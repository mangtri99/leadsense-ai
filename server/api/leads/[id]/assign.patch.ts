import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { leads } from '../../../database/schema'
import { requireAdminSession } from '../../../utils/requireAdmin'

const bodySchema = z.object({
  assignedToId: z.number().int().nullable()
})

export default defineEventHandler(async (event) => {
  await requireAdminSession(event)

  const id = Number(getRouterParam(event, 'id'))
  if (!id) throw createError({ statusCode: 400, message: 'Invalid ID.' })

  const body = await readBody(event)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: parsed.error.issues[0]?.message || 'Invalid input.' })
  }

  const db = useDb()
  const [updated] = await db
    .update(leads)
    .set({ assignedToId: parsed.data.assignedToId, updatedAt: new Date() })
    .where(eq(leads.id, id))
    .returning({ id: leads.id, assignedToId: leads.assignedToId })

  if (!updated) throw createError({ statusCode: 404, message: 'Lead not found.' })

  return updated
})
