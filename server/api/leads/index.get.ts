import { desc, eq, count } from 'drizzle-orm'
import { leads } from '../../database/schema'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)

  const query = getQuery(event)
  const status = query.status as string | undefined
  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 20))
  const offset = (page - 1) * limit

  const db = useDb()

  const where = status ? eq(leads.status, status) : undefined

  const countResult = await db
    .select({ total: count() })
    .from(leads)
    .where(where)

  const total = countResult[0]?.total ?? 0

  const rows = await db
    .select()
    .from(leads)
    .where(where)
    .orderBy(desc(leads.createdAt))
    .limit(limit)
    .offset(offset)

  return {
    data: rows,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  }
})
