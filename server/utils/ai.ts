import Anthropic from '@anthropic-ai/sdk'
import type { HotelRaw } from './hotels'
import { formatHotelForPrompt } from './hotels'

export interface LeadAnalysisResult {
  score: number
  status: 'Hot' | 'Warm' | 'Cold' | 'Nurture'
  analysis: string
  replyDraft: string
  recommendations: string[]
  destination: string | null
  budget: string | null
  travelDate: string | null
  paxCount: number | null
}

const SYSTEM_PROMPT = `You are an AI lead analyst for a travel partner company's sales team.

Your job is to analyze customer inquiry messages and return a structured JSON analysis.

## Scoring Dimensions (Total 100 points)
- **Urgency** (30 points): Is the departure date fixed or time-sensitive?
- **Budget Clarity** (25 points): Is a specific budget or range mentioned?
- **Intent Level** (25 points): Does the language indicate a buying decision, not just curiosity?
- **Info Completeness** (20 points): Are destination, pax count, date, and budget all present?

## Status Classification
- **Hot** (80–100): Clear budget, fixed date, serious about booking → contact within 1 hour
- **Warm** (50–79): Sufficient info, strong interest shown → follow up same day
- **Cold** (20–49): Still exploring, minimal info → send catalog, follow up in 3 days
- **Nurture** (0–19): No urgency, just browsing → add to email nurture sequence

## Output Format (strict JSON, no markdown, no comments)
{
  "score": <integer 0-100>,
  "status": "<Hot|Warm|Cold|Nurture>",
  "analysis": "<2-3 sentence explanation of the score in English>",
  "replyDraft": "<personalized reply draft in English, ready to send by sales, warm and professional>",
  "recommendations": ["<travel package 1>", "<travel package 2>", "<travel package 3>"],
  "destination": "<destination name or null>",
  "budget": "<budget value as string or null>",
  "travelDate": "<travel date or period as string or null>",
  "paxCount": <number of people as integer or null>
}

Return ONLY the JSON above, no other text.`

const AI_TIMEOUT_MS = 15000

function sanitizeInput(input: string): string {
  return input
    .replace(/<[^>]*>/g, '') // strip HTML tags
    .replace(/[^\p{L}\p{N}\p{P}\p{Z}\n]/gu, '') // hanya huruf, angka, tanda baca, spasi
    .trim()
    .slice(0, 2000) // batas maksimum
}

function getStatusFromScore(score: number): LeadAnalysisResult['status'] {
  if (score >= 80) return 'Hot'
  if (score >= 50) return 'Warm'
  if (score >= 20) return 'Cold'
  return 'Nurture'
}

function buildFallback(): LeadAnalysisResult {
  return {
    score: 30,
    status: 'Cold',
    analysis: 'Automatic analysis is currently unavailable. This lead needs to be reviewed manually.',
    replyDraft: 'Hi! Thank you for reaching out. We have received your inquiry and our team will get back to you shortly. Could you share any additional details about your travel plans?',
    recommendations: ['Domestic Tour Package', 'Honeymoon Package', 'Family Package'],
    destination: null,
    budget: null,
    travelDate: null,
    paxCount: null
  }
}

function parseAIResponse(text: string): LeadAnalysisResult {
  const cleaned = text.replace(/```json?\n?/g, '').replace(/```/g, '').trim()
  const parsed = JSON.parse(cleaned)

  const score = Math.min(100, Math.max(0, Number(parsed.score) || 0))

  return {
    score,
    status: getStatusFromScore(score),
    analysis: String(parsed.analysis || ''),
    replyDraft: String(parsed.replyDraft || ''),
    recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations.map(String) : [],
    destination: parsed.destination || null,
    budget: parsed.budget || null,
    travelDate: parsed.travelDate || null,
    paxCount: parsed.paxCount ? Number(parsed.paxCount) : null
  }
}

export interface HotelSelection {
  id: string
  name: string
  reason: string
}

const HOTEL_SELECTION_PROMPT = `You are a travel sales assistant. Given a customer's travel profile and a list of available hotels, select the 1-3 best matching hotels.

Consider:
- Budget fit: does the hotel price match the customer's budget?
- Group size (pax): is the hotel suitable for the number of travelers?
- Amenities relevance: match preferences implied by their inquiry
- Guest rating: prefer higher-rated hotels if budget allows
- Refundability: prefer free cancellation for uncertain bookings

Return ONLY a JSON array (no markdown, no comments):
[
  { "id": "<hotel_id>", "name": "<hotel_name>", "reason": "<1 sentence why this hotel fits>" },
  ...
]

If no hotels are a good fit, return an empty array: []`

export async function selectHotelsWithAI(
  profile: { destination: string | null, budget: string | null, paxCount: number | null, travelDate: string | null, rawMessage: string },
  candidates: HotelRaw[]
): Promise<HotelSelection[]> {
  if (!candidates.length) return []

  const config = useRuntimeConfig()
  const client = new Anthropic({ apiKey: config.anthropicApiKey })

  const hotelList = candidates.map((h, i) => formatHotelForPrompt(h, i)).join('\n\n')

  const customerProfile = [
    `Destination: ${profile.destination || 'Not specified'}`,
    `Budget: ${profile.budget || 'Not specified'}`,
    `Travelers: ${profile.paxCount ? `${profile.paxCount} pax` : 'Not specified'}`,
    `Travel Date: ${profile.travelDate || 'Not specified'}`,
    `Original inquiry: "${profile.rawMessage.slice(0, 300)}"`
  ].join('\n')

  const userContent = `Customer Profile:\n${customerProfile}\n\nAvailable Hotels:\n${hotelList}`

  try {
    const message = await Promise.race([
      client.messages.create({
        model: config.anthropicModel as string,
        max_tokens: 512,
        system: HOTEL_SELECTION_PROMPT,
        messages: [{ role: 'user', content: userContent }]
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('AI_TIMEOUT')), AI_TIMEOUT_MS)
      )
    ])

    const text = message?.content?.[0]?.type === 'text' ? message.content[0].text : '[]'
    const cleaned = text.replace(/```json?\n?/g, '').replace(/```/g, '').trim()
    const parsed = JSON.parse(cleaned)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((item: unknown) => item && typeof item === 'object' && 'id' in (item as object))
      .slice(0, 3)
      .map((item: Record<string, unknown>) => ({
        id: String(item.id),
        name: String(item.name || ''),
        reason: String(item.reason || '')
      }))
  } catch {
    return []
  }
}

export async function analyzeLeadWithAI(rawMessage: string): Promise<LeadAnalysisResult> {
  const config = useRuntimeConfig()
  const sanitized = sanitizeInput(rawMessage)

  const client = new Anthropic({ apiKey: config.anthropicApiKey })

  let text = ''

  try {
    const message = await Promise.race([
      client.messages.create({
        model: config.anthropicModel as string,
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [
          { role: 'user', content: `Analyze the following customer inquiry:\n\n"${sanitized}"` }
        ]
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('AI_TIMEOUT')), AI_TIMEOUT_MS)
      )
    ])

    text = message?.content?.[0]?.type === 'text' ? message.content[0].text : ''
  } catch (err) {
    if ((err as Error)?.message === 'AI_TIMEOUT') {
      throw createError({ statusCode: 504, message: 'AI analysis took too long. Please try again.' })
    }
    throw createError({ statusCode: 502, message: 'Failed to reach the AI service. Please try again.' })
  }

  try {
    return parseAIResponse(text)
  } catch {
    return buildFallback()
  }
}
