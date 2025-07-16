import { 
  users, leads, creditAccounts, creditTransactions, creditPackages,
  leadListings, leadPurchases, leadQualityDecay, demandPredictions, marketTrends,
  type User, type InsertUser, type Lead, type InsertLead,
  type CreditAccount, type InsertCreditAccount, type CreditTransaction, type InsertCreditTransaction,
  type CreditPackage, type InsertCreditPackage, type LeadListing, type InsertLeadListing,
  type LeadPurchase, type InsertLeadPurchase, type LeadQualityDecay,
  type DemandPrediction, type InsertDemandPrediction, type MarketTrend, type InsertMarketTrend
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";

// Expanded storage interface with lead management and new features
export interface IStorage {
  // Original methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createLead(lead: InsertLead): Promise<Lead>;
  getAllLeads(): Promise<Lead[]>;
  getLeadById(id: number): Promise<Lead | undefined>;
  
  // Credit System
  getCreditAccount(userId: number): Promise<CreditAccount | undefined>;
  createCreditAccount(account: InsertCreditAccount): Promise<CreditAccount>;
  updateCreditBalance(userId: number, amount: string): Promise<void>;
  addCreditTransaction(transaction: InsertCreditTransaction): Promise<CreditTransaction>;
  getCreditTransactions(userId: number): Promise<CreditTransaction[]>;
  getCreditPackages(): Promise<CreditPackage[]>;
  createCreditPackage(package: InsertCreditPackage): Promise<CreditPackage>;
  
  // Lead Resale Marketplace
  createLeadListing(listing: InsertLeadListing): Promise<LeadListing>;
  getLeadListings(filters?: { industry?: string; geography?: string; minPrice?: string; maxPrice?: string }): Promise<LeadListing[]>;
  getLeadListingById(id: number): Promise<LeadListing | undefined>;
  updateLeadListing(id: number, updates: Partial<LeadListing>): Promise<void>;
  purchaseLead(purchase: InsertLeadPurchase): Promise<LeadPurchase>;
  getLeadPurchases(userId: number): Promise<LeadPurchase[]>;
  updateLeadQuality(leadId: number, newQuality: number): Promise<void>;
  getLeadQuality(leadId: number): Promise<LeadQualityDecay | undefined>;
  
  // AI Predictive Trends
  saveDemandPrediction(prediction: InsertDemandPrediction): Promise<DemandPrediction>;
  getDemandPredictions(industry?: string, geography?: string): Promise<DemandPrediction[]>;
  getLatestDemandPrediction(industry: string, geography: string): Promise<DemandPrediction | undefined>;
  saveMarketTrend(trend: InsertMarketTrend): Promise<MarketTrend>;
  getMarketTrends(industry?: string, geography?: string, days?: number): Promise<MarketTrend[]>;
}

export class DatabaseStorage implements IStorage {
  // Original methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async createLead(insertLead: InsertLead): Promise<Lead> {
    const [lead] = await db
      .insert(leads)
      .values({
        ...insertLead,
        createdAt: new Date()
      })
      .returning();
    
    // Initialize quality decay tracking for new leads
    await db.insert(leadQualityDecay).values({
      leadId: lead.id,
      initialQuality: 100,
      currentQuality: 100,
      decayRate: "5.00"
    });
    
    return lead;
  }

  async getAllLeads(): Promise<Lead[]> {
    return await db.select().from(leads).orderBy(desc(leads.createdAt));
  }

  async getLeadById(id: number): Promise<Lead | undefined> {
    const [lead] = await db.select().from(leads).where(eq(leads.id, id));
    return lead || undefined;
  }

  // Credit System methods
  async getCreditAccount(userId: number): Promise<CreditAccount | undefined> {
    const [account] = await db.select().from(creditAccounts).where(eq(creditAccounts.userId, userId));
    return account || undefined;
  }

  async createCreditAccount(account: InsertCreditAccount): Promise<CreditAccount> {
    const [newAccount] = await db
      .insert(creditAccounts)
      .values(account)
      .returning();
    return newAccount;
  }

  async updateCreditBalance(userId: number, amount: string): Promise<void> {
    await db
      .update(creditAccounts)
      .set({ 
        balance: sql`${creditAccounts.balance} + ${amount}`,
        updatedAt: new Date()
      })
      .where(eq(creditAccounts.userId, userId));
  }

  async addCreditTransaction(transaction: InsertCreditTransaction): Promise<CreditTransaction> {
    const [newTransaction] = await db
      .insert(creditTransactions)
      .values(transaction)
      .returning();
    return newTransaction;
  }

  async getCreditTransactions(userId: number): Promise<CreditTransaction[]> {
    return await db
      .select()
      .from(creditTransactions)
      .where(eq(creditTransactions.userId, userId))
      .orderBy(desc(creditTransactions.createdAt));
  }

  async getCreditPackages(): Promise<CreditPackage[]> {
    return await db
      .select()
      .from(creditPackages)
      .where(eq(creditPackages.isActive, true))
      .orderBy(creditPackages.credits);
  }

  async createCreditPackage(packageData: InsertCreditPackage): Promise<CreditPackage> {
    const [newPackage] = await db
      .insert(creditPackages)
      .values(packageData)
      .returning();
    return newPackage;
  }

  // Lead Resale Marketplace methods
  async createLeadListing(listing: InsertLeadListing): Promise<LeadListing> {
    const [newListing] = await db
      .insert(leadListings)
      .values(listing)
      .returning();
    return newListing;
  }

  async getLeadListings(filters?: { industry?: string; geography?: string; minPrice?: string; maxPrice?: string }): Promise<LeadListing[]> {
    let query = db.select().from(leadListings).where(eq(leadListings.isActive, true));
    
    if (filters) {
      const conditions = [];
      if (filters.industry) conditions.push(eq(leadListings.industry, filters.industry));
      if (filters.geography) conditions.push(eq(leadListings.geography, filters.geography));
      if (filters.minPrice) conditions.push(gte(leadListings.price, filters.minPrice));
      if (filters.maxPrice) conditions.push(lte(leadListings.price, filters.maxPrice));
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
    }
    
    return await query.orderBy(desc(leadListings.createdAt));
  }

  async getLeadListingById(id: number): Promise<LeadListing | undefined> {
    const [listing] = await db.select().from(leadListings).where(eq(leadListings.id, id));
    return listing || undefined;
  }

  async updateLeadListing(id: number, updates: Partial<LeadListing>): Promise<void> {
    await db
      .update(leadListings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(leadListings.id, id));
  }

  async purchaseLead(purchase: InsertLeadPurchase): Promise<LeadPurchase> {
    const [newPurchase] = await db
      .insert(leadPurchases)
      .values(purchase)
      .returning();
    
    // Update listing's times resold and quality
    const listing = await this.getLeadListingById(purchase.listingId);
    if (listing) {
      await this.updateLeadListing(purchase.listingId, {
        timesResold: listing.timesResold + 1,
        isActive: false // Mark as sold
      });
      
      // Update quality decay
      await this.updateLeadQuality(listing.leadId, listing.qualityScore - 5);
    }
    
    return newPurchase;
  }

  async getLeadPurchases(userId: number): Promise<LeadPurchase[]> {
    return await db
      .select()
      .from(leadPurchases)
      .where(eq(leadPurchases.buyerId, userId))
      .orderBy(desc(leadPurchases.purchaseDate));
  }

  async updateLeadQuality(leadId: number, newQuality: number): Promise<void> {
    await db
      .update(leadQualityDecay)
      .set({ 
        currentQuality: Math.max(0, newQuality),
        lastUpdated: new Date()
      })
      .where(eq(leadQualityDecay.leadId, leadId));
  }

  async getLeadQuality(leadId: number): Promise<LeadQualityDecay | undefined> {
    const [quality] = await db.select().from(leadQualityDecay).where(eq(leadQualityDecay.leadId, leadId));
    return quality || undefined;
  }

  // AI Predictive Trends methods
  async saveDemandPrediction(prediction: InsertDemandPrediction): Promise<DemandPrediction> {
    const [newPrediction] = await db
      .insert(demandPredictions)
      .values(prediction)
      .returning();
    return newPrediction;
  }

  async getDemandPredictions(industry?: string, geography?: string): Promise<DemandPrediction[]> {
    let query = db.select().from(demandPredictions);
    
    const conditions = [];
    if (industry) conditions.push(eq(demandPredictions.industry, industry));
    if (geography) conditions.push(eq(demandPredictions.geography, geography));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query
      .where(gte(demandPredictions.validUntil, new Date()))
      .orderBy(desc(demandPredictions.predictionDate));
  }

  async getLatestDemandPrediction(industry: string, geography: string): Promise<DemandPrediction | undefined> {
    const [prediction] = await db
      .select()
      .from(demandPredictions)
      .where(
        and(
          eq(demandPredictions.industry, industry),
          eq(demandPredictions.geography, geography),
          gte(demandPredictions.validUntil, new Date())
        )
      )
      .orderBy(desc(demandPredictions.predictionDate))
      .limit(1);
    return prediction || undefined;
  }

  async saveMarketTrend(trend: InsertMarketTrend): Promise<MarketTrend> {
    const [newTrend] = await db
      .insert(marketTrends)
      .values(trend)
      .returning();
    return newTrend;
  }

  async getMarketTrends(industry?: string, geography?: string, days?: number): Promise<MarketTrend[]> {
    let query = db.select().from(marketTrends);
    
    const conditions = [];
    if (industry) conditions.push(eq(marketTrends.industry, industry));
    if (geography) conditions.push(eq(marketTrends.geography, geography));
    if (days) {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - days);
      conditions.push(gte(marketTrends.recordedAt, daysAgo));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(desc(marketTrends.recordedAt));
  }
}

export const storage = new DatabaseStorage();
