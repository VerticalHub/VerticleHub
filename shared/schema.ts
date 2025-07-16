import { pgTable, text, serial, integer, boolean, timestamp, decimal, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// New schema for leads
export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phoneNumber: text("phone_number").notNull(),
  zipCode: text("zip_code").notNull(),
  state: text("state").notNull(),
  interestedInACA: boolean("interested_in_aca").default(false),
  interestedInMedicare: boolean("interested_in_medicare").default(false),
  interestedInFinalExpense: boolean("interested_in_final_expense").default(false),
  dateOfBirth: text("date_of_birth"),
  hasMedicaidMedicareVA: boolean("has_medicaid_medicare_va").default(false),
  createdAt: timestamp("created_at").defaultNow()
});

export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  createdAt: true,
});

export const leadValidationSchema = insertLeadSchema.extend({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().min(10, "Phone number should be at least 10 digits"),
  zipCode: z.string().length(5, "Zip code must be 5 digits"),
  state: z.string().min(1, "State is required"),
  dateOfBirth: z.string().optional(),
  hasMedicaidMedicareVA: z.boolean().optional(),
  interests: z.array(z.string()).min(1, "Select at least one interest"),
}).refine((data) => {
  // If interested in ACA, can't have Medicare/Medicaid/VA
  if (data.interests.includes("ACA/Obamacare") && data.hasMedicaidMedicareVA) {
    return false;
  }
  return true;
}, {
  message: "ACA/Obamacare isn't available if you have Medicare, Medicaid, or VA coverage",
  path: ["hasMedicaidMedicareVA"]
}).refine((data) => {
  // If interested in Medicare, must be at least 64.5 years old
  if (data.interests.includes("Medicare") && data.dateOfBirth) {
    const dob = new Date(data.dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    // Check if they're at least 64.5 years old
    if (age < 64 || (age === 64 && monthDiff < 6)) {
      return false;
    }
  }
  return true;
}, {
  message: "You must be at least 64½ years old to qualify for Medicare",
  path: ["dateOfBirth"]
});

export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leads.$inferSelect;
export type LeadFormData = z.infer<typeof leadValidationSchema>;

// Credit System
export const creditAccounts = pgTable("credit_accounts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  balance: decimal("balance", { precision: 10, scale: 2 }).notNull().default("0.00"),
  totalPurchased: decimal("total_purchased", { precision: 10, scale: 2 }).notNull().default("0.00"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const creditTransactions = pgTable("credit_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(), // "purchase", "spend", "refund"
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});

export const creditPackages = pgTable("credit_packages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  credits: integer("credits").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  discountPercentage: decimal("discount_percentage", { precision: 5, scale: 2 }).default("0.00"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow()
});

// Lead Resale Marketplace
export const leadListings = pgTable("lead_listings", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").notNull(),
  sellerId: integer("seller_id").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  qualityScore: integer("quality_score").notNull().default(100), // 0-100
  timesResold: integer("times_resold").notNull().default(0),
  industry: text("industry").notNull(), // "healthcare", "insurance", etc.
  geography: text("geography").notNull(), // state or region
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const leadPurchases = pgTable("lead_purchases", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id").notNull(),
  buyerId: integer("buyer_id").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  purchaseDate: timestamp("purchase_date").defaultNow(),
  qualityAtPurchase: integer("quality_at_purchase").notNull()
});

export const leadQualityDecay = pgTable("lead_quality_decay", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").notNull(),
  initialQuality: integer("initial_quality").notNull().default(100),
  currentQuality: integer("current_quality").notNull().default(100),
  decayRate: decimal("decay_rate", { precision: 5, scale: 2 }).notNull().default("5.00"), // % per resale
  lastUpdated: timestamp("last_updated").defaultNow()
});

// AI Predictive Trends
export const demandPredictions = pgTable("demand_predictions", {
  id: serial("id").primaryKey(),
  industry: text("industry").notNull(),
  geography: text("geography").notNull(),
  predictedDemand: integer("predicted_demand").notNull(), // 0-100 scale
  confidence: decimal("confidence", { precision: 5, scale: 2 }).notNull(), // 0-100%
  factors: json("factors").$type<{ seasonality: number; economic: number; regulatory: number; historical: number }>(),
  predictionDate: timestamp("prediction_date").defaultNow(),
  validUntil: timestamp("valid_until").notNull()
});

export const marketTrends = pgTable("market_trends", {
  id: serial("id").primaryKey(),
  industry: text("industry").notNull(),
  geography: text("geography").notNull(),
  avgPrice: decimal("avg_price", { precision: 10, scale: 2 }).notNull(),
  volume: integer("volume").notNull(),
  growthRate: decimal("growth_rate", { precision: 5, scale: 2 }).notNull(), // % change
  recordedAt: timestamp("recorded_at").defaultNow()
});

// Schema exports for new tables
export const insertCreditAccountSchema = createInsertSchema(creditAccounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertCreditTransactionSchema = createInsertSchema(creditTransactions).omit({
  id: true,
  createdAt: true
});

export const insertCreditPackageSchema = createInsertSchema(creditPackages).omit({
  id: true,
  createdAt: true
});

export const insertLeadListingSchema = createInsertSchema(leadListings).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertLeadPurchaseSchema = createInsertSchema(leadPurchases).omit({
  id: true,
  purchaseDate: true
});

export const insertDemandPredictionSchema = createInsertSchema(demandPredictions).omit({
  id: true,
  predictionDate: true
});

export const insertMarketTrendSchema = createInsertSchema(marketTrends).omit({
  id: true,
  recordedAt: true
});

// Type exports
export type CreditAccount = typeof creditAccounts.$inferSelect;
export type InsertCreditAccount = z.infer<typeof insertCreditAccountSchema>;
export type CreditTransaction = typeof creditTransactions.$inferSelect;
export type InsertCreditTransaction = z.infer<typeof insertCreditTransactionSchema>;
export type CreditPackage = typeof creditPackages.$inferSelect;
export type InsertCreditPackage = z.infer<typeof insertCreditPackageSchema>;

export type LeadListing = typeof leadListings.$inferSelect;
export type InsertLeadListing = z.infer<typeof insertLeadListingSchema>;
export type LeadPurchase = typeof leadPurchases.$inferSelect;
export type InsertLeadPurchase = z.infer<typeof insertLeadPurchaseSchema>;
export type LeadQualityDecay = typeof leadQualityDecay.$inferSelect;

export type DemandPrediction = typeof demandPredictions.$inferSelect;
export type InsertDemandPrediction = z.infer<typeof insertDemandPredictionSchema>;
export type MarketTrend = typeof marketTrends.$inferSelect;
export type InsertMarketTrend = z.infer<typeof insertMarketTrendSchema>;
