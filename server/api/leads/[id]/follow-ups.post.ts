import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { followUps, leads } from '../../../database/schema'

const bodySchema = z.object({
  note: z.string().min(1, 'Note cannot be empty.').max(1000),
  type: z.enum(['internal', 'customer_message']).default('internal'),
  senderName: z.string().max(100).optional()
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

  const { note, type, senderName } = parsed.data
  const db = useDb()

  const [followUp] = await db.insert(followUps).values({
    leadId,
    userId: type === 'internal' ? (session.user as { id: number }).id : null,
    note,
    type,
    senderName: senderName || null
  }).returning()

  // Update lastActivityAt on the lead
  await db.update(leads).set({ lastActivityAt: new Date() }).where(eq(leads.id, leadId))

  return followUp
})
