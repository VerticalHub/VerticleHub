import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { leadValidationSchema } from "@shared/schema";
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

  const httpServer = createServer(app);

  return httpServer;
}
