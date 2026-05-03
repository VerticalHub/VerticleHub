import { 
  users, leads, creditAccounts, creditTransactions, creditPackages,
  leadListings, leadPurchases, leadQualityDecay, demandPredictions, marketTrends,
  alerts, leadActivities, watchlist, priceAlerts, leadSubmissions,
  type User, type InsertUser, type Lead, type InsertLead,
  type CreditAccount, type InsertCreditAccount, type CreditTransaction, type InsertCreditTransaction,
  type CreditPackage, type InsertCreditPackage, type LeadListing, type InsertLeadListing,
  type LeadPurchase, type InsertLeadPurchase, type LeadQualityDecay,
  type DemandPrediction, type InsertDemandPrediction, type MarketTrend, type InsertMarketTrend,
  type Alert, type InsertAlert, type LeadActivity, type InsertLeadActivity,
  type Watchlist, type InsertWatchlist, type PriceAlert, type InsertPriceAlert,
  type LeadSubmission, type InsertLeadSubmission,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, sql, or, ilike, ne } from "drizzle-orm";
import { computeLeadScore } from "./scoring";

export interface PurchaseDetail {
  purchaseId: number; listingId: number; buyerId: number;
  pricePaid: string; qualityAtPurchase: number; purchaseDate: Date | null;
  industry: string | null; geography: string | null; leadId: number | null;
  firstName: string | null; lastName: string | null; state: string | null;
  interestedInACA: boolean | null; interestedInMedicare: boolean | null;
  interestedInFinalExpense: boolean | null;
}

export interface LeadStats {
  total: number;
  byStatus: Record<string, number>;
  byState: Record<string, number>;
  bySource: Record<string, number>;
  tcpaCount: number;
  dncCount: number;
  acaCount: number;
  medicareCount: number;
  finalExpCount: number;
  avgAgingScore: number;
  convertedCount: number;
  today: number;
}

export interface IStorage {
  // Users / Auth
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;

  // Leads
  createLead(lead: InsertLead): Promise<Lead>;
  getAllLeads(): Promise<Lead[]>;
  getLeadById(id: number): Promise<Lead | undefined>;
  updateLead(id: number, updates: Partial<Lead>): Promise<void>;
  updateLeadAgingScore(leadId: number, score: number): Promise<void>;
  markLeadDNC(leadId: number): Promise<void>;
  searchLeads(query: string, filters?: { state?: string; status?: string; dnc?: boolean; tcpaConsent?: boolean; industry?: string }): Promise<Lead[]>;
  getLeadStats(): Promise<LeadStats>;

  // Credits
  getCreditAccount(userId: number): Promise<CreditAccount | undefined>;
  createCreditAccount(account: InsertCreditAccount): Promise<CreditAccount>;
  updateCreditBalance(userId: number, amount: string): Promise<void>;
  addCreditTransaction(transaction: InsertCreditTransaction): Promise<CreditTransaction>;
  getCreditTransactions(userId: number): Promise<CreditTransaction[]>;
  getCreditPackages(): Promise<CreditPackage[]>;
  createCreditPackage(pkg: InsertCreditPackage): Promise<CreditPackage>;

  // Marketplace
  createLeadListing(listing: InsertLeadListing): Promise<LeadListing>;
  getLeadListings(filters?: { industry?: string; geography?: string; minPrice?: string; maxPrice?: string }): Promise<LeadListing[]>;
  getAllLeadListings(): Promise<LeadListing[]>;
  getLeadListingById(id: number): Promise<LeadListing | undefined>;
  updateLeadListing(id: number, updates: Partial<LeadListing>): Promise<void>;
  purchaseLead(purchase: InsertLeadPurchase): Promise<LeadPurchase>;
  getLeadPurchases(userId: number): Promise<LeadPurchase[]>;
  getLeadPurchasesDetailed(userId: number): Promise<PurchaseDetail[]>;
  hasPurchasedLead(userId: number, leadId: number): Promise<boolean>;
  updateLeadQuality(leadId: number, newQuality: number): Promise<void>;
  getLeadQuality(leadId: number): Promise<LeadQualityDecay | undefined>;

  // Watchlist
  addToWatchlist(userId: number, listingId: number): Promise<Watchlist>;
  removeFromWatchlist(userId: number, listingId: number): Promise<void>;
  getWatchlist(userId: number): Promise<Watchlist[]>;
  isWatchlisted(userId: number, listingId: number): Promise<boolean>;

  // Price Alerts
  createPriceAlert(alert: InsertPriceAlert): Promise<PriceAlert>;
  getPriceAlerts(userId: number): Promise<PriceAlert[]>;
  deletePriceAlert(id: number): Promise<void>;
  triggerPriceAlert(id: number): Promise<void>;

  // Alerts
  createAlert(alert: InsertAlert): Promise<Alert>;
  getUnreadAlerts(userId: number): Promise<Alert[]>;
  getAllAlerts(userId: number): Promise<Alert[]>;
  markAlertRead(alertId: number): Promise<void>;
  markAllAlertsRead(userId: number): Promise<void>;
  deleteAlert(alertId: number): Promise<void>;

  // CRM Activities
  createLeadActivity(activity: InsertLeadActivity): Promise<LeadActivity>;
  getLeadActivities(leadId: number): Promise<LeadActivity[]>;
  getFollowUps(userId: number): Promise<LeadActivity[]>;
  getAllRecentActivities(userId: number, limit?: number): Promise<LeadActivity[]>;

  // AI Scoring
  rescoreAllLeads(): Promise<number>;
  getLeadListingsEnriched(filters?: { industry?: string; geography?: string; minPrice?: string; maxPrice?: string }): Promise<any[]>;
  getAllLeadListingsEnriched(): Promise<any[]>;

  // AI / Market
  saveDemandPrediction(prediction: InsertDemandPrediction): Promise<DemandPrediction>;
  getDemandPredictions(industry?: string, geography?: string): Promise<DemandPrediction[]>;
  getLatestDemandPrediction(industry: string, geography: string): Promise<DemandPrediction | undefined>;
  saveMarketTrend(trend: InsertMarketTrend): Promise<MarketTrend>;
  getMarketTrends(industry?: string, geography?: string, days?: number): Promise<MarketTrend[]>;

  // Seller Submissions
  createSubmission(sub: InsertLeadSubmission): Promise<LeadSubmission>;
  getAllSubmissions(): Promise<LeadSubmission[]>;
  getSubmissionsByUser(userId: number): Promise<LeadSubmission[]>;
  updateSubmissionStatus(id: number, status: string, adminNotes: string, reviewedBy: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // ── Users ──────────────────────────────────────────────────────────────────
  async getUser(id: number) {
    const [u] = await db.select().from(users).where(eq(users.id, id));
    return u ?? undefined;
  }
  async getUserByUsername(username: string) {
    const [u] = await db.select().from(users).where(eq(users.username, username));
    return u ?? undefined;
  }
  async createUser(insertUser: InsertUser) {
    const [u] = await db.insert(users).values(insertUser).returning();
    return u;
  }
  async getAllUsers() {
    return db.select({ id: users.id, username: users.username, email: users.email, role: users.role, createdAt: users.createdAt, password: users.password }).from(users).orderBy(desc(users.createdAt));
  }

  // ── Leads ──────────────────────────────────────────────────────────────────
  async createLead(insertLead: InsertLead): Promise<Lead> {
    const now = new Date();
    const { total: score } = computeLeadScore({ ...insertLead, createdAt: now });

    const [lead] = await db.insert(leads).values({ 
      ...insertLead, 
      createdAt: now,
      leadScore: score,
      status: "new",
      source: (insertLead as any).source || "web_form",
    }).returning();
    await db.insert(leadQualityDecay).values({
      leadId: lead.id, initialQuality: 100, currentQuality: 100, decayRate: "5.00",
    });
    return lead;
  }
  async getAllLeads() {
    return db.select().from(leads).orderBy(desc(leads.createdAt));
  }
  async getLeadById(id: number) {
    const [l] = await db.select().from(leads).where(eq(leads.id, id));
    return l ?? undefined;
  }
  async updateLead(id: number, updates: Partial<Lead>) {
    await db.update(leads).set(updates).where(eq(leads.id, id));
  }
  async updateLeadAgingScore(leadId: number, score: number) {
    await db.update(leads).set({ agingScore: score }).where(eq(leads.id, leadId));
  }
  async markLeadDNC(leadId: number) {
    await db.update(leads).set({ dnc: true, dncAddedAt: new Date(), status: "archived" }).where(eq(leads.id, leadId));
  }
  async searchLeads(query: string, filters?: { state?: string; status?: string; dnc?: boolean; tcpaConsent?: boolean; industry?: string }) {
    const conditions: any[] = [];
    if (query && query.trim()) {
      conditions.push(or(
        ilike(leads.firstName, `%${query}%`),
        ilike(leads.lastName, `%${query}%`),
        ilike(leads.email, `%${query}%`),
        ilike(leads.phoneNumber, `%${query}%`),
        ilike(leads.state, `%${query}%`),
        ilike(leads.zipCode, `%${query}%`),
      ));
    }
    if (filters?.state) conditions.push(eq(leads.state, filters.state));
    if (filters?.status) conditions.push(eq(leads.status, filters.status));
    if (filters?.dnc !== undefined) conditions.push(eq(leads.dnc, filters.dnc));
    if (filters?.tcpaConsent !== undefined) conditions.push(eq(leads.tcpaConsent, filters.tcpaConsent));
    if (filters?.industry === "aca") conditions.push(eq(leads.interestedInACA, true));
    if (filters?.industry === "medicare") conditions.push(eq(leads.interestedInMedicare, true));
    if (filters?.industry === "final_expense") conditions.push(eq(leads.interestedInFinalExpense, true));

    const q = conditions.length
      ? db.select().from(leads).where(and(...conditions))
      : db.select().from(leads);
    return q.orderBy(desc(leads.createdAt)).limit(200);
  }
  async getLeadStats(): Promise<LeadStats> {
    const all = await db.select().from(leads);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const byStatus: Record<string, number> = { new: 0, contacted: 0, qualified: 0, converted: 0, archived: 0 };
    const byState: Record<string, number> = {};
    const bySource: Record<string, number> = {};
    let tcpaCount = 0, dncCount = 0, acaCount = 0, medicareCount = 0, finalExpCount = 0, todayCount = 0;
    let totalAging = 0;

    for (const l of all) {
      const status = l.status || "new";
      byStatus[status] = (byStatus[status] || 0) + 1;
      byState[l.state] = (byState[l.state] || 0) + 1;
      const src = l.source || "web_form";
      bySource[src] = (bySource[src] || 0) + 1;
      if (l.tcpaConsent) tcpaCount++;
      if (l.dnc) dncCount++;
      if (l.interestedInACA) acaCount++;
      if (l.interestedInMedicare) medicareCount++;
      if (l.interestedInFinalExpense) finalExpCount++;
      if (l.createdAt && new Date(l.createdAt) >= today) todayCount++;
      totalAging += l.agingScore ?? 100;
    }

    return {
      total: all.length,
      byStatus,
      byState,
      bySource,
      tcpaCount,
      dncCount,
      acaCount,
      medicareCount,
      finalExpCount,
      avgAgingScore: all.length ? Math.round(totalAging / all.length) : 100,
      convertedCount: byStatus.converted || 0,
      today: todayCount,
    };
  }

  // ── Credits ────────────────────────────────────────────────────────────────
  async getCreditAccount(userId: number) {
    const [a] = await db.select().from(creditAccounts).where(eq(creditAccounts.userId, userId));
    return a ?? undefined;
  }
  async createCreditAccount(account: InsertCreditAccount) {
    const [a] = await db.insert(creditAccounts).values(account).returning();
    return a;
  }
  async updateCreditBalance(userId: number, amount: string) {
    await db.update(creditAccounts)
      .set({ balance: sql`${creditAccounts.balance} + ${amount}`, updatedAt: new Date() })
      .where(eq(creditAccounts.userId, userId));
  }
  async addCreditTransaction(transaction: InsertCreditTransaction) {
    const [tx] = await db.insert(creditTransactions).values(transaction).returning();
    return tx;
  }
  async getCreditTransactions(userId: number) {
    return db.select().from(creditTransactions)
      .where(eq(creditTransactions.userId, userId))
      .orderBy(desc(creditTransactions.createdAt)).limit(50);
  }
  async getCreditPackages() {
    return db.select().from(creditPackages)
      .where(eq(creditPackages.isActive, true))
      .orderBy(creditPackages.credits);
  }
  async createCreditPackage(packageData: InsertCreditPackage) {
    const [p] = await db.insert(creditPackages).values(packageData).returning();
    return p;
  }

  // ── Marketplace ────────────────────────────────────────────────────────────
  async createLeadListing(listing: InsertLeadListing) {
    const [l] = await db.insert(leadListings).values(listing).returning();
    return l;
  }
  async getLeadListings(filters?: { industry?: string; geography?: string; minPrice?: string; maxPrice?: string }) {
    const conditions = [eq(leadListings.isActive, true)];
    if (filters?.industry)  conditions.push(eq(leadListings.industry, filters.industry));
    if (filters?.geography) conditions.push(eq(leadListings.geography, filters.geography));
    if (filters?.minPrice)  conditions.push(gte(leadListings.price, filters.minPrice));
    if (filters?.maxPrice)  conditions.push(lte(leadListings.price, filters.maxPrice));
    return db.select().from(leadListings).where(and(...conditions)).orderBy(desc(leadListings.qualityScore));
  }
  async getAllLeadListings() {
    return db.select().from(leadListings).orderBy(desc(leadListings.createdAt));
  }
  async getLeadListingById(id: number) {
    const [l] = await db.select().from(leadListings).where(eq(leadListings.id, id));
    return l ?? undefined;
  }
  async updateLeadListing(id: number, updates: Partial<LeadListing>) {
    await db.update(leadListings).set({ ...updates, updatedAt: new Date() }).where(eq(leadListings.id, id));
  }
  async purchaseLead(purchase: InsertLeadPurchase) {
    const [p] = await db.insert(leadPurchases).values(purchase).returning();
    const listing = await this.getLeadListingById(purchase.listingId);
    if (listing) {
      await this.updateLeadListing(purchase.listingId, { timesResold: listing.timesResold + 1, isActive: false });
      await this.updateLeadQuality(listing.leadId, listing.qualityScore - 5);
    }
    return p;
  }
  async getLeadPurchases(userId: number) {
    return db.select().from(leadPurchases)
      .where(eq(leadPurchases.buyerId, userId))
      .orderBy(desc(leadPurchases.purchaseDate));
  }
  async getLeadPurchasesDetailed(userId: number): Promise<PurchaseDetail[]> {
    const rows = await db.select({
      purchaseId: leadPurchases.id, listingId: leadPurchases.listingId,
      buyerId: leadPurchases.buyerId, pricePaid: leadPurchases.price,
      qualityAtPurchase: leadPurchases.qualityAtPurchase, purchaseDate: leadPurchases.purchaseDate,
      industry: leadListings.industry, geography: leadListings.geography, leadId: leadListings.leadId,
      firstName: leads.firstName, lastName: leads.lastName, state: leads.state,
      interestedInACA: leads.interestedInACA, interestedInMedicare: leads.interestedInMedicare,
      interestedInFinalExpense: leads.interestedInFinalExpense,
    })
    .from(leadPurchases)
    .leftJoin(leadListings, eq(leadPurchases.listingId, leadListings.id))
    .leftJoin(leads, eq(leadListings.leadId, leads.id))
    .where(eq(leadPurchases.buyerId, userId))
    .orderBy(desc(leadPurchases.purchaseDate));
    return rows as PurchaseDetail[];
  }
  async hasPurchasedLead(userId: number, leadId: number): Promise<boolean> {
    const rows = await db.select({ id: leadPurchases.id })
      .from(leadPurchases)
      .leftJoin(leadListings, eq(leadPurchases.listingId, leadListings.id))
      .where(and(eq(leadPurchases.buyerId, userId), eq(leadListings.leadId, leadId)))
      .limit(1);
    return rows.length > 0;
  }
  async updateLeadQuality(leadId: number, newQuality: number) {
    await db.update(leadQualityDecay)
      .set({ currentQuality: Math.max(0, newQuality), lastUpdated: new Date() })
      .where(eq(leadQualityDecay.leadId, leadId));
  }
  async getLeadQuality(leadId: number) {
    const [q] = await db.select().from(leadQualityDecay).where(eq(leadQualityDecay.leadId, leadId));
    return q ?? undefined;
  }

  // ── Watchlist ──────────────────────────────────────────────────────────────
  async addToWatchlist(userId: number, listingId: number): Promise<Watchlist> {
    const [w] = await db.insert(watchlist).values({ userId, listingId }).returning();
    return w;
  }
  async removeFromWatchlist(userId: number, listingId: number): Promise<void> {
    await db.delete(watchlist).where(and(eq(watchlist.userId, userId), eq(watchlist.listingId, listingId)));
  }
  async getWatchlist(userId: number): Promise<Watchlist[]> {
    return db.select().from(watchlist).where(eq(watchlist.userId, userId)).orderBy(desc(watchlist.createdAt));
  }
  async isWatchlisted(userId: number, listingId: number): Promise<boolean> {
    const [w] = await db.select().from(watchlist).where(and(eq(watchlist.userId, userId), eq(watchlist.listingId, listingId))).limit(1);
    return !!w;
  }

  // ── Price Alerts ───────────────────────────────────────────────────────────
  async createPriceAlert(alert: InsertPriceAlert): Promise<PriceAlert> {
    const [a] = await db.insert(priceAlerts).values(alert).returning();
    return a;
  }
  async getPriceAlerts(userId: number): Promise<PriceAlert[]> {
    return db.select().from(priceAlerts).where(eq(priceAlerts.userId, userId)).orderBy(desc(priceAlerts.createdAt));
  }
  async deletePriceAlert(id: number): Promise<void> {
    await db.delete(priceAlerts).where(eq(priceAlerts.id, id));
  }
  async triggerPriceAlert(id: number): Promise<void> {
    await db.update(priceAlerts).set({ triggered: true }).where(eq(priceAlerts.id, id));
  }

  // ── Alerts ─────────────────────────────────────────────────────────────────
  async createAlert(alert: InsertAlert): Promise<Alert> {
    const [a] = await db.insert(alerts).values(alert).returning();
    return a;
  }
  async getUnreadAlerts(userId: number): Promise<Alert[]> {
    return db.select().from(alerts)
      .where(and(eq(alerts.userId, userId), eq(alerts.read, false)))
      .orderBy(desc(alerts.createdAt));
  }
  async getAllAlerts(userId: number): Promise<Alert[]> {
    return db.select().from(alerts)
      .where(eq(alerts.userId, userId))
      .orderBy(desc(alerts.createdAt))
      .limit(50);
  }
  async markAlertRead(alertId: number) {
    await db.update(alerts).set({ read: true }).where(eq(alerts.id, alertId));
  }
  async markAllAlertsRead(userId: number) {
    await db.update(alerts).set({ read: true }).where(eq(alerts.userId, userId));
  }
  async deleteAlert(alertId: number) {
    await db.delete(alerts).where(eq(alerts.id, alertId));
  }

  // ── CRM Activities ─────────────────────────────────────────────────────────
  async createLeadActivity(activity: InsertLeadActivity): Promise<LeadActivity> {
    const [a] = await db.insert(leadActivities).values(activity).returning();
    return a;
  }
  async getLeadActivities(leadId: number): Promise<LeadActivity[]> {
    return db.select().from(leadActivities)
      .where(eq(leadActivities.leadId, leadId))
      .orderBy(desc(leadActivities.createdAt));
  }
  async getFollowUps(userId: number): Promise<LeadActivity[]> {
    return db.select().from(leadActivities)
      .where(and(eq(leadActivities.userId, userId), eq(leadActivities.disposition, "callback")))
      .orderBy(desc(leadActivities.createdAt))
      .limit(20);
  }
  async getAllRecentActivities(userId: number, limit = 20): Promise<LeadActivity[]> {
    return db.select().from(leadActivities)
      .where(eq(leadActivities.userId, userId))
      .orderBy(desc(leadActivities.createdAt))
      .limit(limit);
  }

  // ── AI / Market ────────────────────────────────────────────────────────────
  async saveDemandPrediction(prediction: InsertDemandPrediction) {
    const [p] = await db.insert(demandPredictions).values(prediction).returning();
    return p;
  }
  async getDemandPredictions(industry?: string, geography?: string) {
    const conditions = [gte(demandPredictions.validUntil, new Date())];
    if (industry)  conditions.push(eq(demandPredictions.industry, industry));
    if (geography) conditions.push(eq(demandPredictions.geography, geography));
    return db.select().from(demandPredictions).where(and(...conditions)).orderBy(desc(demandPredictions.predictionDate));
  }
  async getLatestDemandPrediction(industry: string, geography: string) {
    const [p] = await db.select().from(demandPredictions)
      .where(and(eq(demandPredictions.industry, industry), eq(demandPredictions.geography, geography), gte(demandPredictions.validUntil, new Date())))
      .orderBy(desc(demandPredictions.predictionDate)).limit(1);
    return p ?? undefined;
  }
  async saveMarketTrend(trend: InsertMarketTrend) {
    const [t] = await db.insert(marketTrends).values(trend).returning();
    return t;
  }
  async getMarketTrends(industry?: string, geography?: string, days?: number) {
    const conditions: any[] = [];
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

  // ── AI Scoring ──────────────────────────────────────────────────────────────
  async rescoreAllLeads(): Promise<number> {
    const allLeads = await db.select().from(leads);
    let count = 0;
    for (const lead of allLeads) {
      const { total } = computeLeadScore(lead);
      await db.update(leads).set({ leadScore: total }).where(eq(leads.id, lead.id));
      count++;
    }
    return count;
  }

  private async _enrichListings(rawListings: any[]): Promise<any[]> {
    if (!rawListings.length) return [];
    const leadIds = [...new Set(rawListings.map(l => l.leadId).filter(Boolean))];
    const leadRows = await db.select({
      id: leads.id,
      leadScore: leads.leadScore,
      agingScore: leads.agingScore,
      tcpaConsent: leads.tcpaConsent,
      interestedInACA: leads.interestedInACA,
      interestedInMedicare: leads.interestedInMedicare,
      interestedInFinalExpense: leads.interestedInFinalExpense,
      dateOfBirth: leads.dateOfBirth,
      annualIncome: leads.annualIncome,
      householdSize: leads.householdSize,
      state: leads.state,
      source: leads.source,
      hasMedicaidMedicareVA: leads.hasMedicaidMedicareVA,
      createdAt: leads.createdAt,
    }).from(leads).where(
      leadIds.length === 1
        ? eq(leads.id, leadIds[0])
        : sql`${leads.id} = ANY(ARRAY[${sql.raw(leadIds.join(","))}])`
    );
    const leadMap = new Map(leadRows.map(l => [l.id, l]));
    return rawListings.map(listing => ({
      ...listing,
      leadData: leadMap.get(listing.leadId) ?? null,
    }));
  }

  async getLeadListingsEnriched(filters?: { industry?: string; geography?: string; minPrice?: string; maxPrice?: string }) {
    const raw = await this.getLeadListings(filters);
    return this._enrichListings(raw);
  }

  async getAllLeadListingsEnriched() {
    const raw = await this.getAllLeadListings();
    return this._enrichListings(raw);
  }

  // ── Seller Submissions ────────────────────────────────────────────────────
  async createSubmission(sub: InsertLeadSubmission) {
    const [row] = await db.insert(leadSubmissions).values(sub).returning();
    return row;
  }
  async getAllSubmissions() {
    return db.select().from(leadSubmissions).orderBy(desc(leadSubmissions.createdAt));
  }
  async getSubmissionsByUser(userId: number) {
    return db.select().from(leadSubmissions)
      .where(eq(leadSubmissions.submittedBy, userId))
      .orderBy(desc(leadSubmissions.createdAt));
  }
  async updateSubmissionStatus(id: number, status: string, adminNotes: string, reviewedBy: number) {
    await db.update(leadSubmissions).set({
      status,
      adminNotes,
      reviewedBy,
      reviewedAt: new Date(),
    }).where(eq(leadSubmissions.id, id));
  }
}

export const storage = new DatabaseStorage();
