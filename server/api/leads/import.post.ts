import { eq } from 'drizzle-orm'
import { read, utils } from 'xlsx'
import { leads } from '../../database/schema'
import { analyzeLeadWithAI, selectHotelsWithAI } from '../../utils/ai'
import { sendHotLeadEmail } from '../../utils/email'
import { getHotelsByDestination } from '../../utils/hotels'

const MAX_ROWS = 50

// Column aliases: maps various header names → internal field names
const COLUMN_ALIASES: Record<string, string> = {
  // name
  name: 'name',
  nama: 'name',
  'customer name': 'name',
  'nama pelanggan': 'name',
  'nama customer': 'name',
  // message
  message: 'message',
  rawmessage: 'message',
  inquiry: 'message',
  pesan: 'message',
  'pesan inquiry': 'message',
  'raw message': 'message',
  'pesan customer': 'message',
  // source
  source: 'source',
  sumber: 'source',
  channel: 'source',
  // email
  email: 'email',
  'e-mail': 'email',
  // phone
  phone: 'phone',
  telepon: 'phone',
  'nomor hp': 'phone',
  'no hp': 'phone',
  'no. hp': 'phone',
  whatsapp: 'phone',
  wa: 'phone',
  handphone: 'phone'
}

interface ParsedRow {
  name: string
  message: string
  source: string
  email: string
  phone: string
  _rowIndex: number
}

interface ImportResult {
  rowIndex: number
  name: string
  status: 'success' | 'failed'
  error?: string
}

async function processLead(row: ParsedRow, db: ReturnType<typeof useDb>): Promise<ImportResult> {
  try {
    const insertedLeads = await db.insert(leads).values({
      name: row.name,
      rawMessage: row.message,
      source: row.source || 'import',
      email: row.email || null,
      phone: row.phone || null
    }).returning()

    const lead = insertedLeads[0]
    if (!lead) throw new Error('Failed to insert lead.')

    const analysis = await analyzeLeadWithAI(row.message)

    let aiRecommendedHotels: string | null = null
    if (analysis.destination) {
      const candidates = await getHotelsByDestination(analysis.destination, 10, analysis.paxCount, analysis.travelDate)
      const selections = await selectHotelsWithAI(
        { destination: analysis.destination, budget: analysis.budget, paxCount: analysis.paxCount, travelDate: analysis.travelDate, rawMessage: row.message },
        candidates
      )
      if (selections.length) aiRecommendedHotels = JSON.stringify(selections)
    }

    const [updatedLead] = await db
      .update(leads)
      .set({
        score: analysis.score,
        status: analysis.status,
        aiAnalysis: analysis.analysis,
        aiReplyDraft: analysis.replyDraft,
        destination: analysis.destination,
        budget: analysis.budget,
        travelDate: analysis.travelDate,
        paxCount: analysis.paxCount,
        aiRecommendedHotels,
        updatedAt: new Date()
      })
      .where(eq(leads.id, lead.id))
      .returning()

    if (updatedLead && analysis.status === 'Hot') {
      const storage = useStorage('cache')
      const key = 'sse:hot-leads'
      const existing = await storage.getItem<Array<{ id: number, name: string, score: number }>>(key) || []
      existing.push({ id: updatedLead.id, name: updatedLead.name, score: analysis.score })
      await storage.setItem(key, existing)
      sendHotLeadEmail(updatedLead).catch(() => {})
    }

    return { rowIndex: row._rowIndex, name: row.name, status: 'success' }
  }
  catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { rowIndex: row._rowIndex, name: row.name, status: 'failed', error: message }
  }
}

export default defineEventHandler(async (event) => {
  await requireUserSession(event)

  const formData = await readMultipartFormData(event)
  const filePart = formData?.find(p => p.name === 'file')

  if (!filePart?.data) {
    throw createError({ statusCode: 400, message: 'Tidak ada file yang diupload.' })
  }

  const filename = filePart.filename?.toLowerCase() ?? ''
  const mime = filePart.type ?? ''
  const isExcel = mime.includes('spreadsheet') || mime.includes('excel') || filename.endsWith('.xlsx') || filename.endsWith('.xls')
  const isCsv = mime.includes('csv') || filename.endsWith('.csv')

  if (!isExcel && !isCsv) {
    throw createError({ statusCode: 400, message: 'Format file tidak didukung. Gunakan CSV (.csv) atau Excel (.xlsx/.xls).' })
  }

  // Parse workbook
  const workbook = read(filePart.data, { type: 'buffer' })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) {
    throw createError({ statusCode: 400, message: 'File kosong atau tidak memiliki sheet.' })
  }

  const sheet = workbook.Sheets[sheetName]!
  const rawRows = utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })

  if (rawRows.length === 0) {
    throw createError({ statusCode: 400, message: 'Tidak ada data yang ditemukan di file.' })
  }

  if (rawRows.length > MAX_ROWS) {
    throw createError({ statusCode: 400, message: `Maksimal ${MAX_ROWS} baris per import. File ini berisi ${rawRows.length} baris.` })
  }

  // Normalize headers
  const parsed: ParsedRow[] = []
  const skipped: { rowIndex: number, reason: string }[] = []

  for (let i = 0; i < rawRows.length; i++) {
    const raw = rawRows[i] ?? {}
    const normalized: Record<string, string> = {}

    for (const [key, val] of Object.entries(raw)) {
      const alias = COLUMN_ALIASES[key.toLowerCase().trim()]
      if (alias) normalized[alias] = String(val).trim()
    }

    const name = normalized.name || ''
    const message = normalized.message || ''

    if (!name) {
      skipped.push({ rowIndex: i + 2, reason: 'Kolom "name" kosong' })
      continue
    }
    if (!message) {
      skipped.push({ rowIndex: i + 2, reason: 'Kolom "message" kosong' })
      continue
    }

    parsed.push({
      name,
      message,
      source: normalized.source || '',
      email: normalized.email || '',
      phone: normalized.phone || '',
      _rowIndex: i + 2
    })
  }

  if (parsed.length === 0) {
    throw createError({ statusCode: 400, message: 'Tidak ada baris valid yang ditemukan. Pastikan kolom "name" dan "message" terisi.' })
  }

  // Process in batches of 5 to avoid overwhelming AI API
  const db = useDb()
  const BATCH_SIZE = 5
  const results: ImportResult[] = []

  for (let i = 0; i < parsed.length; i += BATCH_SIZE) {
    const batch = parsed.slice(i, i + BATCH_SIZE)
    const batchResults = await Promise.allSettled(batch.map(row => processLead(row, db)))
    for (const r of batchResults) {
      if (r.status === 'fulfilled') results.push(r.value)
      else results.push({ rowIndex: -1, name: '?', status: 'failed', error: r.reason?.message })
    }
  }

  const success = results.filter(r => r.status === 'success').length
  const failed = results.filter(r => r.status === 'failed')

  return {
    total: rawRows.length,
    processed: parsed.length,
    success,
    failed: failed.length + skipped.length,
    errors: [
      ...skipped.map(s => `Baris ${s.rowIndex}: ${s.reason}`),
      ...failed.map(f => `Baris ${f.rowIndex} (${f.name}): ${f.error}`)
    ]
  }
})
