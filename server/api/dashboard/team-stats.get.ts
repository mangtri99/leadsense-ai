import { sql } from 'drizzle-orm'
import { requireAdminSession } from '../../utils/requireAdmin'

export default defineEventHandler(async (event) => {
  await requireAdminSession(event)

  const db = useDb()

  const result = await db.execute(sql`
    SELECT
      u.id,
      u.name,
      cast(count(l.id) as int) as total_assigned,
      cast(count(case when l.pipeline_stage = 'closed_won' then 1 end) as int) as closed_won,
      cast(count(case when l.status = 'Hot' then 1 end) as int) as hot_leads,
      cast(count(case when l.pipeline_stage = 'new' then 1 end) as int) as new_leads
    FROM users u
    LEFT JOIN leads l ON l.assigned_to_id = u.id
    WHERE u.role = 'sales'
    GROUP BY u.id, u.name
    ORDER BY closed_won DESC, total_assigned DESC
  `)

  return result.rows as {
    id: number
    name: string
    total_assigned: number
    closed_won: number
    hot_leads: number
    new_leads: number
  }[]
})
