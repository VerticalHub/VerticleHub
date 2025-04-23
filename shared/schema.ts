import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
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
  interests: z.array(z.string()).min(1, "Select at least one interest"),
});

export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leads.$inferSelect;
export type LeadFormData = z.infer<typeof leadValidationSchema>;
