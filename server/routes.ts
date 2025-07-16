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

export async function registerRoutes(app: Express): Promise<Server> {
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
