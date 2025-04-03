import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  suggestionFormSchema, 
  reviewSuggestionSchema,
  rewardFormSchema,
  statuses
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import MemoryStore from "memorystore";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Setup session store and session middleware
  const SessionStore = MemoryStore(session);
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "kaizen-secret",
      resave: false,
      saveUninitialized: false,
      store: new SessionStore({
        checkPeriod: 86400000, // prune expired entries every 24h
      }),
      cookie: {
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
    })
  );
  
  // Setup passport
  app.use(passport.initialize());
  app.use(passport.session());
  
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: "Invalid username or password" });
        }
        if (user.password !== password) {
          return done(null, false, { message: "Invalid username or password" });
        }
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    })
  );
  
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
  
  // Helper function to check if user is authenticated
  function isAuthenticated(req: Request, res: Response, next: any) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  }
  
  // Helper function to check if user is admin
  function isAdmin(req: Request, res: Response, next: any) {
    if (req.isAuthenticated() && req.user && (req.user as any).role === "admin") {
      return next();
    }
    res.status(403).json({ message: "Forbidden" });
  }
  
  // Auth routes
  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ message: info.message });
      }
      req.logIn(user, (err) => {
        if (err) {
          return next(err);
        }
        return res.json({ user: { ...user, password: undefined } });
      });
    })(req, res, next);
  });
  
  app.post("/api/auth/logout", (req, res) => {
    req.logout(() => {
      res.json({ message: "Logged out successfully" });
    });
  });
  
  app.get("/api/auth/me", (req, res) => {
    if (req.isAuthenticated()) {
      const user = { ...req.user as any, password: undefined };
      return res.json(user);
    }
    res.status(401).json({ message: "Not authenticated" });
  });
  
  // User routes
  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.status(201).json({ ...user, password: undefined });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get("/api/users/top-contributors", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      const contributors = await storage.getTopContributors(limit);
      res.json(contributors.map(c => ({ ...c, password: undefined })));
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Suggestion routes
  app.get("/api/suggestions", async (req, res) => {
    try {
      const suggestions = await storage.getAllSuggestions();
      res.json(suggestions);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get("/api/suggestions/recent", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      const suggestions = await storage.getRecentSuggestions(limit);
      res.json(suggestions);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get("/api/suggestions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const suggestion = await storage.getSuggestion(id);
      if (!suggestion) {
        return res.status(404).json({ message: "Suggestion not found" });
      }
      res.json(suggestion);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/suggestions", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const suggestionData = suggestionFormSchema.parse({
        ...req.body,
        userId: user.id
      });
      
      const suggestion = await storage.createSuggestion(suggestionData);
      res.status(201).json(suggestion);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get("/api/suggestions/status/:status", async (req, res) => {
    try {
      const status = req.params.status;
      if (!statuses.includes(status as any)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const suggestions = await storage.getSuggestionsByStatus(status as any);
      res.json(suggestions);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.patch("/api/suggestions/:id/review", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = req.user as any;
      const reviewData = reviewSuggestionSchema.parse(req.body);
      
      const suggestion = await storage.updateSuggestionStatus(
        id,
        reviewData.status,
        reviewData.reviewNotes,
        user.id
      );
      
      if (!suggestion) {
        return res.status(404).json({ message: "Suggestion not found" });
      }
      
      res.json(suggestion);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Reward routes
  app.post("/api/rewards", isAdmin, async (req, res) => {
    try {
      const user = req.user as any;
      const rewardData = rewardFormSchema.parse({
        ...req.body,
        awardedBy: user.id
      });
      
      const reward = await storage.createReward(rewardData);
      res.status(201).json(reward);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get("/api/rewards/suggestion/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const rewards = await storage.getSuggestionRewards(id);
      res.json(rewards);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get("/api/rewards/user/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const rewards = await storage.getUserRewards(id);
      res.json(rewards);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Statistics route
  app.get("/api/statistics", async (req, res) => {
    try {
      const stats = await storage.getStatistics();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  return httpServer;
}
