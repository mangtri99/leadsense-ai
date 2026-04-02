import { eq } from 'drizzle-orm'
import { leads } from '../../database/schema'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)

  const id = Number(getRouterParam(event, 'id'))
  if (!id) throw createError({ statusCode: 400, message: 'ID tidak valid.' })

  const db = useDb()
  const [lead] = await db.select().from(leads).where(eq(leads.id, id)).limit(1)

  if (!lead) throw createError({ statusCode: 404, message: 'Lead tidak ditemukan.' })

  return lead
})
