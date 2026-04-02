import { z } from 'zod'

export const leadSchema = z.object({
  name: z
    .string()
    .min(2, 'Nama minimal 2 karakter')
    .max(100, 'Nama maksimal 100 karakter'),
  rawMessage: z
    .string()
    .min(10, 'Pesan inquiry minimal 10 karakter')
    .max(2000, 'Pesan inquiry maksimal 2000 karakter'),
  source: z
    .string()
    .optional()
    .default('manual')
})

export type LeadInput = z.infer<typeof leadSchema>
