import { asc } from 'drizzle-orm'
import { users } from '../../database/schema'
import { requireAdminSession } from '../../utils/requireAdmin'

export default defineEventHandler(async (event) => {
  await requireAdminSession(event)

  const db = useDb()
  const rows = await db
    .select({ id: users.id, name: users.name, email: users.email, role: users.role, createdAt: users.createdAt })
    .from(users)
    .orderBy(asc(users.createdAt))

  return rows
})
