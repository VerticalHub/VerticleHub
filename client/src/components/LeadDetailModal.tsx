import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { X, Phone, Mail, MapPin, Calendar, Shield, FileText, User, Zap, Save, ExternalLink } from "lucide-react";
import ScoreBadge from "./ScoreBadge";

type ModalTab = "overview" | "score" | "notes";

interface LeadDetailModalProps {
  leadId: number;
  listing?: any;
  purchase?: any;
  isOwned: boolean;
  onClose: () => void;
}

function mask(val: string | undefined | null, keep = 1): string {
  if (!val) return "—";
  return val.slice(0, keep) + "***";
}

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  return (
    <div className="w-full h-1.5 bg-[#0a1120] rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-700"
        style={{ width: `${Math.round((value / max) * 100)}%`, background: color }} />
    </div>
  );
}

const HIGH_DEMAND = new Set(["FL","CA","NY","TX","AZ","GA","NJ","IL","PA","OH","NC","TN"]);
const MED_DEMAND  = new Set(["WA","CO","VA","MA","MI","MN","MD","OR","WI","IN","MO","AL"]);
const FPL_BASE = 14580, FPL_EACH = 5140;

function computeBreakdown(lead: any) {
  const tcpaV = lead.tcpaConsent ? 25 : 0;
  let iV = 0;
  if (lead.interestedInMedicare)     iV += 13;
  if (lead.interestedInFinalExpense) iV += 10;
  if (lead.interestedInACA)          iV += 8;
  const multi = [lead.interestedInMedicare, lead.interestedInFinalExpense, lead.interestedInACA].filter(Boolean).length;
  if (multi >= 2) iV += 3;
  iV = Math.min(20, iV);
  let aV = 5;
  let ageYrs = 0;
  if (lead.dateOfBirth) {
    ageYrs = Math.floor((Date.now() - new Date(lead.dateOfBirth).getTime()) / (365.25 * 24 * 3600 * 1000));
    if (lead.interestedInMedicare)      aV = ageYrs >= 65 ? 15 : ageYrs >= 63 ? 12 : ageYrs >= 60 ? 9 : ageYrs >= 55 ? 5 : 2;
    else if (lead.interestedInFinalExpense) aV = ageYrs >= 50 && ageYrs <= 80 ? 15 : ageYrs >= 40 ? 10 : 4;
    else if (lead.interestedInACA)      aV = ageYrs >= 26 && ageYrs <= 54 ? 15 : ageYrs >= 18 && ageYrs <= 64 ? 10 : 3;
    else                                aV = ageYrs >= 30 && ageYrs <= 65 ? 8 : 4;
  }
  let rV = 8;
  if (lead.createdAt) {
    const hrs = (Date.now() - new Date(lead.createdAt).getTime()) / 3_600_000;
    rV = hrs <= 6 ? 15 : hrs <= 24 ? 13 : hrs <= 72 ? 10 : hrs <= 168 ? 8 : hrs <= 720 ? 5 : hrs <= 2160 ? 2 : 0;
  }
  const st = (lead.state || "").toUpperCase();
  const sdV = HIGH_DEMAND.has(st) ? 10 : MED_DEMAND.has(st) ? 6 : 3;
  let ifV = 4;
  if (lead.annualIncome && lead.householdSize) {
    const fpl = FPL_BASE + (Math.max(1, lead.householdSize) - 1) * FPL_EACH;
    const pct = (lead.annualIncome / fpl) * 100;
    if (lead.interestedInACA) ifV = pct >= 100 && pct <= 250 ? 8 : pct <= 400 ? 6 : pct <= 600 ? 3 : 1;
    else if (lead.interestedInFinalExpense) ifV = lead.annualIncome >= 18000 && lead.annualIncome <= 90000 ? 8 : 3;
    else ifV = lead.annualIncome < 25000 ? 8 : 6;
  } else if (lead.annualIncome) {
    ifV = lead.annualIncome >= 20000 && lead.annualIncome <= 80000 ? 6 : 3;
  }
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
  return {
    total,
    factors: [
      { label: "TCPA Consent",   value: tcpaV, max: 25, desc: lead.tcpaConsent ? "Consented ✓" : "No consent" },
      { label: "Interest Type",  value: iV,    max: 20, desc: interests.join(" + ") || "None selected" },
      { label: "Age Fit",        value: aV,    max: 15, desc: lead.dateOfBirth ? `Age ${ageYrs}` : "No DOB on file" },
      { label: "Lead Recency",   value: rV,    max: 15, desc: lead.createdAt ? `Captured ${new Date(lead.createdAt).toLocaleDateString()}` : "Unknown" },
      { label: "State Demand",   value: sdV,   max: 10, desc: HIGH_DEMAND.has(st) ? `${st} — high demand` : MED_DEMAND.has(st) ? `${st} — medium` : `${st} — standard` },
      { label: "Income Bracket", value: ifV,   max: 8,  desc: lead.annualIncome ? `$${Number(lead.annualIncome).toLocaleString()}/yr` : "Not provided" },
      { label: "Data Complete",  value: cV,    max: 7,  desc: `${cV}/7 data points filled` },
    ],
  };
}

export default function LeadDetailModal({ leadId, listing, purchase, isOwned, onClose }: LeadDetailModalProps) {
  const [tab, setTab]   = useState<ModalTab>("overview");
  const [notes, setNotes] = useState("");
  const [notesDirty, setNotesDirty] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: leadResp, isLoading } = useQuery<any>({
    queryKey: ["/api/leads", leadId],
    queryFn: () => fetch(`/api/leads/${leadId}`).then(r => r.json()),
    enabled: !!leadId,
    onSuccess: (d: any) => { if (d?.data?.notes) setNotes(d.data.notes); },
  } as any);

  const lead: any = leadResp?.data;
  const bd = lead ? computeBreakdown(lead) : null;
  const aiScore = listing?.leadData?.leadScore ?? lead?.leadScore ?? 0;

  const notesMutation = useMutation({
    mutationFn: (n: string) => apiRequest("PATCH", `/api/leads/${leadId}`, { notes: n }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads", leadId] });
      setNotesDirty(false);
      toast({ title: "Notes saved", description: "Contact notes updated successfully." });
    },
    onError: () => toast({ title: "Save failed", variant: "destructive" }),
  });

  const tierColor = (score: number) =>
    score >= 80 ? "#00d084" : score >= 60 ? "#fbbf24" : score >= 40 ? "#f97316" : "#ff4d4d";
  const tierLabel = (score: number) =>
    score >= 80 ? "PRIME" : score >= 60 ? "GOOD" : score >= 40 ? "FAIR" : "LOW";

  const COLORS: Record<string, string> = { healthcare: "#38bdf8", medicare: "#a78bfa", insurance: "#fbbf24", final_expense: "#00d084" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm fade-in" onClick={onClose}>
      <div className="bg-[#0d1526] border border-[#1e2d4a] rounded-sm w-full max-w-2xl mx-4 shadow-2xl max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}>

        {/* ── HEADER ─────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-[#1e2d4a] bg-[#091220] flex-shrink-0">
          <div className="flex items-center gap-3">
            {listing && (
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: COLORS[listing.industry] || "#4a6080" }} />
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-mono font-bold text-[#c8daf0] tracking-wide">
                  {isOwned && lead ? `${lead.firstName} ${lead.lastName}` : `LEAD #${leadId}`}
                </span>
                {isOwned && (
                  <span className="text-[8px] font-mono text-[#00d084] border border-[#00d08440] bg-[#00d08415] px-1.5 py-0.5 rounded-sm">OWNED</span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                {listing && <span className="text-[9px] font-mono text-[#4a6080]">{listing.industry?.toUpperCase()} · {listing.geography}</span>}
                {listing?.price && <span className="text-[9px] font-mono text-[#00d084]">${listing.price}</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {bd && <ScoreBadge score={aiScore} leadData={listing?.leadData ?? lead} size="lg" />}
            <button onClick={onClose} className="text-[#2a4060] hover:text-[#ff4d4d] transition-colors ml-2">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── TABS ───────────────────────────────────────────────────────── */}
        <div className="flex border-b border-[#1e2d4a] flex-shrink-0 bg-[#091220]">
          {([
            { id: "overview", label: "OVERVIEW",   icon: User    },
            { id: "score",    label: "AI SCORE",   icon: Zap     },
            { id: "notes",    label: "NOTES",      icon: FileText },
          ] as { id: ModalTab; label: string; icon: any }[]).map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-5 py-2.5 text-[9px] font-mono tracking-widest border-b-2 transition-all -mb-px ${
                tab === t.id ? "text-[#38bdf8] border-[#38bdf8]" : "text-[#4a6080] border-transparent hover:text-[#94b4d4]"
              }`}>
              <t.icon className="w-3 h-3" />
              {t.label}
              {t.id === "notes" && notesDirty && <span className="w-1.5 h-1.5 bg-[#fbbf24] rounded-full" />}
            </button>
          ))}
        </div>

        {/* ── BODY ───────────────────────────────────────────────────────── */}
        <div className="overflow-y-auto flex-1 p-5">

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-4 shimmer rounded" style={{ width: `${60 + Math.random() * 40}%` }} />
              ))}
            </div>
          ) : !lead ? (
            <p className="text-[11px] font-mono text-[#ff4d4d]">Failed to load lead data.</p>
          ) : (

            <>
              {/* ── OVERVIEW TAB ─────────────────────────────────────────── */}
              {tab === "overview" && (
                <div className="space-y-5">
                  {/* Contact info */}
                  <div>
                    <p className="text-[9px] font-mono tracking-widest text-[#3a5070] mb-3">CONTACT INFORMATION</p>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { icon: User,    label: "FULL NAME",   value: isOwned ? `${lead.firstName} ${lead.lastName}` : `${mask(lead.firstName)} ${mask(lead.lastName)}` },
                        { icon: Phone,   label: "PHONE",       value: isOwned ? lead.phoneNumber : (lead.phoneNumber ? `(***) ***-${String(lead.phoneNumber).slice(-4)}` : "—") },
                        { icon: Mail,    label: "EMAIL",       value: isOwned ? lead.email : (lead.email ? `${mask(lead.email, 2)}***@***.com` : "—") },
                        { icon: MapPin,  label: "STATE / ZIP", value: isOwned ? `${lead.state} ${lead.zipCode ?? ""}` : `${lead.state ?? "—"} *****` },
                      ].map(f => (
                        <div key={f.label} className="flex items-start gap-2 p-3 bg-[#060e1c] border border-[#1e2d4a] rounded-sm">
                          <f.icon className="w-3.5 h-3.5 text-[#2a4060] mt-0.5 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[8px] font-mono text-[#3a5070] tracking-widest">{f.label}</p>
                            <p className={`text-[11px] font-mono mt-0.5 truncate ${isOwned ? "text-[#c8daf0]" : "text-[#4a6080] select-none"}`}>{f.value}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    {!isOwned && (
                      <p className="mt-2 text-[9px] font-mono text-[#2a4060]">Purchase this lead to reveal full contact information.</p>
                    )}
                  </div>

                  {/* Demographics */}
                  <div>
                    <p className="text-[9px] font-mono tracking-widest text-[#3a5070] mb-3">DEMOGRAPHICS</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: "DATE OF BIRTH", value: lead.dateOfBirth ?? "—" },
                        { label: "AGE",           value: lead.dateOfBirth ? `${Math.floor((Date.now() - new Date(lead.dateOfBirth).getTime()) / (365.25*86400000))} yrs` : "—" },
                        { label: "ANNUAL INCOME", value: lead.annualIncome ? `$${Number(lead.annualIncome).toLocaleString()}` : "—" },
                        { label: "HOUSEHOLD",     value: lead.householdSize ? `${lead.householdSize} people` : "—" },
                      ].map(f => (
                        <div key={f.label} className="p-3 bg-[#060e1c] border border-[#1e2d4a] rounded-sm">
                          <p className="text-[8px] font-mono text-[#3a5070] tracking-widest">{f.label}</p>
                          <p className="text-[12px] font-mono font-bold text-[#94b4d4] mt-1 num">{f.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Interests & compliance */}
                  <div>
                    <p className="text-[9px] font-mono tracking-widest text-[#3a5070] mb-3">INTERESTS & COMPLIANCE</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        { label: "Medicare",       active: !!lead.interestedInMedicare,     color: "#a78bfa" },
                        { label: "ACA / Health",   active: !!lead.interestedInACA,          color: "#38bdf8" },
                        { label: "Final Expense",  active: !!lead.interestedInFinalExpense, color: "#00d084" },
                        { label: "TCPA Consent",   active: !!lead.tcpaConsent,              color: "#00d084" },
                        { label: "DNC Registry",   active: !!lead.dnc,                      color: "#ff4d4d" },
                        { label: "Medicaid / VA",  active: !!lead.hasMedicaidMedicareVA,    color: "#fbbf24" },
                      ].map(f => (
                        <div key={f.label} className="flex items-center gap-2 p-2.5 bg-[#060e1c] border border-[#1e2d4a] rounded-sm">
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: f.active ? f.color : "#2a4060" }} />
                          <span className={`text-[10px] font-mono ${f.active ? "text-[#94b4d4]" : "text-[#3a5070]"}`}>{f.label}</span>
                          <span className="ml-auto text-[9px] font-mono" style={{ color: f.active ? f.color : "#3a5070" }}>{f.active ? "YES" : "NO"}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Purchase info */}
                  {purchase && (
                    <div>
                      <p className="text-[9px] font-mono tracking-widest text-[#3a5070] mb-3">PURCHASE DETAILS</p>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { label: "PRICE PAID",    value: `$${purchase.pricePaid}` },
                          { label: "QUALITY AT BUY",value: purchase.qualityAtPurchase },
                          { label: "DATE ACQUIRED", value: purchase.purchaseDate ? new Date(purchase.purchaseDate).toLocaleDateString() : "—" },
                        ].map(f => (
                          <div key={f.label} className="p-3 bg-[#060e1c] border border-[#1e2d4a] rounded-sm">
                            <p className="text-[8px] font-mono text-[#3a5070] tracking-widest">{f.label}</p>
                            <p className="text-[12px] font-mono font-bold text-[#00d084] mt-1 num">{f.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Meta */}
                  <div className="flex flex-wrap gap-3 text-[9px] font-mono text-[#2a4060]">
                    <span>SOURCE: {(lead.source || "web_form").toUpperCase()}</span>
                    <span>STATUS: {(lead.status || "new").toUpperCase()}</span>
                    <span>CAPTURED: {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : "—"}</span>
                    <span>LEAD ID: #{leadId}</span>
                  </div>
                </div>
              )}

              {/* ── SCORE TAB ──────────────────────────────────────────────── */}
              {tab === "score" && bd && (
                <div className="space-y-4">
                  {/* Score hero */}
                  <div className="flex items-center gap-4 p-4 bg-[#060e1c] border border-[#1e2d4a] rounded-sm">
                    <div className="text-[52px] font-mono font-bold num leading-none" style={{ color: tierColor(bd.total) }}>
                      {bd.total}
                    </div>
                    <div>
                      <div className="text-[14px] font-mono font-bold tracking-widest" style={{ color: tierColor(bd.total) }}>
                        {tierLabel(bd.total)}
                      </div>
                      <div className="text-[9px] font-mono text-[#4a6080] mt-1">AI LEAD SCORE — 7 FACTOR ANALYSIS</div>
                      <div className="mt-2 w-48 h-2 bg-[#0a1120] rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${bd.total}%`, background: tierColor(bd.total) }} />
                      </div>
                    </div>
                  </div>

                  {/* Factor breakdown */}
                  <div className="space-y-3">
                    {bd.factors.map(f => {
                      const pct = f.value / f.max;
                      const fc = pct >= 0.8 ? "#00d084" : pct >= 0.5 ? "#fbbf24" : "#ff4d4d";
                      return (
                        <div key={f.label} className="p-3 bg-[#060e1c] border border-[#1e2d4a] rounded-sm">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-mono text-[#94b4d4]">{f.label}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-mono text-[#4a6080]">{f.desc}</span>
                              <span className="text-[11px] font-mono font-bold num" style={{ color: fc }}>{f.value}</span>
                              <span className="text-[9px] font-mono text-[#2a4060]">/ {f.max}</span>
                            </div>
                          </div>
                          <Bar value={f.value} max={f.max} color={fc} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── NOTES TAB ──────────────────────────────────────────────── */}
              {tab === "notes" && (
                <div className="space-y-4">
                  <div>
                    <p className="text-[9px] font-mono tracking-widest text-[#3a5070] mb-1.5">CONTACT NOTES</p>
                    <p className="text-[9px] font-mono text-[#2a4060] mb-3">Log call outcomes, follow-up details, or any relevant notes about this lead.</p>
                    <textarea
                      value={notes}
                      onChange={e => { setNotes(e.target.value); setNotesDirty(true); }}
                      placeholder="Add contact notes here… e.g. 'Left voicemail 5/3. Interested in Medicare Advantage. Call back Thursday 2pm.'"
                      rows={10}
                      className="w-full bg-[#060e1c] border border-[#1e2d4a] focus:border-[#2563eb] text-[#94b4d4] text-[11px] font-mono px-4 py-3 rounded-sm resize-none focus:outline-none placeholder-[#2a4060] transition-colors"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono text-[#2a4060]">{notes.length} characters</span>
                    <button
                      onClick={() => notesMutation.mutate(notes)}
                      disabled={notesMutation.isPending || !notesDirty}
                      className={`flex items-center gap-1.5 px-4 py-2 text-[10px] font-mono font-bold rounded-sm border transition-colors ${
                        notesDirty ? "bg-[#0d1e3a] border-[#2563eb] text-[#38bdf8] hover:bg-[#1a3a6b]" : "bg-[#060e1c] border-[#1e2d4a] text-[#2a4060] cursor-not-allowed"
                      }`}>
                      {notesMutation.isPending
                        ? <><div className="w-3 h-3 border border-[#38bdf8] border-t-transparent rounded-full animate-spin" /> SAVING...</>
                        : <><Save className="w-3.5 h-3.5" /> SAVE NOTES</>
                      }
                    </button>
                  </div>
                  {lead.notes && (
                    <div className="p-3 bg-[#060e1c] border border-[#1e3a1a] rounded-sm">
                      <p className="text-[9px] font-mono text-[#3a5070] tracking-widest mb-1">LAST SAVED</p>
                      <p className="text-[10px] font-mono text-[#4a6080]">{lead.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
