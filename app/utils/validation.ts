import { z } from 'zod'

export const leadSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters'),
  rawMessage: z
    .string()
    .min(10, 'Inquiry message must be at least 10 characters')
    .max(2000, 'Inquiry message must be at most 2000 characters'),
  source: z
    .string()
    .optional()
    .default('manual')
})

export type LeadInput = z.infer<typeof leadSchema>
