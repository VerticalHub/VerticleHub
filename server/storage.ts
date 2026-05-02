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

export interface PurchaseDetail {
  purchaseId: number;
  listingId: number;
  buyerId: number;
  pricePaid: string;
  qualityAtPurchase: number;
  purchaseDate: Date | null;
  industry: string | null;
  geography: string | null;
  leadId: number | null;
  firstName: string | null;
  lastName: string | null;
  state: string | null;
  interestedInACA: boolean | null;
  interestedInMedicare: boolean | null;
  interestedInFinalExpense: boolean | null;
}

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createLead(lead: InsertLead): Promise<Lead>;
  getAllLeads(): Promise<Lead[]>;
  getLeadById(id: number): Promise<Lead | undefined>;

  getCreditAccount(userId: number): Promise<CreditAccount | undefined>;
  createCreditAccount(account: InsertCreditAccount): Promise<CreditAccount>;
  updateCreditBalance(userId: number, amount: string): Promise<void>;
  addCreditTransaction(transaction: InsertCreditTransaction): Promise<CreditTransaction>;
  getCreditTransactions(userId: number): Promise<CreditTransaction[]>;
  getCreditPackages(): Promise<CreditPackage[]>;
  createCreditPackage(pkg: InsertCreditPackage): Promise<CreditPackage>;

  createLeadListing(listing: InsertLeadListing): Promise<LeadListing>;
  getLeadListings(filters?: { industry?: string; geography?: string; minPrice?: string; maxPrice?: string }): Promise<LeadListing[]>;
  getAllLeadListings(): Promise<LeadListing[]>;
  getLeadListingById(id: number): Promise<LeadListing | undefined>;
  updateLeadListing(id: number, updates: Partial<LeadListing>): Promise<void>;
  purchaseLead(purchase: InsertLeadPurchase): Promise<LeadPurchase>;
  getLeadPurchases(userId: number): Promise<LeadPurchase[]>;
  getLeadPurchasesDetailed(userId: number): Promise<PurchaseDetail[]>;
  updateLeadQuality(leadId: number, newQuality: number): Promise<void>;
  getLeadQuality(leadId: number): Promise<LeadQualityDecay | undefined>;

  saveDemandPrediction(prediction: InsertDemandPrediction): Promise<DemandPrediction>;
  getDemandPredictions(industry?: string, geography?: string): Promise<DemandPrediction[]>;
  getLatestDemandPrediction(industry: string, geography: string): Promise<DemandPrediction | undefined>;
  saveMarketTrend(trend: InsertMarketTrend): Promise<MarketTrend>;
  getMarketTrends(industry?: string, geography?: string, days?: number): Promise<MarketTrend[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user ?? undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user ?? undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async createLead(insertLead: InsertLead): Promise<Lead> {
    const [lead] = await db.insert(leads).values({ ...insertLead, createdAt: new Date() }).returning();
    await db.insert(leadQualityDecay).values({
      leadId: lead.id,
      initialQuality: 100,
      currentQuality: 100,
      decayRate: "5.00",
    });
    return lead;
  }

  async getAllLeads(): Promise<Lead[]> {
    return db.select().from(leads).orderBy(desc(leads.createdAt));
  }

  async getLeadById(id: number): Promise<Lead | undefined> {
    const [lead] = await db.select().from(leads).where(eq(leads.id, id));
    return lead ?? undefined;
  }

  // ── Credit System ──────────────────────────────────────────
  async getCreditAccount(userId: number): Promise<CreditAccount | undefined> {
    const [account] = await db.select().from(creditAccounts).where(eq(creditAccounts.userId, userId));
    return account ?? undefined;
  }

  async createCreditAccount(account: InsertCreditAccount): Promise<CreditAccount> {
    const [newAccount] = await db.insert(creditAccounts).values(account).returning();
    return newAccount;
  }

  async updateCreditBalance(userId: number, amount: string): Promise<void> {
    await db
      .update(creditAccounts)
      .set({ balance: sql`${creditAccounts.balance} + ${amount}`, updatedAt: new Date() })
      .where(eq(creditAccounts.userId, userId));
  }

  async addCreditTransaction(transaction: InsertCreditTransaction): Promise<CreditTransaction> {
    const [tx] = await db.insert(creditTransactions).values(transaction).returning();
    return tx;
  }

  async getCreditTransactions(userId: number): Promise<CreditTransaction[]> {
    return db
      .select().from(creditTransactions)
      .where(eq(creditTransactions.userId, userId))
      .orderBy(desc(creditTransactions.createdAt))
      .limit(50);
  }

  async getCreditPackages(): Promise<CreditPackage[]> {
    return db.select().from(creditPackages)
      .where(eq(creditPackages.isActive, true))
      .orderBy(creditPackages.credits);
  }

  async createCreditPackage(packageData: InsertCreditPackage): Promise<CreditPackage> {
    const [pkg] = await db.insert(creditPackages).values(packageData).returning();
    return pkg;
  }

  // ── Lead Marketplace ───────────────────────────────────────
  async createLeadListing(listing: InsertLeadListing): Promise<LeadListing> {
    const [newListing] = await db.insert(leadListings).values(listing).returning();
    return newListing;
  }

  // BUG FIX: always include isActive:true in the conditions array rather than
  // calling .where() twice (which would overwrite the first constraint).
  async getLeadListings(filters?: { industry?: string; geography?: string; minPrice?: string; maxPrice?: string }): Promise<LeadListing[]> {
    const conditions = [eq(leadListings.isActive, true)];
    if (filters) {
      if (filters.industry)  conditions.push(eq(leadListings.industry, filters.industry));
      if (filters.geography) conditions.push(eq(leadListings.geography, filters.geography));
      if (filters.minPrice)  conditions.push(gte(leadListings.price, filters.minPrice));
      if (filters.maxPrice)  conditions.push(lte(leadListings.price, filters.maxPrice));
    }
    return db
      .select().from(leadListings)
      .where(and(...conditions))
      .orderBy(desc(leadListings.qualityScore));
  }

  async getAllLeadListings(): Promise<LeadListing[]> {
    return db.select().from(leadListings).orderBy(desc(leadListings.createdAt));
  }

  async getLeadListingById(id: number): Promise<LeadListing | undefined> {
    const [listing] = await db.select().from(leadListings).where(eq(leadListings.id, id));
    return listing ?? undefined;
  }

  async updateLeadListing(id: number, updates: Partial<LeadListing>): Promise<void> {
    await db.update(leadListings).set({ ...updates, updatedAt: new Date() }).where(eq(leadListings.id, id));
  }

  async purchaseLead(purchase: InsertLeadPurchase): Promise<LeadPurchase> {
    const [newPurchase] = await db.insert(leadPurchases).values(purchase).returning();
    const listing = await this.getLeadListingById(purchase.listingId);
    if (listing) {
      await this.updateLeadListing(purchase.listingId, {
        timesResold: listing.timesResold + 1,
        isActive: false,
      });
      await this.updateLeadQuality(listing.leadId, listing.qualityScore - 5);
    }
    return newPurchase;
  }

  async getLeadPurchases(userId: number): Promise<LeadPurchase[]> {
    return db
      .select().from(leadPurchases)
      .where(eq(leadPurchases.buyerId, userId))
      .orderBy(desc(leadPurchases.purchaseDate));
  }

  async getLeadPurchasesDetailed(userId: number): Promise<PurchaseDetail[]> {
    const rows = await db
      .select({
        purchaseId:         leadPurchases.id,
        listingId:          leadPurchases.listingId,
        buyerId:            leadPurchases.buyerId,
        pricePaid:          leadPurchases.price,
        qualityAtPurchase:  leadPurchases.qualityAtPurchase,
        purchaseDate:       leadPurchases.purchaseDate,
        industry:           leadListings.industry,
        geography:          leadListings.geography,
        leadId:             leadListings.leadId,
        firstName:          leads.firstName,
        lastName:           leads.lastName,
        state:              leads.state,
        interestedInACA:    leads.interestedInACA,
        interestedInMedicare: leads.interestedInMedicare,
        interestedInFinalExpense: leads.interestedInFinalExpense,
      })
      .from(leadPurchases)
      .leftJoin(leadListings, eq(leadPurchases.listingId, leadListings.id))
      .leftJoin(leads, eq(leadListings.leadId, leads.id))
      .where(eq(leadPurchases.buyerId, userId))
      .orderBy(desc(leadPurchases.purchaseDate));
    return rows as PurchaseDetail[];
  }

  async updateLeadQuality(leadId: number, newQuality: number): Promise<void> {
    await db
      .update(leadQualityDecay)
      .set({ currentQuality: Math.max(0, newQuality), lastUpdated: new Date() })
      .where(eq(leadQualityDecay.leadId, leadId));
  }

  async getLeadQuality(leadId: number): Promise<LeadQualityDecay | undefined> {
    const [q] = await db.select().from(leadQualityDecay).where(eq(leadQualityDecay.leadId, leadId));
    return q ?? undefined;
  }

  // ── AI Predictive Trends ───────────────────────────────────
  async saveDemandPrediction(prediction: InsertDemandPrediction): Promise<DemandPrediction> {
    const [p] = await db.insert(demandPredictions).values(prediction).returning();
    return p;
  }

  // BUG FIX: include validUntil in same conditions array to avoid double .where()
  async getDemandPredictions(industry?: string, geography?: string): Promise<DemandPrediction[]> {
    const conditions = [gte(demandPredictions.validUntil, new Date())];
    if (industry)  conditions.push(eq(demandPredictions.industry, industry));
    if (geography) conditions.push(eq(demandPredictions.geography, geography));
    return db
      .select().from(demandPredictions)
      .where(and(...conditions))
      .orderBy(desc(demandPredictions.predictionDate));
  }

  async getLatestDemandPrediction(industry: string, geography: string): Promise<DemandPrediction | undefined> {
    const [p] = await db
      .select().from(demandPredictions)
      .where(and(
        eq(demandPredictions.industry, industry),
        eq(demandPredictions.geography, geography),
        gte(demandPredictions.validUntil, new Date()),
      ))
      .orderBy(desc(demandPredictions.predictionDate))
      .limit(1);
    return p ?? undefined;
  }

  async saveMarketTrend(trend: InsertMarketTrend): Promise<MarketTrend> {
    const [t] = await db.insert(marketTrends).values(trend).returning();
    return t;
  }

  async getMarketTrends(industry?: string, geography?: string, days?: number): Promise<MarketTrend[]> {
    const conditions = [];
    if (industry)  conditions.push(eq(marketTrends.industry, industry));
    if (geography) conditions.push(eq(marketTrends.geography, geography));
    if (days) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      conditions.push(gte(marketTrends.recordedAt, cutoff));
    }
    const q = conditions.length
      ? db.select().from(marketTrends).where(and(...conditions))
      : db.select().from(marketTrends);
    return q.orderBy(desc(marketTrends.recordedAt)).limit(100);
  }
}

export const storage = new DatabaseStorage();
