import { z } from 'zod'
import { followUps } from '../../../database/schema'

const bodySchema = z.object({
  note: z.string().min(1, 'Note cannot be empty.').max(1000)
})

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)

  const leadId = Number(getRouterParam(event, 'id'))
  if (!leadId) throw createError({ statusCode: 400, message: 'Invalid ID.' })

  const body = await readBody(event)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: parsed.error.issues[0]?.message || 'Invalid input.' })
  }

  const db = useDb()
  const [followUp] = await db.insert(followUps).values({
    leadId,
    userId: session.user.id,
    note: parsed.data.note
  }).returning()

  return followUp
})
