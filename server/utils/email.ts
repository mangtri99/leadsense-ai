import { Resend } from 'resend'

export async function sendHotLeadEmail(lead: {
  id: number
  name: string
  score: number | null
  destination?: string | null
  budget?: string | null
  travelDate?: string | null
  paxCount?: number | null
}) {
  const config = useRuntimeConfig()

  if (!config.resendApiKey || !config.resendFrom) return

  const resend = new Resend(config.resendApiKey)

  const details = [
    lead.destination && `Destination: ${lead.destination}`,
    lead.budget && `Budget: ${lead.budget}`,
    lead.travelDate && `Travel Date: ${lead.travelDate}`,
    lead.paxCount && `Pax: ${lead.paxCount}`
  ].filter(Boolean).join('<br/>')

  await resend.emails.send({
    from: config.resendFrom,
    to: config.resendAlertTo || config.resendFrom,
    subject: `🔥 New Hot Lead: ${lead.name} (Score: ${lead.score}/100)`,
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
        <div style="background: #ef4444; color: white; padding: 16px 24px; border-radius: 8px 8px 0 0;">
          <h2 style="margin: 0;">🔥 New Hot Lead Alert</h2>
        </div>
        <div style="border: 1px solid #e5e7eb; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
          <p style="font-size: 18px; font-weight: bold; margin: 0 0 8px;">${lead.name}</p>
          <p style="font-size: 24px; color: #ef4444; font-weight: bold; margin: 0 0 16px;">Score: ${lead.score ?? 'N/A'}/100</p>
          ${details ? `<div style="color: #374151; line-height: 1.8;">${details}</div>` : ''}
          <div style="margin-top: 24px;">
            <a href="${config.appUrl || 'http://localhost:3000'}/leads/${lead.id}"
               style="background: #ef4444; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold;">
              View Lead →
            </a>
          </div>
          <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">Contact within 1 hour for best results.</p>
        </div>
      </div>
    `
  })
}
