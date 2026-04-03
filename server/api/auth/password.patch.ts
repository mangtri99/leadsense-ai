import { eq } from 'drizzle-orm'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { users } from '../../database/schema'

const bodySchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required.'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters.')
})

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)

  const body = await readBody(event)
  const parsed = bodySchema.safeParse(body)

  if (!parsed.success) {
    throw createError({ statusCode: 400, message: parsed.error.issues[0]?.message || 'Invalid input.' })
  }

  const db = useDb()
  const [user] = await db.select().from(users).where(eq(users.id, (session.user as { id: number }).id)).limit(1)

  if (!user || !(await bcrypt.compare(parsed.data.currentPassword, user.password))) {
    throw createError({ statusCode: 401, message: 'Current password is incorrect.' })
  }

  const hashedPassword = await bcrypt.hash(parsed.data.newPassword, 12)

  await db
    .update(users)
    .set({ password: hashedPassword })
    .where(eq(users.id, (session.user as { id: number }).id))

  return { ok: true }
})
