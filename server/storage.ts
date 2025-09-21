import { 
  users, otpVerifications, categories, quizzes, questions, quizAttempts, 
  adProviders, adPlacements, regions, fraudDetectionLogs, auditLogs, 
  leaderboards, revenueSplits,
  type User, type InsertUser, type OtpVerification, type InsertOtp,
  type Category, type Quiz, type Question, type QuizAttempt, type InsertQuizAttempt,
  type FraudDetectionLog, type AuditLog, type Leaderboard
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, sql, gte, lte, ilike, inArray } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User management
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserLoginInfo(id: string, info: { lastLoginAt: Date; ipAddress: string; deviceFingerprint: string }): Promise<void>;
  updateUserStats(id: string, stats: { quizzesCompleted: number; totalEarnings: number; points: number; currentStreak: number }): Promise<void>;
  verifyUserEmail(userId: string): Promise<void>;

  // OTP management
  createOtpVerification(otp: InsertOtp): Promise<OtpVerification>;
  verifyOtp(email: string, otp: string): Promise<OtpVerification | null>;

  // Quiz management
  getQuizzes(filters: { category?: string; difficulty?: string; region?: string; status?: string }): Promise<Quiz[]>;
  getQuizById(id: string): Promise<Quiz | undefined>;
  getQuizQuestions(quizId: string): Promise<Question[]>;
  getAdminQuizzes(filters: { status?: string; category?: string; creator?: string; adminRole: string; adminRegion?: string }): Promise<Quiz[]>;
  approveQuiz(id: string, approverId: string): Promise<Quiz>;
  rejectQuiz(id: string, reason: string): Promise<Quiz>;

  // Quiz attempts
  createQuizAttempt(attempt: InsertQuizAttempt): Promise<QuizAttempt>;
  updateQuizAttemptEarnings(id: string, earnings: { adRevenue: number; earnings: number }): Promise<void>;

  // Categories
  getCategories(): Promise<Category[]>;

  // Dashboard and analytics
  getUserDashboardStats(userId: string): Promise<any>;
  getUserRecentActivity(userId: string): Promise<any[]>;
  getUserEarnings(userId: string): Promise<any>;
  getLeaderboard(filters: { scope: string; region?: string }): Promise<Leaderboard[]>;
  getSuperAdminAnalytics(): Promise<any>;
  getRevenueAnalytics(): Promise<any>;

  // Fraud detection
  calculateRiskScore(data: { userId: string; ipAddress: string; deviceFingerprint: string; timeSpent: number; score: number }): Promise<number>;
  getFraudDetectionLogs(): Promise<FraudDetectionLog[]>;

  // Audit logging
  createAuditLog(log: { userId: string; action: string; entityType: string; entityId: string; oldValues?: any; newValues?: any; ipAddress: string; userAgent: string }): Promise<AuditLog>;
  getAuditLogs(): Promise<AuditLog[]>;

  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUserLoginInfo(id: string, info: { lastLoginAt: Date; ipAddress: string; deviceFingerprint: string }): Promise<void> {
    await db
      .update(users)
      .set({
        lastLoginAt: info.lastLoginAt,
        ipAddress: info.ipAddress,
        deviceFingerprint: info.deviceFingerprint,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id));
  }

  async updateUserStats(id: string, stats: { quizzesCompleted: number; totalEarnings: number; points: number; currentStreak: number }): Promise<void> {
    await db
      .update(users)
      .set({
        quizzesCompleted: stats.quizzesCompleted,
        totalEarnings: stats.totalEarnings.toString(),
        points: stats.points,
        currentStreak: stats.currentStreak,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id));
  }

  async verifyUserEmail(userId: string): Promise<void> {
    await db
      .update(users)
      .set({ isEmailVerified: true, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  async createOtpVerification(otp: InsertOtp): Promise<OtpVerification> {
    // Mark previous OTPs as used
    await db
      .update(otpVerifications)
      .set({ isUsed: true })
      .where(and(
        eq(otpVerifications.email, otp.email),
        eq(otpVerifications.purpose, otp.purpose),
        eq(otpVerifications.isUsed, false)
      ));

    const [verification] = await db
      .insert(otpVerifications)
      .values(otp)
      .returning();
    return verification;
  }

  async verifyOtp(email: string, otp: string): Promise<OtpVerification | null> {
    const [verification] = await db
      .select()
      .from(otpVerifications)
      .where(and(
        eq(otpVerifications.email, email),
        eq(otpVerifications.otp, otp),
        eq(otpVerifications.isUsed, false),
        gte(otpVerifications.expiresAt, new Date())
      ));

    if (verification) {
      // Mark as used
      await db
        .update(otpVerifications)
        .set({ isUsed: true })
        .where(eq(otpVerifications.id, verification.id));
      
      return verification;
    }

    return null;
  }

  async getQuizzes(filters: { category?: string; difficulty?: string; region?: string; status?: string }): Promise<Quiz[]> {
    let query = db.select().from(quizzes);
    const conditions = [eq(quizzes.isActive, true)];

    if (filters.status) {
      conditions.push(eq(quizzes.status, filters.status));
    }
    if (filters.difficulty) {
      conditions.push(eq(quizzes.difficulty, filters.difficulty));
    }
    if (filters.category) {
      conditions.push(eq(quizzes.categoryId, filters.category));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return await query.orderBy(desc(quizzes.createdAt));
  }

  async getQuizById(id: string): Promise<Quiz | undefined> {
    const [quiz] = await db.select().from(quizzes).where(eq(quizzes.id, id));
    return quiz || undefined;
  }

  async getQuizQuestions(quizId: string): Promise<Question[]> {
    return await db
      .select()
      .from(questions)
      .where(eq(questions.quizId, quizId))
      .orderBy(asc(questions.order));
  }

  async getAdminQuizzes(filters: { status?: string; category?: string; creator?: string; adminRole: string; adminRegion?: string }): Promise<Quiz[]> {
    let query = db.select().from(quizzes);
    const conditions = [];

    if (filters.status) {
      conditions.push(eq(quizzes.status, filters.status));
    }
    if (filters.category) {
      conditions.push(eq(quizzes.categoryId, filters.category));
    }
    if (filters.creator) {
      conditions.push(eq(quizzes.creatorId, filters.creator));
    }

    // Apply regional restrictions based on admin role
    if (filters.adminRole === 'state_admin' && filters.adminRegion) {
      conditions.push(eq(quizzes.targetState, filters.adminRegion));
    } else if (filters.adminRole === 'country_admin' && filters.adminRegion) {
      conditions.push(eq(quizzes.targetCountry, filters.adminRegion));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return await query.orderBy(desc(quizzes.createdAt));
  }

  async approveQuiz(id: string, approverId: string): Promise<Quiz> {
    const [quiz] = await db
      .update(quizzes)
      .set({
        status: 'approved',
        approvedBy: approverId,
        approvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(quizzes.id, id))
      .returning();
    return quiz;
  }

  async rejectQuiz(id: string, reason: string): Promise<Quiz> {
    const [quiz] = await db
      .update(quizzes)
      .set({
        status: 'rejected',
        rejectionReason: reason,
        updatedAt: new Date(),
      })
      .where(eq(quizzes.id, id))
      .returning();
    return quiz;
  }

  async createQuizAttempt(attempt: InsertQuizAttempt): Promise<QuizAttempt> {
    const [created] = await db
      .insert(quizAttempts)
      .values(attempt)
      .returning();
    return created;
  }

  async updateQuizAttemptEarnings(id: string, earnings: { adRevenue: number; earnings: number }): Promise<void> {
    await db
      .update(quizAttempts)
      .set({
        adRevenue: earnings.adRevenue.toString(),
        earnings: earnings.earnings.toString(),
      })
      .where(eq(quizAttempts.id, id));
  }

  async getCategories(): Promise<Category[]> {
    return await db
      .select()
      .from(categories)
      .where(eq(categories.isActive, true))
      .orderBy(asc(categories.name));
  }

  async getUserDashboardStats(userId: string): Promise<any> {
    const user = await this.getUser(userId);
    if (!user) throw new Error('User not found');

    // Get recent quiz attempts count
    const recentAttempts = await db
      .select({ count: sql<number>`count(*)` })
      .from(quizAttempts)
      .where(and(
        eq(quizAttempts.userId, userId),
        gte(quizAttempts.completedAt, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) // Last 30 days
      ));

    return {
      totalEarnings: user.totalEarnings,
      quizzesCompleted: user.quizzesCompleted,
      currentStreak: user.currentStreak,
      points: user.points,
      recentQuizzes: recentAttempts[0]?.count || 0,
    };
  }

  async getUserRecentActivity(userId: string): Promise<any[]> {
    const attempts = await db
      .select({
        id: quizAttempts.id,
        score: quizAttempts.score,
        earnings: quizAttempts.earnings,
        completedAt: quizAttempts.completedAt,
        quizTitle: quizzes.title,
      })
      .from(quizAttempts)
      .leftJoin(quizzes, eq(quizAttempts.quizId, quizzes.id))
      .where(eq(quizAttempts.userId, userId))
      .orderBy(desc(quizAttempts.completedAt))
      .limit(10);

    return attempts.map(attempt => ({
      type: 'quiz_completed',
      title: `Earned $${attempt.earnings} from ${attempt.quizTitle}`,
      timestamp: attempt.completedAt,
      details: {
        score: attempt.score,
        earnings: attempt.earnings,
      },
    }));
  }

  async getUserEarnings(userId: string): Promise<any> {
    const earningsData = await db
      .select({
        totalEarnings: sql<string>`sum(${quizAttempts.earnings})`,
        totalQuizzes: sql<number>`count(*)`,
        avgEarnings: sql<string>`avg(${quizAttempts.earnings})`,
      })
      .from(quizAttempts)
      .where(eq(quizAttempts.userId, userId));

    const monthlyEarnings = await db
      .select({
        month: sql<string>`date_trunc('month', ${quizAttempts.completedAt})`,
        earnings: sql<string>`sum(${quizAttempts.earnings})`,
      })
      .from(quizAttempts)
      .where(eq(quizAttempts.userId, userId))
      .groupBy(sql`date_trunc('month', ${quizAttempts.completedAt})`)
      .orderBy(sql`date_trunc('month', ${quizAttempts.completedAt})`);

    return {
      total: earningsData[0]?.totalEarnings || '0',
      totalQuizzes: earningsData[0]?.totalQuizzes || 0,
      average: earningsData[0]?.avgEarnings || '0',
      monthly: monthlyEarnings,
    };
  }

  async getLeaderboard(filters: { scope: string; region?: string }): Promise<Leaderboard[]> {
    let query = db.select().from(leaderboards);
    const conditions = [eq(leaderboards.scope, filters.scope)];

    if (filters.region) {
      conditions.push(eq(leaderboards.region, filters.region));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return await query.orderBy(asc(leaderboards.rank)).limit(100);
  }

  async getSuperAdminAnalytics(): Promise<any> {
    const totalUsers = await db
      .select({ count: sql<number>`count(*)` })
      .from(users);

    const totalRevenue = await db
      .select({ total: sql<string>`sum(${quizAttempts.adRevenue})` })
      .from(quizAttempts);

    const totalQuizzes = await db
      .select({ count: sql<number>`count(*)` })
      .from(quizzes)
      .where(eq(quizzes.status, 'approved'));

    const activeUsers = await db
      .select({ count: sql<number>`count(distinct ${quizAttempts.userId})` })
      .from(quizAttempts)
      .where(gte(quizAttempts.completedAt, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)));

    return {
      totalUsers: totalUsers[0]?.count || 0,
      totalRevenue: totalRevenue[0]?.total || '0',
      totalQuizzes: totalQuizzes[0]?.count || 0,
      activeUsers: activeUsers[0]?.count || 0,
    };
  }

  async getRevenueAnalytics(): Promise<any> {
    const dailyRevenue = await db
      .select({
        date: sql<string>`date_trunc('day', ${quizAttempts.completedAt})`,
        revenue: sql<string>`sum(${quizAttempts.adRevenue})`,
        userEarnings: sql<string>`sum(${quizAttempts.earnings})`,
      })
      .from(quizAttempts)
      .where(gte(quizAttempts.completedAt, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)))
      .groupBy(sql`date_trunc('day', ${quizAttempts.completedAt})`)
      .orderBy(sql`date_trunc('day', ${quizAttempts.completedAt})`);

    return {
      daily: dailyRevenue,
    };
  }

  async calculateRiskScore(data: { userId: string; ipAddress: string; deviceFingerprint: string; timeSpent: number; score: number }): Promise<number> {
    let riskScore = 0;

    // Check for multiple attempts from same IP
    const ipAttempts = await db
      .select({ count: sql<number>`count(*)` })
      .from(quizAttempts)
      .where(and(
        eq(quizAttempts.ipAddress, data.ipAddress),
        gte(quizAttempts.completedAt, new Date(Date.now() - 24 * 60 * 60 * 1000)) // Last 24 hours
      ));

    if (ipAttempts[0]?.count > 10) riskScore += 30;
    else if (ipAttempts[0]?.count > 5) riskScore += 15;

    // Check for suspiciously fast completion
    const avgTime = await db
      .select({ avg: sql<number>`avg(${quizAttempts.timeSpent})` })
      .from(quizAttempts)
      .where(eq(quizAttempts.userId, data.userId));

    if (avgTime[0]?.avg && data.timeSpent < avgTime[0].avg * 0.3) {
      riskScore += 25;
    }

    // Check for perfect or very high scores
    if (data.score === 100) riskScore += 20;
    else if (data.score > 95) riskScore += 10;

    // Log the risk assessment
    await db.insert(fraudDetectionLogs).values({
      userId: data.userId,
      riskScore,
      riskFactors: JSON.stringify([
        { factor: 'ip_attempts', value: ipAttempts[0]?.count },
        { factor: 'time_spent', value: data.timeSpent },
        { factor: 'score', value: data.score },
      ]),
      ipAddress: data.ipAddress,
      deviceFingerprint: data.deviceFingerprint,
      isBlocked: riskScore >= 70,
      action: riskScore >= 70 ? 'block' : riskScore >= 50 ? 'flag' : 'none',
    });

    return riskScore;
  }

  async getFraudDetectionLogs(): Promise<FraudDetectionLog[]> {
    return await db
      .select()
      .from(fraudDetectionLogs)
      .orderBy(desc(fraudDetectionLogs.createdAt))
      .limit(100);
  }

  async createAuditLog(log: { userId: string; action: string; entityType: string; entityId: string; oldValues?: any; newValues?: any; ipAddress: string; userAgent: string }): Promise<AuditLog> {
    const [auditLog] = await db
      .insert(auditLogs)
      .values({
        ...log,
        oldValues: log.oldValues ? JSON.stringify(log.oldValues) : null,
        newValues: log.newValues ? JSON.stringify(log.newValues) : null,
      })
      .returning();
    return auditLog;
  }

  async getAuditLogs(): Promise<AuditLog[]> {
    return await db
      .select()
      .from(auditLogs)
      .orderBy(desc(auditLogs.createdAt))
      .limit(100);
  }
}

export const storage = new DatabaseStorage();
