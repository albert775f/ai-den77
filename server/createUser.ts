import { storage } from "./storage";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function createDemoUser() {
  try {
    console.log("Creating admin user Albert...");
    
    const hashedPassword = await hashPassword("password123");
    
    const user = await storage.createUser({
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email: "albert@company.com",
      password: hashedPassword,
      firstName: "Albert",
      lastName: "Admin",
      role: "admin",
    });
    
    console.log("Admin user created successfully:");
    console.log(`Email: ${user.email}`);
    console.log(`Password: password123`);
    console.log(`Name: ${user.firstName} ${user.lastName}`);
    console.log(`Role: ${user.role}`);
    
  } catch (error) {
    console.error("Error creating admin user:", error);
  }
}

createDemoUser();