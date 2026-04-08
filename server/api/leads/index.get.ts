import { desc, eq, count, and, getTableColumns } from 'drizzle-orm'
import { leads, users } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const currentUser = session.user as { id: number, role?: string }

  const query = getQuery(event)
  const status = query.status as string | undefined
  const pipeline = query.pipeline as string | undefined
  const assignedTo = query.assignedTo ? Number(query.assignedTo) : undefined
  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 20))
  const offset = (page - 1) * limit

  const db = useDb()

  const conditions = [
    status ? eq(leads.status, status) : undefined,
    pipeline ? eq(leads.pipelineStage, pipeline) : undefined,
    // Admin can filter by assignee; sales always see only their own leads
    currentUser.role === 'sales'
      ? eq(leads.assignedToId, currentUser.id)
      : assignedTo ? eq(leads.assignedToId, assignedTo) : undefined
  ].filter(Boolean) as Parameters<typeof and>

  const where = conditions.length > 0 ? and(...conditions) : undefined

  const countResult = await db
    .select({ total: count() })
    .from(leads)
    .where(where)

  const total = countResult[0]?.total ?? 0

  const leadColumns = getTableColumns(leads)
  const rows = await db
    .select({ ...leadColumns, assignedToName: users.name })
    .from(leads)
    .leftJoin(users, eq(leads.assignedToId, users.id))
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
