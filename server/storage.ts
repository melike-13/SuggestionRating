import { 
  users, type User, type InsertUser,
  suggestions, type Suggestion, type InsertSuggestion,
  rewards, type Reward, type InsertReward,
  SUGGESTION_STATUSES
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";

const PostgresStore = connectPgSimple(session);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  listUsers(): Promise<User[]>;
  
  // Suggestion methods
  getSuggestion(id: number): Promise<Suggestion | undefined>;
  createSuggestion(suggestion: InsertSuggestion): Promise<Suggestion>;
  updateSuggestion(id: number, updates: Partial<Suggestion>): Promise<Suggestion | undefined>;
  listSuggestions(): Promise<Suggestion[]>;
  listSuggestionsByStatus(status: string): Promise<Suggestion[]>;
  listSuggestionsByUser(userId: number): Promise<Suggestion[]>;
  
  // Reward methods
  getReward(id: number): Promise<Reward | undefined>;
  createReward(reward: InsertReward): Promise<Reward>;
  listRewardsBySuggestion(suggestionId: number): Promise<Reward[]>;
  
  // Statistics
  getSuggestionStats(): Promise<{
    total: number;
    byStatus: Record<string, number>;
  }>;
  getTopContributors(limit: number): Promise<{userId: number, count: number}[]>;
  
  // Session store
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    // Session store'u oluştur
    this.sessionStore = new PostgresStore({ 
      pool, 
      createTableIfMissing: true 
    });
    
    // Constructor'da varsayılan kullanıcıları oluştur, eğer yoksa
    this.seedDefaultUsers();
  }

  private async seedDefaultUsers() {
    // Admin kullanıcı var mı kontrol et
    const adminUser = await this.getUserByUsername("admin");
    if (!adminUser) {
      // Admin kullanıcı yoksa oluştur
      await this.createUser({
        username: "admin",
        password: "admin123",
        displayName: "Administrator",
        isAdmin: true
      });
    }
    
    // Normal kullanıcı var mı kontrol et
    const employeeUser = await this.getUserByUsername("employee");
    if (!employeeUser) {
      // Normal kullanıcı yoksa oluştur
      await this.createUser({
        username: "employee",
        password: "employee123",
        displayName: "Test Employee",
        isAdmin: false
      });
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  
  async listUsers(): Promise<User[]> {
    return await db.select().from(users);
  }
  
  // Suggestion methods
  async getSuggestion(id: number): Promise<Suggestion | undefined> {
    const [suggestion] = await db.select().from(suggestions).where(eq(suggestions.id, id));
    return suggestion;
  }
  
  async createSuggestion(insertSuggestion: InsertSuggestion): Promise<Suggestion> {
    const now = new Date();
    const suggestionData = { 
      ...insertSuggestion, 
      status: SUGGESTION_STATUSES.NEW,
      submittedAt: now,
    };
    
    const [suggestion] = await db.insert(suggestions).values(suggestionData).returning();
    return suggestion;
  }
  
  async updateSuggestion(id: number, updates: Partial<Suggestion>): Promise<Suggestion | undefined> {
    const [updatedSuggestion] = await db
      .update(suggestions)
      .set(updates)
      .where(eq(suggestions.id, id))
      .returning();
      
    return updatedSuggestion;
  }
  
  async listSuggestions(): Promise<Suggestion[]> {
    return await db.select().from(suggestions);
  }
  
  async listSuggestionsByStatus(status: string): Promise<Suggestion[]> {
    return await db.select().from(suggestions).where(eq(suggestions.status, status));
  }
  
  async listSuggestionsByUser(userId: number): Promise<Suggestion[]> {
    return await db.select().from(suggestions).where(eq(suggestions.submittedBy, userId));
  }
  
  // Reward methods
  async getReward(id: number): Promise<Reward | undefined> {
    const [reward] = await db.select().from(rewards).where(eq(rewards.id, id));
    return reward;
  }
  
  async createReward(insertReward: InsertReward): Promise<Reward> {
    const [reward] = await db.insert(rewards).values(insertReward).returning();
    return reward;
  }
  
  async listRewardsBySuggestion(suggestionId: number): Promise<Reward[]> {
    return await db.select().from(rewards).where(eq(rewards.suggestionId, suggestionId));
  }
  
  // Statistics
  async getSuggestionStats(): Promise<{ total: number; byStatus: Record<string, number> }> {
    const suggestions = await this.listSuggestions();
    const total = suggestions.length;
    const byStatus: Record<string, number> = {};
    
    suggestions.forEach(suggestion => {
      if (!byStatus[suggestion.status]) {
        byStatus[suggestion.status] = 0;
      }
      byStatus[suggestion.status]++;
    });
    
    return { total, byStatus };
  }
  
  async getTopContributors(limit: number): Promise<{ userId: number; count: number }[]> {
    const suggestions = await this.listSuggestions();
    const contributorCounts: Record<number, number> = {};
    
    suggestions.forEach(suggestion => {
      if (!contributorCounts[suggestion.submittedBy]) {
        contributorCounts[suggestion.submittedBy] = 0;
      }
      contributorCounts[suggestion.submittedBy]++;
    });
    
    return Object.entries(contributorCounts)
      .map(([userId, count]) => ({ userId: parseInt(userId), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }
}

export const storage = new DatabaseStorage();
