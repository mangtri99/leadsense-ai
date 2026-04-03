import { eq } from 'drizzle-orm'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { users } from '../../database/schema'

const bodySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters')
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = bodySchema.safeParse(body)

  if (!parsed.success) {
    throw createError({ statusCode: 400, message: parsed.error.issues[0]?.message || 'Invalid input.' })
  }

  const { name, email, password } = parsed.data
  const db = useDb()

  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1)
  if (existing) {
    throw createError({ statusCode: 409, message: 'An account with this email already exists.' })
  }

  const hashedPassword = await bcrypt.hash(password, 12)

  const result = await db.insert(users).values({
    name,
    email,
    password: hashedPassword
  }).returning()

  const user = result[0]
  if (!user) throw createError({ statusCode: 500, message: 'Failed to create account.' })

  await setUserSession(event, {
    user: {
      id: user.id,
      name: user.name,
      email: user.email
    }
  })

  return { ok: true }
})
