import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  leadValidationSchema, 
  insertCreditAccountSchema,
  insertLeadListingSchema,
  insertDemandPredictionSchema,
  insertMarketTrendSchema
} from "@shared/schema";
import { ZodError } from "zod";

// ─── Seed ──────────────────────────────────────────────────────────────────────
async function seedDatabase() {
  try {
    // ── Leads + Listings + Predictions + Trends ─────────────────────────────
    const existingLeads = await storage.getAllLeads();
    if (existingLeads.length === 0) {
      const leadData = [
        { firstName: "James",    lastName: "Harrington", email: "james.h@email.com",    phoneNumber: "3055551021", zipCode: "33101", state: "FL", interestedInACA: true,  interestedInMedicare: false, interestedInFinalExpense: false, dateOfBirth: "1985-04-12", hasMedicaidMedicareVA: false },
        { firstName: "Maria",    lastName: "Castillo",   email: "maria.c@email.com",    phoneNumber: "2125550934", zipCode: "10001", state: "NY", interestedInACA: false, interestedInMedicare: true,  interestedInFinalExpense: false, dateOfBirth: "1958-08-23", hasMedicaidMedicareVA: false },
        { firstName: "Robert",   lastName: "Kim",        email: "r.kim@email.com",      phoneNumber: "4155557823", zipCode: "94102", state: "CA", interestedInACA: true,  interestedInMedicare: false, interestedInFinalExpense: true,  dateOfBirth: "1979-01-07", hasMedicaidMedicareVA: false },
        { firstName: "Sandra",   lastName: "Williams",   email: "s.williams@email.com", phoneNumber: "7135554412", zipCode: "77001", state: "TX", interestedInACA: false, interestedInMedicare: false, interestedInFinalExpense: true,  dateOfBirth: "1962-11-30", hasMedicaidMedicareVA: false },
        { firstName: "David",    lastName: "Thompson",   email: "d.thompson@email.com", phoneNumber: "3055558821", zipCode: "33102", state: "FL", interestedInACA: true,  interestedInMedicare: true,  interestedInFinalExpense: false, dateOfBirth: "1957-06-15", hasMedicaidMedicareVA: false },
        { firstName: "Patricia", lastName: "Moore",      email: "p.moore@email.com",    phoneNumber: "2135556634", zipCode: "90001", state: "CA", interestedInACA: true,  interestedInMedicare: false, interestedInFinalExpense: false, dateOfBirth: "1990-03-22", hasMedicaidMedicareVA: false },
        { firstName: "Michael",  lastName: "Davis",      email: "m.davis@email.com",    phoneNumber: "2125553398", zipCode: "10002", state: "NY", interestedInACA: false, interestedInMedicare: true,  interestedInFinalExpense: true,  dateOfBirth: "1955-09-18", hasMedicaidMedicareVA: false },
        { firstName: "Linda",    lastName: "Garcia",     email: "l.garcia@email.com",   phoneNumber: "5125559917", zipCode: "78201", state: "TX", interestedInACA: true,  interestedInMedicare: false, interestedInFinalExpense: false, dateOfBirth: "1983-12-05", hasMedicaidMedicareVA: false },
        { firstName: "Charles",  lastName: "Martinez",   email: "c.martinez@email.com", phoneNumber: "3055552244", zipCode: "33103", state: "FL", interestedInACA: false, interestedInMedicare: false, interestedInFinalExpense: true,  dateOfBirth: "1971-07-14", hasMedicaidMedicareVA: false },
        { firstName: "Barbara",  lastName: "Anderson",   email: "b.anderson@email.com", phoneNumber: "4085551876", zipCode: "95101", state: "CA", interestedInACA: true,  interestedInMedicare: true,  interestedInFinalExpense: false, dateOfBirth: "1956-02-28", hasMedicaidMedicareVA: false },
        { firstName: "Thomas",   lastName: "Jackson",    email: "t.jackson@email.com",  phoneNumber: "9175558832", zipCode: "10003", state: "NY", interestedInACA: false, interestedInMedicare: true,  interestedInFinalExpense: false, dateOfBirth: "1959-10-11", hasMedicaidMedicareVA: false },
        { firstName: "Jennifer", lastName: "White",      email: "j.white@email.com",    phoneNumber: "2145553309", zipCode: "75201", state: "TX", interestedInACA: true,  interestedInMedicare: false, interestedInFinalExpense: true,  dateOfBirth: "1977-05-19", hasMedicaidMedicareVA: false },
        { firstName: "Kevin",    lastName: "Nguyen",     email: "k.nguyen@email.com",   phoneNumber: "6025558821", zipCode: "85001", state: "AZ", interestedInACA: true,  interestedInMedicare: false, interestedInFinalExpense: false, dateOfBirth: "1988-02-14", hasMedicaidMedicareVA: false },
        { firstName: "Rachel",   lastName: "Foster",     email: "r.foster@email.com",   phoneNumber: "4045554432", zipCode: "30301", state: "GA", interestedInACA: false, interestedInMedicare: true,  interestedInFinalExpense: false, dateOfBirth: "1954-07-29", hasMedicaidMedicareVA: false },
        { firstName: "Steven",   lastName: "Patel",      email: "s.patel@email.com",    phoneNumber: "7135556789", zipCode: "77002", state: "TX", interestedInACA: true,  interestedInMedicare: false, interestedInFinalExpense: true,  dateOfBirth: "1975-11-03", hasMedicaidMedicareVA: false },
        { firstName: "Amy",      lastName: "Robinson",   email: "a.robinson@email.com", phoneNumber: "3125557654", zipCode: "60601", state: "IL", interestedInACA: false, interestedInMedicare: false, interestedInFinalExpense: true,  dateOfBirth: "1969-09-17", hasMedicaidMedicareVA: false },
      ];

      const createdLeads = [];
      for (const l of leadData) createdLeads.push(await storage.createLead(l));

      const listingConfig = [
        { idx: 0,  price: "42.00", industry: "healthcare", geography: "FL", qualityScore: 97 },
        { idx: 1,  price: "58.50", industry: "medicare",   geography: "NY", qualityScore: 94 },
        { idx: 2,  price: "35.00", industry: "healthcare", geography: "CA", qualityScore: 88 },
        { idx: 3,  price: "28.00", industry: "insurance",  geography: "TX", qualityScore: 91 },
        { idx: 4,  price: "61.00", industry: "medicare",   geography: "FL", qualityScore: 96 },
        { idx: 5,  price: "38.50", industry: "healthcare", geography: "CA", qualityScore: 82 },
        { idx: 6,  price: "55.00", industry: "medicare",   geography: "NY", qualityScore: 89 },
        { idx: 7,  price: "31.00", industry: "insurance",  geography: "TX", qualityScore: 75 },
        { idx: 8,  price: "26.50", industry: "insurance",  geography: "FL", qualityScore: 68 },
        { idx: 9,  price: "47.00", industry: "healthcare", geography: "CA", qualityScore: 93 },
        { idx: 10, price: "52.00", industry: "medicare",   geography: "NY", qualityScore: 85 },
        { idx: 11, price: "33.00", industry: "insurance",  geography: "TX", qualityScore: 78 },
        { idx: 12, price: "29.00", industry: "healthcare", geography: "AZ", qualityScore: 84 },
        { idx: 13, price: "63.00", industry: "medicare",   geography: "GA", qualityScore: 92 },
        { idx: 14, price: "37.50", industry: "insurance",  geography: "TX", qualityScore: 80 },
        { idx: 15, price: "24.00", industry: "insurance",  geography: "IL", qualityScore: 71 },
      ];

      for (const cfg of listingConfig) {
        if (createdLeads[cfg.idx]) {
          await storage.createLeadListing({
            leadId: createdLeads[cfg.idx].id,
            sellerId: 1,
            price: cfg.price,
            qualityScore: cfg.qualityScore,
            timesResold: 0,
            industry: cfg.industry,
            geography: cfg.geography,
            isActive: true,
          });
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
          await storage.saveMarketTrend({
            ...base,
            avgPrice: (20 + Math.random() * 40).toFixed(2),
            volume: Math.floor(Math.random() * 100) + 30,
            growthRate: (Math.random() * 20 - 5).toFixed(2),
          });
        }
      }

      console.log("[seed] Database seeded with sample data");
    }

    // ── Credit packages ─────────────────────────────────────────────────────
    const packages = await storage.getCreditPackages();
    if (packages.length === 0) {
      await storage.createCreditPackage({ name: "Starter",      credits: 500,  price: "99.00",  discountPercentage: "0.00",  isActive: true });
      await storage.createCreditPackage({ name: "Professional", credits: 1500, price: "249.00", discountPercentage: "10.00", isActive: true });
      await storage.createCreditPackage({ name: "Business",     credits: 3000, price: "449.00", discountPercentage: "17.00", isActive: true });
      await storage.createCreditPackage({ name: "Enterprise",   credits: 5000, price: "699.00", discountPercentage: "25.00", isActive: true });
    }

    // ── Credit account for demo user ─────────────────────────────────────────
    let account = await storage.getCreditAccount(1);
    if (!account) {
      account = await storage.createCreditAccount({ userId: 1, balance: "500.00", totalPurchased: "500.00" });
      await storage.addCreditTransaction({ userId: 1, type: "purchase", amount: "500.00", description: "Initial deposit — Business Package" });
    }

    // ── Purchase history (separate guard) ────────────────────────────────────
    const existingPurchases = await storage.getLeadPurchases(1);
    if (existingPurchases.length === 0) {
      const allListings = await storage.getAllLeadListings();
      const active = allListings.filter(l => l.isActive);
      // Purchase 5 listings to populate the portfolio
      const toPurchase = active.slice(-5);
      for (const listing of toPurchase) {
        await storage.purchaseLead({ listingId: listing.id, buyerId: 1, price: listing.price, qualityAtPurchase: listing.qualityScore });
        await storage.updateCreditBalance(1, `-${listing.price}`);
        await storage.addCreditTransaction({ userId: 1, type: "spend", amount: listing.price, description: `Purchased lead listing #${listing.id}` });
      }
      console.log("[seed] Seeded purchase history");
    }
  } catch (err) {
    console.error("[seed] Error seeding database:", err);
  }
}

// ─── Routes ────────────────────────────────────────────────────────────────────
export async function registerRoutes(app: Express): Promise<Server> {
  await seedDatabase();

  // ── Lead capture (public form) ────────────────────────────────────────────
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
      });
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

  app.get("/api/leads/:id/quality", async (req, res) => {
    try {
      return res.json({ success: true, data: await storage.getLeadQuality(parseInt(req.params.id)) });
    } catch { return res.status(500).json({ success: false, message: "Failed to get quality" }); }
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
      return res.json({ success: true, message: "Credits deposited" });
    } catch { return res.status(500).json({ success: false, message: "Failed to deposit credits" }); }
  });

  app.get("/api/credits/:userId/transactions", async (req, res) => {
    try {
      const txs = await storage.getCreditTransactions(parseInt(req.params.userId));
      return res.json({ success: true, data: txs });
    } catch { return res.status(500).json({ success: false, message: "Failed to get transactions" }); }
  });

  // ── Lead Listings ─────────────────────────────────────────────────────────
  app.get("/api/lead-listings", async (req, res) => {
    try {
      const { industry, geography, minPrice, maxPrice } = req.query;
      const listings = await storage.getLeadListings({
        industry: industry as string, geography: geography as string,
        minPrice: minPrice as string, maxPrice: maxPrice as string,
      });
      return res.json({ success: true, data: listings });
    } catch { return res.status(500).json({ success: false, message: "Failed to get listings" }); }
  });

  // All listings including sold — for admin
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
      if (error instanceof ZodError)
        return res.status(400).json({ success: false, message: "Invalid listing data", errors: error.errors });
      return res.status(500).json({ success: false, message: "Failed to create listing" });
    }
  });

  app.post("/api/lead-listings/:id/purchase", async (req, res) => {
    try {
      const listingId = parseInt(req.params.id);
      const { buyerId } = req.body;
      const listing = await storage.getLeadListingById(listingId);
      if (!listing?.isActive)
        return res.status(404).json({ success: false, message: "Listing not available" });
      const account = await storage.getCreditAccount(buyerId);
      if (!account || parseFloat(account.balance) < parseFloat(listing.price))
        return res.status(400).json({ success: false, message: "Insufficient credits" });
      const purchase = await storage.purchaseLead({ listingId, buyerId, price: listing.price, qualityAtPurchase: listing.qualityScore });
      await storage.updateCreditBalance(buyerId, `-${listing.price}`);
      await storage.addCreditTransaction({ userId: buyerId, type: "spend", amount: listing.price, description: `Purchased lead listing #${listingId}` });
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
        factors: {
          seasonality: Math.floor(Math.random() * 100),
          economic:    Math.floor(Math.random() * 100),
          regulatory:  Math.floor(Math.random() * 100),
          historical:  Math.floor(Math.random() * 100),
        },
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
      if (error instanceof ZodError)
        return res.status(400).json({ success: false, message: "Invalid trend data", errors: error.errors });
      return res.status(500).json({ success: false, message: "Failed to save trend" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
