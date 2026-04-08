const WINDOW_MS = 60 * 1000 // 1 menit
const MAX_REQUESTS = 10

export default defineEventHandler(async (event) => {
  // Hanya batasi endpoint AI
  if (!event.path.startsWith('/api/leads') || event.method !== 'POST') return

  const session = await getUserSession(event)
  const userId = (session?.user as { id?: number } | undefined)?.id
  if (!userId) return // akan di-handle oleh requireUserSession di route handler

  const storage = useStorage('cache')
  const key = `rate:leads:${userId}`

  const now = Date.now()
  const raw = await storage.getItem<{ count: number, resetAt: number }>(key)

  if (!raw || now > raw.resetAt) {
    await storage.setItem(key, { count: 1, resetAt: now + WINDOW_MS })
    return
  }

  if (raw.count >= MAX_REQUESTS) {
    const retryAfter = Math.ceil((raw.resetAt - now) / 1000)
    throw createError({
      statusCode: 429,
      message: `Too many requests. Please try again in ${retryAfter} seconds.`
    })
  }

  await storage.setItem(key, { count: raw.count + 1, resetAt: raw.resetAt })
})
