import { createEventStream } from 'h3'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)

  const stream = createEventStream(event)
  const storage = useStorage('cache')

  // Kirim event "connected" saat pertama konek
  await stream.push({ data: JSON.stringify({ type: 'connected' }) })

  // Poll storage setiap 3 detik untuk lead Hot baru
  const interval = setInterval(async () => {
    const key = 'sse:hot-leads'
    const pending = await storage.getItem<Array<{ id: number, name: string, score: number }>>(key)

    if (pending && pending.length > 0) {
      await stream.push({
        data: JSON.stringify({ type: 'new-hot-lead', leads: pending })
      })
      await storage.removeItem(key)
    }
  }, 3000)

  stream.onClosed(() => {
    clearInterval(interval)
  })

  return stream.send()
})
