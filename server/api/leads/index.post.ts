import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { leads } from '../../database/schema'
import { analyzeLeadWithAI } from '../../utils/ai'

const bodySchema = z.object({
  name: z.string().min(2).max(100),
  rawMessage: z.string().min(10).max(2000),
  source: z.string().optional().default('manual')
})

export default defineEventHandler(async (event) => {
  await requireUserSession(event)

  const body = await readBody(event)
  const parsed = bodySchema.safeParse(body)

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message || 'Input tidak valid.'
    throw createError({ statusCode: 400, message })
  }

  const { name, rawMessage, source } = parsed.data
  const db = useDb()

  const [lead] = await db.insert(leads).values({
    name,
    rawMessage,
    source
  }).returning()

  const analysis = await analyzeLeadWithAI(rawMessage)

  const [updatedLead] = await db
    .update(leads)
    .set({
      score: analysis.score,
      status: analysis.status,
      aiAnalysis: analysis.analysis,
      aiReplyDraft: analysis.replyDraft,
      destination: analysis.destination,
      budget: analysis.budget,
      travelDate: analysis.travelDate,
      paxCount: analysis.paxCount,
      updatedAt: new Date()
    })
    .where(eq(leads.id, lead.id))
    .returning()

  // Push ke SSE storage jika lead Hot
  if (analysis.status === 'Hot') {
    const storage = useStorage('cache')
    const key = 'sse:hot-leads'
    const existing = await storage.getItem<Array<{ id: number, name: string, score: number }>>(key) || []
    existing.push({ id: updatedLead.id, name: updatedLead.name, score: analysis.score })
    await storage.setItem(key, existing)
  }

  return {
    ...updatedLead,
    recommendations: analysis.recommendations
  }
})
