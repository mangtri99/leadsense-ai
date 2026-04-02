import { eq, asc } from 'drizzle-orm'
import { followUps, users } from '../../../database/schema'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)

  const leadId = Number(getRouterParam(event, 'id'))
  if (!leadId) throw createError({ statusCode: 400, message: 'ID tidak valid.' })

  const db = useDb()

  const result = await db
    .select({
      id: followUps.id,
      note: followUps.note,
      createdAt: followUps.createdAt,
      userName: users.name
    })
    .from(followUps)
    .leftJoin(users, eq(followUps.userId, users.id))
    .where(eq(followUps.leadId, leadId))
    .orderBy(asc(followUps.createdAt))

  return result
})
