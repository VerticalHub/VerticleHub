import { pgTable, text, serial, integer, boolean, timestamp, decimal, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ── Users ──────────────────────────────────────────────────────────────────────
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").unique(),
  role: text("role").notNull().default("agent"), // agent | manager | admin
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// ── Leads ──────────────────────────────────────────────────────────────────────
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
  annualIncome: integer("annual_income"),             // for ACA subsidy calc
  householdSize: integer("household_size"),           // for ACA subsidy calc
  // Status tracking
  status: text("status").notNull().default("new"),   // new | contacted | qualified | converted | archived
  source: text("source").default("web_form"),         // web_form | phone | referral | paid_ad | organic
  notes: text("notes"),
  tags: text("tags").array(),
  // TCPA compliance
  tcpaConsent: boolean("tcpa_consent").default(false),
  tcpaConsentDate: timestamp("tcpa_consent_date"),
  tcpaConsentSource: text("tcpa_consent_source"),    // web_form | phone | third_party
  dnc: boolean("dnc").default(false),
  dncAddedAt: timestamp("dnc_added_at"),
  // Aging & scoring
  agingScore: integer("aging_score").default(100),   // 0-100, decays over time
  leadScore: integer("lead_score").default(0),       // composite quality score 0-100
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true, createdAt: true, tcpaConsentDate: true, dncAddedAt: true,
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
  tcpaConsent: z.boolean().optional(),
  tcpaConsentSource: z.string().optional(),
  annualIncome: z.number().optional(),
  householdSize: z.number().optional(),
  interests: z.array(z.string()).min(1, "Select at least one interest"),
}).refine((data) => {
  if (data.interests.includes("ACA/Obamacare") && data.hasMedicaidMedicareVA) return false;
  return true;
}, {
  message: "ACA/Obamacare isn't available if you have Medicare, Medicaid, or VA coverage",
  path: ["hasMedicaidMedicareVA"]
}).refine((data) => {
  if (data.interests.includes("Medicare") && data.dateOfBirth) {
    const dob = new Date(data.dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) age--;
    if (age < 64 || (age === 64 && monthDiff < 6)) return false;
  }
  return true;
}, {
  message: "You must be at least 64½ years old to qualify for Medicare",
  path: ["dateOfBirth"]
});

export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leads.$inferSelect;
export type LeadFormData = z.infer<typeof leadValidationSchema>;

// ── Credit System ──────────────────────────────────────────────────────────────
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
  type: text("type").notNull(), // "purchase" | "spend" | "refund"
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

// ── Lead Resale Marketplace ────────────────────────────────────────────────────
export const leadListings = pgTable("lead_listings", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").notNull(),
  sellerId: integer("seller_id").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  qualityScore: integer("quality_score").notNull().default(100),
  timesResold: integer("times_resold").notNull().default(0),
  industry: text("industry").notNull(),
  geography: text("geography").notNull(),
  isActive: boolean("is_active").default(true),
  featured: boolean("featured").default(false),
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
  decayRate: decimal("decay_rate", { precision: 5, scale: 2 }).notNull().default("5.00"),
  lastUpdated: timestamp("last_updated").defaultNow()
});

// ── Watchlist ──────────────────────────────────────────────────────────────────
export const watchlist = pgTable("watchlist", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  listingId: integer("listing_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// ── Price Alerts ───────────────────────────────────────────────────────────────
export const priceAlerts = pgTable("price_alerts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  industry: text("industry").notNull(),
  geography: text("geography").notNull(),
  targetPrice: decimal("target_price", { precision: 10, scale: 2 }).notNull(),
  triggered: boolean("triggered").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// ── Alerts ─────────────────────────────────────────────────────────────────────
export const alerts = pgTable("alerts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(), // prime_lead | low_balance | follow_up | market_signal | purchase | dnc | converted
  title: text("title").notNull(),
  body: text("body"),
  leadId: integer("lead_id"),
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAlertSchema = createInsertSchema(alerts).omit({ id: true, createdAt: true });
export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type Alert = typeof alerts.$inferSelect;

// ── CRM Lead Activities ────────────────────────────────────────────────────────
export const leadActivities = pgTable("lead_activities", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").notNull(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(), // call | email | note | sms | meeting | disposition
  disposition: text("disposition"), // contacted | voicemail | not_interested | converted | callback | no_answer
  notes: text("notes"),
  followUpAt: timestamp("follow_up_at"),
  duration: integer("duration"), // seconds, for calls
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertLeadActivitySchema = createInsertSchema(leadActivities).omit({ id: true, createdAt: true });
export type InsertLeadActivity = z.infer<typeof insertLeadActivitySchema>;
export type LeadActivity = typeof leadActivities.$inferSelect;

// ── AI Predictive Trends ───────────────────────────────────────────────────────
export const demandPredictions = pgTable("demand_predictions", {
  id: serial("id").primaryKey(),
  industry: text("industry").notNull(),
  geography: text("geography").notNull(),
  predictedDemand: integer("predicted_demand").notNull(),
  confidence: decimal("confidence", { precision: 5, scale: 2 }).notNull(),
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
  growthRate: decimal("growth_rate", { precision: 5, scale: 2 }).notNull(),
  recordedAt: timestamp("recorded_at").defaultNow()
});

// ── Schema exports ─────────────────────────────────────────────────────────────
export const insertCreditAccountSchema   = createInsertSchema(creditAccounts).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCreditTransactionSchema = createInsertSchema(creditTransactions).omit({ id: true, createdAt: true });
export const insertCreditPackageSchema   = createInsertSchema(creditPackages).omit({ id: true, createdAt: true });
export const insertLeadListingSchema     = createInsertSchema(leadListings).omit({ id: true, createdAt: true, updatedAt: true });
export const insertLeadPurchaseSchema    = createInsertSchema(leadPurchases).omit({ id: true, purchaseDate: true });
export const insertDemandPredictionSchema= createInsertSchema(demandPredictions).omit({ id: true, predictionDate: true });
export const insertMarketTrendSchema     = createInsertSchema(marketTrends).omit({ id: true, recordedAt: true });
export const insertWatchlistSchema       = createInsertSchema(watchlist).omit({ id: true, createdAt: true });
export const insertPriceAlertSchema      = createInsertSchema(priceAlerts).omit({ id: true, createdAt: true });

// ── Type exports ───────────────────────────────────────────────────────────────
export type CreditAccount          = typeof creditAccounts.$inferSelect;
export type InsertCreditAccount    = z.infer<typeof insertCreditAccountSchema>;
export type CreditTransaction      = typeof creditTransactions.$inferSelect;
export type InsertCreditTransaction= z.infer<typeof insertCreditTransactionSchema>;
export type CreditPackage          = typeof creditPackages.$inferSelect;
export type InsertCreditPackage    = z.infer<typeof insertCreditPackageSchema>;
export type LeadListing            = typeof leadListings.$inferSelect;
export type InsertLeadListing      = z.infer<typeof insertLeadListingSchema>;
export type LeadPurchase           = typeof leadPurchases.$inferSelect;
export type InsertLeadPurchase     = z.infer<typeof insertLeadPurchaseSchema>;
export type LeadQualityDecay       = typeof leadQualityDecay.$inferSelect;
export type DemandPrediction       = typeof demandPredictions.$inferSelect;
export type InsertDemandPrediction = z.infer<typeof insertDemandPredictionSchema>;
export type MarketTrend            = typeof marketTrends.$inferSelect;
export type InsertMarketTrend      = z.infer<typeof insertMarketTrendSchema>;
export type Watchlist              = typeof watchlist.$inferSelect;
export type InsertWatchlist        = z.infer<typeof insertWatchlistSchema>;
export type PriceAlert             = typeof priceAlerts.$inferSelect;
export type InsertPriceAlert       = z.infer<typeof insertPriceAlertSchema>;
