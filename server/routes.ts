import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  leadValidationSchema, 
  insertCreditAccountSchema, 
  insertCreditTransactionSchema,
  insertCreditPackageSchema,
  insertLeadListingSchema,
  insertLeadPurchaseSchema,
  insertDemandPredictionSchema,
  insertMarketTrendSchema
} from "@shared/schema";
import { ZodError } from "zod";

async function seedDatabase() {
  try {
    const existingLeads = await storage.getAllLeads();
    if (existingLeads.length > 0) return;

    // Seed leads
    const leadData = [
      { firstName: "James", lastName: "Harrington", email: "james.h@email.com", phoneNumber: "3055551021", zipCode: "33101", state: "FL", interestedInACA: true, interestedInMedicare: false, interestedInFinalExpense: false, dateOfBirth: "1985-04-12", hasMedicaidMedicareVA: false },
      { firstName: "Maria", lastName: "Castillo", email: "maria.c@email.com", phoneNumber: "2125550934", zipCode: "10001", state: "NY", interestedInACA: false, interestedInMedicare: true, interestedInFinalExpense: false, dateOfBirth: "1958-08-23", hasMedicaidMedicareVA: false },
      { firstName: "Robert", lastName: "Kim", email: "r.kim@email.com", phoneNumber: "4155557823", zipCode: "94102", state: "CA", interestedInACA: true, interestedInMedicare: false, interestedInFinalExpense: true, dateOfBirth: "1979-01-07", hasMedicaidMedicareVA: false },
      { firstName: "Sandra", lastName: "Williams", email: "s.williams@email.com", phoneNumber: "7135554412", zipCode: "77001", state: "TX", interestedInACA: false, interestedInMedicare: false, interestedInFinalExpense: true, dateOfBirth: "1962-11-30", hasMedicaidMedicareVA: false },
      { firstName: "David", lastName: "Thompson", email: "d.thompson@email.com", phoneNumber: "3055558821", zipCode: "33102", state: "FL", interestedInACA: true, interestedInMedicare: true, interestedInFinalExpense: false, dateOfBirth: "1957-06-15", hasMedicaidMedicareVA: false },
      { firstName: "Patricia", lastName: "Moore", email: "p.moore@email.com", phoneNumber: "2135556634", zipCode: "90001", state: "CA", interestedInACA: true, interestedInMedicare: false, interestedInFinalExpense: false, dateOfBirth: "1990-03-22", hasMedicaidMedicareVA: false },
      { firstName: "Michael", lastName: "Davis", email: "m.davis@email.com", phoneNumber: "2125553398", zipCode: "10002", state: "NY", interestedInACA: false, interestedInMedicare: true, interestedInFinalExpense: true, dateOfBirth: "1955-09-18", hasMedicaidMedicareVA: false },
      { firstName: "Linda", lastName: "Garcia", email: "l.garcia@email.com", phoneNumber: "5125559917", zipCode: "78201", state: "TX", interestedInACA: true, interestedInMedicare: false, interestedInFinalExpense: false, dateOfBirth: "1983-12-05", hasMedicaidMedicareVA: false },
      { firstName: "Charles", lastName: "Martinez", email: "c.martinez@email.com", phoneNumber: "3055552244", zipCode: "33103", state: "FL", interestedInACA: false, interestedInMedicare: false, interestedInFinalExpense: true, dateOfBirth: "1971-07-14", hasMedicaidMedicareVA: false },
      { firstName: "Barbara", lastName: "Anderson", email: "b.anderson@email.com", phoneNumber: "4085551876", zipCode: "95101", state: "CA", interestedInACA: true, interestedInMedicare: true, interestedInFinalExpense: false, dateOfBirth: "1956-02-28", hasMedicaidMedicareVA: false },
      { firstName: "Thomas", lastName: "Jackson", email: "t.jackson@email.com", phoneNumber: "9175558832", zipCode: "10003", state: "NY", interestedInACA: false, interestedInMedicare: true, interestedInFinalExpense: false, dateOfBirth: "1959-10-11", hasMedicaidMedicareVA: false },
      { firstName: "Jennifer", lastName: "White", email: "j.white@email.com", phoneNumber: "2145553309", zipCode: "75201", state: "TX", interestedInACA: true, interestedInMedicare: false, interestedInFinalExpense: true, dateOfBirth: "1977-05-19", hasMedicaidMedicareVA: false },
    ];

    const createdLeads = [];
    for (const l of leadData) createdLeads.push(await storage.createLead(l));

    // Seed credit packages
    const packages = await storage.getCreditPackages();
    if (packages.length === 0) {
      await storage.createCreditPackage({ name: "Starter", credits: 500, price: "99.00", discountPercentage: "0.00", isActive: true });
      await storage.createCreditPackage({ name: "Professional", credits: 1500, price: "249.00", discountPercentage: "10.00", isActive: true });
      await storage.createCreditPackage({ name: "Business", credits: 3000, price: "449.00", discountPercentage: "17.00", isActive: true });
      await storage.createCreditPackage({ name: "Enterprise", credits: 5000, price: "699.00", discountPercentage: "25.00", isActive: true });
    }

    // Seed credit account for demo user
    let account = await storage.getCreditAccount(1);
    if (!account) {
      account = await storage.createCreditAccount({ userId: 1, balance: "350.00", totalPurchased: "449.00" });
    }

    // Seed lead listings from created leads
    const listingConfig = [
      { idx: 0, price: "42.00", industry: "healthcare", geography: "FL", qualityScore: 97 },
      { idx: 1, price: "58.50", industry: "medicare", geography: "NY", qualityScore: 94 },
      { idx: 2, price: "35.00", industry: "healthcare", geography: "CA", qualityScore: 88 },
      { idx: 3, price: "28.00", industry: "insurance", geography: "TX", qualityScore: 91 },
      { idx: 4, price: "61.00", industry: "medicare", geography: "FL", qualityScore: 96 },
      { idx: 5, price: "38.50", industry: "healthcare", geography: "CA", qualityScore: 82 },
      { idx: 6, price: "55.00", industry: "medicare", geography: "NY", qualityScore: 89 },
      { idx: 7, price: "31.00", industry: "insurance", geography: "TX", qualityScore: 75 },
      { idx: 8, price: "26.50", industry: "insurance", geography: "FL", qualityScore: 68 },
      { idx: 9, price: "47.00", industry: "healthcare", geography: "CA", qualityScore: 93 },
      { idx: 10, price: "52.00", industry: "medicare", geography: "NY", qualityScore: 85 },
      { idx: 11, price: "33.00", industry: "insurance", geography: "TX", qualityScore: 78 },
    ];

    for (const cfg of listingConfig) {
      if (createdLeads[cfg.idx]) {
        await storage.createLeadListing({
          leadId: createdLeads[cfg.idx].id,
          sellerId: 1,
          price: cfg.price,
          qualityScore: cfg.qualityScore,
          timesResold: Math.floor(Math.random() * 2),
          industry: cfg.industry,
          geography: cfg.geography,
          isActive: true,
        });
      }
    }

    // Seed demand predictions
    const predConfigs = [
      { industry: "healthcare", geography: "CA", predictedDemand: 88, confidence: "91.50", factors: { seasonality: 85, economic: 72, regulatory: 90, historical: 88 } },
      { industry: "medicare", geography: "FL", predictedDemand: 94, confidence: "87.20", factors: { seasonality: 92, economic: 78, regulatory: 95, historical: 91 } },
      { industry: "insurance", geography: "TX", predictedDemand: 72, confidence: "78.40", factors: { seasonality: 68, economic: 74, regulatory: 71, historical: 75 } },
      { industry: "healthcare", geography: "NY", predictedDemand: 81, confidence: "83.60", factors: { seasonality: 79, economic: 81, regulatory: 84, historical: 80 } },
    ];

    const validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    for (const p of predConfigs) {
      await storage.saveDemandPrediction({ ...p, validUntil });
    }

    // Seed market trends
    const trendBases = [
      { industry: "healthcare", geography: "CA" },
      { industry: "medicare", geography: "FL" },
      { industry: "insurance", geography: "TX" },
    ];
    for (const base of trendBases) {
      for (let i = 0; i < 5; i++) {
        await storage.saveMarketTrend({
          ...base,
          avgPrice: (20 + Math.random() * 40).toFixed(2),
          volume: Math.floor(Math.random() * 100) + 30,
          growthRate: (Math.random() * 20 - 5).toFixed(2),
        });
      }
    }

    console.log("[seed] Database seeded with sample data");
  } catch (err) {
    console.error("[seed] Error seeding database:", err);
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  await seedDatabase();

  // API route to submit a lead
  app.post("/api/leads", async (req, res) => {
    try {
      // Validate the request body
      const formData = leadValidationSchema.parse(req.body);
      
      // Process interests array into individual boolean fields
      const leadData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        zipCode: formData.zipCode,
        state: formData.state,
        dateOfBirth: formData.dateOfBirth,
        hasMedicaidMedicareVA: formData.hasMedicaidMedicareVA,
        interestedInACA: formData.interests.includes("ACA/Obamacare"),
        interestedInMedicare: formData.interests.includes("Medicare"),
        interestedInFinalExpense: formData.interests.includes("Final Expense/Life Insurance"),
      };
      
      // Store the lead
      const lead = await storage.createLead(leadData);
      
      return res.status(201).json({
        success: true,
        message: "Lead successfully submitted",
        data: lead
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: "Invalid form data",
          errors: error.errors
        });
      }
      
      return res.status(500).json({
        success: false,
        message: "An error occurred while processing your request",
      });
    }
  });

  // API route to get all leads (for admin purposes)
  app.get("/api/leads", async (req, res) => {
    try {
      const leads = await storage.getAllLeads();
      return res.status(200).json({
        success: true,
        data: leads
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "An error occurred while retrieving leads",
      });
    }
  });

  // CREDIT SYSTEM ROUTES
  
  // Get user's credit account
  app.get("/api/credits/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      let account = await storage.getCreditAccount(userId);
      
      if (!account) {
        account = await storage.createCreditAccount({ userId, balance: "0.00", totalPurchased: "0.00" });
      }
      
      return res.json({ success: true, data: account });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Failed to get credit account" });
    }
  });

  // Get credit packages
  app.get("/api/credit-packages", async (req, res) => {
    try {
      const packages = await storage.getCreditPackages();
      return res.json({ success: true, data: packages });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Failed to get credit packages" });
    }
  });

  // Purchase credits
  app.post("/api/credits/purchase", async (req, res) => {
    try {
      const { userId, packageId, amount } = req.body;
      
      // Add credits to account
      await storage.updateCreditBalance(userId, amount);
      
      // Record transaction
      await storage.addCreditTransaction({
        userId,
        type: "purchase",
        amount,
        description: `Purchased credit package ${packageId}`
      });
      
      return res.json({ success: true, message: "Credits purchased successfully" });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Failed to purchase credits" });
    }
  });

  // Get credit transactions
  app.get("/api/credits/:userId/transactions", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const transactions = await storage.getCreditTransactions(userId);
      return res.json({ success: true, data: transactions });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Failed to get transactions" });
    }
  });

  // LEAD RESALE MARKETPLACE ROUTES
  
  // Get lead listings with filters
  app.get("/api/lead-listings", async (req, res) => {
    try {
      const { industry, geography, minPrice, maxPrice } = req.query;
      const listings = await storage.getLeadListings({
        industry: industry as string,
        geography: geography as string,
        minPrice: minPrice as string,
        maxPrice: maxPrice as string
      });
      return res.json({ success: true, data: listings });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Failed to get lead listings" });
    }
  });

  // Create lead listing
  app.post("/api/lead-listings", async (req, res) => {
    try {
      const listingData = insertLeadListingSchema.parse(req.body);
      const listing = await storage.createLeadListing(listingData);
      return res.status(201).json({ success: true, data: listing });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ success: false, message: "Invalid listing data", errors: error.errors });
      }
      return res.status(500).json({ success: false, message: "Failed to create lead listing" });
    }
  });

  // Purchase lead
  app.post("/api/lead-listings/:id/purchase", async (req, res) => {
    try {
      const listingId = parseInt(req.params.id);
      const { buyerId } = req.body;
      
      const listing = await storage.getLeadListingById(listingId);
      if (!listing || !listing.isActive) {
        return res.status(404).json({ success: false, message: "Lead listing not found or not available" });
      }
      
      // Check if buyer has enough credits
      const account = await storage.getCreditAccount(buyerId);
      if (!account || parseFloat(account.balance) < parseFloat(listing.price)) {
        return res.status(400).json({ success: false, message: "Insufficient credits" });
      }
      
      // Process purchase
      const purchase = await storage.purchaseLead({
        listingId,
        buyerId,
        price: listing.price,
        qualityAtPurchase: listing.qualityScore
      });
      
      // Deduct credits
      await storage.updateCreditBalance(buyerId, `-${listing.price}`);
      await storage.addCreditTransaction({
        userId: buyerId,
        type: "spend",
        amount: listing.price,
        description: `Purchased lead listing ${listingId}`
      });
      
      return res.json({ success: true, data: purchase });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Failed to purchase lead" });
    }
  });

  // Get user's purchased leads
  app.get("/api/purchases/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const purchases = await storage.getLeadPurchases(userId);
      return res.json({ success: true, data: purchases });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Failed to get purchases" });
    }
  });

  // AI PREDICTIVE TRENDS ROUTES
  
  // Get demand predictions
  app.get("/api/demand-predictions", async (req, res) => {
    try {
      const { industry, geography } = req.query;
      const predictions = await storage.getDemandPredictions(industry as string, geography as string);
      return res.json({ success: true, data: predictions });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Failed to get demand predictions" });
    }
  });

  // Generate AI demand prediction (simulation)
  app.post("/api/demand-predictions/generate", async (req, res) => {
    try {
      const { industry, geography } = req.body;
      
      // Simulate AI prediction generation
      const prediction = await storage.saveDemandPrediction({
        industry,
        geography,
        predictedDemand: Math.floor(Math.random() * 100) + 1,
        confidence: Math.floor(Math.random() * 40) + 60, // 60-100% confidence
        factors: {
          seasonality: Math.floor(Math.random() * 100),
          economic: Math.floor(Math.random() * 100),
          regulatory: Math.floor(Math.random() * 100),
          historical: Math.floor(Math.random() * 100)
        },
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      });
      
      return res.json({ success: true, data: prediction });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Failed to generate prediction" });
    }
  });

  // Get market trends
  app.get("/api/market-trends", async (req, res) => {
    try {
      const { industry, geography, days } = req.query;
      const trends = await storage.getMarketTrends(
        industry as string, 
        geography as string, 
        days ? parseInt(days as string) : undefined
      );
      return res.json({ success: true, data: trends });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Failed to get market trends" });
    }
  });

  // Record market trend data
  app.post("/api/market-trends", async (req, res) => {
    try {
      const trendData = insertMarketTrendSchema.parse(req.body);
      const trend = await storage.saveMarketTrend(trendData);
      return res.status(201).json({ success: true, data: trend });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ success: false, message: "Invalid trend data", errors: error.errors });
      }
      return res.status(500).json({ success: false, message: "Failed to save market trend" });
    }
  });

  // Get lead quality info
  app.get("/api/leads/:id/quality", async (req, res) => {
    try {
      const leadId = parseInt(req.params.id);
      const quality = await storage.getLeadQuality(leadId);
      return res.json({ success: true, data: quality });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Failed to get lead quality" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
