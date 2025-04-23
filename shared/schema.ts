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
