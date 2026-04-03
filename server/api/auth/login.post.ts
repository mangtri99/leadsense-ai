import { eq } from 'drizzle-orm'
import { users } from '../../database/schema'

export default defineEventHandler(async (event) => {
  const { email, password } = await readBody(event)

  if (!email || !password) {
    throw createError({ statusCode: 400, message: 'Email and password are required.' })
  }

  const db = useDb()
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)

  if (!user || user.password !== password) {
    throw createError({ statusCode: 401, message: 'Incorrect email or password.' })
  }

  await setUserSession(event, {
    user: {
      id: user.id,
      name: user.name,
      email: user.email
    }
  })

  return { ok: true }
})
