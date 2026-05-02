import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import PurchaseConfirmModal from "@/components/PurchaseConfirmModal";
import { Helmet } from "react-helmet";
import {
  AreaChart, Area, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line
} from "recharts";
import {
  TrendingUp, Filter, ShoppingCart, Zap, RefreshCw, ChevronUp, ChevronDown,
  MapPin, Activity, DollarSign, Star, ArrowUpRight, ArrowDownRight, Package,
  Briefcase, CheckCircle2, Clock, CreditCard, ArrowDownLeft, ArrowUpRight as ArrowUp
} from "lucide-react";

interface LeadListing {
  id: number; leadId: number; sellerId: number; price: string;
  qualityScore: number; timesResold: number; industry: string;
  geography: string; isActive: boolean; createdAt: string;
}
interface DemandPrediction {
  id: number; industry: string; geography: string; predictedDemand: number;
  confidence: string;
  factors: { seasonality: number; economic: number; regulatory: number; historical: number };
  predictionDate: string; validUntil: string;
}
interface CreditAccount { id: number; userId: number; balance: string; totalPurchased: string; }
interface CreditPackage { id: number; name: string; credits: number; price: string; discountPercentage: string; isActive: boolean; }
interface CreditTx { id: number; userId: number; type: string; amount: string; description: string; createdAt: string; }
interface PurchaseDetail {
  purchaseId: number; listingId: number; buyerId: number; pricePaid: string;
  qualityAtPurchase: number; purchaseDate: string;
  industry: string | null; geography: string | null; leadId: number | null;
  firstName: string | null; lastName: string | null; state: string | null;
  interestedInACA: boolean | null; interestedInMedicare: boolean | null; interestedInFinalExpense: boolean | null;
}

const MARKET_VALUE: Record<string, number> = { healthcare: 34, medicare: 49, insurance: 26, "final expense": 36 };

const demandHistory = [
  { time: "09:00", aca: 72, medicare: 85, finalExp: 58 }, { time: "10:00", aca: 78, medicare: 88, finalExp: 62 },
  { time: "11:00", aca: 81, medicare: 84, finalExp: 67 }, { time: "12:00", aca: 76, medicare: 91, finalExp: 64 },
  { time: "13:00", aca: 84, medicare: 89, finalExp: 70 }, { time: "14:00", aca: 88, medicare: 92, finalExp: 68 },
  { time: "15:00", aca: 85, medicare: 90, finalExp: 72 }, { time: "16:00", aca: 91, medicare: 94, finalExp: 75 },
];
const priceHistory = [
  { day: "Mon", avg: 28.5, high: 42, low: 18 }, { day: "Tue", avg: 31.2, high: 48, low: 22 },
  { day: "Wed", avg: 29.8, high: 45, low: 19 }, { day: "Thu", avg: 34.1, high: 52, low: 24 },
  { day: "Fri", avg: 36.7, high: 58, low: 26 }, { day: "Sat", avg: 33.4, high: 50, low: 21 },
  { day: "Sun", avg: 38.2, high: 61, low: 28 },
];
const geoData = [
  { state: "FL", volume: 312, demand: 91, avgPrice: 38.4 }, { state: "CA", volume: 287, demand: 88, avgPrice: 42.1 },
  { state: "TX", volume: 241, demand: 79, avgPrice: 31.6 }, { state: "NY", volume: 198, demand: 84, avgPrice: 44.8 },
  { state: "AZ", volume: 167, demand: 72, avgPrice: 29.3 },
];

const CT = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0d1526] border border-[#1e2d4a] rounded-sm p-2 text-[11px] font-mono">
      <p className="text-[#4a6080] mb-1">{label}</p>
      {payload.map((p: any, i: number) => <p key={i} style={{ color: p.color }}>{p.name}: {p.value}</p>)}
    </div>
  );
};

export default function Marketplace() {
  const [activeTab, setActiveTab] = useState<"order-book" | "predictions" | "geo" | "holdings" | "credits">("order-book");
  const [sortField, setSortField] = useState("qualityScore");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [filters, setFilters] = useState({ industry: "", geography: "", minPrice: "", maxPrice: "" });
  const [selectedListing, setSelectedListing] = useState<LeadListing | null>(null);
  const [pendingPurchaseId, setPendingPurchaseId] = useState<number | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [isDNC, setIsDNC] = useState(false);
  const { toast } = useToast();
  const qc = useQueryClient();
  const userId = 1;

  const filterParams = new URLSearchParams(
    Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ""))
  ).toString();

  const { data: listingsResp, isLoading: loadingListings, refetch } = useQuery<any>({
    queryKey: ["/api/lead-listings", filterParams],
    queryFn: () => fetch(`/api/lead-listings${filterParams ? `?${filterParams}` : ""}`).then(r => r.json()),
    refetchInterval: 30000,
  });
  const listings: LeadListing[] = listingsResp?.data || [];

  const { data: predictionsResp } = useQuery<any>({ queryKey: ["/api/demand-predictions"] });
  const predictions: DemandPrediction[] = predictionsResp?.data || [];

  const { data: creditResp } = useQuery<any>({ queryKey: [`/api/credits/${userId}`] });
  const creditAccount: CreditAccount | null = creditResp?.data || null;
  const balance = parseFloat(creditAccount?.balance || "0");

  const { data: packagesResp } = useQuery<any>({ queryKey: ["/api/credit-packages"] });
  const creditPackages: CreditPackage[] = packagesResp?.data || [];

  const { data: txResp } = useQuery<any>({ queryKey: [`/api/credits/${userId}/transactions`] });
  const transactions: CreditTx[] = txResp?.data || [];

  const { data: portfolioResp, isLoading: loadingPortfolio } = useQuery<any>({
    queryKey: [`/api/purchases/${userId}/detailed`],
    enabled: activeTab === "holdings",
  });
  const { data: allPurchasesResp } = useQuery<any>({
    queryKey: [`/api/purchases/${userId}/detailed`, "always"],
    queryFn: () => fetch(`/api/purchases/${userId}/detailed`).then(r => r.json()),
    staleTime: 30_000,
  });
  const portfolio: PurchaseDetail[] = portfolioResp?.data || [];
  const ownedLeadIds = new Set<number>((allPurchasesResp?.data || []).map((p: PurchaseDetail) => p.leadId).filter(Boolean));

  const pendingListing = listings.find(l => l.id === pendingPurchaseId) || null;
  const openPurchaseModal = (listingId: number) => {
    const listing = listings.find(l => l.id === listingId);
    setIsDuplicate(listing ? ownedLeadIds.has(listing.leadId) : false);
    setIsDNC(false); // server will block DNC — error handled in mutation
    setPendingPurchaseId(listingId);
  };

  const purchaseMutation = useMutation({
    mutationFn: (listingId: number) =>
      apiRequest("POST", `/api/lead-listings/${listingId}/purchase`, { buyerId: userId }),
    onSuccess: () => {
      toast({ title: "ORDER FILLED", description: "Lead acquired. Check My Leads for details." });
      qc.invalidateQueries({ queryKey: ["/api/lead-listings"] });
      qc.invalidateQueries({ queryKey: [`/api/credits/${userId}`] });
      qc.invalidateQueries({ queryKey: [`/api/credits/${userId}/transactions`] });
      qc.invalidateQueries({ queryKey: [`/api/purchases/${userId}/detailed`] });
      setPendingPurchaseId(null);
      setSelectedListing(null);
    },
    onError: (e: any) => {
      toast({ title: "ORDER REJECTED", description: e.message || "Insufficient credits", variant: "destructive" });
      setPendingPurchaseId(null);
    },
  });

  const creditMutation = useMutation({
    mutationFn: (pkg: CreditPackage) =>
      apiRequest("POST", "/api/credits/purchase", { userId, packageId: pkg.id, amount: pkg.price }),
    onSuccess: () => {
      toast({ title: "FUNDS DEPOSITED", description: "Account balance updated." });
      qc.invalidateQueries({ queryKey: [`/api/credits/${userId}`] });
      qc.invalidateQueries({ queryKey: [`/api/credits/${userId}/transactions`] });
    },
  });

  const genPrediction = useMutation({
    mutationFn: (data: { industry: string; geography: string }) =>
      apiRequest("POST", "/api/demand-predictions/generate", data),
    onSuccess: () => {
      toast({ title: "AI MODEL RAN", description: "Prediction refreshed." });
      qc.invalidateQueries({ queryKey: ["/api/demand-predictions"] });
    },
  });

  const sorted = [...listings].sort((a, b) => {
    const av = sortField === "price" ? parseFloat(a.price) : (a as any)[sortField];
    const bv = sortField === "price" ? parseFloat(b.price) : (b as any)[sortField];
    return sortDir === "desc" ? bv - av : av - bv;
  });

  const handleSort = (f: string) => {
    if (sortField === f) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(f); setSortDir("desc"); }
  };

  const qColor = (s: number) => s >= 85 ? "#00d084" : s >= 65 ? "#fbbf24" : "#ff4d4d";
  const qLabel = (s: number) => s >= 85 ? "PRIME" : s >= 65 ? "GOOD" : "AGED";

  // Portfolio stats
  const totalInvested = portfolio.reduce((s, p) => s + parseFloat(p.pricePaid), 0);
  const portfolioValue = portfolio.reduce((s, p) => s + (MARKET_VALUE[p.industry?.toLowerCase() || ""] || 32), 0);
  const unrealizedPnl = portfolioValue - totalInvested;

  const tabs = [
    { id: "order-book",  label: "ORDER BOOK"  },
    { id: "predictions", label: "AI SIGNALS"  },
    { id: "geo",         label: "GEO HEAT MAP"},
    { id: "holdings",    label: `MY LEADS${portfolio.length ? ` (${portfolio.length})` : ""}` },
    { id: "credits",     label: "FUND ACCOUNT"},
  ] as const;

  return (
    <>
      <Helmet>
        <title>Marketplace | HealthLead Pro</title>
        <meta name="description" content="Healthcare lead marketplace with real-time demand signals and AI predictions." />
      </Helmet>
      <Header />
      <PurchaseConfirmModal
        listing={pendingListing}
        balance={balance}
        isPending={purchaseMutation.isPending}
        isDuplicate={isDuplicate}
        isDNC={isDNC}
        onConfirm={(id) => purchaseMutation.mutate(id)}
        onClose={() => { setPendingPurchaseId(null); setIsDuplicate(false); setIsDNC(false); }}
      />

      <div className="min-h-screen bg-[#070d1a] text-[#c8daf0]">
        {/* KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-5 border-b border-[#1e2d4a]">
          {[
            { label: "AVAILABLE LEADS",  value: listings.length.toString(),  sub: "active listings",  icon: Package,    color: "#38bdf8" },
            { label: "CREDIT BALANCE",   value: `$${balance.toFixed(2)}`,    sub: "available funds",  icon: DollarSign, color: "#00d084" },
            { label: "AVG QUALITY",      value: listings.length ? `${Math.round(listings.reduce((s, l) => s + l.qualityScore, 0) / listings.length)}%` : "—", sub: "across listings", icon: Star, color: "#fbbf24" },
            { label: "AVG PRICE",        value: listings.length ? `$${(listings.reduce((s, l) => s + parseFloat(l.price), 0) / listings.length).toFixed(2)}` : "—", sub: "per lead", icon: TrendingUp, color: "#a78bfa" },
            { label: "PORTFOLIO",        value: portfolio.length ? `${portfolio.length} leads` : "—", sub: `$${unrealizedPnl >= 0 ? "+" : ""}${unrealizedPnl.toFixed(0)} P&L`, icon: Briefcase, color: "#fb923c" },
          ].map(({ label, value, sub, icon: Icon, color }) => (
            <div key={label} className="flex items-center gap-3 px-5 py-3 border-r border-[#1e2d4a] last:border-r-0">
              <div className="w-8 h-8 rounded-sm flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}18` }}>
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              <div>
                <p className="text-[9px] font-mono tracking-widest text-[#4a6080] uppercase">{label}</p>
                <p className="text-[15px] font-mono font-bold" style={{ color }}>{value}</p>
                <p className="text-[9px] text-[#2a4060]">{sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tab Nav */}
        <div className="flex border-b border-[#1e2d4a] bg-[#050a14] overflow-x-auto">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`panel-tab flex-shrink-0 ${activeTab === t.id ? "panel-tab-active" : ""}`}>
              {t.label}
            </button>
          ))}
          <div className="flex items-center gap-2 ml-auto px-4 flex-shrink-0">
            <button onClick={() => setFilterOpen(f => !f)}
              className={`flex items-center gap-1.5 text-[10px] font-mono px-3 py-1.5 border rounded-sm transition-colors ${filterOpen ? "border-[#2563eb] text-[#38bdf8] bg-[#0d1e3a]" : "border-[#1e2d4a] text-[#4a6080] hover:border-[#2a3d5a]"}`}>
              <Filter className="w-3 h-3" /> FILTERS
            </button>
            <button onClick={() => refetch()}
              className="flex items-center gap-1.5 text-[10px] font-mono px-3 py-1.5 border border-[#1e2d4a] text-[#4a6080] hover:border-[#2a3d5a] rounded-sm">
              <RefreshCw className="w-3 h-3" /> REFRESH
            </button>
          </div>
        </div>

        {/* Filter panel */}
        {filterOpen && (
          <div className="bg-[#050a14] border-b border-[#1e2d4a] px-4 py-3">
            <div className="flex flex-wrap gap-3 items-center">
              <span className="text-[10px] font-mono text-[#4a6080] uppercase tracking-widest">Filter:</span>
              {[
                { key: "industry",  opts: [["", "All Industries"], ["healthcare", "Healthcare"], ["insurance", "Insurance"], ["medicare", "Medicare"]] },
                { key: "geography", opts: [["", "All States"], ["CA", "California"], ["NY", "New York"], ["TX", "Texas"], ["FL", "Florida"], ["AZ", "Arizona"], ["GA", "Georgia"], ["IL", "Illinois"]] },
              ].map(({ key, opts }) => (
                <select key={key} value={filters[key as keyof typeof filters]}
                  onChange={e => setFilters(p => ({ ...p, [key]: e.target.value }))}
                  className="bg-[#0d1526] border border-[#1e2d4a] text-[#94b4d4] text-[11px] font-mono px-2 py-1.5 rounded-sm focus:outline-none focus:border-[#2563eb]">
                  {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              ))}
              {[{ key: "minPrice", placeholder: "Min $" }, { key: "maxPrice", placeholder: "Max $" }].map(({ key, placeholder }) => (
                <input key={key} type="number" placeholder={placeholder} value={filters[key as keyof typeof filters]}
                  onChange={e => setFilters(p => ({ ...p, [key]: e.target.value }))}
                  className="bg-[#0d1526] border border-[#1e2d4a] text-[#94b4d4] text-[11px] font-mono px-2 py-1.5 w-24 rounded-sm focus:outline-none focus:border-[#2563eb] placeholder-[#2a3d5a]" />
              ))}
              <button onClick={() => setFilters({ industry: "", geography: "", minPrice: "", maxPrice: "" })}
                className="text-[10px] font-mono text-[#ff4d4d] hover:text-[#ff6666] transition-colors">
                CLEAR
              </button>
            </div>
          </div>
        )}

        <div className="flex" style={{ height: "calc(100vh - 190px)" }}>
          <div className="flex-1 overflow-hidden flex flex-col">

            {/* ── ORDER BOOK ── */}
            {activeTab === "order-book" && (
              <div className="flex flex-1 overflow-hidden">
                <div className="flex-1 overflow-auto">
                  <table className="w-full text-[11px] font-mono border-collapse">
                    <thead className="sticky top-0 bg-[#050a14] z-10">
                      <tr className="border-b border-[#1e2d4a]">
                        {[
                          { label: "ID",       field: null },
                          { label: "INDUSTRY", field: "industry" },
                          { label: "STATE",    field: "geography" },
                          { label: "QUALITY",  field: "qualityScore" },
                          { label: "DECAY",    field: "timesResold" },
                          { label: "PRICE",    field: "price" },
                          { label: "LISTED",   field: "createdAt" },
                          { label: "ACTION",   field: null },
                        ].map(({ label, field }) => (
                          <th key={label} onClick={() => field && handleSort(field)}
                            className={`text-left px-3 py-2 text-[9px] tracking-widest text-[#4a6080] border-r border-[#111e33] last:border-r-0 ${field ? "cursor-pointer hover:text-[#94b4d4] select-none" : ""}`}>
                            <div className="flex items-center gap-1">
                              {label}
                              {field && sortField === field && (sortDir === "desc" ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />)}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {loadingListings ? (
                        Array.from({ length: 8 }).map((_, i) => (
                          <tr key={i} className="border-b border-[#111e33]">
                            {Array.from({ length: 8 }).map((_, j) => (
                              <td key={j} className="px-3 py-2.5"><div className="h-3 bg-[#0d1526] rounded animate-pulse w-3/4" /></td>
                            ))}
                          </tr>
                        ))
                      ) : sorted.length === 0 ? (
                        <tr><td colSpan={8} className="text-center py-12 text-[#2a3d5a] font-mono text-sm">NO LISTINGS MATCH CURRENT FILTERS</td></tr>
                      ) : sorted.map((l) => (
                        <tr key={l.id} onClick={() => setSelectedListing(s => s?.id === l.id ? null : l)}
                          className={`ticker-row ${selectedListing?.id === l.id ? "bg-[#0d1e35] border-l-2 border-l-[#2563eb]" : ""}`}>
                          <td className="px-3 py-2.5 text-[#4a6080]">#{l.id}</td>
                          <td className="px-3 py-2.5">
                            <span className={`uppercase font-semibold ${l.industry === "medicare" ? "text-[#a78bfa]" : l.industry === "healthcare" ? "text-[#38bdf8]" : "text-[#00d084]"}`}>
                              {l.industry}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-[#94b4d4]">
                            <div className="flex items-center gap-1"><MapPin className="w-3 h-3 text-[#2a4060]" />{l.geography}</div>
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-[#0d1526] rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${l.qualityScore}%`, backgroundColor: qColor(l.qualityScore) }} />
                              </div>
                              <span style={{ color: qColor(l.qualityScore) }}>{l.qualityScore}</span>
                              <span className="text-[9px] px-1 py-0.5 rounded-sm" style={{ color: qColor(l.qualityScore), backgroundColor: `${qColor(l.qualityScore)}18` }}>
                                {qLabel(l.qualityScore)}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-2.5">
                            <span className={l.timesResold > 2 ? "text-[#ff4d4d]" : l.timesResold > 0 ? "text-[#fbbf24]" : "text-[#00d084]"}>{l.timesResold}x</span>
                          </td>
                          <td className="px-3 py-2.5"><span className="text-[#00d084] font-bold">${parseFloat(l.price).toFixed(2)}</span></td>
                          <td className="px-3 py-2.5 text-[#2a4060]">{new Date(l.createdAt).toLocaleDateString()}</td>
                          <td className="px-3 py-2.5">
                            <button onClick={e => { e.stopPropagation(); openPurchaseModal(l.id); }}
                              className="btn-buy text-[10px] flex items-center gap-1">
                              <ShoppingCart className="w-3 h-3" /> BUY
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Detail panel */}
                {selectedListing && (
                  <div className="w-72 border-l border-[#1e2d4a] bg-[#0a1120] flex flex-col flex-shrink-0 overflow-auto">
                    <div className="terminal-header flex items-center justify-between">
                      <span className="text-[10px] font-mono text-[#4a6080] tracking-widest">LEAD DETAIL</span>
                      <button onClick={() => setSelectedListing(null)} className="text-[#2a4060] hover:text-[#94b4d4] text-xs">✕</button>
                    </div>
                    <div className="p-4 space-y-4">
                      <div>
                        <p className="terminal-label mb-1">Listing ID</p>
                        <p className="font-mono text-[#38bdf8] text-lg font-bold">#{selectedListing.id}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: "Industry",    value: selectedListing.industry.toUpperCase(), color: "#38bdf8" },
                          { label: "Geography",   value: selectedListing.geography,              color: "#94b4d4" },
                          { label: "Times Resold",value: `${selectedListing.timesResold}x`,      color: selectedListing.timesResold > 2 ? "#ff4d4d" : "#00d084" },
                          { label: "Status",      value: selectedListing.isActive ? "ACTIVE" : "SOLD", color: selectedListing.isActive ? "#00d084" : "#ff4d4d" },
                        ].map(({ label, value, color }) => (
                          <div key={label} className="bg-[#060e1c] border border-[#1e2d4a] rounded-sm p-2">
                            <p className="terminal-label">{label}</p>
                            <p className="font-mono text-xs font-semibold mt-0.5" style={{ color }}>{value}</p>
                          </div>
                        ))}
                      </div>
                      <div className="bg-[#060e1c] border border-[#1e2d4a] rounded-sm p-3">
                        <p className="terminal-label mb-2">Quality Score</p>
                        <div className="flex items-end gap-2 mb-2">
                          <span className="text-3xl font-mono font-bold" style={{ color: qColor(selectedListing.qualityScore) }}>{selectedListing.qualityScore}</span>
                          <span className="text-[10px] text-[#4a6080] pb-1">/ 100</span>
                        </div>
                        <div className="w-full h-2 bg-[#0d1526] rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${selectedListing.qualityScore}%`, backgroundColor: qColor(selectedListing.qualityScore) }} />
                        </div>
                        <p className="text-[9px] text-[#2a4060] mt-1">Est. market value: <span className="text-[#fbbf24]">${MARKET_VALUE[selectedListing.industry] || 32}</span></p>
                      </div>
                      <div className="bg-[#060e1c] border border-[#1e2d4a] rounded-sm p-3">
                        <p className="terminal-label mb-1">Ask Price</p>
                        <p className="text-2xl font-mono font-bold text-[#00d084]">${parseFloat(selectedListing.price).toFixed(2)}</p>
                        <p className="text-[9px] text-[#4a6080] mt-1">
                          Balance after: <span className={balance >= parseFloat(selectedListing.price) ? "text-[#00d084]" : "text-[#ff4d4d]"}>
                            ${Math.max(0, balance - parseFloat(selectedListing.price)).toFixed(2)}
                          </span>
                        </p>
                      </div>
                      <button onClick={() => openPurchaseModal(selectedListing.id)}
                        className="w-full py-3 bg-[#0a2e1a] hover:bg-[#0d3d22] border border-[#00d084] text-[#00d084] font-mono font-bold text-sm rounded-sm transition-colors flex items-center justify-center gap-2">
                        <ShoppingCart className="w-4 h-4" /> PLACE ORDER
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── AI SIGNALS ── */}
            {activeTab === "predictions" && (
              <div className="flex-1 overflow-auto p-4 space-y-4">
                <div className="terminal-card">
                  <div className="terminal-header flex items-center justify-between">
                    <span className="text-[10px] font-mono text-[#4a6080] tracking-widest">REAL-TIME DEMAND INDEX — INTRADAY</span>
                    <div className="flex gap-3">
                      {[["#38bdf8", "ACA"], ["#a78bfa", "Medicare"], ["#00d084", "Final Exp"]].map(([c, l]) => (
                        <div key={l} className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c }} />
                          <span className="text-[9px] font-mono text-[#4a6080]">{l}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="p-4 h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={demandHistory}>
                        <defs>
                          {[["aca", "#38bdf8"], ["medicare", "#a78bfa"], ["finalExp", "#00d084"]].map(([k, c]) => (
                            <linearGradient key={k} id={`g-${k}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={c} stopOpacity={0.3} />
                              <stop offset="95%" stopColor={c} stopOpacity={0} />
                            </linearGradient>
                          ))}
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" /><YAxis domain={[40, 100]} />
                        <Tooltip content={<CT />} />
                        <Area type="monotone" dataKey="aca"      stroke="#38bdf8" fill="url(#g-aca)"      strokeWidth={1.5} name="ACA" />
                        <Area type="monotone" dataKey="medicare" stroke="#a78bfa" fill="url(#g-medicare)" strokeWidth={1.5} name="Medicare" />
                        <Area type="monotone" dataKey="finalExp" stroke="#00d084" fill="url(#g-finalExp)" strokeWidth={1.5} name="Final Exp" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {predictions.length === 0 ? (
                    <div className="col-span-full terminal-card p-8 text-center">
                      <p className="text-[#2a4060] font-mono text-sm mb-4">NO ACTIVE SIGNALS</p>
                      <button onClick={() => genPrediction.mutate({ industry: "healthcare", geography: "CA" })}
                        className="btn-terminal flex items-center gap-2 mx-auto">
                        <Zap className="w-3.5 h-3.5" /> GENERATE SIGNAL
                      </button>
                    </div>
                  ) : predictions.map((p) => {
                    const conf = parseFloat(p.confidence);
                    const dc = p.predictedDemand >= 75 ? "#00d084" : p.predictedDemand >= 50 ? "#fbbf24" : "#ff4d4d";
                    const radarData = [
                      { subject: "Seasonal",  value: p.factors?.seasonality  || 0 },
                      { subject: "Economic",  value: p.factors?.economic     || 0 },
                      { subject: "Reg.",      value: p.factors?.regulatory   || 0 },
                      { subject: "Hist.",     value: p.factors?.historical   || 0 },
                    ];
                    return (
                      <div key={p.id} className="terminal-card">
                        <div className="terminal-header flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-mono font-bold uppercase" style={{ color: dc }}>{p.industry}</span>
                            <span className="text-[9px] text-[#4a6080] ml-2">· {p.geography}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {p.predictedDemand >= 75 ? <ArrowUpRight className="w-3 h-3 text-[#00d084]" /> : <ArrowDownRight className="w-3 h-3 text-[#ff4d4d]" />}
                            <span className="font-mono font-bold text-sm" style={{ color: dc }}>{p.predictedDemand}</span>
                          </div>
                        </div>
                        <div className="p-3 flex gap-3">
                          <div className="flex-1">
                            <div className="mb-2">
                              <p className="terminal-label mb-1">Confidence</p>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 bg-[#0d1526] rounded-full overflow-hidden">
                                  <div className="h-full rounded-full bg-[#38bdf8]" style={{ width: `${conf}%` }} />
                                </div>
                                <span className="text-[10px] font-mono text-[#38bdf8]">{conf.toFixed(0)}%</span>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-1 text-[10px]">
                              {radarData.map(r => (
                                <div key={r.subject}>
                                  <p className="terminal-label">{r.subject}</p>
                                  <p className="font-mono text-[#94b4d4]">{r.value}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="w-24 h-24 flex-shrink-0">
                            <ResponsiveContainer width="100%" height="100%">
                              <RadarChart data={radarData}>
                                <PolarGrid stroke="#1e2d4a" />
                                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 7, fill: "#2a4060" }} />
                                <Radar dataKey="value" stroke={dc} fill={dc} fillOpacity={0.2} />
                              </RadarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                        <div className="px-3 pb-3">
                          <button onClick={() => genPrediction.mutate({ industry: p.industry, geography: p.geography })}
                            className="btn-terminal w-full text-center flex items-center justify-center gap-1 text-[10px]">
                            <RefreshCw className="w-3 h-3" /> REFRESH SIGNAL
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="terminal-card p-4">
                  <p className="terminal-label mb-3">GENERATE NEW AI SIGNAL</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { industry: "healthcare", geography: "CA" }, { industry: "medicare",   geography: "FL" },
                      { industry: "insurance",  geography: "TX" }, { industry: "healthcare", geography: "NY" },
                      { industry: "medicare",   geography: "NY" }, { industry: "insurance",  geography: "CA" },
                    ].map(({ industry, geography }) => (
                      <button key={`${industry}-${geography}`}
                        onClick={() => genPrediction.mutate({ industry, geography })}
                        disabled={genPrediction.isPending}
                        className="btn-terminal flex items-center gap-1">
                        <Zap className="w-3 h-3" /> {industry.toUpperCase()} / {geography}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── GEO HEAT MAP ── */}
            {activeTab === "geo" && (
              <div className="flex-1 overflow-auto p-4 space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="terminal-card">
                    <div className="terminal-header"><span className="text-[10px] font-mono text-[#4a6080] tracking-widest">VOLUME BY STATE — 7 DAY</span></div>
                    <div className="p-4 h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={geoData}>
                          <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="state" /><YAxis />
                          <Tooltip content={<CT />} />
                          <Bar dataKey="volume" fill="#38bdf8" fillOpacity={0.8} radius={[2, 2, 0, 0]} name="Volume" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="terminal-card">
                    <div className="terminal-header"><span className="text-[10px] font-mono text-[#4a6080] tracking-widest">AVG PRICE BY STATE</span></div>
                    <div className="p-4 h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={geoData}>
                          <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="state" /><YAxis />
                          <Tooltip content={<CT />} />
                          <Bar dataKey="avgPrice" fill="#00d084" fillOpacity={0.8} radius={[2, 2, 0, 0]} name="Avg $" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
                <div className="terminal-card">
                  <div className="terminal-header"><span className="text-[10px] font-mono text-[#4a6080] tracking-widest">REGIONAL PERFORMANCE MATRIX</span></div>
                  <table className="w-full text-[11px] font-mono">
                    <thead><tr className="border-b border-[#1e2d4a]">{["STATE", "LEAD VOLUME", "DEMAND INDEX", "AVG PRICE", "TREND"].map(h => <th key={h} className="text-left px-4 py-2 text-[9px] tracking-widest text-[#4a6080]">{h}</th>)}</tr></thead>
                    <tbody>
                      {geoData.map((g, i) => (
                        <tr key={g.state} className="ticker-row">
                          <td className="px-4 py-2.5 text-[#38bdf8] font-bold">{g.state}</td>
                          <td className="px-4 py-2.5 text-[#94b4d4]">{g.volume.toLocaleString()}</td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              <div className="w-20 h-1.5 bg-[#0d1526] rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${g.demand}%`, backgroundColor: qColor(g.demand) }} />
                              </div>
                              <span style={{ color: qColor(g.demand) }}>{g.demand}</span>
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-[#00d084] font-bold">${g.avgPrice}</td>
                          <td className="px-4 py-2.5">
                            <span className={`flex items-center gap-1 ${i % 2 === 0 ? "text-[#00d084]" : "text-[#ff4d4d]"}`}>
                              {i % 2 === 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                              {i % 2 === 0 ? "+3.2%" : "-1.4%"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="terminal-card">
                  <div className="terminal-header"><span className="text-[10px] font-mono text-[#4a6080] tracking-widest">PRICE HISTORY — WEEKLY</span></div>
                  <div className="p-4 h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={priceHistory}>
                        <defs>
                          <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#00d084" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#00d084" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="day" /><YAxis />
                        <Tooltip content={<CT />} />
                        <Area type="monotone" dataKey="avg" stroke="#00d084" fill="url(#pg)" strokeWidth={2} name="Avg $" />
                        <Line type="monotone" dataKey="high" stroke="#fbbf24" strokeWidth={1} strokeDasharray="4 4" name="High" dot={false} />
                        <Line type="monotone" dataKey="low"  stroke="#ff4d4d" strokeWidth={1} strokeDasharray="4 4" name="Low"  dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* ── MY LEADS (Portfolio) ── */}
            {activeTab === "holdings" && (
              <div className="flex-1 overflow-auto p-4 space-y-4">
                {/* Portfolio KPIs */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: "HOLDINGS",        value: portfolio.length.toString(),    color: "#38bdf8" },
                    { label: "TOTAL INVESTED",  value: `$${totalInvested.toFixed(2)}`, color: "#ff4d4d" },
                    { label: "PORTFOLIO VALUE", value: `$${portfolioValue.toFixed(2)}`,color: "#00d084" },
                    { label: "UNREALIZED P&L",  value: `${unrealizedPnl >= 0 ? "+" : ""}$${unrealizedPnl.toFixed(2)}`, color: unrealizedPnl >= 0 ? "#00d084" : "#ff4d4d" },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="terminal-card p-4">
                      <p className="terminal-label mb-1.5">{label}</p>
                      <p className="text-xl font-mono font-bold" style={{ color }}>{value}</p>
                    </div>
                  ))}
                </div>

                {/* Holdings table */}
                <div className="terminal-card">
                  <div className="terminal-header flex items-center justify-between">
                    <span className="text-[10px] font-mono text-[#4a6080] tracking-widest">LEAD PORTFOLIO — {portfolio.length} HOLDINGS</span>
                    <span className="text-[9px] font-mono text-[#2a4060]">Est. values based on market avg</span>
                  </div>
                  {loadingPortfolio ? (
                    <div className="p-8 text-center">
                      <div className="inline-block w-5 h-5 border-2 border-[#2563eb] border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : portfolio.length === 0 ? (
                    <div className="py-12 text-center">
                      <Briefcase className="w-8 h-8 text-[#1e2d4a] mx-auto mb-3" />
                      <p className="text-[#2a4060] font-mono text-sm">NO HOLDINGS YET</p>
                      <p className="text-[10px] text-[#1e2d4a] font-mono mt-1">Purchase leads from the Order Book to build your portfolio</p>
                      <button onClick={() => setActiveTab("order-book")} className="btn-terminal mt-4 flex items-center gap-2 mx-auto">
                        <ShoppingCart className="w-3.5 h-3.5" /> GO TO ORDER BOOK
                      </button>
                    </div>
                  ) : (
                    <div className="overflow-auto">
                      <table className="w-full text-[11px] font-mono border-collapse">
                        <thead className="sticky top-0 bg-[#050a14] z-10">
                          <tr className="border-b border-[#1e2d4a]">
                            {["ACQUIRED", "INDUSTRY", "STATE", "LEAD", "QUALITY", "COST", "MKT VALUE", "P&L"].map(h => (
                              <th key={h} className="text-left px-3 py-2 text-[9px] tracking-widest text-[#4a6080] border-r border-[#111e33] last:border-r-0">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {portfolio.map((p) => {
                            const mktVal = MARKET_VALUE[p.industry?.toLowerCase() || ""] || 32;
                            const paid = parseFloat(p.pricePaid);
                            const pnl = mktVal - paid;
                            return (
                              <tr key={p.purchaseId} className="ticker-row">
                                <td className="px-3 py-2.5 text-[#2a4060]">
                                  <div className="flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{new Date(p.purchaseDate!).toLocaleDateString()}</div>
                                </td>
                                <td className="px-3 py-2.5">
                                  <span className={`font-semibold uppercase ${p.industry === "medicare" ? "text-[#a78bfa]" : p.industry === "healthcare" ? "text-[#38bdf8]" : "text-[#00d084]"}`}>
                                    {p.industry || "—"}
                                  </span>
                                </td>
                                <td className="px-3 py-2.5 text-[#94b4d4]">{p.geography || "—"}</td>
                                <td className="px-3 py-2.5 text-[#c8daf0]">
                                  {p.firstName ? `${p.firstName} ${p.lastName?.charAt(0)}.` : `Lead #${p.leadId}`}
                                </td>
                                <td className="px-3 py-2.5">
                                  <span style={{ color: qColor(p.qualityAtPurchase) }}>{p.qualityAtPurchase}</span>
                                </td>
                                <td className="px-3 py-2.5 font-bold text-[#ff4d4d]">${paid.toFixed(2)}</td>
                                <td className="px-3 py-2.5 font-bold text-[#fbbf24]">${mktVal.toFixed(2)}</td>
                                <td className="px-3 py-2.5">
                                  <span className={`flex items-center gap-1 font-bold ${pnl >= 0 ? "text-[#00d084]" : "text-[#ff4d4d]"}`}>
                                    {pnl >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                    {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── FUND ACCOUNT ── */}
            {activeTab === "credits" && (
              <div className="flex-1 overflow-auto p-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Account summary */}
                  <div className="terminal-card lg:col-span-1 flex flex-col">
                    <div className="terminal-header"><span className="text-[10px] font-mono text-[#4a6080] tracking-widest">ACCOUNT SUMMARY</span></div>
                    <div className="p-4 space-y-4">
                      <div>
                        <p className="terminal-label">Available Balance</p>
                        <p className="text-3xl font-mono font-bold text-[#00d084] mt-1">${balance.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="terminal-label">Total Deposited</p>
                        <p className="text-lg font-mono font-bold text-[#38bdf8]">${creditAccount?.totalPurchased || "0.00"}</p>
                      </div>
                      <div className="border-t border-[#1e2d4a] pt-3">
                        <p className="terminal-label mb-2">Buying Power</p>
                        <div className="w-full h-2 bg-[#0d1526] rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-[#00d084] to-[#38bdf8]"
                            style={{ width: `${Math.min(100, (balance / Math.max(1, parseFloat(creditAccount?.totalPurchased || "1"))) * 100)}%` }} />
                        </div>
                      </div>
                    </div>

                    {/* Transaction Ledger */}
                    <div className="border-t border-[#1e2d4a] flex-1">
                      <div className="px-4 py-2 bg-[#060e1c]">
                        <span className="text-[9px] font-mono tracking-widest text-[#4a6080]">TRANSACTION LEDGER</span>
                      </div>
                      <div className="divide-y divide-[#0d1526] max-h-64 overflow-y-auto">
                        {transactions.length === 0 ? (
                          <p className="text-center py-4 text-[10px] text-[#2a4060] font-mono">NO TRANSACTIONS</p>
                        ) : transactions.slice(0, 20).map((tx) => {
                          const isDeposit = tx.type === "purchase";
                          return (
                            <div key={tx.id} className="flex items-center gap-2 px-4 py-2.5 hover:bg-[#0f1e35] transition-colors">
                              <div className={`w-5 h-5 rounded-sm flex items-center justify-center flex-shrink-0 ${isDeposit ? "bg-[#00d08418]" : "bg-[#ff4d4d18]"}`}>
                                {isDeposit
                                  ? <ArrowDownLeft className="w-3 h-3 text-[#00d084]" />
                                  : <ArrowUp className="w-3 h-3 text-[#ff4d4d]" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-mono text-[#94b4d4] truncate">{tx.description}</p>
                                <p className="text-[9px] font-mono text-[#2a4060]">{new Date(tx.createdAt).toLocaleDateString()}</p>
                              </div>
                              <p className={`text-[11px] font-mono font-bold flex-shrink-0 ${isDeposit ? "text-[#00d084]" : "text-[#ff4d4d]"}`}>
                                {isDeposit ? "+" : "−"}${parseFloat(tx.amount).toFixed(2)}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Credit packages */}
                  <div className="lg:col-span-2 space-y-3">
                    <p className="text-[10px] font-mono text-[#4a6080] tracking-widest uppercase">Select Deposit Package</p>
                    {creditPackages.map((pkg) => (
                      <div key={pkg.id} className="terminal-card border border-[#1e2d4a] hover:border-[#2563eb] transition-colors">
                        <div className="flex items-center justify-between p-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono font-bold text-[#c8daf0]">{pkg.name.toUpperCase()}</span>
                              {parseFloat(pkg.discountPercentage) > 0 && (
                                <span className="text-[9px] bg-[#00d08420] text-[#00d084] border border-[#00d08440] px-1.5 py-0.5 rounded-sm font-mono">
                                  {pkg.discountPercentage}% OFF
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-[#4a6080] font-mono">
                              {pkg.credits.toLocaleString()} credits · ${(parseFloat(pkg.price) / pkg.credits).toFixed(2)}/credit
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="terminal-label">Total Cost</p>
                              <p className="text-xl font-mono font-bold text-[#00d084]">${pkg.price}</p>
                            </div>
                            <button onClick={() => creditMutation.mutate(pkg)} disabled={creditMutation.isPending}
                              className="btn-buy flex items-center gap-2 px-4 py-2">
                              <CreditCard className="w-3.5 h-3.5" /> DEPOSIT
                            </button>
                          </div>
                        </div>
                        <div className="h-0.5 bg-gradient-to-r from-[#38bdf8] via-[#00d084] to-transparent" style={{ width: `${(pkg.credits / 5000) * 100}%` }} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
