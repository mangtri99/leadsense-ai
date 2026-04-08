import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { users } from '../../database/schema'

const bodySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100)
})

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)

  const body = await readBody(event)
  const parsed = bodySchema.safeParse(body)

  if (!parsed.success) {
    throw createError({ statusCode: 400, message: parsed.error.issues[0]?.message || 'Invalid input.' })
  }

  const db = useDb()
  const result = await db
    .update(users)
    .set({ name: parsed.data.name })
    .where(eq(users.id, (session.user as { id: number }).id))
    .returning()

  const updated = result[0]
  if (!updated) throw createError({ statusCode: 404, message: 'User not found.' })

  await setUserSession(event, {
    user: {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: updated.role
    }
  })

  return { ok: true, name: updated.name }
})
