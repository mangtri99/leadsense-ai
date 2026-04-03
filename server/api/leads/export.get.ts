import { desc, eq } from 'drizzle-orm'
import { leads } from '../../database/schema'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)

  const query = getQuery(event)
  const status = query.status as string | undefined

  const db = useDb()

  const rows = status
    ? await db.select().from(leads).where(eq(leads.status, status)).orderBy(desc(leads.createdAt))
    : await db.select().from(leads).orderBy(desc(leads.createdAt))

  const headers = ['ID', 'Name', 'Email', 'Phone', 'Status', 'Score', 'Source', 'Destination', 'Budget', 'Pax', 'Travel Date', 'Date Added']

  const escapeCSV = (val: string | number | null | undefined) => {
    if (val === null || val === undefined) return ''
    const str = String(val)
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  const csvRows = rows.map(lead => [
    lead.id,
    lead.name,
    (lead as { email?: string | null }).email ?? '',
    (lead as { phone?: string | null }).phone ?? '',
    lead.status ?? '',
    lead.score ?? '',
    lead.source ?? '',
    lead.destination ?? '',
    lead.budget ?? '',
    lead.paxCount ?? '',
    lead.travelDate ?? '',
    new Date(lead.createdAt).toLocaleString('en-US')
  ].map(escapeCSV).join(','))

  const csv = [headers.join(','), ...csvRows].join('\n')
  const filename = `leadsense-leads-${new Date().toISOString().split('T')[0]}.csv`

  setResponseHeader(event, 'Content-Type', 'text/csv; charset=utf-8')
  setResponseHeader(event, 'Content-Disposition', `attachment; filename="${filename}"`)

  return csv
})
