import { count, avg, eq } from 'drizzle-orm'
import { leads } from '../../database/schema'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)

  const db = useDb()

  const [totalResult] = await db.select({ total: count() }).from(leads)
  const [avgResult] = await db.select({ avg: avg(leads.score) }).from(leads)

  const statusCounts = await Promise.all(
    ['Hot', 'Warm', 'Cold', 'Nurture'].map(async (status) => {
      const [result] = await db.select({ count: count() }).from(leads).where(eq(leads.status, status))
      return { status, count: result?.count ?? 0 }
    })
  )

  const pipelineCounts = await Promise.all(
    ['new', 'contacted', 'negotiating', 'closed_won', 'closed_lost'].map(async (stage) => {
      const [result] = await db.select({ count: count() }).from(leads).where(eq(leads.pipelineStage, stage))
      return { stage, count: result?.count ?? 0 }
    })
  )

  const breakdown = Object.fromEntries(statusCounts.map(s => [s.status, s.count]))
  const pipeline = Object.fromEntries(pipelineCounts.map(s => [s.stage, s.count]))

  return {
    total: totalResult?.total ?? 0,
    avg: avgResult?.avg,
    breakdown: {
      Hot: breakdown.Hot ?? 0,
      Warm: breakdown.Warm ?? 0,
      Cold: breakdown.Cold ?? 0,
      Nurture: breakdown.Nurture ?? 0
    },
    pipeline: {
      new: pipeline.new ?? 0,
      contacted: pipeline.contacted ?? 0,
      negotiating: pipeline.negotiating ?? 0,
      closed_won: pipeline.closed_won ?? 0,
      closed_lost: pipeline.closed_lost ?? 0
    }
  }
})
