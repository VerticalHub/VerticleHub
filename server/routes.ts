import type { Express } from "express";
import { createServer, type Server } from "http";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { 
  leadValidationSchema, insertCreditAccountSchema,
  insertLeadListingSchema, insertDemandPredictionSchema,
  insertMarketTrendSchema, insertLeadActivitySchema,
  insertPriceAlertSchema,
} from "@shared/schema";
import { ZodError } from "zod";
import { startAgingJob } from "./jobs/ageLeads";

// ─── Seed ──────────────────────────────────────────────────────────────────────
async function seedDatabase() {
  try {
    const existing = await storage.getUserByUsername("admin");
    if (!existing) {
      const hash = await bcrypt.hash("admin123", 10);
      await storage.createUser({ username: "admin", password: hash, email: "admin@healthleadpro.com", role: "admin" });
      const agentHash = await bcrypt.hash("agent123", 10);
      await storage.createUser({ username: "agent1", password: agentHash, email: "agent1@healthleadpro.com", role: "agent" });
      console.log("[seed] Created demo users");
    }

    const existingLeads = await storage.getAllLeads();
    if (existingLeads.length === 0) {
      const leadData = [
        { firstName: "James",    lastName: "Harrington", email: "james.h@email.com",    phoneNumber: "3055551021", zipCode: "33101", state: "FL", interestedInACA: true,  interestedInMedicare: false, interestedInFinalExpense: false, dateOfBirth: "1985-04-12", hasMedicaidMedicareVA: false, tcpaConsent: true,  tcpaConsentSource: "web_form",    status: "contacted",  source: "web_form",    annualIncome: 42000, householdSize: 2 },
        { firstName: "Maria",    lastName: "Castillo",   email: "maria.c@email.com",    phoneNumber: "2125550934", zipCode: "10001", state: "NY", interestedInACA: false, interestedInMedicare: true,  interestedInFinalExpense: false, dateOfBirth: "1958-08-23", hasMedicaidMedicareVA: false, tcpaConsent: true,  tcpaConsentSource: "web_form",    status: "qualified",  source: "web_form",    annualIncome: 28000, householdSize: 1 },
        { firstName: "Robert",   lastName: "Kim",        email: "r.kim@email.com",      phoneNumber: "4155557823", zipCode: "94102", state: "CA", interestedInACA: true,  interestedInMedicare: false, interestedInFinalExpense: true,  dateOfBirth: "1979-01-07", hasMedicaidMedicareVA: false, tcpaConsent: false, tcpaConsentSource: "third_party", status: "new",        source: "paid_ad",     annualIncome: 58000, householdSize: 3 },
        { firstName: "Sandra",   lastName: "Williams",   email: "s.williams@email.com", phoneNumber: "7135554412", zipCode: "77001", state: "TX", interestedInACA: false, interestedInMedicare: false, interestedInFinalExpense: true,  dateOfBirth: "1962-11-30", hasMedicaidMedicareVA: false, tcpaConsent: true,  tcpaConsentSource: "phone",       status: "converted",  source: "phone",       annualIncome: 35000, householdSize: 2 },
        { firstName: "David",    lastName: "Thompson",   email: "d.thompson@email.com", phoneNumber: "3055558821", zipCode: "33102", state: "FL", interestedInACA: true,  interestedInMedicare: true,  interestedInFinalExpense: false, dateOfBirth: "1957-06-15", hasMedicaidMedicareVA: false, tcpaConsent: true,  tcpaConsentSource: "web_form",    status: "qualified",  source: "web_form",    annualIncome: 31000, householdSize: 1 },
        { firstName: "Patricia", lastName: "Moore",      email: "p.moore@email.com",    phoneNumber: "2135556634", zipCode: "90001", state: "CA", interestedInACA: true,  interestedInMedicare: false, interestedInFinalExpense: false, dateOfBirth: "1990-03-22", hasMedicaidMedicareVA: false, tcpaConsent: false, tcpaConsentSource: undefined,     status: "new",        source: "organic",     annualIncome: 47000, householdSize: 4 },
        { firstName: "Michael",  lastName: "Davis",      email: "m.davis@email.com",    phoneNumber: "2125553398", zipCode: "10002", state: "NY", interestedInACA: false, interestedInMedicare: true,  interestedInFinalExpense: true,  dateOfBirth: "1955-09-18", hasMedicaidMedicareVA: false, tcpaConsent: true,  tcpaConsentSource: "web_form",    status: "contacted",  source: "web_form",    annualIncome: 22000, householdSize: 1 },
        { firstName: "Linda",    lastName: "Garcia",     email: "l.garcia@email.com",   phoneNumber: "5125559917", zipCode: "78201", state: "TX", interestedInACA: true,  interestedInMedicare: false, interestedInFinalExpense: false, dateOfBirth: "1983-12-05", hasMedicaidMedicareVA: false, tcpaConsent: true,  tcpaConsentSource: "web_form",    status: "new",        source: "referral",    annualIncome: 39000, householdSize: 3 },
        { firstName: "Charles",  lastName: "Martinez",   email: "c.martinez@email.com", phoneNumber: "3055552244", zipCode: "33103", state: "FL", interestedInACA: false, interestedInMedicare: false, interestedInFinalExpense: true,  dateOfBirth: "1971-07-14", hasMedicaidMedicareVA: false, tcpaConsent: true,  tcpaConsentSource: "phone",       status: "contacted",  source: "phone",       annualIncome: 44000, householdSize: 2 },
        { firstName: "Barbara",  lastName: "Anderson",   email: "b.anderson@email.com", phoneNumber: "4085551876", zipCode: "95101", state: "CA", interestedInACA: true,  interestedInMedicare: true,  interestedInFinalExpense: false, dateOfBirth: "1956-02-28", hasMedicaidMedicareVA: false, tcpaConsent: false, tcpaConsentSource: "third_party", status: "archived",   source: "paid_ad",     annualIncome: 29000, householdSize: 1 },
        { firstName: "Thomas",   lastName: "Jackson",    email: "t.jackson@email.com",  phoneNumber: "9175558832", zipCode: "10003", state: "NY", interestedInACA: false, interestedInMedicare: true,  interestedInFinalExpense: false, dateOfBirth: "1959-10-11", hasMedicaidMedicareVA: false, tcpaConsent: true,  tcpaConsentSource: "web_form",    status: "qualified",  source: "web_form",    annualIncome: 25000, householdSize: 1 },
        { firstName: "Jennifer", lastName: "White",      email: "j.white@email.com",    phoneNumber: "2145553309", zipCode: "75201", state: "TX", interestedInACA: true,  interestedInMedicare: false, interestedInFinalExpense: true,  dateOfBirth: "1977-05-19", hasMedicaidMedicareVA: false, tcpaConsent: true,  tcpaConsentSource: "web_form",    status: "converted",  source: "web_form",    annualIncome: 52000, householdSize: 3 },
        { firstName: "Kevin",    lastName: "Nguyen",     email: "k.nguyen@email.com",   phoneNumber: "6025558821", zipCode: "85001", state: "AZ", interestedInACA: true,  interestedInMedicare: false, interestedInFinalExpense: false, dateOfBirth: "1988-02-14", hasMedicaidMedicareVA: false, tcpaConsent: false, tcpaConsentSource: undefined,     status: "new",        source: "organic",     annualIncome: 63000, householdSize: 4 },
        { firstName: "Rachel",   lastName: "Foster",     email: "r.foster@email.com",   phoneNumber: "4045554432", zipCode: "30301", state: "GA", interestedInACA: false, interestedInMedicare: true,  interestedInFinalExpense: false, dateOfBirth: "1954-07-29", hasMedicaidMedicareVA: false, tcpaConsent: true,  tcpaConsentSource: "phone",       status: "contacted",  source: "phone",       annualIncome: 19000, householdSize: 1 },
        { firstName: "Steven",   lastName: "Patel",      email: "s.patel@email.com",    phoneNumber: "7135556789", zipCode: "77002", state: "TX", interestedInACA: true,  interestedInMedicare: false, interestedInFinalExpense: true,  dateOfBirth: "1975-11-03", hasMedicaidMedicareVA: false, tcpaConsent: true,  tcpaConsentSource: "web_form",    status: "qualified",  source: "web_form",    annualIncome: 48000, householdSize: 2 },
        { firstName: "Amy",      lastName: "Robinson",   email: "a.robinson@email.com", phoneNumber: "3125557654", zipCode: "60601", state: "IL", interestedInACA: false, interestedInMedicare: false, interestedInFinalExpense: true,  dateOfBirth: "1969-09-17", hasMedicaidMedicareVA: false, tcpaConsent: true,  tcpaConsentSource: "web_form",    status: "new",        source: "referral",    annualIncome: 37000, householdSize: 2 },
      ];

      const createdLeads = [];
      for (const l of leadData) createdLeads.push(await storage.createLead(l as any));

      const listingConfig = [
        { idx: 0,  price: "42.00", industry: "healthcare", geography: "FL", qualityScore: 97, featured: true  },
        { idx: 1,  price: "58.50", industry: "medicare",   geography: "NY", qualityScore: 94, featured: true  },
        { idx: 2,  price: "35.00", industry: "healthcare", geography: "CA", qualityScore: 88, featured: false },
        { idx: 3,  price: "28.00", industry: "insurance",  geography: "TX", qualityScore: 91, featured: false },
        { idx: 4,  price: "61.00", industry: "medicare",   geography: "FL", qualityScore: 96, featured: true  },
        { idx: 5,  price: "38.50", industry: "healthcare", geography: "CA", qualityScore: 82, featured: false },
        { idx: 6,  price: "55.00", industry: "medicare",   geography: "NY", qualityScore: 89, featured: false },
        { idx: 7,  price: "31.00", industry: "insurance",  geography: "TX", qualityScore: 75, featured: false },
        { idx: 8,  price: "26.50", industry: "insurance",  geography: "FL", qualityScore: 68, featured: false },
        { idx: 9,  price: "47.00", industry: "healthcare", geography: "CA", qualityScore: 93, featured: true  },
        { idx: 10, price: "52.00", industry: "medicare",   geography: "NY", qualityScore: 85, featured: false },
        { idx: 11, price: "33.00", industry: "insurance",  geography: "TX", qualityScore: 78, featured: false },
        { idx: 12, price: "29.00", industry: "healthcare", geography: "AZ", qualityScore: 84, featured: false },
        { idx: 13, price: "63.00", industry: "medicare",   geography: "GA", qualityScore: 92, featured: true  },
        { idx: 14, price: "37.50", industry: "insurance",  geography: "TX", qualityScore: 80, featured: false },
        { idx: 15, price: "24.00", industry: "insurance",  geography: "IL", qualityScore: 71, featured: false },
      ];
      for (const cfg of listingConfig) {
        if (createdLeads[cfg.idx]) {
          await storage.createLeadListing({ leadId: createdLeads[cfg.idx].id, sellerId: 1, price: cfg.price, qualityScore: cfg.qualityScore, timesResold: 0, industry: cfg.industry, geography: cfg.geography, isActive: true, featured: cfg.featured });
        }
      }

      const predConfigs = [
        { industry: "healthcare", geography: "CA", predictedDemand: 88, confidence: "91.50", factors: { seasonality: 85, economic: 72, regulatory: 90, historical: 88 } },
        { industry: "medicare",   geography: "FL", predictedDemand: 94, confidence: "87.20", factors: { seasonality: 92, economic: 78, regulatory: 95, historical: 91 } },
        { industry: "insurance",  geography: "TX", predictedDemand: 72, confidence: "78.40", factors: { seasonality: 68, economic: 74, regulatory: 71, historical: 75 } },
        { industry: "healthcare", geography: "NY", predictedDemand: 81, confidence: "83.60", factors: { seasonality: 79, economic: 81, regulatory: 84, historical: 80 } },
      ];
      const validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      for (const p of predConfigs) await storage.saveDemandPrediction({ ...p, validUntil });

      const trendBases = [
        { industry: "healthcare", geography: "CA" }, { industry: "healthcare", geography: "FL" },
        { industry: "medicare",   geography: "FL" }, { industry: "medicare",   geography: "NY" },
        { industry: "insurance",  geography: "TX" }, { industry: "insurance",  geography: "CA" },
      ];
      for (const base of trendBases) {
        for (let i = 0; i < 8; i++) {
          await storage.saveMarketTrend({ ...base, avgPrice: (20 + Math.random() * 40).toFixed(2), volume: Math.floor(Math.random() * 100) + 30, growthRate: (Math.random() * 20 - 5).toFixed(2) });
        }
      }
      console.log("[seed] Database seeded with sample data");
    }

    const packages = await storage.getCreditPackages();
    if (packages.length === 0) {
      await storage.createCreditPackage({ name: "Starter",      credits: 500,  price: "99.00",  discountPercentage: "0.00",  isActive: true });
      await storage.createCreditPackage({ name: "Professional", credits: 1500, price: "249.00", discountPercentage: "10.00", isActive: true });
      await storage.createCreditPackage({ name: "Business",     credits: 3000, price: "449.00", discountPercentage: "17.00", isActive: true });
      await storage.createCreditPackage({ name: "Enterprise",   credits: 5000, price: "699.00", discountPercentage: "25.00", isActive: true });
    }

    let account = await storage.getCreditAccount(1);
    if (!account) {
      account = await storage.createCreditAccount({ userId: 1, balance: "500.00", totalPurchased: "500.00" });
      await storage.addCreditTransaction({ userId: 1, type: "purchase", amount: "500.00", description: "Initial deposit — Business Package" });
    }

    const existingPurchases = await storage.getLeadPurchases(1);
    if (existingPurchases.length === 0) {
      const allListings = await storage.getAllLeadListings();
      const toPurchase = allListings.filter(l => l.isActive).slice(-5);
      for (const listing of toPurchase) {
        await storage.purchaseLead({ listingId: listing.id, buyerId: 1, price: listing.price, qualityAtPurchase: listing.qualityScore });
        await storage.updateCreditBalance(1, `-${listing.price}`);
        await storage.addCreditTransaction({ userId: 1, type: "spend", amount: listing.price, description: `Purchased lead listing #${listing.id}` });
      }

      await storage.createAlert({ userId: 1, type: "prime_lead",    title: "NEW PRIME LEAD",      body: "FL Healthcare — Score 97 available",          leadId: null, read: false });
      await storage.createAlert({ userId: 1, type: "market_signal", title: "AI SIGNAL",           body: "Medicare/FL demand spike +12% detected",       leadId: null, read: false });
      await storage.createAlert({ userId: 1, type: "purchase",      title: "ORDER FILLED",        body: "5 leads purchased — portfolio initialized",    leadId: null, read: true  });
      await storage.createAlert({ userId: 1, type: "converted",     title: "LEAD CONVERTED!",     body: "Sandra Williams → Final Expense converted",    leadId: null, read: false });
      await storage.createAlert({ userId: 1, type: "low_balance",   title: "BALANCE REMINDER",    body: "Consider topping up your credit account",      leadId: null, read: true  });

      const allLeads = await storage.getAllLeads();
      if (allLeads.length > 0) {
        await storage.createLeadActivity({ leadId: allLeads[0].id, userId: 1, type: "call",  disposition: "contacted",     notes: "Spoke with prospect, interested in ACA plan options",          duration: 312 });
        await storage.createLeadActivity({ leadId: allLeads[0].id, userId: 1, type: "email", disposition: "callback",      notes: "Sent plan comparison PDF, follow up Thursday",                  followUpAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) });
        await storage.createLeadActivity({ leadId: allLeads[1].id, userId: 1, type: "call",  disposition: "voicemail",     notes: "Left voicemail, will try again tomorrow",                       duration: 45 });
        await storage.createLeadActivity({ leadId: allLeads[3].id, userId: 1, type: "call",  disposition: "converted",     notes: "Enrolled in Final Expense plan — $147/mo premium",             duration: 824 });
        await storage.createLeadActivity({ leadId: allLeads[2].id, userId: 1, type: "note",  disposition: "not_interested",notes: "Prospect already has employer coverage, not a fit",              duration: undefined });
      }

      await storage.createPriceAlert({ userId: 1, industry: "medicare",   geography: "FL", targetPrice: "45.00", triggered: false });
      await storage.createPriceAlert({ userId: 1, industry: "healthcare", geography: "CA", targetPrice: "30.00", triggered: false });

      console.log("[seed] Seeded purchase history, alerts, activities, and price alerts");
    }
  } catch (err) {
    console.error("[seed] Error seeding database:", err);
  }
}

// ─── Routes ────────────────────────────────────────────────────────────────────
export async function registerRoutes(app: Express): Promise<Server> {
  await seedDatabase();
  startAgingJob();

  // ── Auth ──────────────────────────────────────────────────────────────────
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) return res.status(400).json({ success: false, message: "Username and password required" });
      const user = await storage.getUserByUsername(username);
      if (!user) return res.status(401).json({ success: false, message: "Invalid credentials" });
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) return res.status(401).json({ success: false, message: "Invalid credentials" });
      (req.session as any).userId = user.id;
      (req.session as any).role   = user.role;
      return res.json({ success: true, data: { id: user.id, username: user.username, role: user.role, email: user.email } });
    } catch { return res.status(500).json({ success: false, message: "Login failed" }); }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, password, email, role } = req.body;
      if (!username || !password) return res.status(400).json({ success: false, message: "Username and password required" });
      const existing = await storage.getUserByUsername(username);
      if (existing) return res.status(409).json({ success: false, message: "Username already taken" });
      const hash = await bcrypt.hash(password, 10);
      const user = await storage.createUser({ username, password: hash, email: email || null, role: role || "agent" });
      (req.session as any).userId = user.id;
      (req.session as any).role   = user.role;
      return res.status(201).json({ success: true, data: { id: user.id, username: user.username, role: user.role } });
    } catch { return res.status(500).json({ success: false, message: "Registration failed" }); }
  });

  app.get("/api/auth/me", async (req, res) => {
    const userId = (req.session as any)?.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Not authenticated" });
    try {
      const user = await storage.getUser(userId);
      if (!user) return res.status(401).json({ success: false, message: "User not found" });
      return res.json({ success: true, data: { id: user.id, username: user.username, role: user.role, email: user.email } });
    } catch { return res.status(500).json({ success: false, message: "Failed to get user" }); }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => res.json({ success: true }));
  });

  // ── Users (admin) ─────────────────────────────────────────────────────────
  app.get("/api/users", async (_req, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      const safe = allUsers.map(u => ({ id: u.id, username: u.username, email: u.email, role: u.role, createdAt: u.createdAt }));
      return res.json({ success: true, data: safe });
    } catch { return res.status(500).json({ success: false, message: "Failed to get users" }); }
  });

  // ── Lead Stats (MUST be before /:id routes) ───────────────────────────────
  app.get("/api/leads/stats", async (_req, res) => {
    try {
      return res.json({ success: true, data: await storage.getLeadStats() });
    } catch { return res.status(500).json({ success: false, message: "Failed to get lead stats" }); }
  });

  app.get("/api/leads/search", async (req, res) => {
    try {
      const { q = "", state, status, dnc, tcpa, industry } = req.query;
      const filters: any = {};
      if (state)    filters.state    = state as string;
      if (status)   filters.status   = status as string;
      if (dnc !== undefined && dnc !== "") filters.dnc = dnc === "true";
      if (tcpa !== undefined && tcpa !== "") filters.tcpaConsent = tcpa === "true";
      if (industry) filters.industry = industry as string;
      const results = await storage.searchLeads(q as string, filters);
      return res.json({ success: true, data: results });
    } catch { return res.status(500).json({ success: false, message: "Search failed" }); }
  });

  // ── Dashboard summary ─────────────────────────────────────────────────────
  app.get("/api/dashboard", async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string) || 1;
      const [leadStats, account, listings, recentActivities, followUps, unreadAlerts] = await Promise.all([
        storage.getLeadStats(),
        storage.getCreditAccount(userId),
        storage.getAllLeadListings(),
        storage.getAllRecentActivities(userId, 5),
        storage.getFollowUps(userId),
        storage.getUnreadAlerts(userId),
      ]);
      const activeListings = listings.filter(l => l.isActive);
      const totalRevenue   = listings.reduce((s, l) => s + parseFloat(l.price) * l.timesResold, 0);
      return res.json({
        success: true,
        data: {
          leadStats,
          balance: account?.balance || "0.00",
          activeListings: activeListings.length,
          totalListings:  listings.length,
          totalRevenue:   totalRevenue.toFixed(2),
          recentActivities,
          pendingFollowUps: followUps.length,
          unreadAlerts:     unreadAlerts.length,
        }
      });
    } catch { return res.status(500).json({ success: false, message: "Failed to get dashboard" }); }
  });

  // ── Lead capture ──────────────────────────────────────────────────────────
  app.post("/api/leads", async (req, res) => {
    try {
      const formData = leadValidationSchema.parse(req.body);
      const lead = await storage.createLead({
        firstName: formData.firstName, lastName: formData.lastName,
        email: formData.email, phoneNumber: formData.phoneNumber,
        zipCode: formData.zipCode, state: formData.state,
        dateOfBirth: formData.dateOfBirth, hasMedicaidMedicareVA: formData.hasMedicaidMedicareVA,
        interestedInACA:          formData.interests.includes("ACA/Obamacare"),
        interestedInMedicare:     formData.interests.includes("Medicare"),
        interestedInFinalExpense: formData.interests.includes("Final Expense/Life Insurance"),
        tcpaConsent: formData.tcpaConsent ?? false,
        tcpaConsentSource: formData.tcpaConsentSource || "web_form",
        annualIncome: formData.annualIncome,
        householdSize: formData.householdSize,
        status: "new",
        source: "web_form",
      } as any);
      if (lead.interestedInMedicare || lead.interestedInACA) {
        await storage.createAlert({ userId: 1, type: "prime_lead", title: "NEW LEAD CAPTURED", body: `${lead.firstName} ${lead.lastName} — ${lead.state}`, leadId: lead.id, read: false });
      }
      return res.status(201).json({ success: true, message: "Lead submitted", data: lead });
    } catch (error) {
      if (error instanceof ZodError)
        return res.status(400).json({ success: false, message: "Invalid form data", errors: error.errors });
      return res.status(500).json({ success: false, message: "Server error" });
    }
  });

  app.get("/api/leads", async (_req, res) => {
    try {
      return res.json({ success: true, data: await storage.getAllLeads() });
    } catch { return res.status(500).json({ success: false, message: "Failed to get leads" }); }
  });

  app.get("/api/leads/:id", async (req, res) => {
    try {
      const lead = await storage.getLeadById(parseInt(req.params.id));
      if (!lead) return res.status(404).json({ success: false, message: "Lead not found" });
      return res.json({ success: true, data: lead });
    } catch { return res.status(500).json({ success: false, message: "Failed to get lead" }); }
  });

  app.patch("/api/leads/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status, notes, tags } = req.body;
      const updates: any = {};
      if (status !== undefined) updates.status = status;
      if (notes  !== undefined) updates.notes  = notes;
      if (tags   !== undefined) updates.tags   = tags;
      await storage.updateLead(id, updates);
      const lead = await storage.getLeadById(id);
      if (status === "converted") {
        await storage.createAlert({ userId: 1, type: "converted", title: "LEAD CONVERTED!", body: `Lead #${id} — ${lead?.firstName} ${lead?.lastName} converted`, leadId: id, read: false });
      }
      return res.json({ success: true, data: lead });
    } catch { return res.status(500).json({ success: false, message: "Failed to update lead" }); }
  });

  app.get("/api/leads/:id/quality", async (req, res) => {
    try {
      return res.json({ success: true, data: await storage.getLeadQuality(parseInt(req.params.id)) });
    } catch { return res.status(500).json({ success: false, message: "Failed to get quality" }); }
  });

  app.get("/api/leads/:leadId/owned", async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string) || 1;
      const owned = await storage.hasPurchasedLead(userId, parseInt(req.params.leadId));
      return res.json({ success: true, data: { owned } });
    } catch { return res.status(500).json({ success: false, message: "Failed to check ownership" }); }
  });

  app.post("/api/leads/:id/dnc", async (req, res) => {
    try {
      await storage.markLeadDNC(parseInt(req.params.id));
      await storage.createAlert({ userId: 1, type: "dnc", title: "LEAD DNC'D", body: `Lead #${req.params.id} added to Do Not Call list`, leadId: parseInt(req.params.id), read: false });
      return res.json({ success: true });
    } catch { return res.status(500).json({ success: false, message: "Failed to mark DNC" }); }
  });

  // Bulk DNC
  app.post("/api/leads/bulk-dnc", async (req, res) => {
    try {
      const { leadIds } = req.body;
      if (!Array.isArray(leadIds)) return res.status(400).json({ success: false, message: "leadIds must be an array" });
      for (const id of leadIds) {
        await storage.markLeadDNC(id);
      }
      await storage.createAlert({ userId: 1, type: "dnc", title: "BULK DNC", body: `${leadIds.length} leads added to Do Not Call list`, leadId: null, read: false });
      return res.json({ success: true, message: `${leadIds.length} leads DNC'd` });
    } catch { return res.status(500).json({ success: false, message: "Failed to bulk DNC" }); }
  });

  // ── CRM Activities ────────────────────────────────────────────────────────
  app.get("/api/leads/:id/activities", async (req, res) => {
    try {
      return res.json({ success: true, data: await storage.getLeadActivities(parseInt(req.params.id)) });
    } catch { return res.status(500).json({ success: false, message: "Failed to get activities" }); }
  });

  app.post("/api/leads/:id/activities", async (req, res) => {
    try {
      const data = insertLeadActivitySchema.parse({ ...req.body, leadId: parseInt(req.params.id) });
      const activity = await storage.createLeadActivity(data);
      if (data.disposition === "converted") {
        await storage.updateLead(parseInt(req.params.id), { status: "converted" });
        await storage.createAlert({ userId: data.userId, type: "converted", title: "LEAD CONVERTED!", body: `Lead #${req.params.id} marked as converted`, leadId: parseInt(req.params.id), read: false });
      } else if (data.disposition === "contacted") {
        await storage.updateLead(parseInt(req.params.id), { status: "contacted" });
      }
      return res.status(201).json({ success: true, data: activity });
    } catch (error) {
      if (error instanceof ZodError) return res.status(400).json({ success: false, message: "Invalid activity data", errors: error.errors });
      return res.status(500).json({ success: false, message: "Failed to log activity" });
    }
  });

  app.get("/api/follow-ups", async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string) || 1;
      return res.json({ success: true, data: await storage.getFollowUps(userId) });
    } catch { return res.status(500).json({ success: false, message: "Failed to get follow-ups" }); }
  });

  app.get("/api/activities/recent", async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string) || 1;
      const limit  = parseInt(req.query.limit as string) || 20;
      return res.json({ success: true, data: await storage.getAllRecentActivities(userId, limit) });
    } catch { return res.status(500).json({ success: false, message: "Failed to get activities" }); }
  });

  // ── Alerts ────────────────────────────────────────────────────────────────
  app.get("/api/alerts/unread", async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string) || 1;
      return res.json({ success: true, data: await storage.getUnreadAlerts(userId) });
    } catch { return res.status(500).json({ success: false, message: "Failed to get alerts" }); }
  });

  app.get("/api/alerts", async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string) || 1;
      return res.json({ success: true, data: await storage.getAllAlerts(userId) });
    } catch { return res.status(500).json({ success: false, message: "Failed to get alerts" }); }
  });

  app.patch("/api/alerts/:id/read", async (req, res) => {
    try {
      await storage.markAlertRead(parseInt(req.params.id));
      return res.json({ success: true });
    } catch { return res.status(500).json({ success: false, message: "Failed to mark alert read" }); }
  });

  app.patch("/api/alerts/read-all", async (req, res) => {
    try {
      const userId = parseInt(req.body.userId) || 1;
      await storage.markAllAlertsRead(userId);
      return res.json({ success: true });
    } catch { return res.status(500).json({ success: false, message: "Failed to mark all read" }); }
  });

  app.delete("/api/alerts/:id", async (req, res) => {
    try {
      await storage.deleteAlert(parseInt(req.params.id));
      return res.json({ success: true });
    } catch { return res.status(500).json({ success: false, message: "Failed to delete alert" }); }
  });

  // ── Watchlist ─────────────────────────────────────────────────────────────
  app.get("/api/watchlist", async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string) || 1;
      return res.json({ success: true, data: await storage.getWatchlist(userId) });
    } catch { return res.status(500).json({ success: false, message: "Failed to get watchlist" }); }
  });

  app.post("/api/watchlist", async (req, res) => {
    try {
      const { userId = 1, listingId } = req.body;
      const already = await storage.isWatchlisted(userId, listingId);
      if (already) {
        await storage.removeFromWatchlist(userId, listingId);
        return res.json({ success: true, data: { action: "removed" } });
      }
      const w = await storage.addToWatchlist(userId, listingId);
      return res.status(201).json({ success: true, data: { action: "added", watchlist: w } });
    } catch { return res.status(500).json({ success: false, message: "Failed to update watchlist" }); }
  });

  app.delete("/api/watchlist/:listingId", async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string) || 1;
      await storage.removeFromWatchlist(userId, parseInt(req.params.listingId));
      return res.json({ success: true });
    } catch { return res.status(500).json({ success: false, message: "Failed to remove from watchlist" }); }
  });

  app.get("/api/watchlist/:listingId/check", async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string) || 1;
      const watched = await storage.isWatchlisted(userId, parseInt(req.params.listingId));
      return res.json({ success: true, data: { watched } });
    } catch { return res.status(500).json({ success: false, message: "Failed to check watchlist" }); }
  });

  // ── Price Alerts ──────────────────────────────────────────────────────────
  app.get("/api/price-alerts", async (req, res) => {
    try {
      const userId = parseInt(req.query.userId as string) || 1;
      return res.json({ success: true, data: await storage.getPriceAlerts(userId) });
    } catch { return res.status(500).json({ success: false, message: "Failed to get price alerts" }); }
  });

  app.post("/api/price-alerts", async (req, res) => {
    try {
      const data = insertPriceAlertSchema.parse(req.body);
      const alert = await storage.createPriceAlert(data);
      return res.status(201).json({ success: true, data: alert });
    } catch (error) {
      if (error instanceof ZodError) return res.status(400).json({ success: false, message: "Invalid alert data", errors: error.errors });
      return res.status(500).json({ success: false, message: "Failed to create price alert" });
    }
  });

  app.delete("/api/price-alerts/:id", async (req, res) => {
    try {
      await storage.deletePriceAlert(parseInt(req.params.id));
      return res.json({ success: true });
    } catch { return res.status(500).json({ success: false, message: "Failed to delete price alert" }); }
  });

  // ── CSV Export ────────────────────────────────────────────────────────────
  app.get("/api/export/leads", async (req, res) => {
    try {
      const { state, status } = req.query;
      let allLeads = await storage.getAllLeads();
      if (state)  allLeads = allLeads.filter(l => l.state === state);
      if (status) allLeads = allLeads.filter(l => l.status === status);
      const headers = ["ID","First Name","Last Name","Email","Phone","Zip","State","DOB","ACA","Medicare","Final Expense","Status","Source","TCPA Consent","DNC","Aging Score","Lead Score","Notes","Captured"];
      const rows = allLeads.map(l => [
        l.id, l.firstName, l.lastName, `"${l.email}"`, l.phoneNumber, l.zipCode, l.state,
        l.dateOfBirth || "", l.interestedInACA ? "Y" : "N", l.interestedInMedicare ? "Y" : "N",
        l.interestedInFinalExpense ? "Y" : "N", l.status || "new", l.source || "web_form",
        l.tcpaConsent ? "Y" : "N", l.dnc ? "Y" : "N", l.agingScore ?? 100, l.leadScore ?? 0,
        `"${(l.notes || "").replace(/"/g, "'")}"`,
        new Date(l.createdAt ?? "").toISOString(),
      ].join(","));
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="leads-${Date.now()}.csv"`);
      return res.send([headers.join(","), ...rows].join("\n"));
    } catch { return res.status(500).json({ success: false, message: "Export failed" }); }
  });

  app.get("/api/export/listings", async (req, res) => {
    try {
      const listings = await storage.getAllLeadListings();
      const headers = ["ID","Lead ID","Industry","State","Price","Quality","Times Resold","Featured","Active","Listed"];
      const rows = listings.map(l => [
        l.id, l.leadId, l.industry, l.geography, l.price, l.qualityScore,
        l.timesResold, l.featured ? "Y" : "N", l.isActive ? "Y" : "N", new Date(l.createdAt ?? "").toISOString(),
      ].join(","));
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="listings-${Date.now()}.csv"`);
      return res.send([headers.join(","), ...rows].join("\n"));
    } catch { return res.status(500).json({ success: false, message: "Export failed" }); }
  });

  // ── Credits ───────────────────────────────────────────────────────────────
  app.get("/api/credits/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      let account = await storage.getCreditAccount(userId);
      if (!account) account = await storage.createCreditAccount({ userId, balance: "0.00", totalPurchased: "0.00" });
      return res.json({ success: true, data: account });
    } catch { return res.status(500).json({ success: false, message: "Failed to get credit account" }); }
  });

  app.get("/api/credit-packages", async (_req, res) => {
    try {
      return res.json({ success: true, data: await storage.getCreditPackages() });
    } catch { return res.status(500).json({ success: false, message: "Failed to get packages" }); }
  });

  app.post("/api/credits/purchase", async (req, res) => {
    try {
      const { userId, packageId, amount } = req.body;
      await storage.updateCreditBalance(userId, amount);
      await storage.addCreditTransaction({ userId, type: "purchase", amount, description: `Deposit — Package #${packageId}` });
      await storage.createAlert({ userId, type: "purchase", title: "FUNDS DEPOSITED", body: `$${amount} added to your account`, leadId: null, read: false });
      return res.json({ success: true, message: "Credits deposited" });
    } catch { return res.status(500).json({ success: false, message: "Failed to deposit credits" }); }
  });

  app.get("/api/credits/:userId/transactions", async (req, res) => {
    try {
      return res.json({ success: true, data: await storage.getCreditTransactions(parseInt(req.params.userId)) });
    } catch { return res.status(500).json({ success: false, message: "Failed to get transactions" }); }
  });

  // ── Lead Listings ─────────────────────────────────────────────────────────
  app.get("/api/lead-listings", async (req, res) => {
    try {
      const { industry, geography, minPrice, maxPrice } = req.query;
      const listings = await storage.getLeadListings({ industry: industry as string, geography: geography as string, minPrice: minPrice as string, maxPrice: maxPrice as string });
      return res.json({ success: true, data: listings });
    } catch { return res.status(500).json({ success: false, message: "Failed to get listings" }); }
  });

  app.get("/api/lead-listings/all", async (_req, res) => {
    try {
      return res.json({ success: true, data: await storage.getAllLeadListings() });
    } catch { return res.status(500).json({ success: false, message: "Failed to get all listings" }); }
  });

  app.post("/api/lead-listings", async (req, res) => {
    try {
      const data = insertLeadListingSchema.parse(req.body);
      const listing = await storage.createLeadListing(data);
      return res.status(201).json({ success: true, data: listing });
    } catch (error) {
      if (error instanceof ZodError) return res.status(400).json({ success: false, message: "Invalid listing data", errors: error.errors });
      return res.status(500).json({ success: false, message: "Failed to create listing" });
    }
  });

  app.post("/api/lead-listings/:id/purchase", async (req, res) => {
    try {
      const listingId = parseInt(req.params.id);
      const { buyerId } = req.body;
      const listing = await storage.getLeadListingById(listingId);
      if (!listing?.isActive) return res.status(404).json({ success: false, message: "Listing not available" });
      const lead = await storage.getLeadById(listing.leadId);
      if (lead?.dnc) return res.status(403).json({ success: false, message: "Lead is on DNC registry" });
      const alreadyOwned = await storage.hasPurchasedLead(buyerId, listing.leadId);
      if (alreadyOwned) return res.status(409).json({ success: false, message: "You already own this lead" });
      const account = await storage.getCreditAccount(buyerId);
      if (!account || parseFloat(account.balance) < parseFloat(listing.price))
        return res.status(400).json({ success: false, message: "Insufficient credits" });
      const purchase = await storage.purchaseLead({ listingId, buyerId, price: listing.price, qualityAtPurchase: listing.qualityScore });
      await storage.updateCreditBalance(buyerId, `-${listing.price}`);
      await storage.addCreditTransaction({ userId: buyerId, type: "spend", amount: listing.price, description: `Purchased lead listing #${listingId}` });
      await storage.createAlert({ userId: buyerId, type: "purchase", title: "ORDER FILLED", body: `Lead #${listing.leadId} acquired — $${listing.price} debited`, leadId: listing.leadId, read: false });
      const updated = await storage.getCreditAccount(buyerId);
      if (updated && parseFloat(updated.balance) < 100) {
        await storage.createAlert({ userId: buyerId, type: "low_balance", title: "LOW BALANCE WARNING", body: `Balance is $${parseFloat(updated.balance).toFixed(2)} — consider adding funds`, leadId: null, read: false });
      }
      return res.json({ success: true, data: purchase });
    } catch { return res.status(500).json({ success: false, message: "Failed to purchase lead" }); }
  });

  // ── Purchases ─────────────────────────────────────────────────────────────
  app.get("/api/purchases/:userId", async (req, res) => {
    try {
      return res.json({ success: true, data: await storage.getLeadPurchases(parseInt(req.params.userId)) });
    } catch { return res.status(500).json({ success: false, message: "Failed to get purchases" }); }
  });

  app.get("/api/purchases/:userId/detailed", async (req, res) => {
    try {
      return res.json({ success: true, data: await storage.getLeadPurchasesDetailed(parseInt(req.params.userId)) });
    } catch { return res.status(500).json({ success: false, message: "Failed to get detailed purchases" }); }
  });

  // ── AI Demand Predictions ─────────────────────────────────────────────────
  app.get("/api/demand-predictions", async (req, res) => {
    try {
      const { industry, geography } = req.query;
      return res.json({ success: true, data: await storage.getDemandPredictions(industry as string, geography as string) });
    } catch { return res.status(500).json({ success: false, message: "Failed to get predictions" }); }
  });

  app.post("/api/demand-predictions/generate", async (req, res) => {
    try {
      const { industry, geography } = req.body;
      const prediction = await storage.saveDemandPrediction({
        industry, geography,
        predictedDemand: Math.floor(Math.random() * 40) + 60,
        confidence: (Math.floor(Math.random() * 30) + 65).toString(),
        factors: { seasonality: Math.floor(Math.random() * 100), economic: Math.floor(Math.random() * 100), regulatory: Math.floor(Math.random() * 100), historical: Math.floor(Math.random() * 100) },
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });
      return res.json({ success: true, data: prediction });
    } catch { return res.status(500).json({ success: false, message: "Failed to generate prediction" }); }
  });

  // ── Market Trends ─────────────────────────────────────────────────────────
  app.get("/api/market-trends", async (req, res) => {
    try {
      const { industry, geography, days } = req.query;
      return res.json({ success: true, data: await storage.getMarketTrends(industry as string, geography as string, days ? parseInt(days as string) : undefined) });
    } catch { return res.status(500).json({ success: false, message: "Failed to get trends" }); }
  });

  app.post("/api/market-trends", async (req, res) => {
    try {
      const data = insertMarketTrendSchema.parse(req.body);
      const trend = await storage.saveMarketTrend(data);
      return res.status(201).json({ success: true, data: trend });
    } catch (error) {
      if (error instanceof ZodError) return res.status(400).json({ success: false, message: "Invalid trend data", errors: error.errors });
      return res.status(500).json({ success: false, message: "Failed to save trend" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
