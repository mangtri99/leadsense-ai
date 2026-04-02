import { pgTable, serial, text, integer, timestamp, index } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
})

export const leads = pgTable('leads', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  rawMessage: text('raw_message').notNull(),
  source: text('source').default('manual'),
  score: integer('score'),
  status: text('status'), // Hot | Warm | Cold | Nurture
  aiAnalysis: text('ai_analysis'),
  aiReplyDraft: text('ai_reply_draft'),
  destination: text('destination'),
  budget: text('budget'),
  travelDate: text('travel_date'),
  paxCount: integer('pax_count'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, table => [
  index('idx_leads_status').on(table.status),
  index('idx_leads_score').on(table.score),
  index('idx_leads_created_at').on(table.createdAt)
])

export const followUps = pgTable('follow_ups', {
  id: serial('id').primaryKey(),
  leadId: integer('lead_id').notNull().references(() => leads.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id),
  note: text('note').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Lead = typeof leads.$inferSelect
export type NewLead = typeof leads.$inferInsert
export type FollowUp = typeof followUps.$inferSelect
export type NewFollowUp = typeof followUps.$inferInsert
