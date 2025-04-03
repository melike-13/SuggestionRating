import { 
  users, type User, type InsertUser,
  suggestions, type Suggestion, type InsertSuggestion,
  rewards, type Reward, type InsertReward,
  SUGGESTION_STATUSES
} from "@shared/schema";

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
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private suggestions: Map<number, Suggestion>;
  private rewards: Map<number, Reward>;
  private userId: number;
  private suggestionId: number;
  private rewardId: number;

  constructor() {
    this.users = new Map();
    this.suggestions = new Map();
    this.rewards = new Map();
    this.userId = 1;
    this.suggestionId = 1;
    this.rewardId = 1;
    
    // Create default admin user
    this.createUser({
      username: "admin",
      password: "admin123",
      displayName: "Administrator",
      isAdmin: true
    });
    
    // Create default regular user
    this.createUser({
      username: "employee",
      password: "employee123",
      displayName: "Test Employee",
      isAdmin: false
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  async listUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  // Suggestion methods
  async getSuggestion(id: number): Promise<Suggestion | undefined> {
    return this.suggestions.get(id);
  }
  
  async createSuggestion(insertSuggestion: InsertSuggestion): Promise<Suggestion> {
    const id = this.suggestionId++;
    const now = new Date();
    const suggestion: Suggestion = { 
      ...insertSuggestion, 
      id, 
      status: SUGGESTION_STATUSES.NEW,
      submittedAt: now,
      rating: null,
      feedback: null,
      reviewedBy: null,
      reviewedAt: null
    };
    this.suggestions.set(id, suggestion);
    return suggestion;
  }
  
  async updateSuggestion(id: number, updates: Partial<Suggestion>): Promise<Suggestion | undefined> {
    const suggestion = this.suggestions.get(id);
    if (!suggestion) return undefined;
    
    const updatedSuggestion = { ...suggestion, ...updates };
    this.suggestions.set(id, updatedSuggestion);
    return updatedSuggestion;
  }
  
  async listSuggestions(): Promise<Suggestion[]> {
    return Array.from(this.suggestions.values());
  }
  
  async listSuggestionsByStatus(status: string): Promise<Suggestion[]> {
    return Array.from(this.suggestions.values())
      .filter(suggestion => suggestion.status === status);
  }
  
  async listSuggestionsByUser(userId: number): Promise<Suggestion[]> {
    return Array.from(this.suggestions.values())
      .filter(suggestion => suggestion.submittedBy === userId);
  }
  
  // Reward methods
  async getReward(id: number): Promise<Reward | undefined> {
    return this.rewards.get(id);
  }
  
  async createReward(insertReward: InsertReward): Promise<Reward> {
    const id = this.rewardId++;
    const now = new Date();
    const reward: Reward = {
      ...insertReward,
      id,
      assignedAt: now
    };
    this.rewards.set(id, reward);
    return reward;
  }
  
  async listRewardsBySuggestion(suggestionId: number): Promise<Reward[]> {
    return Array.from(this.rewards.values())
      .filter(reward => reward.suggestionId === suggestionId);
  }
  
  // Statistics
  async getSuggestionStats(): Promise<{ total: number; byStatus: Record<string, number> }> {
    const suggestions = Array.from(this.suggestions.values());
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
    const suggestions = Array.from(this.suggestions.values());
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

export const storage = new MemStorage();
