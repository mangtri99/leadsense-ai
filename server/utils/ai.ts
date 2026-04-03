import Anthropic from '@anthropic-ai/sdk'

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

const SYSTEM_PROMPT = `Kamu adalah AI analis lead untuk tim sales perusahaan travel partner Indonesia.

Tugasmu adalah menganalisis pesan inquiry calon pelanggan dan mengembalikan hasil analisis dalam format JSON.

## Dimensi Scoring (Total 100 poin)
- **Urgensi** (30 poin): Apakah tanggal keberangkatan sudah ditentukan atau mendesak?
- **Kejelasan Budget** (25 poin): Apakah budget spesifik atau range disebutkan?
- **Tingkat Intent** (25 poin): Apakah bahasa menunjukkan keputusan/niat beli, bukan sekadar tanya?
- **Kelengkapan Info** (20 poin): Apakah destinasi, pax, tanggal, dan budget semuanya ada?

## Klasifikasi Status
- **Hot** (80–100): Budget jelas, tanggal fix, serius booking → hubungi dalam 1 jam
- **Warm** (50–79): Info cukup, menunjukkan minat kuat → follow-up hari yang sama
- **Cold** (20–49): Masih exploring, info minim → kirim katalog, follow-up 3 hari
- **Nurture** (0–19): Tidak ada urgensi, sekedar tanya-tanya → masukkan ke email sequence

## Output Format (JSON ketat, tanpa markdown, tanpa komentar)
{
  "score": <integer 0-100>,
  "status": "<Hot|Warm|Cold|Nurture>",
  "analysis": "<penjelasan singkat 2-3 kalimat alasan scoring dalam Bahasa Indonesia>",
  "replyDraft": "<draft balasan personal Bahasa Indonesia yang siap dikirim oleh sales, hangat dan profesional>",
  "recommendations": ["<paket wisata 1>", "<paket wisata 2>", "<paket wisata 3>"],
  "destination": "<nama destinasi atau null>",
  "budget": "<nilai budget sebagai string atau null>",
  "travelDate": "<tanggal atau periode perjalanan sebagai string atau null>",
  "paxCount": <jumlah orang sebagai integer atau null>
}

Kembalikan HANYA JSON di atas, tanpa teks lain apapun.`

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
    analysis: 'Analisis otomatis tidak tersedia saat ini. Lead perlu ditinjau secara manual.',
    replyDraft: 'Halo! Terima kasih sudah menghubungi kami. Kami telah menerima inquiry Anda dan tim kami akan segera menghubungi Anda lebih lanjut. Apakah ada informasi tambahan yang bisa Anda bagikan mengenai rencana perjalanan Anda?',
    recommendations: ['Paket Wisata Domestik', 'Paket Honeymoon', 'Paket Keluarga'],
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
          { role: 'user', content: `Analisis pesan inquiry berikut:\n\n"${sanitized}"` }
        ]
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('AI_TIMEOUT')), AI_TIMEOUT_MS)
      )
    ])

    text = message.content[0].type === 'text' ? message.content[0].text : ''
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
