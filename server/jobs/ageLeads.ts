import cron from "node-cron";
import { db } from "../db";
import { leads } from "@shared/schema";
import { computeAgingScore } from "../utils/leadAging";

export function startAgingJob() {
  // Run every 15 minutes — recompute agingScore for all leads
  cron.schedule("*/15 * * * *", async () => {
    try {
      const allLeads = await db.select({ id: leads.id, createdAt: leads.createdAt }).from(leads);
      for (const lead of allLeads) {
        const score = computeAgingScore(lead.createdAt ?? new Date());
        await db.update(leads)
          .set({ agingScore: score })
          .where((await import("drizzle-orm")).eq(leads.id, lead.id));
      }
      console.log(`[aging] Updated aging scores for ${allLeads.length} leads`);
    } catch (err) {
      console.error("[aging] Cron error:", err);
    }
  });
  console.log("[aging] Lead aging cron job started (every 15 min)");
}
