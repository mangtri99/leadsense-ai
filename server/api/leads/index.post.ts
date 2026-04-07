import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { leads } from '../../database/schema'
import { analyzeLeadWithAI, selectHotelsWithAI } from '../../utils/ai'
import { sendHotLeadEmail } from '../../utils/email'
import { getHotelsByDestination } from '../../utils/hotels'

const bodySchema = z.object({
  name: z.string().min(2).max(100),
  rawMessage: z.string().min(10).max(2000),
  source: z.string().optional().default('manual'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().max(30).optional()
})

export default defineEventHandler(async (event) => {
  await requireUserSession(event)

  const body = await readBody(event)
  const parsed = bodySchema.safeParse(body)

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message || 'Invalid input.'
    throw createError({ statusCode: 400, message })
  }

  const { name, rawMessage, source, email, phone } = parsed.data
  const db = useDb()

  const insertedLeads = await db.insert(leads).values({
    name,
    rawMessage,
    source,
    email: email || null,
    phone: phone || null
  }).returning()

  const lead = insertedLeads[0]
  if (!lead) throw createError({ statusCode: 500, message: 'Failed to create lead.' })

  const analysis = await analyzeLeadWithAI(rawMessage)

  // AI hotel selection based on extracted profile
  let aiRecommendedHotels: string | null = null
  if (analysis.destination) {
    const candidates = await getHotelsByDestination(analysis.destination, 10, analysis.paxCount, analysis.travelDate)
    const selections = await selectHotelsWithAI(
      { destination: analysis.destination, budget: analysis.budget, paxCount: analysis.paxCount, travelDate: analysis.travelDate, rawMessage },
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

  if (!updatedLead) throw createError({ statusCode: 500, message: 'Failed to save lead analysis.' })

  // Push ke SSE storage jika lead Hot + send email
  if (analysis.status === 'Hot') {
    const storage = useStorage('cache')
    const key = 'sse:hot-leads'
    const existing = await storage.getItem<Array<{ id: number, name: string, score: number }>>(key) || []
    existing.push({ id: updatedLead.id, name: updatedLead.name, score: analysis.score })
    await storage.setItem(key, existing)

    sendHotLeadEmail(updatedLead).catch(() => {})
  }

  return {
    ...updatedLead,
    recommendations: analysis.recommendations
  }
})
