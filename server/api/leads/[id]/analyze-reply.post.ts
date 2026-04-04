import { eq, asc } from 'drizzle-orm'
import { z } from 'zod'
import { followUps, leads } from '../../../database/schema'
import { analyzeLeadWithAI, selectHotelsWithAI } from '../../../utils/ai'
import { sendHotLeadEmail } from '../../../utils/email'
import { getHotelsByDestination } from '../../../utils/hotels'

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

  // Re-analyze with full conversation context
  const previousScore = lead.score
  const previousStatus = lead.status

  // Fetch all previous customer messages for context
  const previousReplies = await db
    .select({ note: followUps.note })
    .from(followUps)
    .where(eq(followUps.leadId, leadId))
    .orderBy(asc(followUps.createdAt))

  // Build context: original inquiry + prior customer replies + new message
  const previousMessages = previousReplies
    .filter(r => r.note !== message) // exclude the one we just inserted
    .map((r, i) => `Customer follow-up ${i + 1}:\n"${r.note}"`)
    .join('\n\n')

  const contextMessage = [
    `Pesan inquiry awal:\n"${lead.rawMessage}"`,
    previousMessages,
    `Pesan terbaru dari customer:\n"${message}"`
  ].filter(Boolean).join('\n\n')

  const analysis = await analyzeLeadWithAI(contextMessage)

  // Determine effective destination for hotel selection
  const effectiveDestination = analysis.destination || lead.destination

  // AI hotel selection — re-run if destination or profile changed
  let aiRecommendedHotelsUpdate: { aiRecommendedHotels: string | null } = { aiRecommendedHotels: lead.aiRecommendedHotels ?? null }
  if (effectiveDestination) {
    const candidates = await getHotelsByDestination(effectiveDestination, 10)
    const effectiveBudget = analysis.budget || lead.budget
    const effectivePax = analysis.paxCount || lead.paxCount
    const effectiveDate = analysis.travelDate || lead.travelDate
    const selections = await selectHotelsWithAI(
      { destination: effectiveDestination, budget: effectiveBudget, paxCount: effectivePax, travelDate: effectiveDate, rawMessage: contextMessage },
      candidates
    )
    aiRecommendedHotelsUpdate = { aiRecommendedHotels: selections.length ? JSON.stringify(selections) : null }
  }

  const [updatedLead] = await db
    .update(leads)
    .set({
      score: analysis.score,
      status: analysis.status,
      aiReplyDraft: analysis.replyDraft,
      // Update extracted fields if AI detected new values
      ...(analysis.destination && { destination: analysis.destination }),
      ...(analysis.budget && { budget: analysis.budget }),
      ...(analysis.travelDate && { travelDate: analysis.travelDate }),
      ...(analysis.paxCount && { paxCount: analysis.paxCount }),
      ...aiRecommendedHotelsUpdate,
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
