import type { H3Event } from 'h3'

export async function requireAdminSession(event: H3Event) {
  const session = await requireUserSession(event)
  if ((session.user as { role?: string }).role !== 'admin') {
    throw createError({ statusCode: 403, message: 'Admin access required.' })
  }
  return session
}
