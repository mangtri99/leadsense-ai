import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { leads } from '../../../database/schema'

const bodySchema = z.object({
  pipelineStage: z.enum(['new', 'contacted', 'negotiating', 'closed_won', 'closed_lost'])
})

export default defineEventHandler(async (event) => {
  await requireUserSession(event)

  const leadId = Number(getRouterParam(event, 'id'))
  if (!leadId) throw createError({ statusCode: 400, message: 'Invalid ID.' })

  const body = await readBody(event)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: parsed.error.issues[0]?.message || 'Invalid input.' })
  }

  const db = useDb()
  const [updated] = await db
    .update(leads)
    .set({ pipelineStage: parsed.data.pipelineStage, lastActivityAt: new Date() })
    .where(eq(leads.id, leadId))
    .returning()

  if (!updated) throw createError({ statusCode: 404, message: 'Lead not found.' })

  return { ok: true, pipelineStage: updated.pipelineStage }
})
