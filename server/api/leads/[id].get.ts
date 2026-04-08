import { eq, getTableColumns } from 'drizzle-orm'
import { leads, users } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const currentUser = session.user as { id: number, role?: string }

  const id = Number(getRouterParam(event, 'id'))
  if (!id) throw createError({ statusCode: 400, message: 'Invalid ID.' })

  const db = useDb()
  const leadColumns = getTableColumns(leads)
  const [row] = await db
    .select({ ...leadColumns, assignedToName: users.name })
    .from(leads)
    .leftJoin(users, eq(leads.assignedToId, users.id))
    .where(eq(leads.id, id))
    .limit(1)

  if (!row) throw createError({ statusCode: 404, message: 'Lead not found.' })

  // Sales can only view leads assigned to them
  if (currentUser.role === 'sales' && row.assignedToId !== currentUser.id) {
    throw createError({ statusCode: 403, message: 'Access denied.' })
  }

  return row
})
