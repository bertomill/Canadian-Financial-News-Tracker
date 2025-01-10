import { pgTable, serial, text, timestamp, real } from 'drizzle-orm/pg-core';

// Define the articles table
export const articles = pgTable('articles', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  link: text('link').notNull().unique(),
  publishDate: timestamp('publish_date').notNull(),
  source: text('source').notNull(),
  bankCode: text('bank_code').notNull(),
  summary: text('summary'),
  aiRelevanceScore: real('ai_relevance_score').default(0),
  aiRelevanceReason: text('ai_relevance_reason'),
  createdAt: timestamp('created_at').defaultNow()
});

// Export type for TypeScript
export type Article = typeof articles.$inferSelect;
export type InsertArticle = typeof articles.$inferInsert; 