import { useState, useRef } from "react";

/** Mirror of server/scoring.ts — kept in sync manually */
interface LeadData {
  tcpaConsent?: boolean | null;
  interestedInACA?: boolean | null;
  interestedInMedicare?: boolean | null;
  interestedInFinalExpense?: boolean | null;
  dateOfBirth?: string | null;
  state?: string | null;
  annualIncome?: number | null;
  householdSize?: number | null;
  createdAt?: string | Date | null;
  source?: string | null;
  hasMedicaidMedicareVA?: boolean | null;
}

interface Breakdown {
  tcpa:         { label: string; value: number; max: number; desc: string };
  interest:     { label: string; value: number; max: number; desc: string };
  ageBracket:   { label: string; value: number; max: number; desc: string };
  recency:      { label: string; value: number; max: number; desc: string };
  stateDemand:  { label: string; value: number; max: number; desc: string };
  incomeFit:    { label: string; value: number; max: number; desc: string };
  completeness: { label: string; value: number; max: number; desc: string };
}

const HIGH_DEMAND = new Set(["FL","CA","NY","TX","AZ","GA","NJ","IL","PA","OH","NC","TN"]);
const MED_DEMAND  = new Set(["WA","CO","VA","MA","MI","MN","MD","OR","WI","IN","MO","AL"]);
const FPL_BASE = 14580, FPL_EACH = 5140;

function computeBreakdown(lead: LeadData): { breakdown: Breakdown; total: number } {
  // 1. TCPA
  const tcpaV = lead.tcpaConsent ? 25 : 0;

  // 2. Interest
  let iV = 0;
  if (lead.interestedInMedicare)     iV += 13;
  if (lead.interestedInFinalExpense) iV += 10;
  if (lead.interestedInACA)          iV += 8;
  const multi = [lead.interestedInMedicare, lead.interestedInFinalExpense, lead.interestedInACA].filter(Boolean).length;
  if (multi >= 2) iV += 3;
  iV = Math.min(20, iV);

  // 3. Age bracket
  let aV = 5;
  let ageYrs = 0;
  if (lead.dateOfBirth) {
    ageYrs = Math.floor((Date.now() - new Date(lead.dateOfBirth).getTime()) / (365.25 * 24 * 3600 * 1000));
    if (lead.interestedInMedicare) {
      aV = ageYrs >= 65 ? 15 : ageYrs >= 63 ? 12 : ageYrs >= 60 ? 9 : ageYrs >= 55 ? 5 : 2;
    } else if (lead.interestedInFinalExpense) {
      aV = ageYrs >= 50 && ageYrs <= 80 ? 15 : ageYrs >= 40 ? 10 : 4;
    } else if (lead.interestedInACA) {
      aV = ageYrs >= 26 && ageYrs <= 54 ? 15 : ageYrs >= 18 && ageYrs <= 64 ? 10 : 3;
    } else {
      aV = ageYrs >= 30 && ageYrs <= 65 ? 8 : 4;
    }
  }

  // 4. Recency
  let rV = 8;
  if (lead.createdAt) {
    const hrs = (Date.now() - new Date(lead.createdAt).getTime()) / 3_600_000;
    rV = hrs <= 6 ? 15 : hrs <= 24 ? 13 : hrs <= 72 ? 10 : hrs <= 168 ? 8 : hrs <= 720 ? 5 : hrs <= 2160 ? 2 : 0;
  }

  // 5. State
  const st = lead.state?.toUpperCase() || "";
  const sdV = HIGH_DEMAND.has(st) ? 10 : MED_DEMAND.has(st) ? 6 : 3;

  // 6. Income fit
  let ifV = 4;
  if (lead.annualIncome && lead.householdSize) {
    const fpl = FPL_BASE + (Math.max(1, lead.householdSize) - 1) * FPL_EACH;
    const pct  = (lead.annualIncome / fpl) * 100;
    if (lead.interestedInACA) {
      ifV = pct >= 100 && pct <= 250 ? 8 : pct <= 400 ? 6 : pct <= 600 ? 3 : 1;
    } else if (lead.interestedInFinalExpense) {
      ifV = lead.annualIncome >= 18000 && lead.annualIncome <= 90000 ? 8 : 3;
    } else {
      ifV = lead.annualIncome < 25000 ? 8 : 6;
    }
  } else if (lead.annualIncome) {
    ifV = lead.annualIncome >= 20000 && lead.annualIncome <= 80000 ? 6 : 3;
  }

  // 7. Completeness
  let cV = 0;
  if (lead.dateOfBirth)   cV += 2;
  if (lead.annualIncome)  cV += 2;
  if (lead.householdSize) cV += 1;
  if (lead.source && lead.source !== "web_form") cV += 1;
  if (!lead.hasMedicaidMedicareVA) cV += 1;

  const total = Math.min(100, tcpaV + iV + aV + rV + sdV + ifV + cV);

  const interests: string[] = [];
  if (lead.interestedInMedicare)     interests.push("Medicare");
  if (lead.interestedInFinalExpense) interests.push("Final Expense");
  if (lead.interestedInACA)          interests.push("ACA");

  const breakdown: Breakdown = {
    tcpa:         { label: "TCPA Consent",    value: tcpaV, max: 25, desc: lead.tcpaConsent ? "Consented" : "No consent" },
    interest:     { label: "Interest Type",   value: iV,    max: 20, desc: interests.join(" + ") || "None selected" },
    ageBracket:   { label: "Age Fit",         value: aV,    max: 15, desc: lead.dateOfBirth ? `Age ${ageYrs}` : "No DOB on file" },
    recency:      { label: "Lead Recency",    value: rV,    max: 15, desc: lead.createdAt ? `Captured ${new Date(lead.createdAt).toLocaleDateString()}` : "Unknown" },
    stateDemand:  { label: "State Demand",    value: sdV,   max: 10, desc: HIGH_DEMAND.has(st) ? `${st} — high demand` : MED_DEMAND.has(st) ? `${st} — medium demand` : `${st} — standard` },
    incomeFit:    { label: "Income Bracket",  value: ifV,   max: 8,  desc: lead.annualIncome ? `$${Number(lead.annualIncome).toLocaleString()}/yr` : "Income not provided" },
    completeness: { label: "Data Complete",   value: cV,    max: 7,  desc: `${cV}/7 points` },
  };

  return { breakdown, total };
}

function scoreColor(score: number) {
  if (score >= 80) return "#00d084";
  if (score >= 60) return "#fbbf24";
  if (score >= 40) return "#f97316";
  return "#ff4d4d";
}

function scoreTier(score: number) {
  if (score >= 80) return "PRIME";
  if (score >= 60) return "GOOD";
  if (score >= 40) return "FAIR";
  return "LOW";
}

interface ScoreBadgeProps {
  score: number;
  leadData?: LeadData;
  size?: "sm" | "md" | "lg";
  showBar?: boolean;
}

export default function ScoreBadge({ score, leadData, size = "md", showBar = false }: ScoreBadgeProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const color = scoreColor(score);
  const tier  = scoreTier(score);

  const computed = leadData ? computeBreakdown(leadData) : null;

  const textSize = size === "sm" ? "text-[10px]" : size === "lg" ? "text-[16px]" : "text-[12px]";
  const tierSize = size === "sm" ? "text-[7px]" : size === "lg" ? "text-[10px]" : "text-[8px]";

  return (
    <div className="relative inline-flex" ref={ref}
      onMouseEnter={() => leadData && setOpen(true)}
      onMouseLeave={() => setOpen(false)}>

      {/* Badge */}
      <div className="flex items-center gap-1.5 cursor-default">
        <div className="flex flex-col items-center leading-none">
          <span className={`${textSize} font-mono font-bold num leading-none`} style={{ color }}>
            {score}
          </span>
          <span className={`${tierSize} font-mono tracking-wider`} style={{ color, opacity: 0.75 }}>
            {tier}
          </span>
        </div>

        {showBar && (
          <div className="w-12 h-1.5 bg-[#0a1120] rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all"
              style={{ width: `${score}%`, background: color }} />
          </div>
        )}
      </div>

      {/* Breakdown tooltip */}
      {open && computed && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 bg-[#060e1c] border border-[#1e2d4a] rounded-sm shadow-2xl p-3"
          style={{ boxShadow: `0 0 20px ${color}22` }}>
          {/* Header */}
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[9px] font-mono tracking-widest text-[#3a5070]">AI SCORE BREAKDOWN</span>
            <span className="text-[13px] font-mono font-bold num" style={{ color }}>{computed.total}</span>
          </div>

          {/* Factor rows */}
          <div className="space-y-1.5">
            {Object.values(computed.breakdown).map((f) => (
              <div key={f.label}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[8px] font-mono text-[#4a6080]">{f.label}</span>
                  <span className="text-[8px] font-mono num text-[#94b4d4]">{f.value}/{f.max}</span>
                </div>
                <div className="w-full h-1 bg-[#0a1120] rounded-full overflow-hidden">
                  <div className="h-full rounded-full"
                    style={{
                      width: `${(f.value / f.max) * 100}%`,
                      background: f.value / f.max >= 0.8 ? "#00d084" : f.value / f.max >= 0.5 ? "#fbbf24" : "#ff4d4d"
                    }} />
                </div>
                <p className="text-[7px] font-mono text-[#2a4060] mt-0.5">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0"
            style={{ borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: "5px solid #1e2d4a" }} />
        </div>
      )}
    </div>
  );
}
