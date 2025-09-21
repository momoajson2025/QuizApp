import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { z } from "zod";

export function registerRoutes(app: Express): Server {
  // Setup authentication routes
  setupAuth(app);

  // Middleware to check authentication
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    next();
  };

  // Middleware to check roles
  const requireRole = (roles: string[]) => {
    return (req: any, res: any, next: any) => {
      if (!req.user || !roles.includes(req.user.role)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      next();
    };
  };

  // Quiz endpoints
  app.get("/api/quizzes", requireAuth, async (req, res, next) => {
    try {
      const { category, difficulty, region } = req.query;
      const quizzes = await storage.getQuizzes({
        category: category as string,
        difficulty: difficulty as string,
        region: region as string,
        status: 'approved',
      });
      res.json(quizzes);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/quizzes/:id", requireAuth, async (req, res, next) => {
    try {
      const quiz = await storage.getQuizById(req.params.id);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }
      res.json(quiz);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/quizzes/:id/questions", requireAuth, async (req, res, next) => {
    try {
      const questions = await storage.getQuizQuestions(req.params.id);
      res.json(questions);
    } catch (error) {
      next(error);
    }
  });

  // Quiz attempt endpoints
  app.post("/api/quiz-attempts", requireAuth, async (req, res, next) => {
    try {
      const attemptSchema = z.object({
        quizId: z.string().uuid(),
        score: z.number().min(0),
        totalQuestions: z.number().min(1),
        correctAnswers: z.number().min(0),
        timeSpent: z.number().min(1),
        answers: z.array(z.object({
          questionId: z.string().uuid(),
          answer: z.string(),
          timeSpent: z.number(),
        })),
      });

      const data = attemptSchema.parse(req.body);
      
      // Fraud detection check
      const riskScore = await storage.calculateRiskScore({
        userId: req.user.id,
        ipAddress: req.ip,
        deviceFingerprint: req.headers['user-agent'] || '',
        timeSpent: data.timeSpent,
        score: data.score,
      });

      // Create quiz attempt
      const attempt = await storage.createQuizAttempt({
        ...data,
        userId: req.user.id,
        deviceFingerprint: req.headers['user-agent'] || '',
        ipAddress: req.ip,
        isValid: riskScore < 70, // Mark as invalid if high risk
      });

      // Calculate earnings (mock ad revenue calculation)
      const adRevenue = Math.random() * 5 + 1; // $1-$6 mock ad revenue
      const userEarnings = adRevenue * 0.8; // 80% to user
      const platformFee = adRevenue * 0.2; // 20% platform fee

      // Update attempt with earnings
      await storage.updateQuizAttemptEarnings(attempt.id, {
        adRevenue,
        earnings: userEarnings,
      });

      // Update user stats
      await storage.updateUserStats(req.user.id, {
        quizzesCompleted: req.user.quizzesCompleted + 1,
        totalEarnings: parseFloat(req.user.totalEarnings) + userEarnings,
        points: req.user.points + data.score,
        currentStreak: req.user.currentStreak + 1,
      });

      res.json({
        attempt,
        earnings: userEarnings,
        platformFee,
        riskScore,
      });
    } catch (error) {
      next(error);
    }
  });

  // User dashboard endpoints
  app.get("/api/dashboard/stats", requireAuth, async (req, res, next) => {
    try {
      const stats = await storage.getUserDashboardStats(req.user.id);
      res.json(stats);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/dashboard/recent-activity", requireAuth, async (req, res, next) => {
    try {
      const activities = await storage.getUserRecentActivity(req.user.id);
      res.json(activities);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/dashboard/earnings", requireAuth, async (req, res, next) => {
    try {
      const earnings = await storage.getUserEarnings(req.user.id);
      res.json(earnings);
    } catch (error) {
      next(error);
    }
  });

  // Leaderboard endpoints
  app.get("/api/leaderboard", requireAuth, async (req, res, next) => {
    try {
      const { scope = 'global', region } = req.query;
      const leaderboard = await storage.getLeaderboard({
        scope: scope as string,
        region: region as string,
      });
      res.json(leaderboard);
    } catch (error) {
      next(error);
    }
  });

  // Admin endpoints
  app.get("/api/admin/quizzes", requireAuth, requireRole(['content_creator', 'state_admin', 'country_admin', 'superadmin']), async (req, res, next) => {
    try {
      const { status, category, creator } = req.query;
      const quizzes = await storage.getAdminQuizzes({
        status: status as string,
        category: category as string,
        creator: creator as string,
        adminRole: req.user.role,
        adminRegion: req.user.region,
      });
      res.json(quizzes);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/admin/quizzes/:id/approve", requireAuth, requireRole(['state_admin', 'country_admin', 'superadmin']), async (req, res, next) => {
    try {
      const quiz = await storage.approveQuiz(req.params.id, req.user.id);
      
      // Log audit action
      await storage.createAuditLog({
        userId: req.user.id,
        action: 'approve_quiz',
        entityType: 'quiz',
        entityId: req.params.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] || '',
      });

      res.json(quiz);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/admin/quizzes/:id/reject", requireAuth, requireRole(['state_admin', 'country_admin', 'superadmin']), async (req, res, next) => {
    try {
      const { reason } = req.body;
      const quiz = await storage.rejectQuiz(req.params.id, reason);
      
      // Log audit action
      await storage.createAuditLog({
        userId: req.user.id,
        action: 'reject_quiz',
        entityType: 'quiz',
        entityId: req.params.id,
        newValues: { rejectionReason: reason },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] || '',
      });

      res.json(quiz);
    } catch (error) {
      next(error);
    }
  });

  // SuperAdmin endpoints
  app.get("/api/superadmin/analytics", requireAuth, requireRole(['superadmin']), async (req, res, next) => {
    try {
      const analytics = await storage.getSuperAdminAnalytics();
      res.json(analytics);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/superadmin/revenue", requireAuth, requireRole(['superadmin']), async (req, res, next) => {
    try {
      const revenue = await storage.getRevenueAnalytics();
      res.json(revenue);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/superadmin/fraud-logs", requireAuth, requireRole(['superadmin']), async (req, res, next) => {
    try {
      const logs = await storage.getFraudDetectionLogs();
      res.json(logs);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/superadmin/audit-logs", requireAuth, requireRole(['superadmin']), async (req, res, next) => {
    try {
      const logs = await storage.getAuditLogs();
      res.json(logs);
    } catch (error) {
      next(error);
    }
  });

  // Categories endpoint
  app.get("/api/categories", async (req, res, next) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      next(error);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
