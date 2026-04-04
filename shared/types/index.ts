export interface Lead {
  id: number
  name: string
  rawMessage: string
  source: string | null
  score: number | null
  status: string | null
  pipelineStage: string | null
  aiAnalysis: string | null
  aiReplyDraft: string | null
  destination: string | null
  budget: string | null
  travelDate: string | null
  paxCount: number | null
  email: string | null
  phone: string | null
  aiRecommendedHotels: string | null
  lastActivityAt: Date | string
  createdAt: Date | string
  updatedAt: Date | string
}

export interface FollowUp {
  id: number
  leadId: number
  userId: number | null
  note: string
  type: string
  senderName: string | null
  createdAt: Date | string
}
