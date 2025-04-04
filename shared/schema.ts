import { pgTable, text, serial, integer, boolean, timestamp, varchar, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table for authentication and tracking who submitted suggestions
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(), // Sicil numarası için kullanacağız
  password: text("password").notNull(),
  displayName: text("display_name").notNull(),
  role: text("role").notNull().default("employee"), // "employee", "manager", "executive" değerleri alabilir
  department: text("department"), // kullanıcının bölümü (opsiyonel)
  isAdmin: boolean("is_admin").notNull().default(false),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  displayName: true,
  role: true,
  department: true,
  isAdmin: true,
});

// Kullanıcı rolleri
export const USER_ROLES = {
  EMPLOYEE: "employee",
  MANAGER: "manager",
  EXECUTIVE: "executive"
};

// Kaizen türleri
export const KAIZEN_TYPES = {
  BEFORE_AFTER: "before_after", // Önce-Sonra Kaizen
  KOBETSU: "kobetsu", // Kobetsu Kaizen
} as const;

// İyileştirme türleri
export const IMPROVEMENT_TYPES = {
  ISG: "isg", // İş Sağlığı ve Güvenliği
  ENVIRONMENT: "environment", // Çevre
  QUALITY: "quality", // Kalite
  PRODUCTION: "production", // Üretim
  COST: "cost", // Maliyet
  COMPETENCE: "competence", // Yetkinlik
  SUSTAINABILITY: "sustainability", // Sürdürülebilirlik
  FIVE_S: "5s", // 5S
  EFFICIENCY: "efficiency", // Verimlilik
  OTHER: "other", // Diğer
} as const;

// Kaizen suggestions table
export const suggestions = pgTable("suggestions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  benefits: text("benefits").notNull(),
  status: text("status").notNull().default("new"),
  
  // Kaizen türü ve iyileştirme türü
  kaizenType: text("kaizen_type").notNull().default(KAIZEN_TYPES.BEFORE_AFTER),
  improvementType: text("improvement_type").notNull().default(IMPROVEMENT_TYPES.QUALITY),
  
  // Uygulanacak departman
  targetDepartment: text("target_department"),
  
  // Ekip üyeleri ve proje lideri - JSON olarak saklanacak
  teamMembers: json("team_members").$type<{id: number, name: string}[]>().default([]),
  projectLeader: integer("project_leader"),
  
  // Dosya yükleme alanları için URL'ler - JSON olarak saklanacak
  currentStateFiles: json("current_state_files").$type<string[]>().default([]),
  improvementFiles: json("improvement_files").$type<string[]>().default([]),
  
  // Şirkete katkısı
  companyContribution: text("company_contribution"),
  
  // Başvuru bilgileri
  submittedBy: integer("submitted_by").notNull(),
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
  
  // Bölüm müdürü incelemesi
  departmentManagerId: integer("department_manager_id"),
  departmentReviewAt: timestamp("department_review_at"),
  departmentFeedback: text("department_feedback"),
  
  // Yapılabilirlik değerlendirmesi
  feasibilityScore: integer("feasibility_score"), // 2.5 üstünde olmalı
  feasibilityFeedback: text("feasibility_feedback"),
  feasibilityReviewedBy: integer("feasibility_reviewed_by"),
  feasibilityReviewedAt: timestamp("feasibility_reviewed_at"),
  
  // Çözüm önerisi
  solutionDescription: text("solution_description"),
  solutionProposedBy: integer("solution_proposed_by"),
  solutionProposedAt: timestamp("solution_proposed_at"),
  
  // Maliyet değerlendirmesi
  costScore: integer("cost_score"), // 3 üstünde olmalı
  costDetails: text("cost_details"),
  costReviewedBy: integer("cost_reviewed_by"),
  costReviewedAt: timestamp("cost_reviewed_at"),
  
  // Genel Müdür onayı
  executiveReviewedBy: integer("executive_reviewed_by"),
  executiveReviewedAt: timestamp("executive_reviewed_at"),
  executiveFeedback: text("executive_feedback"),
  
  // Uygulama ve takip
  implementationStartedAt: timestamp("implementation_started_at"),
  implementationCompletedAt: timestamp("implementation_completed_at"),
  implementationNotes: text("implementation_notes"),
  
  // Raporlama
  reportedAt: timestamp("reported_at"),
  reportDetails: text("report_details"),
  reportedBy: integer("reported_by"),
  
  // Değerlendirme
  evaluationScore: integer("evaluation_score"),
  evaluationNotes: text("evaluation_notes"),
  evaluatedBy: integer("evaluated_by"),
  evaluatedAt: timestamp("evaluated_at"),
  
  // Eski alanlar (geriye uyumluluk için)
  rating: integer("rating"),
  feedback: text("feedback"),
  reviewedBy: integer("reviewed_by"),
  reviewedAt: timestamp("reviewed_at"),
});

export const insertSuggestionSchema = createInsertSchema(suggestions).omit({
  id: true,
  status: true,
  submittedAt: true,
  
  // Bölüm müdürü incelemesi
  departmentManagerId: true,
  departmentReviewAt: true,
  departmentFeedback: true,
  
  // Yapılabilirlik değerlendirmesi
  feasibilityScore: true,
  feasibilityFeedback: true,
  feasibilityReviewedBy: true,
  feasibilityReviewedAt: true,
  
  // Çözüm önerisi
  solutionDescription: true,
  solutionProposedBy: true,
  solutionProposedAt: true,
  
  // Maliyet değerlendirmesi
  costScore: true,
  costDetails: true,
  costReviewedBy: true,
  costReviewedAt: true,
  
  // Genel Müdür onayı
  executiveReviewedBy: true,
  executiveReviewedAt: true,
  executiveFeedback: true,
  
  // Uygulama ve takip
  implementationStartedAt: true,
  implementationCompletedAt: true,
  implementationNotes: true,
  
  // Raporlama
  reportedAt: true,
  reportDetails: true,
  reportedBy: true,
  
  // Değerlendirme
  evaluationScore: true,
  evaluationNotes: true,
  evaluatedBy: true,
  evaluatedAt: true,
  
  // Eski alanlar
  rating: true,
  feedback: true,
  reviewedBy: true,
  reviewedAt: true,
});

// Rewards table
export const rewards = pgTable("rewards", {
  id: serial("id").primaryKey(),
  suggestionId: integer("suggestion_id").notNull(),
  amount: integer("amount").notNull(),
  type: text("type").notNull(), // "money", "points", "gift"
  assignedBy: integer("assigned_by").notNull(),
  assignedAt: timestamp("assigned_at").notNull().defaultNow(),
});

export const insertRewardSchema = createInsertSchema(rewards).omit({
  id: true,
  assignedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Suggestion = typeof suggestions.$inferSelect;
export type InsertSuggestion = z.infer<typeof insertSuggestionSchema>;

export type Reward = typeof rewards.$inferSelect;
export type InsertReward = z.infer<typeof insertRewardSchema>;

// Status and Category Constants
export const SUGGESTION_STATUSES = {
  NEW: "new", // İlk giriş (Kaizen Formu)
  DEPARTMENT_REVIEW: "department_review", // Bölüm Müdürü incelemesinde
  FEASIBILITY_ASSESSMENT: "feasibility_assessment", // Yapılabilirlik değerlendirmesinde
  FEASIBILITY_REJECTED: "feasibility_rejected", // Yapılabilirlik puanı düşük (< 2.5)
  SOLUTION_IDENTIFIED: "solution_identified", // Çözüm önerisi belirlenmiş
  COST_ASSESSMENT: "cost_assessment", // Maliyet değerlendirmesinde
  COST_REJECTED: "cost_rejected", // Maliyet puanı düşük (< 3)
  EXECUTIVE_REVIEW: "executive_review", // Genel Müdür incelemesinde
  APPROVED: "approved", // Onaylanmış
  REJECTED: "rejected", // Reddedilmiş
  IN_PROGRESS: "in_progress", // Uygulama aşamasında
  COMPLETED: "completed", // Uygulama tamamlandı
  REPORTED: "reported", // Raporlandı
  EVALUATED: "evaluated", // Değerlendirildi
  REWARDED: "rewarded" // Ödüllendirildi
} as const;

export const SUGGESTION_CATEGORIES = {
  PRODUCTION: "production",
  QUALITY: "quality",
  SAFETY: "safety", 
  ENVIRONMENT: "environment",
  COST: "cost",
  WORKPLACE: "workplace",
  OTHER: "other",
} as const;

export const REWARD_TYPES = {
  MONEY: "money",
  POINTS: "points",
  GIFT: "gift",
} as const;

// Extend with validation
export const extendedInsertSuggestionSchema = insertSuggestionSchema.extend({
  title: z.string().min(5, "Başlık en az 5 karakter olmalıdır").max(100, "Başlık en fazla 100 karakter olmalıdır"),
  description: z.string().min(10, "Açıklama en az 10 karakter olmalıdır"),
  benefits: z.string().min(10, "Beklenen faydalar en az 10 karakter olmalıdır"),
  
  // Kategori
  category: z.enum([
    SUGGESTION_CATEGORIES.PRODUCTION,
    SUGGESTION_CATEGORIES.QUALITY,
    SUGGESTION_CATEGORIES.SAFETY,
    SUGGESTION_CATEGORIES.ENVIRONMENT,
    SUGGESTION_CATEGORIES.COST,
    SUGGESTION_CATEGORIES.WORKPLACE,
    SUGGESTION_CATEGORIES.OTHER
  ]),
  
  // Kaizen türü
  kaizenType: z.enum([
    KAIZEN_TYPES.BEFORE_AFTER,
    KAIZEN_TYPES.KOBETSU
  ]),
  
  // İyileştirme türü
  improvementType: z.enum([
    IMPROVEMENT_TYPES.ISG,
    IMPROVEMENT_TYPES.ENVIRONMENT,
    IMPROVEMENT_TYPES.QUALITY,
    IMPROVEMENT_TYPES.PRODUCTION,
    IMPROVEMENT_TYPES.COST,
    IMPROVEMENT_TYPES.COMPETENCE,
    IMPROVEMENT_TYPES.SUSTAINABILITY,
    IMPROVEMENT_TYPES.FIVE_S,
    IMPROVEMENT_TYPES.EFFICIENCY,
    IMPROVEMENT_TYPES.OTHER
  ]),
  
  // Kobetsu Kaizen için proje lideri zorunlu
  projectLeader: z.number().optional().refine(
    (val) => {
      // Eğer veri yoksa validation'dan geçsin
      if (val === undefined || val === null) return true;
      // Sayı olarak geçerli bir ID ise geçsin
      return Number.isInteger(val) && val > 0;
    }, 
    {
      message: "Proje lideri geçerli bir kullanıcı ID'si olmalıdır"
    }
  ),
  
  // Dosya yükleme alanları opsiyonel
  currentStateFiles: z.array(z.string()).optional(),
  improvementFiles: z.array(z.string()).optional(),
  
  // Ekip üyeleri maksimum 4 kişi olabilir
  teamMembers: z.array(
    z.object({
      id: z.number(),
      name: z.string()
    })
  ).max(4, "Ekip en fazla 4 kişiden oluşabilir").optional(),
  
  // Şirkete katkısı
  companyContribution: z.string().min(10, "Şirkete katkı açıklaması en az 10 karakter olmalıdır").optional(),
});

export const extendedInsertRewardSchema = insertRewardSchema.extend({
  amount: z.number().positive("Ödül miktarı pozitif olmalıdır"),
  type: z.enum([REWARD_TYPES.MONEY, REWARD_TYPES.POINTS, REWARD_TYPES.GIFT]),
});

// Session tablosu - Express-session için gerekli
export const session = pgTable("session", {
  sid: varchar("sid").primaryKey(),
  sess: json("sess").notNull(),
  expire: timestamp("expire", { precision: 6 }).notNull(),
});
