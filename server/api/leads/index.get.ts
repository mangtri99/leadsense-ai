import { desc, eq } from 'drizzle-orm'
import { leads } from '../../database/schema'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)

  const query = getQuery(event)
  const status = query.status as string | undefined

  const db = useDb()

  const result = status
    ? await db.select().from(leads).where(eq(leads.status, status)).orderBy(desc(leads.createdAt))
    : await db.select().from(leads).orderBy(desc(leads.createdAt))

  return result
})
