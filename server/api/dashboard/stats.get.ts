import { count, avg, eq } from 'drizzle-orm'
import { leads } from '../../database/schema'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)

  const db = useDb()

  const [totalResult] = await db.select({ total: count() }).from(leads)
  const [avgResult] = await db.select({ avg: avg(leads.score) }).from(leads)

  const statusCounts = await Promise.all(
    ['Hot', 'Warm', 'Cold', 'Nurture'].map(async (status) => {
      const [result] = await db
        .select({ count: count() })
        .from(leads)
        .where(eq(leads.status, status))
      return { status, count: result?.count }
    })
  )

  const breakdown = Object.fromEntries(
    statusCounts.map(s => [s.status, s.count])
  )

  return {
    total: totalResult?.total,
    avg: avgResult?.avg,
    breakdown: {
      Hot: breakdown.Hot || 0,
      Warm: breakdown.Warm || 0,
      Cold: breakdown.Cold || 0,
      Nurture: breakdown.Nurture || 0
    }
  }
})
