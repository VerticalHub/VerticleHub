import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import { Helmet } from "react-helmet";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import {
  Users, TrendingUp, DollarSign, Package, Plus, ChevronUp, ChevronDown,
  Activity, Target, Shield, Zap, RefreshCw, ArrowUpRight, ArrowDownRight,
  Eye, Radio, AlertCircle, BarChart2, Database, Download, Phone, Mail,
  FileText, Clock, CheckCircle2, PhoneCall, ShieldAlert, ShieldCheck
} from "lucide-react";

interface Lead {
  id: number; firstName: string; lastName: string; email: string;
  phoneNumber: string; zipCode: string; state: string;
  dateOfBirth?: string; hasMedicaidMedicareVA?: boolean;
  interestedInACA: boolean; interestedInMedicare: boolean; interestedInFinalExpense: boolean;
  tcpaConsent?: boolean; tcpaConsentSource?: string; dnc?: boolean; agingScore?: number;
  createdAt: string;
}
interface LeadActivity {
  id: number; leadId: number; userId: number; type: string;
  disposition?: string; notes?: string; duration?: number; createdAt: string;
}
interface LeadListing {
  id: number; leadId: number; price: string; qualityScore: number;
  timesResold: number; industry: string; geography: string; isActive: boolean; createdAt: string;
}

const sparkData = [
  [3, 7, 5, 9, 6, 11, 8],
  [8, 6, 10, 7, 12, 9, 14],
  [22, 24, 21, 26, 28, 25, 31],
  [4, 3, 5, 4, 6, 5, 7],
];

const volumeHistory = [
  { date: "Apr 26", leads: 18, revenue: 612, listings: 14 },
  { date: "Apr 27", leads: 24, revenue: 816, listings: 19 },
  { date: "Apr 28", leads: 21, revenue: 714, listings: 17 },
  { date: "Apr 29", leads: 31, revenue: 1054, listings: 26 },
  { date: "Apr 30", leads: 27, revenue: 918, listings: 22 },
  { date: "May 01", leads: 35, revenue: 1190, listings: 29 },
  { date: "May 02", leads: 42, revenue: 1428, listings: 35 },
];

const industryBreakdown = [
  { name: "Healthcare", volume: 142, avgPrice: 28.4, quality: 87 },
  { name: "Medicare", volume: 98, avgPrice: 42.1, quality: 91 },
  { name: "Insurance", volume: 76, avgPrice: 22.6, quality: 79 },
  { name: "Final Exp", volume: 54, avgPrice: 31.8, quality: 83 },
];

// ── Activity Feed (inline CRM panel) ──────────────────────────────────────────
function ActivityFeed({ leadId }: { leadId: number }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [form, setForm] = useState({ type: "call", disposition: "contacted", notes: "", duration: "" });

  const { data: actResp, isLoading } = useQuery<any>({
    queryKey: ["/api/leads", leadId, "activities"],
    queryFn: () => fetch(`/api/leads/${leadId}/activities`).then(r => r.json()),
  });
  const activities: LeadActivity[] = actResp?.data || [];

  const logMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", `/api/leads/${leadId}/activities`, { ...data, userId: 1, leadId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads", leadId, "activities"] });
      setForm({ type: "call", disposition: "contacted", notes: "", duration: "" });
      toast({ title: "ACTIVITY LOGGED" });
    },
  });

  const actIcon = (type: string) => {
    if (type === "call")  return <PhoneCall className="w-3 h-3 text-[#38bdf8]" />;
    if (type === "email") return <Mail       className="w-3 h-3 text-[#a78bfa]" />;
    if (type === "note")  return <FileText   className="w-3 h-3 text-[#fbbf24]" />;
    return <CheckCircle2 className="w-3 h-3 text-[#00d084]" />;
  };
  const dispColor = (d?: string) => ({ converted: "#00d084", contacted: "#38bdf8", callback: "#fbbf24", not_interested: "#ff4d4d", voicemail: "#4a6080" }[d ?? ""] ?? "#4a6080");

  return (
    <div className="border-t border-[#1e2d4a] pt-3">
      <p className="text-[9px] font-mono tracking-widest text-[#2a4060] mb-2">CRM ACTIVITY LOG</p>
      {/* Timeline */}
      {isLoading ? (
        <div className="text-[9px] font-mono text-[#2a4060] mb-2">Loading...</div>
      ) : activities.length === 0 ? (
        <div className="text-[9px] font-mono text-[#1e2d4a] mb-2">No activities logged yet.</div>
      ) : (
        <div className="space-y-1.5 mb-3 max-h-28 overflow-y-auto">
          {activities.map(a => (
            <div key={a.id} className="flex items-start gap-2 text-[10px] font-mono">
              <div className="mt-0.5 flex-shrink-0">{actIcon(a.type)}</div>
              <div className="flex-1 min-w-0">
                <span className="uppercase" style={{ color: dispColor(a.disposition) }}>{a.disposition || a.type}</span>
                {a.notes && <span className="text-[#4a6080] ml-2">— {a.notes}</span>}
              </div>
              <span className="text-[#1e2d4a] flex-shrink-0 text-[9px]">{new Date(a.createdAt).toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
      {/* Log form */}
      <div className="flex flex-wrap gap-2 items-end">
        <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
          className="bg-[#060e1c] border border-[#1e2d4a] text-[#94b4d4] text-[10px] font-mono px-2 py-1 rounded-sm focus:outline-none focus:border-[#2563eb]">
          {["call","email","note","disposition"].map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
        </select>
        <select value={form.disposition} onChange={e => setForm(p => ({ ...p, disposition: e.target.value }))}
          className="bg-[#060e1c] border border-[#1e2d4a] text-[#94b4d4] text-[10px] font-mono px-2 py-1 rounded-sm focus:outline-none focus:border-[#2563eb]">
          {["contacted","voicemail","not_interested","converted","callback"].map(d => <option key={d} value={d}>{d.replace("_"," ").toUpperCase()}</option>)}
        </select>
        <input type="text" placeholder="Notes..." value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
          className="flex-1 min-w-32 bg-[#060e1c] border border-[#1e2d4a] text-[#94b4d4] text-[10px] font-mono px-2 py-1 rounded-sm focus:outline-none focus:border-[#2563eb] placeholder-[#1e2d4a]" />
        <button onClick={() => logMutation.mutate(form)} disabled={logMutation.isPending}
          className="btn-terminal text-[10px] flex items-center gap-1">
          <Plus className="w-3 h-3" /> LOG
        </button>
      </div>
    </div>
  );
}

const MiniSparkline = ({ data, color }: { data: number[]; color: string }) => (
  <div className="h-8 w-20">
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data.map((v, i) => ({ v }))}>
        <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0d1526] border border-[#1e2d4a] rounded-sm p-2 text-[11px] font-mono">
        <p className="text-[#4a6080] mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color }}>{p.name}: {p.value}</p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Admin() {
  const [activeTab, setActiveTab] = useState<"overview" | "leads" | "listings" | "create" | "trends">("overview");
  const [newListing, setNewListing] = useState({ leadId: "", price: "", industry: "", geography: "" });
  const [sortField, setSortField] = useState("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [expandedLeadId, setExpandedLeadId] = useState<number | null>(null);
  const [trendIndustry, setTrendIndustry] = useState("healthcare");
  const [trendGeo, setTrendGeo] = useState("CA");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: leadsResp, isLoading: loadingLeads } = useQuery<any>({
    queryKey: ["/api/leads"],
    refetchInterval: 60000,
  });
  const leads: Lead[] = leadsResp?.data || [];

  const { data: listingsResp, isLoading: loadingListings } = useQuery<any>({
    queryKey: ["/api/lead-listings/all"],
    queryFn: () => fetch("/api/lead-listings/all").then(r => r.json()),
    refetchInterval: 30000,
  });
  const listings: LeadListing[] = listingsResp?.data || [];

  const { data: trendsResp } = useQuery<any>({
    queryKey: ["/api/market-trends"],
  });
  const trends: any[] = trendsResp?.data || [];

  const createListingMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/lead-listings", { ...data, sellerId: 1, qualityScore: 100, timesResold: 0, isActive: true }),
    onSuccess: () => {
      toast({ title: "LISTING CREATED", description: "Lead queued to marketplace." });
      queryClient.invalidateQueries({ queryKey: ["/api/lead-listings"] });
      setNewListing({ leadId: "", price: "", industry: "", geography: "" });
    },
    onError: (e: any) => toast({ title: "ERROR", description: e.message, variant: "destructive" }),
  });

  const recordTrendMutation = useMutation({
    mutationFn: ({ industry, geography }: { industry: string; geography: string }) =>
      apiRequest("POST", "/api/market-trends", {
        industry, geography,
        avgPrice: (20 + Math.random() * 40).toFixed(2),
        volume: Math.floor(Math.random() * 100) + 50,
        growthRate: (Math.random() * 20 - 10).toFixed(2),
      }),
    onSuccess: () => {
      toast({ title: "TREND RECORDED", description: "Market data point saved." });
      queryClient.invalidateQueries({ queryKey: ["/api/market-trends"] });
    },
  });

  const handleCreateListing = () => {
    if (!newListing.leadId || !newListing.price || !newListing.industry || !newListing.geography) {
      toast({ title: "VALIDATION ERROR", description: "All fields required.", variant: "destructive" });
      return;
    }
    createListingMutation.mutate({ leadId: parseInt(newListing.leadId), price: newListing.price, industry: newListing.industry, geography: newListing.geography });
  };

  const getInterests = (lead: Lead) => {
    const i = [];
    if (lead.interestedInACA) i.push({ label: "ACA", color: "#38bdf8" });
    if (lead.interestedInMedicare) i.push({ label: "Medicare", color: "#a78bfa" });
    if (lead.interestedInFinalExpense) i.push({ label: "Final Exp", color: "#00d084" });
    return i;
  };

  const activeListings = listings.filter(l => l.isActive);
  const avgPrice = listings.length ? (listings.reduce((s, l) => s + parseFloat(l.price), 0) / listings.length).toFixed(2) : "0.00";
  const avgQuality = listings.length ? Math.round(listings.reduce((s, l) => s + l.qualityScore, 0) / listings.length) : 0;
  const totalRevenue = listings.reduce((s, l) => s + parseFloat(l.price) * l.timesResold, 0).toFixed(2);

  const kpis = [
    { label: "TOTAL LEADS", value: leads.length, sub: "+12% WoW", up: true, color: "#38bdf8", spark: sparkData[0], icon: Users },
    { label: "ACTIVE LISTINGS", value: activeListings.length, sub: "+8% WoW", up: true, color: "#00d084", spark: sparkData[1], icon: Package },
    { label: "TOTAL REVENUE", value: `$${totalRevenue}`, sub: "+22% WoW", up: true, color: "#fbbf24", spark: sparkData[2], icon: DollarSign },
    { label: "AVG QUALITY", value: `${avgQuality}%`, sub: "-1% WoW", up: false, color: "#fb923c", spark: sparkData[3], icon: Target },
  ];

  const tabs = [
    { id: "overview", label: "OVERVIEW", icon: BarChart2 },
    { id: "leads", label: "LEAD DB", icon: Database },
    { id: "listings", label: "LISTINGS", icon: Package },
    { id: "create", label: "NEW LISTING", icon: Plus },
    { id: "trends", label: "MARKET DATA", icon: TrendingUp },
  ] as const;

  const handleSort = (f: string) => {
    if (sortField === f) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(f); setSortDir("desc"); }
  };

  const qColor = (s: number) => s >= 85 ? "#00d084" : s >= 65 ? "#fbbf24" : "#ff4d4d";

  return (
    <>
      <Helmet>
        <title>Command Center | HealthLead Pro</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <Header />

      <div className="min-h-screen bg-[#070d1a] text-[#c8daf0]">
        {/* KPI Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 border-b border-[#1e2d4a]">
          {kpis.map(({ label, value, sub, up, color, spark, icon: Icon }) => (
            <div key={label} className="flex items-center gap-3 px-5 py-3 border-r border-[#1e2d4a] last:border-r-0">
              <div className="w-9 h-9 rounded-sm flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}18` }}>
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-mono tracking-widest text-[#4a6080] uppercase">{label}</p>
                <p className="text-[17px] font-mono font-bold" style={{ color }}>{value}</p>
                <p className={`text-[9px] font-mono flex items-center gap-0.5 ${up ? "text-[#00d084]" : "text-[#ff4d4d]"}`}>
                  {up ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
                  {sub}
                </p>
              </div>
              <MiniSparkline data={spark} color={color} />
            </div>
          ))}
        </div>

        {/* Tab Nav */}
        <div className="flex border-b border-[#1e2d4a] bg-[#050a14]">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 panel-tab ${activeTab === id ? "panel-tab-active" : ""}`}>
              <Icon className="w-3 h-3" />{label}
            </button>
          ))}
          <div className="flex items-center gap-2 ml-auto px-4">
            <div className="flex items-center gap-1.5">
              <Radio className="w-3 h-3 text-[#00d084] animate-pulse" />
              <span className="text-[10px] font-mono text-[#00d084]">LIVE DATA</span>
            </div>
          </div>
        </div>

        <div className="overflow-auto" style={{ height: "calc(100vh - 180px)" }}>

          {/* OVERVIEW TAB */}
          {activeTab === "overview" && (
            <div className="p-4 space-y-4">
              {/* Main Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="terminal-card lg:col-span-2">
                  <div className="terminal-header flex items-center justify-between">
                    <span className="text-[10px] font-mono text-[#4a6080] tracking-widest">LEAD ACQUISITION & REVENUE — 7 DAY</span>
                    <div className="flex gap-3">
                      {[["#38bdf8", "Leads"], ["#00d084", "Revenue $"]].map(([c, l]) => (
                        <div key={l} className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c }} />
                          <span className="text-[9px] font-mono text-[#4a6080]">{l}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="p-4 h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={volumeHistory}>
                        <defs>
                          <linearGradient id="leadsGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip content={<CustomTooltip />} />
                        <Area yAxisId="left" type="monotone" dataKey="leads" stroke="#38bdf8" fill="url(#leadsGrad)" strokeWidth={2} name="Leads" />
                        <Bar yAxisId="right" dataKey="revenue" fill="#00d084" fillOpacity={0.4} radius={[2, 2, 0, 0]} name="Revenue $" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="terminal-card">
                  <div className="terminal-header">
                    <span className="text-[10px] font-mono text-[#4a6080] tracking-widest">INDUSTRY BREAKDOWN</span>
                  </div>
                  <div className="p-4 h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={industryBreakdown} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={65} tick={{ fontSize: 10, fill: "#4a6080" }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="volume" fill="#38bdf8" fillOpacity={0.8} radius={[0, 2, 2, 0]} name="Volume" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Industry Table */}
              <div className="terminal-card">
                <div className="terminal-header flex items-center justify-between">
                  <span className="text-[10px] font-mono text-[#4a6080] tracking-widest">PERFORMANCE BY SEGMENT</span>
                  <span className="text-[9px] font-mono text-[#2a4060]">Updated: {new Date().toLocaleTimeString("en-US", { hour12: false })}</span>
                </div>
                <table className="w-full text-[11px] font-mono">
                  <thead>
                    <tr className="border-b border-[#1e2d4a]">
                      {["SEGMENT", "VOLUME", "AVG PRICE", "AVG QUALITY", "TREND"].map(h => (
                        <th key={h} className="text-left px-4 py-2 text-[9px] tracking-widest text-[#4a6080]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {industryBreakdown.map((row, i) => (
                      <tr key={row.name} className="ticker-row">
                        <td className="px-4 py-2.5 font-bold text-[#c8daf0]">{row.name.toUpperCase()}</td>
                        <td className="px-4 py-2.5 text-[#94b4d4]">{row.volume}</td>
                        <td className="px-4 py-2.5 text-[#00d084] font-bold">${row.avgPrice}</td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-[#0d1526] rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${row.quality}%`, backgroundColor: qColor(row.quality) }} />
                            </div>
                            <span style={{ color: qColor(row.quality) }}>{row.quality}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`flex items-center gap-1 ${i % 3 !== 2 ? "text-[#00d084]" : "text-[#ff4d4d]"}`}>
                            {i % 3 !== 2 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                            {i % 3 !== 2 ? "+4.2%" : "-1.8%"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="terminal-card">
                  <div className="terminal-header">
                    <span className="text-[10px] font-mono text-[#4a6080] tracking-widest">RECENT LEADS</span>
                  </div>
                  <div className="divide-y divide-[#111e33]">
                    {leads.slice(0, 5).map((lead: Lead) => (
                      <div key={lead.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-[#0f1e35] transition-colors">
                        <div>
                          <p className="text-[11px] font-mono font-semibold text-[#94b4d4]">{lead.firstName} {lead.lastName}</p>
                          <p className="text-[10px] text-[#2a4060]">{lead.state} · {new Date(lead.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="flex gap-1">
                          {getInterests(lead).map(({ label, color }) => (
                            <span key={label} className="text-[9px] px-1.5 py-0.5 rounded-sm font-mono border" style={{ color, borderColor: `${color}40`, backgroundColor: `${color}10` }}>
                              {label}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                    {leads.length === 0 && <p className="text-center py-6 text-[#2a4060] font-mono text-xs">NO LEADS YET</p>}
                  </div>
                </div>

                <div className="terminal-card">
                  <div className="terminal-header">
                    <span className="text-[10px] font-mono text-[#4a6080] tracking-widest">RECENT LISTINGS</span>
                  </div>
                  <div className="divide-y divide-[#111e33]">
                    {listings.slice(0, 5).map((l: LeadListing) => (
                      <div key={l.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-[#0f1e35] transition-colors">
                        <div>
                          <p className="text-[11px] font-mono font-semibold text-[#94b4d4]">{l.industry.toUpperCase()} · {l.geography}</p>
                          <p className="text-[10px] text-[#2a4060]">Lead #{l.leadId} · Q:{l.qualityScore}%</p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono font-bold text-[#00d084] text-sm">${parseFloat(l.price).toFixed(2)}</p>
                          <span className={`text-[9px] font-mono ${l.isActive ? "text-[#00d084]" : "text-[#4a6080]"}`}>
                            {l.isActive ? "● ACTIVE" : "○ SOLD"}
                          </span>
                        </div>
                      </div>
                    ))}
                    {listings.length === 0 && <p className="text-center py-6 text-[#2a4060] font-mono text-xs">NO LISTINGS YET</p>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* LEADS TAB */}
          {activeTab === "leads" && (
            <div className="p-4">
              <div className="terminal-card">
                <div className="terminal-header flex items-center justify-between">
                  <span className="text-[10px] font-mono text-[#4a6080] tracking-widest">LEAD DATABASE — {leads.length} RECORDS</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] font-mono text-[#2a4060]">SORT: {sortField.toUpperCase()} {sortDir.toUpperCase()}</span>
                    <a href="/api/export/leads" target="_blank" rel="noreferrer"
                      className="btn-terminal flex items-center gap-1 text-[10px]">
                      <Download className="w-3 h-3" /> CSV
                    </a>
                  </div>
                </div>
                <div className="overflow-auto">
                  <table className="w-full text-[11px] font-mono border-collapse">
                    <thead className="sticky top-0 bg-[#050a14] z-10">
                      <tr className="border-b border-[#1e2d4a]">
                        {[
                          { label: "#",        field: "id"        },
                          { label: "NAME",     field: null        },
                          { label: "STATE",    field: "state"     },
                          { label: "AGING",    field: null        },
                          { label: "INTERESTS",field: null        },
                          { label: "TCPA/DNC", field: null        },
                          { label: "CAPTURED", field: "createdAt" },
                        ].map(({ label, field }) => (
                          <th key={label} onClick={() => field && handleSort(field)}
                            className={`text-left px-3 py-2 text-[9px] tracking-widest text-[#4a6080] border-r border-[#111e33] last:border-r-0 ${field ? "cursor-pointer hover:text-[#94b4d4]" : ""}`}>
                            <div className="flex items-center gap-1">
                              {label}
                              {field && sortField === field && (sortDir === "desc" ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />)}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {loadingLeads ? (
                        Array.from({ length: 6 }).map((_, i) => (
                          <tr key={i} className="border-b border-[#111e33]">
                            {Array.from({ length: 7 }).map((_, j) => (
                              <td key={j} className="px-3 py-2.5"><div className="h-3 bg-[#0d1526] rounded animate-pulse w-3/4" /></td>
                            ))}
                          </tr>
                        ))
                      ) : leads.length === 0 ? (
                        <tr><td colSpan={7} className="text-center py-12 text-[#2a4060]">NO LEADS IN DATABASE</td></tr>
                      ) : leads.map((lead: Lead) => {
                        const hoursOld = Math.floor((Date.now() - new Date(lead.createdAt).getTime()) / 3_600_000);
                        const ageColor = hoursOld < 4 ? "#00d084" : hoursOld < 24 ? "#fbbf24" : "#ff4d4d";
                        return (
                          <>
                            <tr key={lead.id}
                              onClick={() => setExpandedLeadId(expandedLeadId === lead.id ? null : lead.id)}
                              className={`ticker-row cursor-pointer ${expandedLeadId === lead.id ? "bg-[#0d1e35] border-l-2 border-l-[#2563eb]" : ""}`}>
                              <td className="px-3 py-2.5 text-[#4a6080]">#{lead.id}</td>
                              <td className="px-3 py-2.5 text-[#c8daf0] font-semibold">{lead.firstName} {lead.lastName}</td>
                              <td className="px-3 py-2.5 text-[#38bdf8]">{lead.state}</td>
                              <td className="px-3 py-2.5">
                                <div className="flex items-center gap-1.5">
                                  <Clock className="w-2.5 h-2.5" style={{ color: ageColor }} />
                                  <span className="text-[10px] font-mono font-semibold" style={{ color: ageColor }}>
                                    {hoursOld}h
                                  </span>
                                  {lead.agingScore != null && (
                                    <span className="text-[9px] font-mono text-[#2a4060]">· {lead.agingScore}</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-3 py-2.5">
                                <div className="flex gap-1">
                                  {getInterests(lead).map(({ label, color }) => (
                                    <span key={label} className="text-[9px] px-1.5 py-0.5 rounded-sm border" style={{ color, borderColor: `${color}40`, backgroundColor: `${color}10` }}>{label}</span>
                                  ))}
                                </div>
                              </td>
                              <td className="px-3 py-2.5">
                                <div className="flex gap-1">
                                  {lead.tcpaConsent
                                    ? <span className="flex items-center gap-0.5 text-[9px] font-mono text-[#00d084] bg-[#00d08415] border border-[#00d08430] px-1.5 py-0.5 rounded-sm"><ShieldCheck className="w-2.5 h-2.5" /> TCPA</span>
                                    : <span className="flex items-center gap-0.5 text-[9px] font-mono text-[#fbbf24] bg-[#fbbf2415] border border-[#fbbf2430] px-1.5 py-0.5 rounded-sm"><ShieldAlert className="w-2.5 h-2.5" /> NO CONSENT</span>
                                  }
                                  {lead.dnc && (
                                    <span className="text-[9px] font-mono text-[#ff4d4d] bg-[#ff4d4d15] border border-[#ff4d4d30] px-1.5 py-0.5 rounded-sm">DNC</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-3 py-2.5 text-[#2a4060]">{new Date(lead.createdAt).toLocaleDateString()}</td>
                            </tr>
                            {expandedLeadId === lead.id && (
                              <tr key={`${lead.id}-detail`}>
                                <td colSpan={7} className="px-4 py-3 border-b border-[#111e33] bg-[#070f1f]">
                                  {/* Contact + compliance grid */}
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3 text-[10px] font-mono">
                                    {[
                                      { label: "EMAIL",         value: lead.email },
                                      { label: "PHONE",         value: lead.phoneNumber },
                                      { label: "ZIP / DOB",     value: `${lead.zipCode || "—"} / ${lead.dateOfBirth || "—"}` },
                                      { label: "MEDICAID/VA",   value: lead.hasMedicaidMedicareVA ? "⚠ Has Coverage" : "None" },
                                    ].map(({ label, value }) => (
                                      <div key={label} className="bg-[#060e1c] border border-[#1e2d4a] rounded-sm px-2.5 py-2">
                                        <p className="terminal-label">{label}</p>
                                        <p className="text-[#94b4d4] mt-0.5 text-[10px]">{value}</p>
                                      </div>
                                    ))}
                                  </div>
                                  {/* TCPA row */}
                                  <div className="flex items-center gap-3 mb-3 text-[9px] font-mono">
                                    <span className="text-[#2a4060]">TCPA:</span>
                                    {lead.tcpaConsent
                                      ? <span className="text-[#00d084]">Consented via {lead.tcpaConsentSource || "unknown"}</span>
                                      : <span className="text-[#fbbf24]">No consent recorded</span>}
                                    {lead.dnc && <span className="text-[#ff4d4d] ml-4 font-bold">DO NOT CALL — DNC registered</span>}
                                  </div>
                                  {/* Activity feed inline */}
                                  <ActivityFeed leadId={lead.id} />
                                </td>
                              </tr>
                            )}
                          </>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* LISTINGS TAB */}
          {activeTab === "listings" && (
            <div className="p-4">
              <div className="terminal-card">
                <div className="terminal-header flex items-center justify-between">
                  <span className="text-[10px] font-mono text-[#4a6080] tracking-widest">MARKETPLACE LISTINGS — {listings.length} TOTAL · {activeListings.length} ACTIVE</span>
                </div>
                <div className="overflow-auto">
                  <table className="w-full text-[11px] font-mono border-collapse">
                    <thead className="sticky top-0 bg-[#050a14] z-10">
                      <tr className="border-b border-[#1e2d4a]">
                        {["ID", "LEAD ID", "INDUSTRY", "STATE", "PRICE", "QUALITY", "RESOLD", "STATUS", "LISTED"].map(h => (
                          <th key={h} className="text-left px-3 py-2 text-[9px] tracking-widest text-[#4a6080] border-r border-[#111e33] last:border-r-0">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {loadingListings ? (
                        Array.from({ length: 6 }).map((_, i) => (
                          <tr key={i} className="border-b border-[#111e33]">
                            {Array.from({ length: 9 }).map((_, j) => (
                              <td key={j} className="px-3 py-2.5">
                                <div className="h-3 bg-[#0d1526] rounded animate-pulse w-3/4" />
                              </td>
                            ))}
                          </tr>
                        ))
                      ) : listings.length === 0 ? (
                        <tr><td colSpan={9} className="text-center py-12 text-[#2a4060]">NO LISTINGS FOUND</td></tr>
                      ) : listings.map((l: LeadListing) => (
                        <tr key={l.id} className="ticker-row">
                          <td className="px-3 py-2.5 text-[#4a6080]">#{l.id}</td>
                          <td className="px-3 py-2.5 text-[#4a6080]">#{l.leadId}</td>
                          <td className="px-3 py-2.5">
                            <span className={`font-semibold uppercase ${l.industry === "medicare" ? "text-[#a78bfa]" : l.industry === "healthcare" ? "text-[#38bdf8]" : "text-[#00d084]"}`}>
                              {l.industry}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-[#38bdf8]">{l.geography}</td>
                          <td className="px-3 py-2.5 text-[#00d084] font-bold">${parseFloat(l.price).toFixed(2)}</td>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-2">
                              <div className="w-12 h-1.5 bg-[#0d1526] rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${l.qualityScore}%`, backgroundColor: qColor(l.qualityScore) }} />
                              </div>
                              <span style={{ color: qColor(l.qualityScore) }}>{l.qualityScore}</span>
                            </div>
                          </td>
                          <td className="px-3 py-2.5">
                            <span className={l.timesResold > 2 ? "text-[#ff4d4d]" : l.timesResold > 0 ? "text-[#fbbf24]" : "text-[#4a6080]"}>
                              {l.timesResold}x
                            </span>
                          </td>
                          <td className="px-3 py-2.5">
                            <span className={`text-[9px] px-2 py-0.5 rounded-sm font-mono ${l.isActive ? "text-[#00d084] bg-[#00d08418]" : "text-[#4a6080] bg-[#4a608018]"}`}>
                              {l.isActive ? "● ACTIVE" : "○ SOLD"}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-[#2a4060]">{new Date(l.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* CREATE LISTING TAB */}
          {activeTab === "create" && (
            <div className="p-4 max-w-2xl">
              <div className="terminal-card">
                <div className="terminal-header">
                  <span className="text-[10px] font-mono text-[#4a6080] tracking-widest">CREATE MARKETPLACE LISTING</span>
                </div>
                <div className="p-6 space-y-5">
                  {/* Quick reference: recent leads */}
                  {leads.length > 0 && (
                    <div className="bg-[#060e1c] border border-[#1e2d4a] rounded-sm p-3">
                      <p className="terminal-label mb-2">RECENT LEAD IDs (click to auto-fill)</p>
                      <div className="flex flex-wrap gap-2">
                        {leads.slice(0, 8).map((l: Lead) => (
                          <button key={l.id} onClick={() => setNewListing(p => ({ ...p, leadId: l.id.toString() }))}
                            className={`text-[10px] font-mono px-2 py-1 rounded-sm border transition-colors ${newListing.leadId === l.id.toString() ? "border-[#2563eb] text-[#38bdf8] bg-[#0d1e3a]" : "border-[#1e2d4a] text-[#4a6080] hover:border-[#2a3d5a] hover:text-[#94b4d4]"}`}>
                            #{l.id} — {l.firstName} {l.lastName[0]}.
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { key: "leadId", label: "LEAD ID", placeholder: "e.g. 42", type: "number" },
                      { key: "price", label: "ASK PRICE ($)", placeholder: "e.g. 35.00", type: "number" },
                    ].map(({ key, label, placeholder, type }) => (
                      <div key={key}>
                        <label className="terminal-label block mb-1.5">{label}</label>
                        <input type={type} placeholder={placeholder}
                          value={newListing[key as keyof typeof newListing]}
                          onChange={e => setNewListing(p => ({ ...p, [key]: e.target.value }))}
                          className="w-full bg-[#060e1c] border border-[#1e2d4a] text-[#94b4d4] text-[12px] font-mono px-3 py-2 rounded-sm focus:outline-none focus:border-[#2563eb] placeholder-[#1e2d4a]" />
                      </div>
                    ))}

                    {[
                      { key: "industry", label: "INDUSTRY", opts: [["", "— Select Industry —"], ["healthcare", "Healthcare"], ["insurance", "Insurance"], ["medicare", "Medicare"]] },
                      { key: "geography", label: "STATE", opts: [["", "— Select State —"], ["CA", "California"], ["NY", "New York"], ["TX", "Texas"], ["FL", "Florida"], ["AZ", "Arizona"], ["IL", "Illinois"]] },
                    ].map(({ key, label, opts }) => (
                      <div key={key}>
                        <label className="terminal-label block mb-1.5">{label}</label>
                        <select value={newListing[key as keyof typeof newListing]}
                          onChange={e => setNewListing(p => ({ ...p, [key]: e.target.value }))}
                          className="w-full bg-[#060e1c] border border-[#1e2d4a] text-[#94b4d4] text-[12px] font-mono px-3 py-2 rounded-sm focus:outline-none focus:border-[#2563eb]">
                          {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>

                  <div className="bg-[#060e1c] border border-[#1e2d4a] rounded-sm p-3 text-[11px] font-mono text-[#4a6080]">
                    <p className="text-[9px] tracking-widest mb-1 text-[#2a4060]">LISTING PREVIEW</p>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { label: "Lead", value: newListing.leadId ? `#${newListing.leadId}` : "—" },
                        { label: "Price", value: newListing.price ? `$${newListing.price}` : "—" },
                        { label: "Industry", value: newListing.industry || "—" },
                        { label: "State", value: newListing.geography || "—" },
                      ].map(({ label, value }) => (
                        <div key={label}>
                          <p className="terminal-label">{label}</p>
                          <p className="text-[#38bdf8] font-bold">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button onClick={handleCreateListing}
                    disabled={createListingMutation.isPending}
                    className="w-full py-3 bg-[#0d1e3a] hover:bg-[#1a3a6b] border border-[#2563eb] text-[#38bdf8] font-mono font-bold text-sm rounded-sm transition-colors flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4" />
                    {createListingMutation.isPending ? "SUBMITTING..." : "PUBLISH TO MARKETPLACE"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MARKET DATA TAB */}
          {activeTab === "trends" && (() => {
            // Build multi-segment chart data indexed by sequential position per industry
            const byIndustry: Record<string, number[]> = {};
            trends.forEach((t: any) => {
              const k = t.industry.toLowerCase();
              if (!byIndustry[k]) byIndustry[k] = [];
              byIndustry[k].push(parseFloat(t.avgPrice));
            });
            const maxLen = Math.max(...Object.values(byIndustry).map(v => v.length), 0);
            const multiChart = Array.from({ length: maxLen }, (_, i) => ({
              i: i + 1,
              healthcare: byIndustry["healthcare"]?.[i] ?? null,
              medicare:   byIndustry["medicare"]?.[i]   ?? null,
              insurance:  byIndustry["insurance"]?.[i]  ?? null,
            }));

            // Per-segment summary stats
            const segStats = ["healthcare", "medicare", "insurance"].map(seg => {
              const pts = byIndustry[seg] || [];
              const avg = pts.length ? pts.reduce((s, v) => s + v, 0) / pts.length : 0;
              const last = pts[pts.length - 1] ?? 0;
              const prev = pts[pts.length - 2] ?? last;
              const chg = prev ? ((last - prev) / prev) * 100 : 0;
              return { seg, avg, last, chg, count: pts.length };
            });

            return (
              <div className="p-4 space-y-4">
                {/* Segment summary stats */}
                <div className="grid grid-cols-3 gap-3">
                  {segStats.map(({ seg, avg, last, chg, count }) => {
                    const color = seg === "healthcare" ? "#38bdf8" : seg === "medicare" ? "#a78bfa" : "#00d084";
                    return (
                      <div key={seg} className="terminal-card p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-mono font-bold uppercase" style={{ color }}>{seg}</span>
                          <span className={`text-[10px] font-mono flex items-center gap-0.5 ${chg >= 0 ? "text-[#00d084]" : "text-[#ff4d4d]"}`}>
                            {chg >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                            {Math.abs(chg).toFixed(1)}%
                          </span>
                        </div>
                        <p className="text-2xl font-mono font-bold text-[#c8daf0]">${avg.toFixed(2)}</p>
                        <p className="text-[9px] font-mono text-[#4a6080] mt-0.5">avg · {count} data pts · latest ${last.toFixed(2)}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Multi-segment chart */}
                <div className="terminal-card">
                  <div className="terminal-header flex items-center justify-between">
                    <span className="text-[10px] font-mono text-[#4a6080] tracking-widest">AVG PRICE BY SEGMENT — ALL INDUSTRIES</span>
                    <div className="flex gap-3">
                      {[["#38bdf8", "Healthcare"], ["#a78bfa", "Medicare"], ["#00d084", "Insurance"]].map(([c, l]) => (
                        <div key={l} className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c }} />
                          <span className="text-[9px] font-mono text-[#4a6080]">{l}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="p-4 h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={multiChart}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="i" tick={{ fontSize: 10, fill: "#4a6080" }} />
                        <YAxis tick={{ fontSize: 10, fill: "#4a6080" }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Line type="monotone" dataKey="healthcare" stroke="#38bdf8" strokeWidth={2} dot={false} name="Healthcare $" connectNulls />
                        <Line type="monotone" dataKey="medicare"   stroke="#a78bfa" strokeWidth={2} dot={false} name="Medicare $"   connectNulls />
                        <Line type="monotone" dataKey="insurance"  stroke="#00d084" strokeWidth={2} dot={false} name="Insurance $"  connectNulls />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Record new data point */}
                <div className="terminal-card">
                  <div className="terminal-header">
                    <span className="text-[10px] font-mono text-[#4a6080] tracking-widest">RECORD MARKET DATA POINT</span>
                  </div>
                  <div className="p-4 flex flex-wrap gap-3 items-end">
                    <div>
                      <label className="terminal-label block mb-1.5">INDUSTRY</label>
                      <select value={trendIndustry} onChange={e => setTrendIndustry(e.target.value)}
                        className="bg-[#060e1c] border border-[#1e2d4a] text-[#94b4d4] text-[12px] font-mono px-3 py-2 rounded-sm focus:outline-none focus:border-[#2563eb]">
                        {["healthcare", "medicare", "insurance", "final expense"].map(v => <option key={v} value={v}>{v.toUpperCase()}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="terminal-label block mb-1.5">STATE</label>
                      <select value={trendGeo} onChange={e => setTrendGeo(e.target.value)}
                        className="bg-[#060e1c] border border-[#1e2d4a] text-[#94b4d4] text-[12px] font-mono px-3 py-2 rounded-sm focus:outline-none focus:border-[#2563eb]">
                        {["CA", "FL", "TX", "NY", "AZ", "GA", "IL"].map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => recordTrendMutation.mutate({ industry: trendIndustry, geography: trendGeo })}
                        disabled={recordTrendMutation.isPending}
                        className="btn-terminal flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5" />
                        {recordTrendMutation.isPending ? "RECORDING…" : "RECORD SAMPLE"}
                      </button>
                      {["healthcare", "medicare", "insurance"].map(seg => (
                        <button key={seg} onClick={() => recordTrendMutation.mutate({ industry: seg, geography: trendGeo })}
                          disabled={recordTrendMutation.isPending}
                          className="text-[9px] font-mono px-2 py-1.5 border border-[#1e2d4a] text-[#4a6080] hover:border-[#2a3d5a] hover:text-[#94b4d4] rounded-sm transition-colors">
                          + {seg.slice(0, 4).toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Trends raw data table */}
                <div className="terminal-card">
                  <div className="terminal-header">
                    <span className="text-[10px] font-mono text-[#4a6080] tracking-widest">RAW DATA FEED — {trends.length} RECORDS</span>
                  </div>
                  {trends.length === 0 ? (
                    <div className="text-center py-10">
                      <p className="text-[#2a4060] font-mono text-sm">NO MARKET DATA YET — RECORD A DATA POINT ABOVE</p>
                    </div>
                  ) : (
                    <div className="overflow-auto max-h-64">
                      <table className="w-full text-[11px] font-mono border-collapse">
                        <thead className="sticky top-0 bg-[#050a14]">
                          <tr className="border-b border-[#1e2d4a]">
                            {["INDUSTRY", "STATE", "AVG PRICE", "VOLUME", "GROWTH RATE", "RECORDED"].map(h => (
                              <th key={h} className="text-left px-4 py-2 text-[9px] tracking-widest text-[#4a6080] border-r border-[#111e33] last:border-r-0">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {trends.map((t: any) => {
                            const growth = parseFloat(t.growthRate);
                            return (
                              <tr key={t.id} className="ticker-row">
                                <td className="px-4 py-2 font-semibold uppercase"
                                  style={{ color: t.industry === "medicare" ? "#a78bfa" : t.industry === "healthcare" ? "#38bdf8" : "#00d084" }}>
                                  {t.industry}
                                </td>
                                <td className="px-4 py-2 text-[#94b4d4]">{t.geography}</td>
                                <td className="px-4 py-2 text-[#00d084] font-bold">${parseFloat(t.avgPrice).toFixed(2)}</td>
                                <td className="px-4 py-2 text-[#94b4d4]">{t.volume}</td>
                                <td className="px-4 py-2">
                                  <span className={`flex items-center gap-1 font-bold ${growth >= 0 ? "text-[#00d084]" : "text-[#ff4d4d]"}`}>
                                    {growth >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                    {Math.abs(growth).toFixed(2)}%
                                  </span>
                                </td>
                                <td className="px-4 py-2 text-[#2a4060]">{new Date(t.recordedAt).toLocaleString()}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </>
  );
}
