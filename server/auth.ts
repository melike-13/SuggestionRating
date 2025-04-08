import type { Express } from "express";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { storage } from "./storage";

export function setupAuth(app: Express) {
  // Setup session middleware
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "kaizen-app-secret",
      resave: false,
      saveUninitialized: false,
      store: storage.sessionStore,
      cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        secure: process.env.NODE_ENV === "production",
      },
    })
  );

  // Setup passport with local strategy
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy({
      // Şifre alanı gerekli olmadığı için passwordField'ı username ile aynı yapıyoruz
      // Bu sayede LocalStrategy yapısını bozmadan sadece sicil numarası ile giriş yapılabilir
      usernameField: 'username',
      passwordField: 'username',
    }, async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        
        if (!user) {
          return done(null, false, { message: "Geçersiz sicil numarası" });
        }
        
        // Sadece sicil numarası kontrolü yaptığımız için şifre kontrolü yapmıyoruz
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    })
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  // Auth endpoints
  app.post("/api/auth/login", passport.authenticate("local"), (req, res) => {
    res.json({ user: req.user });
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ success: true });
    });
  });

  app.get("/api/auth/user", (req, res) => {
    res.json({ user: req.user || null });
  });
}