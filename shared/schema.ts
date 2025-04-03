import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table (employees)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  department: text("department").notNull(),
  role: text("role").default("employee"),
  points: integer("points").default(0),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  department: true,
  role: true,
});

// Categories for suggestions
export const categories = [
  "production",
  "quality",
  "safety",
  "environment",
  "energy",
  "employee",
  "other",
] as const;

export const categoryLabels: Record<string, string> = {
  production: "Üretim",
  quality: "Kalite",
  safety: "İş Güvenliği",
  environment: "Çevre",
  energy: "Enerji Verimliliği",
  employee: "Çalışan Refahı",
  other: "Diğer",
};

// Status types for suggestions
export const statuses = [
  "new", 
  "under_review", 
  "approved", 
  "implemented", 
  "rejected"
] as const;

export const statusLabels: Record<string, string> = {
  new: "Yeni",
  under_review: "İncelemede",
  approved: "Onaylandı",
  implemented: "Uygulanıyor",
  rejected: "Reddedildi",
};

// Suggestions table
export const suggestions = pgTable("suggestions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  benefits: text("benefits"),
  status: text("status").default("new"),
  submittedAt: timestamp("submitted_at").defaultNow(),
  userId: integer("user_id").notNull(),
  reviewNotes: text("review_notes"),
  reviewedBy: integer("reviewed_by"),
  reviewedAt: timestamp("reviewed_at"),
});

export const insertSuggestionSchema = createInsertSchema(suggestions).pick({
  title: true,
  description: true,
  category: true,
  benefits: true,
  userId: true,
});

// Rewards table
export const rewards = pgTable("rewards", {
  id: serial("id").primaryKey(),
  suggestionId: integer("suggestion_id").notNull(),
  userId: integer("user_id").notNull(),
  amount: integer("amount").notNull(),
  description: text("description"),
  awardedAt: timestamp("awarded_at").defaultNow(),
  awardedBy: integer("awarded_by").notNull(),
});

export const insertRewardSchema = createInsertSchema(rewards).pick({
  suggestionId: true,
  userId: true,
  amount: true,
  description: true,
  awardedBy: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Suggestion = typeof suggestions.$inferSelect;
export type InsertSuggestion = z.infer<typeof insertSuggestionSchema>;

export type Reward = typeof rewards.$inferSelect;
export type InsertReward = z.infer<typeof insertRewardSchema>;

export type Category = typeof categories[number];
export type Status = typeof statuses[number];

// Extended schemas with validation
export const suggestionFormSchema = insertSuggestionSchema.extend({
  category: z.enum(categories),
});

export const reviewSuggestionSchema = z.object({
  status: z.enum(statuses),
  reviewNotes: z.string().optional(),
});

export const rewardFormSchema = insertRewardSchema.extend({
  amount: z.number().min(1, "Ödül miktarı en az 1 olmalıdır"),
});
