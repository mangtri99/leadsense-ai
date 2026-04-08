import { sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)

  const db = useDb()

  const [leadsOverTime, topDestinations, pipelineStats] = await Promise.all([
    // Leads created per day for the last 30 days
    db.execute(sql`
      SELECT
        to_char(created_at, 'YYYY-MM-DD') as date,
        cast(count(*) as int) as count
      FROM leads
      WHERE created_at >= now() - interval '30 days'
      GROUP BY date
      ORDER BY date ASC
    `),

    // Top 8 destinations by lead count
    db.execute(sql`
      SELECT
        destination,
        cast(count(*) as int) as count
      FROM leads
      WHERE destination IS NOT NULL AND destination != ''
      GROUP BY destination
      ORDER BY count DESC
      LIMIT 8
    `),

    // closed_won and closed_lost for win rate
    db.execute(sql`
      SELECT
        cast(count(case when pipeline_stage = 'closed_won' then 1 end) as int) as closed_won,
        cast(count(case when pipeline_stage = 'closed_lost' then 1 end) as int) as closed_lost
      FROM leads
    `)
  ])

  return {
    leadsOverTime: leadsOverTime.rows as { date: string, count: number }[],
    topDestinations: topDestinations.rows as { destination: string, count: number }[],
    winRate: pipelineStats.rows[0] as { closed_won: number, closed_lost: number }
  }
})
