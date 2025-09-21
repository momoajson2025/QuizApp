import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, decimal, boolean, jsonb, uuid, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table with comprehensive user management
export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phone: text("phone"),
  role: text("role").notNull().default("user"), // user, content_creator, state_admin, country_admin, superadmin
  isEmailVerified: boolean("is_email_verified").default(false),
  isActive: boolean("is_active").default(true),
  region: text("region"),
  country: text("country"),
  state: text("state"),
  totalEarnings: decimal("total_earnings", { precision: 10, scale: 2 }).default("0.00"),
  currentStreak: integer("current_streak").default(0),
  longestStreak: integer("longest_streak").default(0),
  quizzesCompleted: integer("quizzes_completed").default(0),
  points: integer("points").default(0),
  lastLoginAt: timestamp("last_login_at"),
  deviceFingerprint: text("device_fingerprint"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
}, (table) => ({
  emailIdx: index("users_email_idx").on(table.email),
  roleIdx: index("users_role_idx").on(table.role),
  regionIdx: index("users_region_idx").on(table.region),
}));

// OTP verification table
export const otpVerifications = pgTable("otp_verifications", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  otp: text("otp").notNull(),
  purpose: text("purpose").notNull(), // registration, password_reset
  expiresAt: timestamp("expires_at").notNull(),
  isUsed: boolean("is_used").default(false),
  createdAt: timestamp("created_at").default(sql`now()`),
});

// Categories for quizzes
export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  description: text("description"),
  icon: text("icon"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").default(sql`now()`),
});

// Quizzes table with comprehensive management
export const quizzes = pgTable("quizzes", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  categoryId: uuid("category_id").references(() => categories.id),
  creatorId: uuid("creator_id").references(() => users.id),
  difficulty: text("difficulty").notNull().default("medium"), // easy, medium, hard
  estimatedTime: integer("estimated_time").notNull(), // in minutes
  totalQuestions: integer("total_questions").notNull(),
  status: text("status").notNull().default("draft"), // draft, pending, approved, rejected, archived
  approvedBy: uuid("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  rejectionReason: text("rejection_reason"),
  publishScope: text("publish_scope").notNull().default("local"), // local, country, global
  targetRegion: text("target_region"),
  targetCountry: text("target_country"),
  targetState: text("target_state"),
  adPlacements: jsonb("ad_placements").default({}), // {left: boolean, right: boolean, top: boolean, bottom: boolean, video: boolean}
  isActive: boolean("is_active").default(true),
  participantCount: integer("participant_count").default(0),
  averageScore: decimal("average_score", { precision: 5, scale: 2 }).default("0.00"),
  totalRevenue: decimal("total_revenue", { precision: 10, scale: 2 }).default("0.00"),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
}, (table) => ({
  statusIdx: index("quizzes_status_idx").on(table.status),
  categoryIdx: index("quizzes_category_idx").on(table.categoryId),
  regionIdx: index("quizzes_region_idx").on(table.targetRegion),
}));

// Quiz questions
export const questions = pgTable("questions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  quizId: uuid("quiz_id").references(() => quizzes.id, { onDelete: "cascade" }),
  questionText: text("question_text").notNull(),
  questionType: text("question_type").notNull().default("multiple_choice"), // multiple_choice, true_false, text
  options: jsonb("options").notNull(), // Array of option objects
  correctAnswer: text("correct_answer").notNull(),
  explanation: text("explanation"),
  points: integer("points").default(10),
  timeLimit: integer("time_limit").default(30), // seconds
  order: integer("order").notNull(),
  createdAt: timestamp("created_at").default(sql`now()`),
});

// User quiz attempts
export const quizAttempts = pgTable("quiz_attempts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id),
  quizId: uuid("quiz_id").references(() => quizzes.id),
  score: integer("score").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  correctAnswers: integer("correct_answers").notNull(),
  timeSpent: integer("time_spent").notNull(), // seconds
  completedAt: timestamp("completed_at").default(sql`now()`),
  earnings: decimal("earnings", { precision: 8, scale: 2 }).default("0.00"),
  adViews: integer("ad_views").default(0),
  adRevenue: decimal("ad_revenue", { precision: 8, scale: 2 }).default("0.00"),
  deviceFingerprint: text("device_fingerprint"),
  ipAddress: text("ip_address"),
  isValid: boolean("is_valid").default(true), // for fraud detection
}, (table) => ({
  userIdx: index("quiz_attempts_user_idx").on(table.userId),
  quizIdx: index("quiz_attempts_quiz_idx").on(table.quizId),
  dateIdx: index("quiz_attempts_date_idx").on(table.completedAt),
}));

// Ad providers configuration
export const adProviders = pgTable("ad_providers", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  apiEndpoint: text("api_endpoint"),
  apiKey: text("api_key"),
  secretKey: text("secret_key"),
  configuration: jsonb("configuration").default({}),
  isActive: boolean("is_active").default(true),
  revenueShare: decimal("revenue_share", { precision: 5, scale: 2 }).default("0.80"), // 80% to users
  totalRevenue: decimal("total_revenue", { precision: 12, scale: 2 }).default("0.00"),
  createdAt: timestamp("created_at").default(sql`now()`),
});

// Ad placements and revenue tracking
export const adPlacements = pgTable("ad_placements", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  quizAttemptId: uuid("quiz_attempt_id").references(() => quizAttempts.id),
  adProviderId: uuid("ad_provider_id").references(() => adProviders.id),
  placement: text("placement").notNull(), // left, right, top, bottom, video
  impressions: integer("impressions").default(0),
  clicks: integer("clicks").default(0),
  revenue: decimal("revenue", { precision: 8, scale: 2 }).default("0.00"),
  userEarnings: decimal("user_earnings", { precision: 8, scale: 2 }).default("0.00"),
  platformFee: decimal("platform_fee", { precision: 8, scale: 2 }).default("0.00"),
  createdAt: timestamp("created_at").default(sql`now()`),
});

// Regions management  
export const regions = pgTable("regions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(), // country, state, city
  parentId: uuid("parent_id"),
  code: text("code"), // ISO codes for countries, state codes, etc.
  adminId: uuid("admin_id").references(() => users.id),
  isActive: boolean("is_active").default(true),
  configuration: jsonb("configuration").default({}),
  createdAt: timestamp("created_at").default(sql`now()`),
});

// Fraud detection logs
export const fraudDetectionLogs = pgTable("fraud_detection_logs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id),
  attemptId: uuid("attempt_id").references(() => quizAttempts.id),
  riskScore: integer("risk_score").notNull(), // 0-100
  riskFactors: jsonb("risk_factors").notNull(), // Array of detected risk factors
  ipAddress: text("ip_address"),
  deviceFingerprint: text("device_fingerprint"),
  userAgent: text("user_agent"),
  isVpn: boolean("is_vpn").default(false),
  isBlocked: boolean("is_blocked").default(false),
  action: text("action"), // warning, block, flag
  createdAt: timestamp("created_at").default(sql`now()`),
}, (table) => ({
  userIdx: index("fraud_logs_user_idx").on(table.userId),
  riskIdx: index("fraud_logs_risk_idx").on(table.riskScore),
  dateIdx: index("fraud_logs_date_idx").on(table.createdAt),
}));

// Audit logs for all administrative actions
export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(), // quiz, user, category, etc.
  entityId: text("entity_id"),
  oldValues: jsonb("old_values"),
  newValues: jsonb("new_values"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  sessionId: text("session_id"),
  createdAt: timestamp("created_at").default(sql`now()`),
}, (table) => ({
  userIdx: index("audit_logs_user_idx").on(table.userId),
  actionIdx: index("audit_logs_action_idx").on(table.action),
  entityIdx: index("audit_logs_entity_idx").on(table.entityType, table.entityId),
  dateIdx: index("audit_logs_date_idx").on(table.createdAt),
}));

// Leaderboards
export const leaderboards = pgTable("leaderboards", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id),
  scope: text("scope").notNull(), // global, country, state
  region: text("region"),
  rank: integer("rank").notNull(),
  points: integer("points").notNull(),
  earnings: decimal("earnings", { precision: 10, scale: 2 }).notNull(),
  quizzesCompleted: integer("quizzes_completed").notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`),
}, (table) => ({
  scopeIdx: index("leaderboards_scope_idx").on(table.scope),
  rankIdx: index("leaderboards_rank_idx").on(table.rank),
  regionIdx: index("leaderboards_region_idx").on(table.region),
}));

// Revenue splits and calculations
export const revenueSplits = pgTable("revenue_splits", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id),
  quizAttemptId: uuid("quiz_attempt_id").references(() => quizAttempts.id),
  adProviderId: uuid("ad_provider_id").references(() => adProviders.id),
  totalRevenue: decimal("total_revenue", { precision: 10, scale: 2 }).notNull(),
  userShare: decimal("user_share", { precision: 10, scale: 2 }).notNull(),
  platformShare: decimal("platform_share", { precision: 10, scale: 2 }).notNull(),
  sharePercentage: decimal("share_percentage", { precision: 5, scale: 2 }).notNull(),
  calculatedAt: timestamp("calculated_at").default(sql`now()`),
  processedAt: timestamp("processed_at"),
  status: text("status").default("pending"), // pending, processed, failed
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  otpVerifications: many(otpVerifications),
  quizzes: many(quizzes, { relationName: "creator" }),
  approvedQuizzes: many(quizzes, { relationName: "approver" }),
  quizAttempts: many(quizAttempts),
  region: one(regions, { fields: [users.region], references: [regions.id] }),
  fraudLogs: many(fraudDetectionLogs),
  auditLogs: many(auditLogs),
  leaderboards: many(leaderboards),
  revenueSplits: many(revenueSplits),
}));

export const otpVerificationsRelations = relations(otpVerifications, ({ one }) => ({
  user: one(users, { fields: [otpVerifications.userId], references: [users.id] }),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  quizzes: many(quizzes),
}));

export const quizzesRelations = relations(quizzes, ({ one, many }) => ({
  category: one(categories, { fields: [quizzes.categoryId], references: [categories.id] }),
  creator: one(users, { fields: [quizzes.creatorId], references: [users.id], relationName: "creator" }),
  approver: one(users, { fields: [quizzes.approvedBy], references: [users.id], relationName: "approver" }),
  questions: many(questions),
  attempts: many(quizAttempts),
}));

export const questionsRelations = relations(questions, ({ one }) => ({
  quiz: one(quizzes, { fields: [questions.quizId], references: [quizzes.id] }),
}));

export const quizAttemptsRelations = relations(quizAttempts, ({ one, many }) => ({
  user: one(users, { fields: [quizAttempts.userId], references: [users.id] }),
  quiz: one(quizzes, { fields: [quizAttempts.quizId], references: [quizzes.id] }),
  adPlacements: many(adPlacements),
  fraudLogs: many(fraudDetectionLogs),
  revenueSplits: many(revenueSplits),
}));

export const adProvidersRelations = relations(adProviders, ({ many }) => ({
  adPlacements: many(adPlacements),
  revenueSplits: many(revenueSplits),
}));

export const adPlacementsRelations = relations(adPlacements, ({ one }) => ({
  quizAttempt: one(quizAttempts, { fields: [adPlacements.quizAttemptId], references: [quizAttempts.id] }),
  adProvider: one(adProviders, { fields: [adPlacements.adProviderId], references: [adProviders.id] }),
}));

export const regionsRelations = relations(regions, ({ one, many }) => ({
  admin: one(users, { fields: [regions.adminId], references: [users.id] }),
}));

export const fraudDetectionLogsRelations = relations(fraudDetectionLogs, ({ one }) => ({
  user: one(users, { fields: [fraudDetectionLogs.userId], references: [users.id] }),
  attempt: one(quizAttempts, { fields: [fraudDetectionLogs.attemptId], references: [quizAttempts.id] }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, { fields: [auditLogs.userId], references: [users.id] }),
}));

export const leaderboardsRelations = relations(leaderboards, ({ one }) => ({
  user: one(users, { fields: [leaderboards.userId], references: [users.id] }),
}));

export const revenueSplitsRelations = relations(revenueSplits, ({ one }) => ({
  user: one(users, { fields: [revenueSplits.userId], references: [users.id] }),
  quizAttempt: one(quizAttempts, { fields: [revenueSplits.quizAttemptId], references: [quizAttempts.id] }),
  adProvider: one(adProviders, { fields: [revenueSplits.adProviderId], references: [adProviders.id] }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLoginAt: true,
});

export const insertOtpSchema = createInsertSchema(otpVerifications).omit({
  id: true,
  createdAt: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
});

export const insertQuizSchema = createInsertSchema(quizzes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  approvedAt: true,
});

export const insertQuestionSchema = createInsertSchema(questions).omit({
  id: true,
  createdAt: true,
});

export const insertQuizAttemptSchema = createInsertSchema(quizAttempts).omit({
  id: true,
  completedAt: true,
});

export const insertRegionSchema = createInsertSchema(regions).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type OtpVerification = typeof otpVerifications.$inferSelect;
export type InsertOtp = z.infer<typeof insertOtpSchema>;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Quiz = typeof quizzes.$inferSelect;
export type InsertQuiz = z.infer<typeof insertQuizSchema>;
export type Question = typeof questions.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type QuizAttempt = typeof quizAttempts.$inferSelect;
export type InsertQuizAttempt = z.infer<typeof insertQuizAttemptSchema>;
export type AdProvider = typeof adProviders.$inferSelect;
export type AdPlacement = typeof adPlacements.$inferSelect;
export type Region = typeof regions.$inferSelect;
export type InsertRegion = z.infer<typeof insertRegionSchema>;
export type FraudDetectionLog = typeof fraudDetectionLogs.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type Leaderboard = typeof leaderboards.$inferSelect;
export type RevenueSplit = typeof revenueSplits.$inferSelect;
