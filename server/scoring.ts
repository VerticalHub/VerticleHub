/**
 * AI Lead Scoring Engine — v2
 * Deterministic, multi-factor, 0-100 composite score.
 * Used server-side at creation, rescore, and listing enrichment.
 * Mirrored client-side in ScoreBadge.tsx for breakdown tooltips.
 */

export interface ScoreBreakdown {
  tcpa:         number;  // 0-25  TCPA consent
  interest:     number;  // 0-20  interest type quality
  ageBracket:   number;  // 0-15  age vs interest fit
  recency:      number;  // 0-15  capture recency
  stateDemand:  number;  // 0-10  high-demand state bonus
  incomeFit:    number;  // 0-8   income bracket eligibility
  completeness: number;  // 0-7   data completeness
  total:        number;  // 0-100
}

/** High-demand states for healthcare lead buying */
const HIGH_DEMAND  = new Set(["FL","CA","NY","TX","AZ","GA","NJ","IL","PA","OH","NC","TN"]);
const MED_DEMAND   = new Set(["WA","CO","VA","MA","MI","MN","MD","OR","WI","IN","MO","AL"]);

/** Federal Poverty Level 2024 — single + per-additional-member */
const FPL_BASE = 14580;
const FPL_EACH = 5140;

export function computeLeadScore(lead: {
  tcpaConsent?: boolean | null;
  interestedInACA?: boolean | null;
  interestedInMedicare?: boolean | null;
  interestedInFinalExpense?: boolean | null;
  dateOfBirth?: string | null;
  state?: string | null;
  annualIncome?: number | null;
  householdSize?: number | null;
  createdAt?: Date | string | null;
  source?: string | null;
  hasMedicaidMedicareVA?: boolean | null;
}): ScoreBreakdown {

  // ── 1. TCPA consent (0-25) ──────────────────────────────────────────────
  const tcpa = lead.tcpaConsent ? 25 : 0;

  // ── 2. Interest type quality (0-20) ─────────────────────────────────────
  let interest = 0;
  if (lead.interestedInMedicare)     interest += 13;
  if (lead.interestedInFinalExpense) interest += 10;
  if (lead.interestedInACA)          interest += 8;
  // Multi-interest combo bonus
  const multiCount = [lead.interestedInMedicare, lead.interestedInFinalExpense, lead.interestedInACA].filter(Boolean).length;
  if (multiCount >= 2) interest += 3;
  interest = Math.min(20, interest);

  // ── 3. Age bracket fit (0-15) ────────────────────────────────────────────
  let ageBracket = 5; // default for no DOB
  if (lead.dateOfBirth) {
    const ageMs  = Date.now() - new Date(lead.dateOfBirth).getTime();
    const ageYrs = Math.floor(ageMs / (365.25 * 24 * 3600 * 1000));
    if (lead.interestedInMedicare) {
      if      (ageYrs >= 65)              ageBracket = 15; // prime Medicare age
      else if (ageYrs >= 63)              ageBracket = 12; // approaching 65
      else if (ageYrs >= 60)              ageBracket = 9;
      else if (ageYrs >= 55)              ageBracket = 5;
      else                                ageBracket = 2;
    } else if (lead.interestedInFinalExpense) {
      if      (ageYrs >= 50 && ageYrs <= 80) ageBracket = 15;
      else if (ageYrs >= 40)                 ageBracket = 10;
      else                                   ageBracket = 4;
    } else if (lead.interestedInACA) {
      if      (ageYrs >= 26 && ageYrs <= 54) ageBracket = 15; // prime ACA
      else if (ageYrs >= 18 && ageYrs <= 64) ageBracket = 10;
      else                                   ageBracket = 3;
    } else {
      ageBracket = ageYrs >= 30 && ageYrs <= 65 ? 8 : 4;
    }
  }

  // ── 4. Recency (0-15) ────────────────────────────────────────────────────
  let recency = 0;
  if (lead.createdAt) {
    const hrs = (Date.now() - new Date(lead.createdAt).getTime()) / 3_600_000;
    if      (hrs <= 6)    recency = 15; // < 6 hours: ultra-fresh
    else if (hrs <= 24)   recency = 13;
    else if (hrs <= 72)   recency = 10; // 3 days
    else if (hrs <= 168)  recency = 8;  // 7 days
    else if (hrs <= 720)  recency = 5;  // 30 days
    else if (hrs <= 2160) recency = 2;  // 90 days
    else                  recency = 0;
  } else {
    recency = 8; // no createdAt = mid-range assumption
  }

  // ── 5. State demand (0-10) ───────────────────────────────────────────────
  const st = lead.state?.toUpperCase() || "";
  const stateDemand = HIGH_DEMAND.has(st) ? 10 : MED_DEMAND.has(st) ? 6 : 3;

  // ── 6. Income bracket fit (0-8) ──────────────────────────────────────────
  let incomeFit = 4; // neutral when unknown
  if (lead.annualIncome && lead.householdSize) {
    const fpl = FPL_BASE + (Math.max(1, lead.householdSize) - 1) * FPL_EACH;
    const pct  = (lead.annualIncome / fpl) * 100;
    if (lead.interestedInACA) {
      // ACA subsidy range: 100-400% FPL
      if      (pct >= 100 && pct <= 250) incomeFit = 8;
      else if (pct >= 250 && pct <= 400) incomeFit = 6;
      else if (pct >= 400 && pct <= 600) incomeFit = 3;
      else                               incomeFit = 1;
    } else if (lead.interestedInFinalExpense) {
      incomeFit = (lead.annualIncome >= 18000 && lead.annualIncome <= 90000) ? 8 : 3;
    } else if (lead.interestedInMedicare) {
      // Medicare is income-independent but low-income = extra products
      incomeFit = lead.annualIncome < 25000 ? 8 : 6;
    }
  } else if (lead.annualIncome) {
    // Income known but not household size
    incomeFit = lead.annualIncome >= 20000 && lead.annualIncome <= 80000 ? 6 : 3;
  }

  // ── 7. Data completeness (0-7) ───────────────────────────────────────────
  let completeness = 0;
  if (lead.dateOfBirth)   completeness += 2;
  if (lead.annualIncome)  completeness += 2;
  if (lead.householdSize) completeness += 1;
  if (lead.source && lead.source !== "web_form") completeness += 1; // quality source signal
  if (!lead.hasMedicaidMedicareVA) completeness += 1; // not already covered = better prospect

  const total = Math.min(100, tcpa + interest + ageBracket + recency + stateDemand + incomeFit + completeness);

  return { tcpa, interest, ageBracket, recency, stateDemand, incomeFit, completeness, total };
}

export function scoreLabel(score: number): "PRIME" | "GOOD" | "FAIR" | "LOW" {
  if (score >= 80) return "PRIME";
  if (score >= 60) return "GOOD";
  if (score >= 40) return "FAIR";
  return "LOW";
}

export function scoreColor(score: number): string {
  if (score >= 80) return "#00d084";
  if (score >= 60) return "#fbbf24";
  if (score >= 40) return "#f97316";
  return "#ff4d4d";
}
