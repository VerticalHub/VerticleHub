import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest, apiErrorMessage } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import {
  Upload, CheckCircle2, Clock, XCircle, DollarSign, ChevronDown,
  User, Phone, Mail, MapPin, Calendar, Heart, Briefcase, FileText, AlertTriangle,
} from "lucide-react";

const STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"];
const INDUSTRIES = ["medicare","healthcare","insurance","final_expense","aca","life_insurance"];

const empty = {
  firstName: "", lastName: "", email: "", phoneNumber: "", zipCode: "", state: "",
  dateOfBirth: "", interestedInACA: false, interestedInMedicare: false,
  interestedInFinalExpense: false, tcpaConsent: false,
  annualIncome: "", householdSize: "", askingPrice: "", industry: "medicare", sellerNotes: "",
};

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div>
      <label className="block text-[9px] font-mono tracking-widest text-[#7a9abf] mb-1.5">
        {label}{required && <span className="text-[#ff4d4d] ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = "w-full bg-[#060e1c] border border-[#1e2d4a] focus:border-[#2563eb] text-[#c8daf0] text-[11px] font-mono px-3 py-2 rounded-sm focus:outline-none placeholder-[#4a7090] transition-colors";
const selectCls = `${inputCls} appearance-none cursor-pointer`;

function statusIcon(s: string) {
  if (s === "approved") return <CheckCircle2 className="w-3.5 h-3.5 text-[#00d084]" />;
  if (s === "rejected") return <XCircle className="w-3.5 h-3.5 text-[#ff4d4d]" />;
  return <Clock className="w-3.5 h-3.5 text-[#fbbf24]" />;
}
function statusColor(s: string) {
  if (s === "approved") return "text-[#00d084]";
  if (s === "rejected") return "text-[#ff4d4d]";
  return "text-[#fbbf24]";
}

export default function SellLeads() {
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: mySubsResp } = useQuery<any>({
    queryKey: ["/api/submissions/mine"],
    queryFn: () => fetch("/api/submissions").then(r => r.json()),
  });
  const mySubs: any[] = mySubsResp?.data || [];

  const submitMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/submissions", data),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/submissions/mine"] });
      queryClient.invalidateQueries({ queryKey: ["/api/listings"] });
      setSubmitted(true);
      setForm(empty);
      const score = res?.data?.leadScore;
      const tier = score >= 80 ? "PRIME" : score >= 60 ? "GOOD" : score >= 40 ? "FAIR" : score != null ? "LOW" : null;
      toast({ title: "Lead listed instantly!", description: tier ? `Your lead scored ${score}/100 (${tier}) and is now live on the marketplace.` : "Your lead is now live on the marketplace.", variant: "success" as any });
    },
    onError: (err: any) => toast({ title: "Submission failed", description: apiErrorMessage(err, "Please check your details and try again."), variant: "destructive" }),
  });

  const set = (k: string, v: any) => {
    setForm(p => ({ ...p, [k]: v }));
    if (errors[k]) setErrors(p => { const n = { ...p }; delete n[k]; return n; });
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.firstName.trim())    e.firstName    = "Required";
    if (!form.lastName.trim())     e.lastName     = "Required";
    if (!form.email.includes("@")) e.email        = "Valid email required";
    if (form.phoneNumber.replace(/\D/g,"").length < 10) e.phoneNumber = "10-digit phone required";
    if (form.zipCode.length !== 5) e.zipCode      = "5-digit zip required";
    if (!form.state)               e.state        = "Required";
    if (!form.askingPrice || parseFloat(form.askingPrice) < 1) e.askingPrice = "Enter a price ≥ $1";
    if (!form.interestedInACA && !form.interestedInMedicare && !form.interestedInFinalExpense)
      e.interests = "Select at least one interest";
    if (!form.tcpaConsent) e.tcpaConsent = "TCPA consent is required to list a lead";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    submitMutation.mutate({
      ...form,
      annualIncome:  form.annualIncome  ? parseInt(form.annualIncome)  : undefined,
      householdSize: form.householdSize ? parseInt(form.householdSize) : undefined,
      askingPrice: parseFloat(form.askingPrice).toFixed(2),
    });
  };

  return (
    <div className="min-h-screen bg-[#070d1a] text-[#c8daf0]">
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">

        {/* Page header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Upload className="w-4 h-4 text-[#00d084]" />
              <h1 className="text-[16px] font-mono font-bold text-[#c8daf0] tracking-wide">SELL LEADS</h1>
            </div>
            <p className="text-[10px] font-mono text-[#7a9abf]">Submit a lead and it goes live on the marketplace instantly — AI-scored and priced.</p>
          </div>
          <div className="text-right">
            <div className="text-[22px] font-mono font-bold text-[#00d084] num">{mySubs.filter((s:any) => s.status==="approved").length}</div>
            <div className="text-[9px] font-mono text-[#7a9abf]">LEADS LISTED</div>
          </div>
        </div>

        {/* Success banner */}
        {submitted && (
          <div className="flex items-center gap-3 p-4 bg-[#001a0d] border border-[#00d08440] rounded-sm fade-in">
            <CheckCircle2 className="w-5 h-5 text-[#00d084] flex-shrink-0" />
            <div>
              <p className="text-[12px] font-mono font-bold text-[#00d084]">LEAD NOW LIVE</p>
              <p className="text-[10px] font-mono text-[#94b4d4] mt-0.5">Your lead has been AI-scored and is active on the marketplace. Buyers can purchase it immediately.</p>
            </div>
            <button onClick={() => setSubmitted(false)} className="ml-auto text-[#7a9abf] hover:text-[#00d084] text-[10px] font-mono">LIST ANOTHER</button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── FORM ─────────────────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Lead contact */}
            <div className="bg-[#0d1526] border border-[#1e2d4a] rounded-sm p-5">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#1e2d4a]">
                <User className="w-3.5 h-3.5 text-[#38bdf8]" />
                <span className="text-[10px] font-mono tracking-widest text-[#7a9abf]">LEAD CONTACT INFORMATION</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="FIRST NAME" required>
                  <input value={form.firstName} onChange={e => set("firstName", e.target.value)}
                    placeholder="Jane" className={inputCls} />
                  {errors.firstName && <p className="text-[9px] font-mono text-[#ff4d4d] mt-1">{errors.firstName}</p>}
                </Field>
                <Field label="LAST NAME" required>
                  <input value={form.lastName} onChange={e => set("lastName", e.target.value)}
                    placeholder="Smith" className={inputCls} />
                  {errors.lastName && <p className="text-[9px] font-mono text-[#ff4d4d] mt-1">{errors.lastName}</p>}
                </Field>
                <Field label="EMAIL ADDRESS" required>
                  <input type="email" value={form.email} onChange={e => set("email", e.target.value)}
                    placeholder="jane@example.com" className={inputCls} />
                  {errors.email && <p className="text-[9px] font-mono text-[#ff4d4d] mt-1">{errors.email}</p>}
                </Field>
                <Field label="PHONE NUMBER" required>
                  <input value={form.phoneNumber} onChange={e => set("phoneNumber", e.target.value)}
                    placeholder="(555) 000-0000" className={inputCls} />
                  {errors.phoneNumber && <p className="text-[9px] font-mono text-[#ff4d4d] mt-1">{errors.phoneNumber}</p>}
                </Field>
                <Field label="STATE" required>
                  <div className="relative">
                    <select value={form.state} onChange={e => set("state", e.target.value)} className={selectCls}>
                      <option value="">Select state…</option>
                      {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#7a9abf] pointer-events-none" />
                  </div>
                  {errors.state && <p className="text-[9px] font-mono text-[#ff4d4d] mt-1">{errors.state}</p>}
                </Field>
                <Field label="ZIP CODE" required>
                  <input value={form.zipCode} onChange={e => set("zipCode", e.target.value)}
                    placeholder="33101" maxLength={5} className={inputCls} />
                  {errors.zipCode && <p className="text-[9px] font-mono text-[#ff4d4d] mt-1">{errors.zipCode}</p>}
                </Field>
                <Field label="DATE OF BIRTH">
                  <input type="date" value={form.dateOfBirth} onChange={e => set("dateOfBirth", e.target.value)}
                    className={inputCls} />
                </Field>
              </div>
            </div>

            {/* Interests */}
            <div className="bg-[#0d1526] border border-[#1e2d4a] rounded-sm p-5">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#1e2d4a]">
                <Heart className="w-3.5 h-3.5 text-[#a78bfa]" />
                <span className="text-[10px] font-mono tracking-widest text-[#7a9abf]">LEAD INTERESTS & COMPLIANCE</span>
              </div>
              <div className="space-y-3">
                <p className="text-[9px] font-mono text-[#7a9abf]">SELECT ALL THAT APPLY <span className="text-[#ff4d4d]">*</span></p>
                {[
                  { key: "interestedInMedicare",     label: "Medicare",        color: "#a78bfa", desc: "Age 65+ or disability" },
                  { key: "interestedInACA",           label: "ACA / Obamacare", color: "#38bdf8", desc: "Marketplace health plans" },
                  { key: "interestedInFinalExpense",  label: "Final Expense",   color: "#00d084", desc: "Life / burial insurance" },
                ].map(opt => (
                  <label key={opt.key} className={`flex items-center gap-3 p-3 border rounded-sm cursor-pointer transition-all ${
                    (form as any)[opt.key] ? "border-[#2563eb] bg-[#0d1e3a]" : "border-[#1e2d4a] hover:border-[#2a3a5a]"
                  }`}>
                    <input type="checkbox" checked={(form as any)[opt.key]}
                      onChange={e => set(opt.key, e.target.checked)} className="sr-only" />
                    <div className={`w-4 h-4 border-2 rounded-sm flex items-center justify-center flex-shrink-0 transition-colors ${
                      (form as any)[opt.key] ? "border-[#2563eb] bg-[#2563eb]" : "border-[#2a4060]"
                    }`}>
                      {(form as any)[opt.key] && <div className="w-2 h-2 bg-white rounded-sm" />}
                    </div>
                    <div>
                      <span className="text-[11px] font-mono text-[#c8daf0]">{opt.label}</span>
                      <span className="text-[9px] font-mono text-[#7a9abf] ml-2">{opt.desc}</span>
                    </div>
                    <div className="ml-auto w-2 h-2 rounded-full" style={{ background: (form as any)[opt.key] ? opt.color : "#2a4060" }} />
                  </label>
                ))}
                {errors.interests && <p className="text-[9px] font-mono text-[#ff4d4d]">{errors.interests}</p>}

                <label className="flex items-center gap-3 p-3 border border-[#1e2d4a] hover:border-[#2a3a5a] rounded-sm cursor-pointer mt-1">
                  <input type="checkbox" checked={form.tcpaConsent}
                    onChange={e => set("tcpaConsent", e.target.checked)} className="sr-only" />
                  <div className={`w-4 h-4 border-2 rounded-sm flex items-center justify-center flex-shrink-0 transition-colors ${
                    form.tcpaConsent ? "border-[#00d084] bg-[#00d084]" : "border-[#2a4060]"
                  }`}>
                    {form.tcpaConsent && <div className="w-2 h-2 bg-white rounded-sm" />}
                  </div>
                  <div>
                    <span className="text-[11px] font-mono text-[#c8daf0]">TCPA Consent Obtained</span>
                    <span className="text-[9px] font-mono text-[#7a9abf] ml-2">Seller certifies written consent was obtained and documented</span>
                  </div>
                </label>
                {errors.tcpaConsent && <p className="text-[9px] font-mono text-[#ff4d4d]">{errors.tcpaConsent}</p>}
              </div>
            </div>

            {/* Income */}
            <div className="bg-[#0d1526] border border-[#1e2d4a] rounded-sm p-5">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#1e2d4a]">
                <DollarSign className="w-3.5 h-3.5 text-[#fbbf24]" />
                <span className="text-[10px] font-mono tracking-widest text-[#7a9abf]">INCOME & HOUSEHOLD (OPTIONAL)</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="ANNUAL INCOME ($)">
                  <input type="number" value={form.annualIncome} onChange={e => set("annualIncome", e.target.value)}
                    placeholder="45000" className={inputCls} />
                </Field>
                <Field label="HOUSEHOLD SIZE">
                  <input type="number" value={form.householdSize} onChange={e => set("householdSize", e.target.value)}
                    placeholder="2" min={1} max={10} className={inputCls} />
                </Field>
              </div>
            </div>

            {/* Listing details */}
            <div className="bg-[#0d1526] border border-[#1e2d4a] rounded-sm p-5">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#1e2d4a]">
                <Briefcase className="w-3.5 h-3.5 text-[#00d084]" />
                <span className="text-[10px] font-mono tracking-widest text-[#7a9abf]">MARKETPLACE LISTING DETAILS</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="INDUSTRY / LEAD TYPE" required>
                  <div className="relative">
                    <select value={form.industry} onChange={e => set("industry", e.target.value)} className={selectCls}>
                      {INDUSTRIES.map(i => <option key={i} value={i}>{i.replace("_", " ").toUpperCase()}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#7a9abf] pointer-events-none" />
                  </div>
                </Field>
                <Field label="ASKING PRICE ($)" required>
                  <input type="number" value={form.askingPrice} onChange={e => set("askingPrice", e.target.value)}
                    placeholder="35.00" min={1} step={0.01} className={inputCls} />
                  {errors.askingPrice && <p className="text-[9px] font-mono text-[#ff4d4d] mt-1">{errors.askingPrice}</p>}
                </Field>
              </div>
              <div className="mt-4">
                <Field label="SELLER NOTES (OPTIONAL)">
                  <textarea value={form.sellerNotes} onChange={e => set("sellerNotes", e.target.value)}
                    placeholder="Any additional context about this lead that might help buyers…"
                    rows={3} className={`${inputCls} resize-none`} />
                </Field>
              </div>
            </div>

            {/* Submit */}
            <button onClick={handleSubmit} disabled={submitMutation.isPending}
              className="w-full flex items-center justify-center gap-2 py-3 bg-[#0d1e3a] border border-[#2563eb] text-[#38bdf8] text-[11px] font-mono font-bold rounded-sm hover:bg-[#1a3a6b] transition-colors disabled:opacity-50">
              {submitMutation.isPending
                ? <><div className="w-4 h-4 border border-[#38bdf8] border-t-transparent rounded-full animate-spin" /> LISTING...</>
                : <><Upload className="w-4 h-4" /> LIST LEAD INSTANTLY</>
              }
            </button>
          </div>

          {/* ── SIDEBAR ──────────────────────────────────────────────────── */}
          <div className="space-y-4">
            {/* How it works */}
            <div className="bg-[#0d1526] border border-[#1e2d4a] rounded-sm p-4">
              <p className="text-[10px] font-mono tracking-widest text-[#7a9abf] mb-4">HOW IT WORKS</p>
              <div className="space-y-4">
                {[
                  { n: "1", label: "SUBMIT",   desc: "Fill out the lead form with all available contact details" },
                  { n: "2", label: "AI SCORE", desc: "Lead is instantly scored 0–100 across 7 quality factors" },
                  { n: "3", label: "LIVE NOW", desc: "Your listing goes active on the marketplace immediately" },
                  { n: "4", label: "EARNINGS", desc: "Credits are deposited the moment a buyer purchases" },
                ].map(step => (
                  <div key={step.n} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#0a1628] border border-[#2563eb] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[9px] font-mono text-[#38bdf8] font-bold">{step.n}</span>
                    </div>
                    <div>
                      <p className="text-[10px] font-mono text-[#94b4d4]">{step.label}</p>
                      <p className="text-[9px] font-mono text-[#7a9abf] mt-0.5">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing tips */}
            <div className="bg-[#0d1526] border border-[#1e2d4a] rounded-sm p-4">
              <p className="text-[10px] font-mono tracking-widest text-[#7a9abf] mb-3">PRICING GUIDE</p>
              <div className="space-y-2">
                {[
                  { label: "Medicare (65+, TCPA)",     price: "$45–$65" },
                  { label: "Final Expense",             price: "$30–$50" },
                  { label: "ACA / Obamacare",           price: "$20–$40" },
                  { label: "TCPA Consent bonus",        price: "+$10–$20" },
                  { label: "High-demand state (FL/CA)", price: "+$5–$15" },
                ].map(r => (
                  <div key={r.label} className="flex items-center justify-between">
                    <span className="text-[9px] font-mono text-[#94b4d4]">{r.label}</span>
                    <span className="text-[10px] font-mono text-[#00d084]">{r.price}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* TCPA tip */}
            <div className="flex items-start gap-2 p-3 bg-[#0d1e0d] border border-[#00d08430] rounded-sm">
              <AlertTriangle className="w-3.5 h-3.5 text-[#00d084] flex-shrink-0 mt-0.5" />
              <p className="text-[9px] font-mono text-[#4a8060]">
                Only check TCPA consent if you have the signed consent record on file. Misrepresenting consent status may violate federal law.
              </p>
            </div>
          </div>
        </div>

        {/* ── MY SUBMISSIONS TABLE ───────────────────────────────────────── */}
        {mySubs.length > 0 && (
          <div className="bg-[#0d1526] border border-[#1e2d4a] rounded-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-[#1e2d4a] flex items-center justify-between">
              <span className="text-[10px] font-mono tracking-widest text-[#7a9abf]">MY SUBMISSIONS</span>
              <span className="text-[10px] font-mono text-[#7a9abf]">{mySubs.length} total</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#1e2d4a]">
                    {["#","NAME","INDUSTRY","STATE","ASKING","STATUS","SUBMITTED","ADMIN NOTES"].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-[9px] font-mono tracking-widest text-[#7a9abf] whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#0a1120]">
                  {mySubs.map((s: any) => (
                    <tr key={s.id} className="hover:bg-[#0a1628] transition-colors">
                      <td className="px-4 py-3 text-[10px] font-mono text-[#7a9abf] num">#{s.id}</td>
                      <td className="px-4 py-3 text-[11px] font-mono text-[#94b4d4]">{s.firstName} {s.lastName}</td>
                      <td className="px-4 py-3 text-[10px] font-mono text-[#94b4d4]">{s.industry?.toUpperCase()}</td>
                      <td className="px-4 py-3 text-[10px] font-mono text-[#94b4d4]">{s.state}</td>
                      <td className="px-4 py-3 text-[12px] font-mono font-bold text-[#00d084] num">${s.askingPrice}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {statusIcon(s.status)}
                          <span className={`text-[10px] font-mono font-bold ${statusColor(s.status)}`}>{s.status.toUpperCase()}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[9px] font-mono text-[#7a9abf]">
                        {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-4 py-3 text-[9px] font-mono text-[#94b4d4] max-w-[160px] truncate">{s.adminNotes || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
