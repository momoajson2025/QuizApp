import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import { z } from "zod";
import nodemailer from "nodemailer";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Email transporter setup
const transporter = nodemailer.createTransport({
  host: 'sandbox.smtp.mailtrap.io',
  port: 2525,
  auth: {
    user: '9540e4850d191b',
    pass: '4bc36a6aa3dc08',
  },
});

// Generate OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP email
async function sendOTPEmail(email: string, otp: string, purpose: string) {
  const subject = purpose === 'registration' ? 'Verify Your QuizRevenue Account' : 'Password Reset Code';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%); padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">QuizRevenue</h1>
      </div>
      <div style="padding: 30px; background: #f9f9f9;">
        <h2 style="color: #333;">Verification Code</h2>
        <p style="color: #666; font-size: 16px;">Your verification code is:</p>
        <div style="background: white; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; color: #8B5CF6; letter-spacing: 5px;">${otp}</span>
        </div>
        <p style="color: #666;">This code will expire in 10 minutes.</p>
        <p style="color: #999; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.FROM_EMAIL || 'noreply@quizrevenue.com',
    to: email,
    subject,
    html,
  });
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      { usernameField: 'email' },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user || !(await comparePasswords(password, user.password))) {
            return done(null, false, { message: 'Invalid credentials' });
          }
          if (!user.isEmailVerified) {
            return done(null, false, { message: 'Please verify your email first' });
          }
          if (!user.isActive) {
            return done(null, false, { message: 'Account is suspended' });
          }
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    ),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Registration endpoint
  app.post("/api/register", async (req, res, next) => {
    try {
      const registerSchema = z.object({
        email: z.string().email(),
        password: z.string().min(8),
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        phone: z.string().optional(),
        region: z.string().optional(),
      });

      const data = registerSchema.parse(req.body);
      
      const existingUser = await storage.getUserByEmail(data.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Create user
      const hashedPassword = await hashPassword(data.password);
      const user = await storage.createUser({
        ...data,
        password: hashedPassword,
        role: 'user',
      });

      // Generate and send OTP
      const otp = generateOTP();
      await storage.createOtpVerification({
        userId: user.id,
        email: user.email,
        otp,
        purpose: 'registration',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      });

      await sendOTPEmail(user.email, otp, 'registration');

      res.status(201).json({ 
        message: "Registration successful. Please check your email for verification code.",
        userId: user.id,
        email: user.email 
      });
    } catch (error) {
      next(error);
    }
  });

  // OTP verification endpoint
  app.post("/api/verify-otp", async (req, res, next) => {
    try {
      const { email, otp } = req.body;
      
      const verification = await storage.verifyOtp(email, otp);
      if (!verification) {
        return res.status(400).json({ message: "Invalid or expired OTP" });
      }

      // Mark user as verified
      await storage.verifyUserEmail(verification.userId);

      // Log the user in
      const user = await storage.getUser(verification.userId);
      if (user) {
        req.login(user, (err) => {
          if (err) return next(err);
          res.json({ 
            message: "Email verified successfully",
            user: {
              id: user.id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              role: user.role,
            }
          });
        });
      }
    } catch (error) {
      next(error);
    }
  });

  // Login endpoint
  app.post("/api/login", async (req, res, next) => {
    passport.authenticate("local", (err: any, user: SelectUser, info: any) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: info?.message || "Login failed" });
      }

      req.login(user, async (err) => {
        if (err) return next(err);
        
        // Update last login and device info
        await storage.updateUserLoginInfo(user.id, {
          lastLoginAt: new Date(),
          ipAddress: req.ip,
          deviceFingerprint: req.headers['user-agent'] || '',
        });

        res.json({
          message: "Login successful",
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            totalEarnings: user.totalEarnings,
            currentStreak: user.currentStreak,
            quizzesCompleted: user.quizzesCompleted,
            points: user.points,
          }
        });
      });
    })(req, res, next);
  });

  // Logout endpoint
  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.json({ message: "Logout successful" });
    });
  });

  // Get current user
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const user = req.user;
    res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      totalEarnings: user.totalEarnings,
      currentStreak: user.currentStreak,
      quizzesCompleted: user.quizzesCompleted,
      points: user.points,
      region: user.region,
      country: user.country,
      state: user.state,
    });
  });

  // Resend OTP
  app.post("/api/resend-otp", async (req, res, next) => {
    try {
      const { email } = req.body;
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.isEmailVerified) {
        return res.status(400).json({ message: "Email already verified" });
      }

      // Generate new OTP
      const otp = generateOTP();
      await storage.createOtpVerification({
        userId: user.id,
        email: user.email,
        otp,
        purpose: 'registration',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      });

      await sendOTPEmail(user.email, otp, 'registration');

      res.json({ message: "OTP sent successfully" });
    } catch (error) {
      next(error);
    }
  });
}
