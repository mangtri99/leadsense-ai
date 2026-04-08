import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { users } from '../../../database/schema'
import { requireAdminSession } from '../../../utils/requireAdmin'

const bodySchema = z.object({
  role: z.enum(['admin', 'sales'])
})

export default defineEventHandler(async (event) => {
  const session = await requireAdminSession(event)
  const currentUser = session.user as { id: number }

  const id = Number(getRouterParam(event, 'id'))
  if (!id) throw createError({ statusCode: 400, message: 'Invalid ID.' })

  if (id === currentUser.id) {
    throw createError({ statusCode: 400, message: 'Cannot change your own role.' })
  }

  const body = await readBody(event)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: parsed.error.issues[0]?.message || 'Invalid input.' })
  }

  const db = useDb()
  const [updated] = await db
    .update(users)
    .set({ role: parsed.data.role })
    .where(eq(users.id, id))
    .returning({ id: users.id, name: users.name, email: users.email, role: users.role })

  if (!updated) throw createError({ statusCode: 404, message: 'User not found.' })

  return updated
})
