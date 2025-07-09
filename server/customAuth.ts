import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";

const scryptAsync = promisify(scrypt);

// Hash password with salt
async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// Compare passwords
async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// User session interface
interface UserSession {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
}

// Extend Express session
declare module "express-session" {
  interface SessionData {
    user?: UserSession;
  }
}

// Login schema
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// Admin create user schema
const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: z.string().optional().default("employee"),
});

// Password change schema
const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
  confirmPassword: z.string().min(1),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Profile update schema
const profileUpdateSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
});

// Configure multer for profile picture uploads
const storage_multer = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), "uploads", "profiles");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const userId = req.session.user?.id;
    if (!userId) {
      return cb(new Error("User not authenticated"));
    }
    const ext = path.extname(file.originalname);
    cb(null, `profile-${userId}-${Date.now()}${ext}`);
  },
});

// Configure multer for todo file uploads
const todoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), "uploads", "todos");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const userId = req.session.user?.id;
    if (!userId) {
      return cb(new Error("User not authenticated"));
    }
    const ext = path.extname(file.originalname);
    cb(null, `todo-${userId}-${Date.now()}${ext}`);
  },
});

const upload = multer({ 
  storage: storage_multer,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed."));
    }
  }
});

const todoUpload = multer({ 
  storage: todoStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit for todos
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/aac', 'audio/ogg'
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only images and audio files are allowed."));
    }
  },
});

export function setupCustomAuth(app: Express) {
  // Session configuration
  app.use(session({
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  }));

  // Admin route to create new employee accounts
  app.post("/api/admin/create-user", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Check if user is admin
      if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { email, password, firstName, lastName, role, roleIds } = req.body;
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }
      
      // Hash password
      const hashedPassword = await hashPassword(password);
      
      // Create user
      const user = await storage.createUser({
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role,
      });

      // Assign roles if roleIds are provided
      if (roleIds && roleIds.length > 0) {
        for (const roleId of roleIds) {
          await storage.assignUserRole(user.id, roleId);
        }
      }
      
      res.status(201).json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      });
    } catch (error) {
      console.error("User creation error:", error);
      res.status(500).json({ message: "User creation failed" });
    }
  });

  // Admin route to get all users
  app.get("/api/admin/users", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const users = await storage.getAllUsers();
      res.json(users.map(user => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
      })));
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Admin route to delete user
  app.delete("/api/admin/users/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const userId = req.params.id;
      
      // Don't allow deleting yourself
      if (userId === req.session.user.id) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }

      const success = await storage.deleteUser(userId);
      if (success) {
        res.json({ message: "User deleted successfully" });
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Admin stats route
  app.get("/api/admin/stats", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const stats = await storage.getSystemStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching system stats:", error);
      res.status(500).json({ message: "Failed to fetch system stats" });
    }
  });

  // Admin route to update user
  app.put("/api/admin/users/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { id } = req.params;
      const { roleIds, ...updateData } = req.body;
      
      const updatedUser = await storage.updateUser(id, updateData);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Update user roles if roleIds are provided
      if (roleIds !== undefined) {
        // First, remove all existing roles for this user
        const existingRoles = await storage.getUserRoles(id);
        for (const existingRole of existingRoles) {
          await storage.removeUserRole(id, existingRole.id);
        }
        
        // Then assign new roles
        for (const roleId of roleIds) {
          await storage.assignUserRole(id, roleId);
        }
      }
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Admin route to change user password
  app.put("/api/admin/users/:id/password", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { id } = req.params;
      const { password } = req.body;
      
      const hashedPassword = await hashPassword(password);
      const updatedUser = await storage.updateUser(id, { password: hashedPassword });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Error updating password:", error);
      res.status(500).json({ message: "Failed to update password" });
    }
  });

  // System settings routes
  app.get("/api/admin/system-settings", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const settings = await storage.getSystemSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching system settings:", error);
      res.status(500).json({ message: "Failed to fetch system settings" });
    }
  });

  // Public system settings endpoint for unauthenticated access (landing page, auth page)
  app.get("/api/system-settings", async (req: Request, res: Response) => {
    try {
      const settings = await storage.getSystemSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching system settings:", error);
      res.status(500).json({ message: "Failed to fetch system settings" });
    }
  });

  app.post("/api/admin/system-settings", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { key, value } = req.body;
      const setting = await storage.setSystemSetting(key, value);
      res.json(setting);
    } catch (error) {
      console.error("Error updating system setting:", error);
      res.status(500).json({ message: "Failed to update system setting" });
    }
  });

  app.get("/api/system-settings/:key", async (req: Request, res: Response) => {
    try {
      const key = req.params.key;
      const setting = await storage.getSystemSetting(key);
      if (!setting) {
        return res.status(404).json({ message: "Setting not found" });
      }
      res.json(setting);
    } catch (error) {
      console.error("Error fetching system setting:", error);
      res.status(500).json({ message: "Failed to fetch system setting" });
    }
  });

  // Admin route to toggle user status
  app.put("/api/admin/users/:id/status", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { id } = req.params;
      const { isActive } = req.body;
      
      const updatedUser = await storage.updateUser(id, { isActive });
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user status:", error);
      res.status(500).json({ message: "Failed to update user status" });
    }
  });

  // Admin route to bulk delete users
  app.delete("/api/admin/users/bulk", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { userIds } = req.body;
      
      for (const id of userIds) {
        // Don't allow deleting yourself
        if (id !== req.session.user.id) {
          await storage.deleteUser(id);
        }
      }
      
      res.json({ message: "Users deleted successfully" });
    } catch (error) {
      console.error("Error deleting users:", error);
      res.status(500).json({ message: "Failed to delete users" });
    }
  });

  // Login route
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      // Find user
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Check password
      const isValid = await comparePasswords(password, user.password);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Create session
      req.session.user = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      };
      
      console.log("User logged in successfully:", {
        id: user.id,
        email: user.email,
        role: user.role,
      });
      
      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        profileImageUrl: user.profileImageUrl,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Logout route
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // Get current user
  app.get("/api/auth/user", async (req: Request, res: Response) => {
    if (req.session.user) {
      try {
        // Fetch fresh user data from database to ensure we have the latest information
        const user = await storage.getUser(req.session.user.id);
        if (user) {
          const userData = {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            isActive: user.isActive,
            profileImageUrl: user.profileImageUrl,
          };
          console.log("User session data:", userData);
          res.json(userData);
        } else {
          res.status(401).json({ message: "User not found" });
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        res.status(500).json({ message: "Failed to fetch user data" });
      }
    } else {
      res.status(401).json({ message: "Not authenticated" });
    }
  });

  // User role assignment endpoints
  app.get("/api/admin/users/:userId/roles", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const userId = req.params.userId;
      const userRoles = await storage.getUserRoles(userId);
      res.json(userRoles);
    } catch (error) {
      console.error("Error fetching user roles:", error);
      res.status(500).json({ message: "Failed to fetch user roles" });
    }
  });

  app.post("/api/admin/users/:userId/roles", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const userId = req.params.userId;
      const { roleId } = req.body;
      
      await storage.assignUserRole(userId, roleId);
      res.json({ message: "Role assigned successfully" });
    } catch (error) {
      console.error("Error assigning role:", error);
      res.status(500).json({ message: "Failed to assign role" });
    }
  });

  app.delete("/api/admin/users/:userId/roles/:roleId", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const userId = req.params.userId;
      const roleId = parseInt(req.params.roleId);
      
      await storage.removeUserRole(userId, roleId);
      res.json({ message: "Role removed successfully" });
    } catch (error) {
      console.error("Error removing role:", error);
      res.status(500).json({ message: "Failed to remove role" });
    }
  });

  // Admin route to update legacy role names
  app.put("/api/admin/legacy-roles/:roleKey", isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { roleKey } = req.params;
      const { name } = req.body;

      // Update the legacy role name in system settings
      await storage.setSystemSetting(`legacy_role_${roleKey}_name`, name);
      
      res.json({ message: "Legacy role name updated successfully" });
    } catch (error) {
      console.error("Error updating legacy role name:", error);
      res.status(500).json({ message: "Failed to update legacy role name" });
    }
  });

  // Profile management endpoints
  app.put("/api/profile", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const validation = profileUpdateSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid profile data", errors: validation.error.errors });
      }

      const userId = req.session.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { firstName, lastName, email } = validation.data;
      await storage.updateUser(userId, { firstName, lastName, email });

      // Update session data
      req.session.user = {
        ...req.session.user,
        firstName,
        lastName,
        email,
      };

      res.json({ message: "Profile updated successfully" });
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.put("/api/profile/password", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const validation = passwordChangeSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid password data", errors: validation.error.errors });
      }

      const userId = req.session.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { currentPassword, newPassword } = validation.data;
      const user = await storage.getUser(userId);
      
      if (!user || !user.password) {
        return res.status(404).json({ message: "User not found" });
      }

      const isCurrentPasswordValid = await comparePasswords(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }

      const hashedNewPassword = await hashPassword(newPassword);
      await storage.updateUser(userId, { password: hashedNewPassword });

      res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Error updating password:", error);
      res.status(500).json({ message: "Failed to update password" });
    }
  });

  app.post("/api/profile/picture", isAuthenticated, upload.single("profilePicture"), async (req: Request, res: Response) => {
    try {
      const userId = req.session.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const profileImageUrl = `/uploads/profiles/${req.file.filename}`;
      await storage.updateUser(userId, { profileImageUrl });

      res.json({ message: "Profile picture updated successfully", profileImageUrl });
    } catch (error) {
      console.error("Error updating profile picture:", error);
      res.status(500).json({ message: "Failed to update profile picture" });
    }
  });

  app.get("/api/profile/public/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get user statistics
      const stats = await storage.getUserStats(userId);
      
      // Return public profile data (excluding sensitive information)
      const publicProfile = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        profileImageUrl: user.profileImageUrl,
        isActive: user.isActive,
        createdAt: user.createdAt,
        totalProjects: stats.totalProjects,
        totalTodos: stats.totalTodos,
        completedTodos: stats.completedTodos,
        totalActivities: stats.totalActivities,
      };

      res.json(publicProfile);
    } catch (error) {
      console.error("Error fetching public profile:", error);
      res.status(500).json({ message: "Failed to fetch public profile" });
    }
  });

  // Todo file upload endpoint
  app.post("/api/todos/:id/upload", isAuthenticated, todoUpload.single("attachment"), async (req: Request, res: Response) => {
    try {
      const todoId = parseInt(req.params.id);
      const userId = req.session.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Get the todo to check if user has permission to upload
      const todo = await storage.getTodo(todoId);
      if (!todo) {
        return res.status(404).json({ message: "Todo not found" });
      }

      // Check if user is assigned to this todo or is the creator
      if (todo.assignedTo !== userId && todo.assignedBy !== userId) {
        return res.status(403).json({ message: "You don't have permission to upload files to this todo" });
      }

      const attachmentUrl = `/uploads/todos/${req.file.filename}`;
      const attachmentType = req.file.mimetype.startsWith('image/') ? 'image' : 'audio';
      const attachmentName = req.file.originalname;

      // Update the todo with attachment information
      const updatedTodo = await storage.updateTodo(todoId, {
        attachmentUrl,
        attachmentType,
        attachmentName,
      });

      if (!updatedTodo) {
        return res.status(500).json({ message: "Failed to update todo with attachment" });
      }

      res.json({ 
        message: "File uploaded successfully", 
        attachmentUrl, 
        attachmentType, 
        attachmentName,
        todo: updatedTodo 
      });
    } catch (error) {
      console.error("Error uploading todo file:", error);
      res.status(500).json({ message: "Failed to upload file" });
    }
  });
}

// Authentication middleware
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.session.user) {
    // Add user to request for compatibility
    req.user = { claims: { sub: req.session.user.id } };
    next();
  } else {
    res.status(401).json({ message: "Not authenticated" });
  }
}