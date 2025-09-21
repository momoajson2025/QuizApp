import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function seed() {
  try {
    // Check if superadmin already exists
    const existingSuperAdmin = await db
      .select()
      .from(users)
      .where(eq(users.email, "superadmin@quizads.com"))
      .limit(1);

    if (existingSuperAdmin.length > 0) {
      console.log("Superadmin user already exists");
      return;
    }

    // Create superadmin user
    const hashedPassword = await hashPassword("SuperAdmin123!");

    await db.insert(users).values({
      email: "superadmin@quizads.com",
      password: hashedPassword,
      firstName: "Super",
      lastName: "Admin",
      role: "superadmin",
      isEmailVerified: true,
      isActive: true,
    });

    console.log("Superadmin user created successfully!");
    console.log("Email: superadmin@quizads.com");
    console.log("Password: SuperAdmin123!");

    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
}

seed();
