import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { followUps, leads } from '../../../database/schema'
import { analyzeLeadWithAI } from '../../../utils/ai'
import { sendHotLeadEmail } from '../../../utils/email'

const bodySchema = z.object({
  message: z.string().min(1, 'Message cannot be empty.').max(2000),
  reanalyze: z.boolean().default(true)
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

  const { message, reanalyze } = parsed.data
  const db = useDb()

  const [lead] = await db.select().from(leads).where(eq(leads.id, leadId)).limit(1)
  if (!lead) throw createError({ statusCode: 404, message: 'Lead not found.' })

  // Save customer message
  const [followUp] = await db.insert(followUps).values({
    leadId,
    userId: null,
    note: message,
    type: 'customer_message',
    senderName: lead.name
  }).returning()

  await db.update(leads).set({ lastActivityAt: new Date() }).where(eq(leads.id, leadId))

  if (!reanalyze) {
    return { followUp, analysis: null }
  }

  // Re-analyze with AI
  const previousScore = lead.score
  const previousStatus = lead.status

  const analysis = await analyzeLeadWithAI(message)

  const [updatedLead] = await db
    .update(leads)
    .set({
      score: analysis.score,
      status: analysis.status,
      aiReplyDraft: analysis.replyDraft,
      updatedAt: new Date(),
      lastActivityAt: new Date()
    })
    .where(eq(leads.id, leadId))
    .returning()

  const statusChanged = analysis.status !== previousStatus

  // Trigger SSE + email if newly Hot
  if (analysis.status === 'Hot' && previousStatus !== 'Hot' && updatedLead) {
    const storage = useStorage('cache')
    const key = 'sse:hot-leads'
    const existing = await storage.getItem<Array<{ id: number, name: string, score: number }>>(key) || []
    existing.push({ id: updatedLead.id, name: updatedLead.name, score: analysis.score })
    await storage.setItem(key, existing)
    sendHotLeadEmail(updatedLead).catch(() => {})
  }

  return {
    followUp,
    analysis: {
      score: analysis.score,
      status: analysis.status,
      previousScore,
      previousStatus,
      scoreDiff: analysis.score - (previousScore ?? 0),
      statusChanged,
      replyDraft: analysis.replyDraft
    }
  }
})
