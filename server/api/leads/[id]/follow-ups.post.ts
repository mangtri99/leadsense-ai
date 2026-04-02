import { z } from 'zod'
import { followUps } from '../../../database/schema'

const bodySchema = z.object({
  note: z.string().min(1, 'Catatan tidak boleh kosong.').max(1000)
})

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)

  const leadId = Number(getRouterParam(event, 'id'))
  if (!leadId) throw createError({ statusCode: 400, message: 'ID tidak valid.' })

  const body = await readBody(event)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: parsed.error.issues[0]?.message || 'Input tidak valid.' })
  }

  const db = useDb()
  const [followUp] = await db.insert(followUps).values({
    leadId,
    userId: session.user.id,
    note: parsed.data.note
  }).returning()

  return followUp
})
