import { 
  users, type User, type InsertUser,
  suggestions, type Suggestion, type InsertSuggestion,
  rewards, type Reward, type InsertReward,
  SUGGESTION_STATUSES, USER_ROLES
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
    // Genel Müdür (sicil no: 1001)
    const executiveUser = await this.getUserByUsername("1001");
    if (!executiveUser) {
      await this.createUser({
        username: "1001",
        password: "admin123",
        displayName: "Genel Müdür",
        role: USER_ROLES.EXECUTIVE,
        department: "Yönetim",
        isAdmin: true
      });
    }
    
    // Bölüm Müdürü (sicil no: 2001)
    const managerUser = await this.getUserByUsername("2001");
    if (!managerUser) {
      await this.createUser({
        username: "2001",
        password: "manager123",
        displayName: "Bölüm Müdürü",
        role: USER_ROLES.MANAGER,
        department: "Üretim",
        isAdmin: false
      });
    }
    
    // Normal çalışan (sicil no: 3001)
    const employeeUser = await this.getUserByUsername("3001");
    if (!employeeUser) {
      await this.createUser({
        username: "3001",
        password: "employee123",
        displayName: "Test Çalışan",
        role: USER_ROLES.EMPLOYEE,
        department: "Üretim",
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
    
    // JSON alanlar için null/undefined kontrolü
    if (!suggestionData.teamMembers) suggestionData.teamMembers = [];
    if (!suggestionData.currentStateFiles) suggestionData.currentStateFiles = [];
    if (!suggestionData.improvementFiles) suggestionData.improvementFiles = [];
    
    const [suggestion] = await db.insert(suggestions).values(suggestionData).returning();
    return suggestion;
  }
  
  async updateSuggestion(id: number, updates: Partial<Suggestion>): Promise<Suggestion | undefined> {
    // Tarih alanlarını otomatik olarak kontrol et ve gerekirse dönüştür
    const processedUpdates = { ...updates };
    
    // JSON alanlar için null/undefined kontrolü
    if (processedUpdates.teamMembers === null) processedUpdates.teamMembers = [];
    if (processedUpdates.currentStateFiles === null) processedUpdates.currentStateFiles = [];
    if (processedUpdates.improvementFiles === null) processedUpdates.improvementFiles = [];
    
    // Alan türlerini kontrol et ve gerekirse düzelt
    Object.keys(processedUpdates).forEach(key => {
      const value = (processedUpdates as any)[key];
      
      // ISO string tarih formatını Date objesine çevir
      if (typeof value === 'string' && (
          key.includes('At') || // submittedAt, reviewedAt gibi tarih alanları
          key.endsWith('At')    // tarihlerin sonu genelde At ile bitiyor
      )) {
        try {
          // ISO string'i Date objesine çevir
          (processedUpdates as any)[key] = new Date(value);
        } catch (e) {
          // Geçersiz tarih formatı ise değeri olduğu gibi bırak
          console.warn(`Invalid date format for field ${key}: ${value}`);
        }
      }

      // Puan alanlarını sayısal değerlere dönüştür
      if ((
          key.includes('Score') || // feasibilityScore, costScore gibi puan alanları
          key.endsWith('Score')    // puanların sonu genelde Score ile bitiyor
      )) {
        if (value !== undefined && value !== null) {
          try {
            // Ondalıklı sayılar için parseFloat kullan (string veya number olabilir)
            const numericValue = typeof value === 'string' ? parseFloat(value) : value;
            
            // Çok önemli! Number.isNaN ile geçersiz sayıları kontrol et
            if (!Number.isNaN(numericValue)) {
              // Sayı olduğunu kesinleştirmek için Number'a çevir
              (processedUpdates as any)[key] = Math.floor(numericValue * 10) / 10; // Ondalık kısmı 1 basamakla sınırla
              console.log(`Score field ${key} converted to number: ${(processedUpdates as any)[key]}`);
            }
          } catch (e) {
            console.error(`Error converting score field ${key} with value ${value}:`, e);
          }
        }
      }
      
      // undefined alanları kaldır
      if (value === undefined) {
        delete (processedUpdates as any)[key];
      }
    });
    
    const [updatedSuggestion] = await db
      .update(suggestions)
      .set(processedUpdates)
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
