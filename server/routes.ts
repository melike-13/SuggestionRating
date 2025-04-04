import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { pool } from "./db";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { 
  insertSuggestionSchema, 
  insertUserSchema,
  extendedInsertSuggestionSchema, 
  extendedInsertRewardSchema, 
  SUGGESTION_STATUSES,
  USER_ROLES
} from "@shared/schema";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup session middleware
  app.use(
    session({
      secret: "kaizen-app-secret",
      resave: false,
      saveUninitialized: false,
      store: storage.sessionStore,
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
  
  const hasRole = (roles: string[]) => {
    return (req: Request, res: Response, next: Function) => {
      if (req.isAuthenticated()) {
        const userRole = (req.user as any).role;
        if (roles.includes(userRole)) {
          return next();
        }
      }
      res.status(403).json({ message: "Not authorized" });
    };
  };
  
  // Role-based middlewares
  const isManager = hasRole([USER_ROLES.MANAGER, USER_ROLES.EXECUTIVE]);
  const isExecutive = hasRole([USER_ROLES.EXECUTIVE]);

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
      
      // Date objeleri yerine timestamp string kullan veya sil
      Object.keys(updates).forEach(key => {
        // Date objesi toISOString hatası veriyorsa, Date olarak bırak
        // Drizzle Date nesnelerini doğrudan veritabanına timestamp olarak kaydeder
        
        // null değerlerini koru ama undefined'ları sil
        if (updates[key] === undefined) {
          delete updates[key];
        }
      });
      
      // Spesifik alan güncelleme - genel reviewedAt yerine durum bazlı alanlar kullan
      if (updates.status && updates.status !== suggestion.status) {
        const userId = (req.user as any).id;
        const now = new Date();
        
        // Duruma göre ilgili alanları güncelle
        switch(updates.status) {
          case SUGGESTION_STATUSES.DEPARTMENT_REVIEW:
            updates.departmentManagerId = userId;
            updates.departmentReviewAt = new Date();
            break;
          case SUGGESTION_STATUSES.FEASIBILITY_ASSESSMENT:
            updates.feasibilityReviewedBy = userId;
            updates.feasibilityReviewedAt = new Date();
            break;
          case SUGGESTION_STATUSES.SOLUTION_IDENTIFIED:
            updates.solutionProposedBy = userId;
            updates.solutionProposedAt = new Date();
            break;
          case SUGGESTION_STATUSES.COST_ASSESSMENT:
            updates.costReviewedBy = userId;
            updates.costReviewedAt = new Date();
            break;
          case SUGGESTION_STATUSES.EXECUTIVE_REVIEW:
            updates.executiveReviewedBy = userId;
            updates.executiveReviewedAt = new Date();
            break;
        }
      }
      
      const updatedSuggestion = await storage.updateSuggestion(id, updates);
      res.json(updatedSuggestion);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // Yapılabilirlik Değerlendirmesi güncelleme endpoint'i
  app.patch("/api/suggestions/:id/feasibility", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const suggestion = await storage.getSuggestion(id);
      
      if (!suggestion) {
        return res.status(404).json({ message: "Öneri bulunamadı" });
      }
      
      // Status kontrolü kaldırıldı - önerinin değerlendirilmesine her durumda izin ver
      
      // Veritabanı puanları integer olarak bekliyor. Ondalıklı puanları yuvarlayarak integer'a çevirelim.
      const safeRound = (value: any): number => {
        if (value === undefined || value === null) {
          return 0;
        }
        // Önce sayıya çevir, sonra en yakın tam sayıya yuvarla
        const num = typeof value === 'number' ? value : parseFloat(String(value));
        return Number.isNaN(num) ? 0 : Math.round(num);
      }
      
      console.log("Gelen puan değerleri:");
      console.log("feasibilityScore (ham):", req.body.feasibilityScore, "tip:", typeof req.body.feasibilityScore);
      
      // Bu aşamada tüm sayısal değerleri yuvarlayarak tam sayıya çeviriyoruz
      const updates = {
        feasibilityScore: safeRound(req.body.feasibilityScore),
        feasibilityFeedback: req.body.feasibilityFeedback,
        status: req.body.status,
        feasibilityReviewedBy: (req.user as any).id,
        feasibilityReviewedAt: new Date(),
        
        // Tüm puan alanlarını yuvarlayarak integer'a çeviriyoruz
        innovationScore: safeRound(req.body.innovationScore),
        safetyScore: safeRound(req.body.safetyScore),
        environmentScore: safeRound(req.body.environmentScore),
        employeeSatisfactionScore: safeRound(req.body.employeeSatisfactionScore),
        technologicalCompatibilityScore: safeRound(req.body.technologicalCompatibilityScore),
        implementationEaseScore: safeRound(req.body.implementationEaseScore),
        costBenefitScore: safeRound(req.body.costBenefitScore),
      };
      
      console.log("Veritabanına gönderilen puan değerleri:");
      console.log("feasibilityScore (işlenmiş):", updates.feasibilityScore);
      console.log("innovationScore:", updates.innovationScore);
      console.log("safetyScore:", updates.safetyScore);
      console.log("environmentScore:", updates.environmentScore);
      
      // Direkt SQL ile güncelleme yapalım
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        
        // SQL sorgusunu elle oluşturalım ve parametreleri tam sayı olarak geçirelim
        const sql = `
          UPDATE suggestions 
          SET 
            feasibility_score = $1,
            feasibility_feedback = $2,
            status = $3,
            feasibility_reviewed_by = $4,
            feasibility_reviewed_at = $5,
            innovation_score = $6, 
            safety_score = $7,
            environment_score = $8,
            employee_satisfaction_score = $9,
            technological_compatibility_score = $10,
            implementation_ease_score = $11,
            cost_benefit_score = $12
          WHERE id = $13
          RETURNING *
        `;
        
        const result = await client.query(sql, [
          updates.feasibilityScore,
          updates.feasibilityFeedback,
          updates.status,
          updates.feasibilityReviewedBy,
          updates.feasibilityReviewedAt,
          updates.innovationScore,
          updates.safetyScore,
          updates.environmentScore,
          updates.employeeSatisfactionScore,
          updates.technologicalCompatibilityScore,
          updates.implementationEaseScore,
          updates.costBenefitScore,
          id
        ]);
        
        await client.query('COMMIT');
        
        const updatedSuggestion = result.rows[0];
        res.json(updatedSuggestion);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (err: any) {
      console.error("Yapılabilirlik değerlendirme hatası:", err);
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
      
      // Update suggestion status to COMPLETED if not already
      const suggestion = await storage.getSuggestion(reward.suggestionId);
      if (suggestion && suggestion.status !== SUGGESTION_STATUSES.COMPLETED) {
        await storage.updateSuggestion(suggestion.id, {
          status: SUGGESTION_STATUSES.COMPLETED,
          // reviewedBy ve reviewedAt kullanmıyoruz artık, durum bazlı tarih alanları var
          executiveReviewedBy: (req.user as any).id,
          executiveReviewedAt: new Date()
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
  
  // Yeni kullanıcı oluşturma
  app.post("/api/users", isAdmin, async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      // Kullanıcı adının benzersiz olduğunu kontrol et
      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Bu kullanıcı adı zaten kullanılıyor." });
      }
      
      const user = await storage.createUser(validatedData);
      res.status(201).json(user);
    } catch (err: any) {
      if (err.name === "ZodError") {
        const validationError = fromZodError(err);
        res.status(400).json({ message: validationError.message });
      } else {
        res.status(500).json({ message: err.message });
      }
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
