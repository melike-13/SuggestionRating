// schema.ts
import { pgTable, text, serial, integer, boolean, timestamp, varchar, json, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// USERS TABLE
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name").notNull(),
  fullName: text("full_name"), // <-- Yeni eklendi
  role: text("role").notNull().default("employee"),
  department: text("department"),
  isAdmin: boolean("is_admin").notNull().default(false),
  email: text("email"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  displayName: true,
  role: true,
  department: true,
  isAdmin: true,
  email: true,
});

export const USER_ROLES = {
  EMPLOYEE: "employee",
  MANAGER: "manager",
  EXECUTIVE: "executive",
  ADMIN: "executive",
};

export const KAIZEN_TYPES = {
  BEFORE_AFTER: "before_after",
  KOBETSU: "kobetsu",
} as const;

export const IMPROVEMENT_TYPES = {
  ISG: "isg",
  ENVIRONMENT: "environment",
  QUALITY: "quality",
  PRODUCTION: "production",
  COST: "cost",
  COMPETENCE: "competence",
  SUSTAINABILITY: "sustainability",
  FIVE_S: "5s",
  EFFICIENCY: "efficiency",
  OTHER: "other",
} as const;

// SUGGESTIONS TABLE
export const suggestions = pgTable("suggestions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  benefits: text("benefits").notNull(),
  status: text("status").notNull().default("new"),
  suggestionType: text("suggestion_type").notNull().default("kaizen"),
  kaizenType: text("kaizen_type").default(KAIZEN_TYPES.BEFORE_AFTER),
  improvementType: text("improvement_type").notNull().default(IMPROVEMENT_TYPES.QUALITY),
  targetDepartment: text("target_department"),
  teamMembers: json("team_members").$type<{id: number, name: string}[]>().default([]),
  projectLeader: integer("project_leader"),
  currentStateFiles: json("current_state_files").$type<string[]>().default([]),
  improvementFiles: json("improvement_files").$type<string[]>().default([]),
  companyContribution: text("company_contribution"),
  submittedBy: integer("submitted_by").notNull(),
  createdById: integer("created_by_id"), // <-- Yeni eklendi
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
  departmentManagerId: integer("department_manager_id"),
  departmentReviewAt: timestamp("department_review_at"),
  departmentFeedback: text("department_feedback"),
  feasibilityScore: integer("feasibility_score"),
  feasibilityFeedback: text("feasibility_feedback"),
  feasibilityReviewedBy: integer("feasibility_reviewed_by"),
  feasibilityReviewedAt: timestamp("feasibility_reviewed_at"),
  innovationScore: integer("innovation_score"),
  safetyScore: integer("safety_score"),
  environmentScore: integer("environment_score"),
  employeeSatisfactionScore: integer("employee_satisfaction_score"),
  technologicalCompatibilityScore: integer("technological_compatibility_score"),
  implementationEaseScore: integer("implementation_ease_score"),
  costBenefitScore: integer("cost_benefit_score"),
  solutionDescription: text("solution_description"),
  solutionProposedBy: integer("solution_proposed_by"),
  solutionProposedAt: timestamp("solution_proposed_at"),
  costScore: integer("cost_score"),
  costDetails: text("cost_details"),
  costReviewedBy: integer("cost_reviewed_by"),
  costReviewedAt: timestamp("cost_reviewed_at"),
  kivilcimLeaderId: integer("kivilcim_leader_id"),
  kivilcimReviewAt: timestamp("kivilcim_review_at"),
  kivilcimFeedback: text("kivilcim_feedback"),
  kivilcimCommitteeReviewAt: timestamp("kivilcim_committee_review_at"),
  kivilcimCommitteeFeedback: text("kivilcim_committee_feedback"),
  kivilcimDirectorReviewAt: timestamp("kivilcim_director_review_at"),
  kivilcimDirectorFeedback: text("kivilcim_director_feedback"),
  isReserved: boolean("is_reserved").default(false),
  reservationNotes: text("reservation_notes"),
  costCalculationDetails: json("cost_calculation_details").$type<{
    materials: { description: string, amount: number, unitPrice: number, totalPrice: number }[],
    labor: { description: string, amount: number, unitPrice: number, totalPrice: number }[],
    other: { description: string, amount: number, unitPrice: number, totalPrice: number }[]
  }>(),
  executiveReviewedBy: integer("executive_reviewed_by"),
  executiveReviewedAt: timestamp("executive_reviewed_at"),
  executiveFeedback: text("executive_feedback"),
  implementationStartedAt: timestamp("implementation_started_at"),
  implementationCompletedAt: timestamp("implementation_completed_at"),
  implementationNotes: text("implementation_notes"),
  reportedAt: timestamp("reported_at"),
  reportDetails: text("report_details"),
  reportedBy: integer("reported_by"),
  evaluationScore: integer("evaluation_score"),
  evaluationNotes: text("evaluation_notes"),
  evaluatedBy: integer("evaluated_by"),
  evaluatedAt: timestamp("evaluated_at"),
  rating: integer("rating"),
  feedback: text("feedback"),
  reviewedBy: integer("reviewed_by"),
  reviewedAt: timestamp("reviewed_at"),
});

// REWARDS TABLE
export const rewards = pgTable("rewards", {
  id: serial("id").primaryKey(),
  suggestionId: integer("suggestion_id").notNull(),
  userId: integer("user_id"), // <-- Yeni eklendi
  amount: integer("amount").notNull(),
  type: text("type").notNull(),
  assignedBy: integer("assigned_by").notNull(),
  assignedAt: timestamp("assigned_at").notNull().defaultNow(),
});
