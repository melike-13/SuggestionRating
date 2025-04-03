import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import session from "express-session";
import MemoryStore from "memorystore";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { 
  insertSuggestionSchema, 
  extendedInsertSuggestionSchema, 
  extendedInsertRewardSchema, 
  SUGGESTION_STATUSES
} from "@shared/schema";
import { fromZodError } from "zod-validation-error";

const MemoryStoreSession = MemoryStore(session);

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup session middleware
  app.use(
    session({
      secret: "kaizen-app-secret",
      resave: false,
      saveUninitialized: false,
      store: new MemoryStoreSession({
        checkPeriod: 86400000, // prune expired entries every 24h
      }),
      cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
    })
  );

  // Setup passport with local strategy
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        
        if (!user) {
          return done(null, false, { message: "Incorrect username" });
        }
        
        if (user.password !== password) {
          return done(null, false, { message: "Incorrect password" });
        }
        
        return done(null, user);
      } catch (err) {
        return done(err);
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
    } catch (err) {
      done(err);
    }
  });

  // Auth middleware
  const isAuthenticated = (req: Request, res: Response, next: Function) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Not authenticated" });
  };

  const isAdmin = (req: Request, res: Response, next: Function) => {
    if (req.isAuthenticated() && (req.user as any).isAdmin) {
      return next();
    }
    res.status(403).json({ message: "Not authorized" });
  };

  // Authentication routes
  app.post("/api/auth/login", passport.authenticate("local"), (req, res) => {
    res.json({ user: req.user });
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout(() => {
      res.json({ success: true });
    });
  });

  app.get("/api/auth/user", (req, res) => {
    if (req.isAuthenticated()) {
      res.json({ user: req.user });
    } else {
      res.json({ user: null });
    }
  });

  // Suggestion routes
  app.post("/api/suggestions", isAuthenticated, async (req, res) => {
    try {
      const validatedData = extendedInsertSuggestionSchema.parse({
        ...req.body,
        submittedBy: (req.user as any).id
      });
      
      const suggestion = await storage.createSuggestion(validatedData);
      res.status(201).json(suggestion);
    } catch (err: any) {
      if (err.name === "ZodError") {
        const validationError = fromZodError(err);
        res.status(400).json({ message: validationError.message });
      } else {
        res.status(500).json({ message: err.message });
      }
    }
  });

  app.get("/api/suggestions", isAuthenticated, async (req, res) => {
    try {
      const suggestions = await storage.listSuggestions();
      res.json(suggestions);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/suggestions/:id", isAuthenticated, async (req, res) => {
    try {
      const suggestion = await storage.getSuggestion(parseInt(req.params.id));
      
      if (!suggestion) {
        return res.status(404).json({ message: "Suggestion not found" });
      }
      
      res.json(suggestion);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.patch("/api/suggestions/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const suggestion = await storage.getSuggestion(id);
      
      if (!suggestion) {
        return res.status(404).json({ message: "Suggestion not found" });
      }
      
      const updates: any = { ...req.body };
      
      // If status is being updated to a review status, set reviewed info
      if (updates.status && updates.status !== suggestion.status) {
        updates.reviewedBy = (req.user as any).id;
        updates.reviewedAt = new Date();
      }
      
      const updatedSuggestion = await storage.updateSuggestion(id, updates);
      res.json(updatedSuggestion);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/suggestions/status/:status", isAuthenticated, async (req, res) => {
    try {
      const suggestions = await storage.listSuggestionsByStatus(req.params.status);
      res.json(suggestions);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/suggestions/user/:userId", isAuthenticated, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const suggestions = await storage.listSuggestionsByUser(userId);
      res.json(suggestions);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Reward routes
  app.post("/api/rewards", isAdmin, async (req, res) => {
    try {
      const validatedData = extendedInsertRewardSchema.parse({
        ...req.body,
        assignedBy: (req.user as any).id,
      });
      
      const reward = await storage.createReward(validatedData);
      
      // Update suggestion status to implemented if not already
      const suggestion = await storage.getSuggestion(reward.suggestionId);
      if (suggestion && suggestion.status !== SUGGESTION_STATUSES.IMPLEMENTED) {
        await storage.updateSuggestion(suggestion.id, {
          status: SUGGESTION_STATUSES.IMPLEMENTED,
          reviewedBy: (req.user as any).id,
          reviewedAt: new Date()
        });
      }
      
      res.status(201).json(reward);
    } catch (err: any) {
      if (err.name === "ZodError") {
        const validationError = fromZodError(err);
        res.status(400).json({ message: validationError.message });
      } else {
        res.status(500).json({ message: err.message });
      }
    }
  });

  app.get("/api/rewards/suggestion/:suggestionId", isAuthenticated, async (req, res) => {
    try {
      const suggestionId = parseInt(req.params.suggestionId);
      const rewards = await storage.listRewardsBySuggestion(suggestionId);
      res.json(rewards);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Statistics routes
  app.get("/api/stats/suggestions", isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getSuggestionStats();
      res.json(stats);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/stats/top-contributors", isAuthenticated, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      const topContributors = await storage.getTopContributors(limit);
      
      // Get full user data for each contributor
      const contributorsWithData = await Promise.all(
        topContributors.map(async ({ userId, count }) => {
          const user = await storage.getUser(userId);
          return {
            user,
            count
          };
        })
      );
      
      res.json(contributorsWithData);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // User routes
  app.get("/api/users", isAdmin, async (req, res) => {
    try {
      const users = await storage.listUsers();
      res.json(users);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
