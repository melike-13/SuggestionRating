import { 
  users, 
  suggestions, 
  rewards,
  type User, 
  type InsertUser, 
  type Suggestion, 
  type InsertSuggestion,
  type Reward,
  type InsertReward,
  type Status,
  statuses
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUserSuggestions(userId: number): Promise<Suggestion[]>;
  updateUserPoints(userId: number, points: number): Promise<User | undefined>;
  getTopContributors(limit?: number): Promise<User[]>;
  
  // Suggestion operations
  getSuggestion(id: number): Promise<Suggestion | undefined>;
  getAllSuggestions(): Promise<Suggestion[]>;
  getRecentSuggestions(limit?: number): Promise<Suggestion[]>;
  createSuggestion(suggestion: InsertSuggestion): Promise<Suggestion>;
  updateSuggestionStatus(id: number, status: Status, reviewNotes?: string, reviewedBy?: number): Promise<Suggestion | undefined>;
  getSuggestionsByStatus(status: Status): Promise<Suggestion[]>;
  getStatistics(): Promise<{
    totalSuggestions: number;
    pendingReview: number;
    approved: number;
    implemented: number;
    totalRewards: number;
  }>;
  
  // Reward operations
  getReward(id: number): Promise<Reward | undefined>;
  createReward(reward: InsertReward): Promise<Reward>;
  getSuggestionRewards(suggestionId: number): Promise<Reward[]>;
  getUserRewards(userId: number): Promise<Reward[]>;
  getTotalRewards(): Promise<number>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private suggestions: Map<number, Suggestion>;
  private rewards: Map<number, Reward>;
  private userIdCounter: number;
  private suggestionIdCounter: number;
  private rewardIdCounter: number;

  constructor() {
    this.users = new Map();
    this.suggestions = new Map();
    this.rewards = new Map();
    this.userIdCounter = 1;
    this.suggestionIdCounter = 1;
    this.rewardIdCounter = 1;
    
    // Initialize with some default users
    this.createUser({
      username: "admin",
      password: "admin123",
      fullName: "Admin User",
      department: "Management",
      role: "admin"
    });
    
    this.createUser({
      username: "employee1",
      password: "employee123",
      fullName: "Ahmet Yılmaz",
      department: "Üretim",
      role: "employee"
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id, points: 0 };
    this.users.set(id, user);
    return user;
  }

  async getUserSuggestions(userId: number): Promise<Suggestion[]> {
    return Array.from(this.suggestions.values()).filter(
      suggestion => suggestion.userId === userId
    );
  }

  async updateUserPoints(userId: number, points: number): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;
    
    const updatedUser = { ...user, points: user.points + points };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async getTopContributors(limit: number = 5): Promise<User[]> {
    return Array.from(this.users.values())
      .sort((a, b) => b.points - a.points)
      .slice(0, limit);
  }

  // Suggestion operations
  async getSuggestion(id: number): Promise<Suggestion | undefined> {
    return this.suggestions.get(id);
  }

  async getAllSuggestions(): Promise<Suggestion[]> {
    return Array.from(this.suggestions.values())
      .sort((a, b) => {
        return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
      });
  }

  async getRecentSuggestions(limit: number = 5): Promise<Suggestion[]> {
    return this.getAllSuggestions().slice(0, limit);
  }

  async createSuggestion(insertSuggestion: InsertSuggestion): Promise<Suggestion> {
    const id = this.suggestionIdCounter++;
    const now = new Date();
    const suggestion: Suggestion = {
      ...insertSuggestion,
      id,
      status: "new",
      submittedAt: now,
      reviewNotes: null,
      reviewedBy: null,
      reviewedAt: null
    };
    this.suggestions.set(id, suggestion);
    
    // Award points for submitting a suggestion
    await this.updateUserPoints(suggestion.userId, 10);
    
    return suggestion;
  }

  async updateSuggestionStatus(
    id: number, 
    status: Status, 
    reviewNotes?: string, 
    reviewedBy?: number
  ): Promise<Suggestion | undefined> {
    const suggestion = await this.getSuggestion(id);
    if (!suggestion) return undefined;
    
    const now = new Date();
    const updatedSuggestion: Suggestion = {
      ...suggestion,
      status,
      reviewNotes: reviewNotes || suggestion.reviewNotes,
      reviewedBy: reviewedBy !== undefined ? reviewedBy : suggestion.reviewedBy,
      reviewedAt: now
    };
    
    this.suggestions.set(id, updatedSuggestion);
    
    // Award points for approved suggestions
    if (status === "approved" && suggestion.status !== "approved") {
      await this.updateUserPoints(suggestion.userId, 20);
    }
    
    // Award more points for implemented suggestions
    if (status === "implemented" && suggestion.status !== "implemented") {
      await this.updateUserPoints(suggestion.userId, 50);
    }
    
    return updatedSuggestion;
  }

  async getSuggestionsByStatus(status: Status): Promise<Suggestion[]> {
    return Array.from(this.suggestions.values())
      .filter(suggestion => suggestion.status === status)
      .sort((a, b) => {
        return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
      });
  }

  async getStatistics(): Promise<{
    totalSuggestions: number;
    pendingReview: number;
    approved: number;
    implemented: number;
    totalRewards: number;
  }> {
    const allSuggestions = await this.getAllSuggestions();
    const pendingReview = await this.getSuggestionsByStatus("under_review");
    const approved = await this.getSuggestionsByStatus("approved");
    const implemented = await this.getSuggestionsByStatus("implemented");
    const totalRewards = await this.getTotalRewards();
    
    return {
      totalSuggestions: allSuggestions.length,
      pendingReview: pendingReview.length,
      approved: approved.length,
      implemented: implemented.length,
      totalRewards
    };
  }

  // Reward operations
  async getReward(id: number): Promise<Reward | undefined> {
    return this.rewards.get(id);
  }

  async createReward(insertReward: InsertReward): Promise<Reward> {
    const id = this.rewardIdCounter++;
    const now = new Date();
    const reward: Reward = {
      ...insertReward,
      id,
      awardedAt: now
    };
    this.rewards.set(id, reward);
    
    // Update user points for the reward
    await this.updateUserPoints(reward.userId, reward.amount);
    
    return reward;
  }

  async getSuggestionRewards(suggestionId: number): Promise<Reward[]> {
    return Array.from(this.rewards.values())
      .filter(reward => reward.suggestionId === suggestionId)
      .sort((a, b) => {
        return new Date(b.awardedAt).getTime() - new Date(a.awardedAt).getTime();
      });
  }

  async getUserRewards(userId: number): Promise<Reward[]> {
    return Array.from(this.rewards.values())
      .filter(reward => reward.userId === userId)
      .sort((a, b) => {
        return new Date(b.awardedAt).getTime() - new Date(a.awardedAt).getTime();
      });
  }

  async getTotalRewards(): Promise<number> {
    return Array.from(this.rewards.values()).reduce(
      (total, reward) => total + reward.amount, 
      0
    );
  }
}

export const storage = new MemStorage();
