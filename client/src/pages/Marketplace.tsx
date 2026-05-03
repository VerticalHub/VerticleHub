import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import PurchaseConfirmModal from "@/components/PurchaseConfirmModal";
import ScoreBadge from "@/components/ScoreBadge";
import {
  BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import {
  ShoppingCart, TrendingUp, Star, Award, AlertTriangle, Package,
  DollarSign, Filter, Search, Bell, Heart, HeartOff, BellOff, BellRing,
  ArrowUpDown, Zap, X, SlidersHorizontal, ChevronDown, ChevronUp, RotateCcw,
} from "lucide-react";

const STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"];

type Tab = "order-book" | "watchlist" | "portfolio" | "ai-signals";

const COLORS: Record<string, string> = { healthcare: "#38bdf8", medicare: "#a78bfa", insurance: "#fbbf24", final_expense: "#00d084" };

function valueScore(q: number, price: string) {
  const p = parseFloat(price);
  if (!p) return 0;
  return Math.min(99, Math.round((q / p) * 10));
}

function VsChip({ score }: { score: number }) {
  const cls = score >= 25 ? "vs-high" : score >= 15 ? "vs-med" : "vs-low";
  return <span className={`font-mono text-[11px] ${cls} num`}>{score}</span>;
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#0d1e3a] border border-[#2563eb50] text-[#38bdf8] text-[9px] font-mono rounded-sm">
      {label}
      <button onClick={onRemove} className="hover:text-white transition-colors"><X className="w-2.5 h-2.5" /></button>
    </span>
  );
}

export default function Marketplace() {
  const [tab, setTab]             = useState<Tab>("order-book");
  const [search, setSearch]       = useState("");
  const [filterIndustry, setFI]   = useState("");
  const [filterGeo, setFG]        = useState("");
  const [sortBy, setSortBy]       = useState<"quality"|"price"|"value"|"featured"|"score"|"newest"|"oldest">("featured");
  const [confirmListing, setConfirm] = useState<any>(null);
  const [alertForm, setAlertForm] = useState({ industry: "medicare", geography: "FL", targetPrice: "" });
  const [showAlertForm, setShowAlertForm] = useState(false);

  // ── Advanced filter sidebar state ─────────────────────────────────────────
  const [showFilters, setShowFilters]   = useState(true);
  const [fState, setFState]             = useState("");
  const [fAgeMin, setFAgeMin]           = useState("");
  const [fAgeMax, setFAgeMax]           = useState("");
  const [fTypes, setFTypes]             = useState<Set<string>>(new Set());
  const [fPriceMin, setFPriceMin]       = useState("");
  const [fPriceMax, setFPriceMax]       = useState("");
  const [fScoreMin, setFScoreMin]       = useState("");
  const [fScoreMax, setFScoreMax]       = useState("");
  const [fLeadAge, setFLeadAge]         = useState("");
  const [fTcpa, setFTcpa]               = useState("");

  const toggleType = (t: string) => setFTypes(prev => {
    const n = new Set(prev);
    n.has(t) ? n.delete(t) : n.add(t);
    return n;
  });
  const clearFilters = () => {
    setSearch(""); setFI(""); setFG(""); setFState("");
    setFAgeMin(""); setFAgeMax(""); setFTypes(new Set());
    setFPriceMin(""); setFPriceMax(""); setFScoreMin(""); setFScoreMax("");
    setFLeadAge(""); setFTcpa("");
  };
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: listingsResp, isLoading } = useQuery<any>({
    queryKey: ["/api/lead-listings"],
    queryFn: () => fetch("/api/lead-listings").then(r => r.json()),
    refetchInterval: 15_000,
  });

  const { data: creditsResp } = useQuery<any>({
    queryKey: ["/api/credits/1"],
    queryFn: () => fetch("/api/credits/1").then(r => r.json()),
    refetchInterval: 30_000,
  });

  const { data: purchasesResp } = useQuery<any>({
    queryKey: ["/api/purchases/1/detailed"],
    queryFn: () => fetch("/api/purchases/1/detailed").then(r => r.json()),
  });

  const { data: predsResp } = useQuery<any>({
    queryKey: ["/api/demand-predictions"],
    queryFn: () => fetch("/api/demand-predictions").then(r => r.json()),
    enabled: tab === "ai-signals",
  });

  const { data: trendsResp } = useQuery<any>({
    queryKey: ["/api/market-trends"],
    queryFn: () => fetch("/api/market-trends").then(r => r.json()),
    enabled: tab === "ai-signals",
  });

  const { data: watchlistResp } = useQuery<any>({
    queryKey: ["/api/watchlist"],
    queryFn: () => fetch("/api/watchlist?userId=1").then(r => r.json()),
    refetchInterval: 30_000,
  });

  const { data: priceAlertsResp } = useQuery<any>({
    queryKey: ["/api/price-alerts"],
    queryFn: () => fetch("/api/price-alerts?userId=1").then(r => r.json()),
  });

  const { data: packagesResp } = useQuery<any>({
    queryKey: ["/api/credit-packages"],
    queryFn: () => fetch("/api/credit-packages").then(r => r.json()),
  });

  const allListings: any[]   = listingsResp?.data || [];
  const credits              = parseFloat(creditsResp?.data?.balance || "0");
  const purchases: any[]     = purchasesResp?.data || [];
  const predictions: any[]   = predsResp?.data || [];
  const trends: any[]        = trendsResp?.data || [];
  const watchlistIds         = new Set((watchlistResp?.data || []).map((w: any) => w.listingId));
  const priceAlerts: any[]   = priceAlertsResp?.data || [];
  const packages: any[]      = packagesResp?.data || [];

  // ── Filter + sort listings ─────────────────────────────────────────────────
  const filtered = allListings
    .filter(l => {
      const ld = l.leadData;
      // text search
      if (search && !`${l.industry} ${l.geography} ${ld?.state || ""}`.toLowerCase().includes(search.toLowerCase())) return false;
      // industry (legacy inline filter)
      if (filterIndustry && l.industry !== filterIndustry) return false;
      // state
      const st = fState || filterGeo;
      if (st && ld?.state !== st && l.geography !== st) return false;
      // lead type (interest)
      if (fTypes.size > 0) {
        const match = (fTypes.has("Medicare") && ld?.interestedInMedicare)
          || (fTypes.has("ACA") && ld?.interestedInACA)
          || (fTypes.has("FinalExpense") && ld?.interestedInFinalExpense);
        if (!match) return false;
      }
      // price range
      const price = parseFloat(l.price);
      if (fPriceMin && price < parseFloat(fPriceMin)) return false;
      if (fPriceMax && price > parseFloat(fPriceMax)) return false;
      // AI score range
      const score = ld?.leadScore ?? l.qualityScore;
      if (fScoreMin && score < parseInt(fScoreMin)) return false;
      if (fScoreMax && score > parseInt(fScoreMax)) return false;
      // age of lead (capture recency in days)
      if (fLeadAge && ld?.createdAt) {
        const ageDays = (Date.now() - new Date(ld.createdAt).getTime()) / 86_400_000;
        if (ageDays > parseInt(fLeadAge)) return false;
      }
      // TCPA
      if (fTcpa === "yes" && !ld?.tcpaConsent) return false;
      if (fTcpa === "no"  &&  ld?.tcpaConsent) return false;
      // subject age range (from DOB)
      if ((fAgeMin || fAgeMax) && ld?.dateOfBirth) {
        const subAge = Math.floor((Date.now() - new Date(ld.dateOfBirth).getTime()) / (365.25 * 86_400_000));
        if (fAgeMin && subAge < parseInt(fAgeMin)) return false;
        if (fAgeMax && subAge > parseInt(fAgeMax)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "featured") {
        if (a.featured !== b.featured) return a.featured ? -1 : 1;
        return b.qualityScore - a.qualityScore;
      }
      if (sortBy === "score")   return (b.leadData?.leadScore ?? b.qualityScore) - (a.leadData?.leadScore ?? a.qualityScore);
      if (sortBy === "quality") return b.qualityScore - a.qualityScore;
      if (sortBy === "price")   return parseFloat(a.price) - parseFloat(b.price);
      if (sortBy === "value")   return valueScore(b.qualityScore, b.price) - valueScore(a.qualityScore, a.price);
      if (sortBy === "newest")  return new Date(b.leadData?.createdAt || b.createdAt || 0).getTime() - new Date(a.leadData?.createdAt || a.createdAt || 0).getTime();
      if (sortBy === "oldest")  return new Date(a.leadData?.createdAt || a.createdAt || 0).getTime() - new Date(b.leadData?.createdAt || b.createdAt || 0).getTime();
      return 0;
    });

  // active filter count for badge
  const activeFilterCount = [
    search, fState, filterGeo, filterIndustry,
    fAgeMin, fAgeMax, fPriceMin, fPriceMax,
    fScoreMin, fScoreMax, fLeadAge, fTcpa,
  ].filter(Boolean).length + fTypes.size;

  // Watchlist listings with full detail
  const watchlistListings = allListings.filter(l => watchlistIds.has(l.id));

  // ── Mutations ──────────────────────────────────────────────────────────────
  const purchaseMutation = useMutation({
    mutationFn: ({ listingId, buyerId }: any) =>
      apiRequest("POST", `/api/lead-listings/${listingId}/purchase`, { buyerId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lead-listings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/credits/1"] });
      queryClient.invalidateQueries({ queryKey: ["/api/purchases/1/detailed"] });
      queryClient.invalidateQueries({ queryKey: ["/api/alerts/unread"] });
      setConfirm(null);
      toast({ title: "Lead acquired", description: "Lead added to your portfolio." });
    },
    onError: (err: any) => {
      toast({ title: "Purchase failed", description: err?.message || "Could not complete purchase.", variant: "destructive" });
    },
  });

  const watchlistMutation = useMutation({
    mutationFn: ({ listingId }: { listingId: number }) =>
      apiRequest("POST", "/api/watchlist", { userId: 1, listingId }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["/api/watchlist"] });
      const now = watchlistIds.has(vars.listingId);
      toast({ title: now ? "Removed from watchlist" : "Added to watchlist" });
    },
  });

  const deleteAlertMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/price-alerts/${id}`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/price-alerts"] }),
  });

  const createAlertMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/price-alerts", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/price-alerts"] });
      setShowAlertForm(false);
      setAlertForm({ industry: "medicare", geography: "FL", targetPrice: "" });
      toast({ title: "Price alert created", description: "We'll notify you when a match appears." });
    },
  });

  const depositMutation = useMutation({
    mutationFn: ({ packageId, amount }: any) =>
      apiRequest("POST", "/api/credits/purchase", { userId: 1, packageId, amount }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/credits/1"] });
      toast({ title: "Credits deposited" });
    },
  });

  const geos = [...new Set(allListings.map(l => l.geography))].sort();
  const industries = [...new Set(allListings.map(l => l.industry))].sort();

  const radarData = [
    { axis: "Volume",     value: Math.min(100, trends.length * 3) },
    { axis: "Demand",     value: predictions.length ? Math.round(predictions.reduce((s: number, p: any) => s + p.predictedDemand, 0) / predictions.length) : 70 },
    { axis: "Quality",    value: allListings.length ? Math.round(allListings.reduce((s, l) => s + l.qualityScore, 0) / allListings.length) : 80 },
    { axis: "Value",      value: allListings.length ? Math.min(99, Math.round(allListings.reduce((s, l) => s + valueScore(l.qualityScore, l.price), 0) / allListings.length)) : 60 },
    { axis: "Liquidity",  value: 82 },
  ];

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "order-book", label: "ORDER BOOK",    icon: ShoppingCart },
    { id: "watchlist",  label: `WATCHLIST (${watchlistIds.size})`, icon: Heart },
    { id: "portfolio",  label: "PORTFOLIO",     icon: Package      },
    { id: "ai-signals", label: "AI SIGNALS",    icon: Zap          },
  ];

  return (
    <div className="min-h-screen bg-[#070d1a] flex flex-col">
      <Header />

      {/* Purchase confirm modal */}
      {confirmListing && (
        <PurchaseConfirmModal
          listing={confirmListing}
          balance={credits}
          onConfirm={() => purchaseMutation.mutate({ listingId: confirmListing.id, buyerId: 1 })}
          onCancel={() => setConfirm(null)}
          isPending={purchaseMutation.isPending}
        />
      )}

      <main className="flex-1 p-4 md:p-6 max-w-screen-2xl mx-auto w-full">
        {/* Header bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="text-[14px] font-mono font-bold text-[#c8daf0] tracking-widest">LEAD MARKETPLACE</h1>
            <p className="text-[10px] font-mono text-[#4a6080]">Real-time lead exchange · {allListings.length} total listings</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-[#0d1526] border border-[#1e2d4a] rounded-sm px-3 py-2">
              <DollarSign className="w-3.5 h-3.5 text-[#00d084]" />
              <span className="text-[13px] font-mono font-bold text-[#00d084] num">${credits.toFixed(2)}</span>
              <span className="text-[9px] font-mono text-[#2a4060]">BALANCE</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-0 border-b border-[#1e2d4a] mb-5">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-[10px] font-mono tracking-widest border-b-2 transition-all -mb-px ${
                tab === t.id ? "text-[#38bdf8] border-[#38bdf8]" : "text-[#4a6080] border-transparent hover:text-[#94b4d4]"
              }`}>
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        {/* ── ORDER BOOK ──────────────────────────────────────────────────── */}
        {tab === "order-book" && (
          <div className="fade-in flex gap-4 items-start">

            {/* ── FILTER SIDEBAR ─────────────────────────────────────────── */}
            {showFilters && (
              <div className="w-52 shrink-0 bg-[#0d1526] border border-[#1e2d4a] rounded-sm sticky top-4 overflow-hidden">
                {/* Sidebar header */}
                <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#1e2d4a] bg-[#091220]">
                  <div className="flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-[#38bdf8]" />
                    <span className="text-[10px] font-mono tracking-widest text-[#4a6080]">FILTERS</span>
                    {activeFilterCount > 0 && (
                      <span className="ml-1 bg-[#2563eb] text-white text-[9px] font-mono rounded-full px-1.5 py-0.5 leading-none">{activeFilterCount}</span>
                    )}
                  </div>
                  {activeFilterCount > 0 && (
                    <button onClick={clearFilters} className="flex items-center gap-1 text-[9px] font-mono text-[#ff4d4d] hover:text-[#ff8080] transition-colors">
                      <RotateCcw className="w-2.5 h-2.5" /> CLEAR
                    </button>
                  )}
                </div>

                <div className="p-3 space-y-4 max-h-[calc(100vh-220px)] overflow-y-auto">

                  {/* SEARCH */}
                  <div>
                    <label className="block text-[9px] font-mono tracking-widest text-[#3a5070] mb-1.5">SEARCH</label>
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[#2a4060]" />
                      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="industry, state..."
                        className="w-full bg-[#060e1c] border border-[#1e2d4a] text-[#94b4d4] text-[10px] font-mono pl-7 pr-2 py-1.5 rounded-sm focus:outline-none focus:border-[#2563eb] placeholder-[#2a4060]" />
                    </div>
                  </div>

                  {/* STATE */}
                  <div>
                    <label className="block text-[9px] font-mono tracking-widest text-[#3a5070] mb-1.5">STATE</label>
                    <select value={fState} onChange={e => setFState(e.target.value)}
                      className="w-full bg-[#060e1c] border border-[#1e2d4a] text-[#94b4d4] text-[10px] font-mono px-2 py-1.5 rounded-sm focus:outline-none focus:border-[#2563eb]">
                      <option value="">ALL STATES</option>
                      {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  {/* LEAD TYPE */}
                  <div>
                    <label className="block text-[9px] font-mono tracking-widest text-[#3a5070] mb-1.5">LEAD TYPE</label>
                    <div className="space-y-1.5">
                      {[
                        { key: "Medicare",    label: "Medicare",      color: "#a78bfa" },
                        { key: "ACA",         label: "ACA / Health",  color: "#38bdf8" },
                        { key: "FinalExpense",label: "Final Expense", color: "#00d084" },
                      ].map(({ key, label, color }) => (
                        <label key={key} className="flex items-center gap-2 cursor-pointer group">
                          <div onClick={() => toggleType(key)}
                            className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center transition-colors ${fTypes.has(key) ? "border-transparent" : "border-[#2a4060] bg-transparent"}`}
                            style={fTypes.has(key) ? { background: color } : {}}>
                            {fTypes.has(key) && <X className="w-2 h-2 text-black" />}
                          </div>
                          <span className="text-[10px] font-mono text-[#4a6080] group-hover:text-[#94b4d4] transition-colors">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* PRICE RANGE */}
                  <div>
                    <label className="block text-[9px] font-mono tracking-widest text-[#3a5070] mb-1.5">PRICE RANGE ($)</label>
                    <div className="flex items-center gap-1">
                      <input type="number" value={fPriceMin} onChange={e => setFPriceMin(e.target.value)} placeholder="Min"
                        className="w-1/2 bg-[#060e1c] border border-[#1e2d4a] text-[#94b4d4] text-[10px] font-mono px-2 py-1.5 rounded-sm focus:outline-none focus:border-[#2563eb] placeholder-[#2a4060]" />
                      <span className="text-[#2a4060] text-[10px]">–</span>
                      <input type="number" value={fPriceMax} onChange={e => setFPriceMax(e.target.value)} placeholder="Max"
                        className="w-1/2 bg-[#060e1c] border border-[#1e2d4a] text-[#94b4d4] text-[10px] font-mono px-2 py-1.5 rounded-sm focus:outline-none focus:border-[#2563eb] placeholder-[#2a4060]" />
                    </div>
                  </div>

                  {/* AI SCORE RANGE */}
                  <div>
                    <label className="block text-[9px] font-mono tracking-widest text-[#3a5070] mb-1.5">AI SCORE RANGE</label>
                    <div className="flex items-center gap-1">
                      <input type="number" min={0} max={100} value={fScoreMin} onChange={e => setFScoreMin(e.target.value)} placeholder="0"
                        className="w-1/2 bg-[#060e1c] border border-[#1e2d4a] text-[#94b4d4] text-[10px] font-mono px-2 py-1.5 rounded-sm focus:outline-none focus:border-[#2563eb] placeholder-[#2a4060]" />
                      <span className="text-[#2a4060] text-[10px]">–</span>
                      <input type="number" min={0} max={100} value={fScoreMax} onChange={e => setFScoreMax(e.target.value)} placeholder="100"
                        className="w-1/2 bg-[#060e1c] border border-[#1e2d4a] text-[#94b4d4] text-[10px] font-mono px-2 py-1.5 rounded-sm focus:outline-none focus:border-[#2563eb] placeholder-[#2a4060]" />
                    </div>
                    <div className="flex justify-between mt-1">
                      {[
                        { label: "PRIME", min: "80", max: "", color: "#00d084" },
                        { label: "GOOD",  min: "60", max: "79", color: "#fbbf24" },
                        { label: "LOW",   min: "",   max: "39", color: "#ff4d4d" },
                      ].map(p => (
                        <button key={p.label} onClick={() => { setFScoreMin(p.min); setFScoreMax(p.max); }}
                          className="text-[8px] font-mono px-1.5 py-0.5 rounded border transition-colors"
                          style={{ color: p.color, borderColor: p.color + "50", background: p.color + "12" }}>
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* SUBJECT AGE RANGE */}
                  <div>
                    <label className="block text-[9px] font-mono tracking-widest text-[#3a5070] mb-1.5">SUBJECT AGE (YRS)</label>
                    <div className="flex items-center gap-1">
                      <input type="number" value={fAgeMin} onChange={e => setFAgeMin(e.target.value)} placeholder="Min"
                        className="w-1/2 bg-[#060e1c] border border-[#1e2d4a] text-[#94b4d4] text-[10px] font-mono px-2 py-1.5 rounded-sm focus:outline-none focus:border-[#2563eb] placeholder-[#2a4060]" />
                      <span className="text-[#2a4060] text-[10px]">–</span>
                      <input type="number" value={fAgeMax} onChange={e => setFAgeMax(e.target.value)} placeholder="Max"
                        className="w-1/2 bg-[#060e1c] border border-[#1e2d4a] text-[#94b4d4] text-[10px] font-mono px-2 py-1.5 rounded-sm focus:outline-none focus:border-[#2563eb] placeholder-[#2a4060]" />
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {[["18-34","18","34"],["35-54","35","54"],["55-64","55","64"],["65+","65",""]].map(([label, min, max]) => (
                        <button key={label} onClick={() => { setFAgeMin(min); setFAgeMax(max); }}
                          className="text-[8px] font-mono text-[#4a6080] hover:text-[#38bdf8] px-1.5 py-0.5 rounded border border-[#1e2d4a] hover:border-[#38bdf840] transition-colors">
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* LEAD CAPTURE AGE */}
                  <div>
                    <label className="block text-[9px] font-mono tracking-widest text-[#3a5070] mb-1.5">LEAD FRESHNESS</label>
                    <div className="space-y-1">
                      {[
                        { label: "ALL TIME",   value: "" },
                        { label: "LAST 7 DAYS",  value: "7" },
                        { label: "LAST 30 DAYS", value: "30" },
                        { label: "LAST 90 DAYS", value: "90" },
                        { label: "LAST YEAR",  value: "365" },
                      ].map(opt => (
                        <label key={opt.value} className="flex items-center gap-2 cursor-pointer group">
                          <div onClick={() => setFLeadAge(opt.value)}
                            className={`w-3 h-3 rounded-full border-2 flex items-center justify-center transition-colors ${fLeadAge === opt.value ? "border-[#38bdf8]" : "border-[#2a4060]"}`}>
                            {fLeadAge === opt.value && <div className="w-1.5 h-1.5 rounded-full bg-[#38bdf8]" />}
                          </div>
                          <span className={`text-[10px] font-mono transition-colors ${fLeadAge === opt.value ? "text-[#38bdf8]" : "text-[#4a6080] group-hover:text-[#94b4d4]"}`}>
                            {opt.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* TCPA STATUS */}
                  <div>
                    <label className="block text-[9px] font-mono tracking-widest text-[#3a5070] mb-1.5">TCPA CONSENT</label>
                    <div className="space-y-1">
                      {[
                        { label: "ANY",          value: "" },
                        { label: "VERIFIED ✓",   value: "yes" },
                        { label: "NOT VERIFIED", value: "no" },
                      ].map(opt => (
                        <label key={opt.value} className="flex items-center gap-2 cursor-pointer group">
                          <div onClick={() => setFTcpa(opt.value)}
                            className={`w-3 h-3 rounded-full border-2 flex items-center justify-center transition-colors ${fTcpa === opt.value ? "border-[#00d084]" : "border-[#2a4060]"}`}>
                            {fTcpa === opt.value && <div className="w-1.5 h-1.5 rounded-full bg-[#00d084]" />}
                          </div>
                          <span className={`text-[10px] font-mono transition-colors ${fTcpa === opt.value ? "text-[#00d084]" : "text-[#4a6080] group-hover:text-[#94b4d4]"}`}>
                            {opt.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* ── MAIN CONTENT ───────────────────────────────────────────── */}
            <div className="flex-1 min-w-0 space-y-3">
              {/* Top control bar */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Filter toggle */}
                <button onClick={() => setShowFilters(v => !v)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-[10px] font-mono rounded-sm border transition-colors ${showFilters ? "bg-[#0d1e3a] border-[#2563eb] text-[#38bdf8]" : "bg-[#060e1c] border-[#1e2d4a] text-[#4a6080] hover:text-[#94b4d4]"}`}>
                  <Filter className="w-3.5 h-3.5" />
                  FILTERS
                  {activeFilterCount > 0 && (
                    <span className="bg-[#2563eb] text-white text-[9px] font-mono rounded-full px-1.5 py-0.5 leading-none">{activeFilterCount}</span>
                  )}
                </button>
                {/* Sort */}
                <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
                  className="bg-[#060e1c] border border-[#1e2d4a] text-[#94b4d4] text-[10px] font-mono px-3 py-2 rounded-sm focus:outline-none focus:border-[#2563eb]">
                  <option value="featured">SORT: FEATURED</option>
                  <option value="score">SORT: AI SCORE ↓</option>
                  <option value="quality">SORT: QUALITY</option>
                  <option value="value">SORT: VALUE SCORE</option>
                  <option value="price">SORT: PRICE ↑</option>
                  <option value="newest">SORT: NEWEST</option>
                  <option value="oldest">SORT: OLDEST</option>
                </select>
                <span className="ml-auto text-[10px] font-mono text-[#3a5070] num">{filtered.length} / {allListings.length} listings</span>
              </div>

              {/* Active filter chips */}
              {activeFilterCount > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {search && <Chip label={`"${search}"`} onRemove={() => setSearch("")} />}
                  {fState && <Chip label={`STATE: ${fState}`} onRemove={() => setFState("")} />}
                  {fAgeMin && <Chip label={`AGE ≥${fAgeMin}`} onRemove={() => setFAgeMin("")} />}
                  {fAgeMax && <Chip label={`AGE ≤${fAgeMax}`} onRemove={() => setFAgeMax("")} />}
                  {[...fTypes].map(t => <Chip key={t} label={t.toUpperCase()} onRemove={() => toggleType(t)} />)}
                  {fPriceMin && <Chip label={`$${fPriceMin}+`} onRemove={() => setFPriceMin("")} />}
                  {fPriceMax && <Chip label={`≤$${fPriceMax}`} onRemove={() => setFPriceMax("")} />}
                  {fScoreMin && <Chip label={`SCORE ≥${fScoreMin}`} onRemove={() => setFScoreMin("")} />}
                  {fScoreMax && <Chip label={`SCORE ≤${fScoreMax}`} onRemove={() => setFScoreMax("")} />}
                  {fLeadAge && <Chip label={`LAST ${fLeadAge}D`} onRemove={() => setFLeadAge("")} />}
                  {fTcpa && <Chip label={`TCPA: ${fTcpa.toUpperCase()}`} onRemove={() => setFTcpa("")} />}
                </div>
              )}

            {/* Listings table */}
            <div className="bg-[#0d1526] border border-[#1e2d4a] rounded-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#1e2d4a]">
                      <th className="px-3 py-2.5"></th>
                      {["INDUSTRY","GEO","PRICE","AI SCORE","QUALITY","VALUE","RESOLD","BADGES","ACTIONS"].map(h => (
                        <th key={h} className="px-3 py-2.5 text-left text-[9px] font-mono tracking-widest text-[#3a5070] whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#0a1120]">
                    {isLoading ? (
                      Array.from({ length: 6 }).map((_, i) => (
                        <tr key={i}>{Array.from({ length: 10 }).map((_, j) => (
                          <td key={j} className="px-3 py-3"><div className="h-3 shimmer rounded" /></td>
                        ))}</tr>
                      ))
                    ) : filtered.length === 0 ? (
                      <tr><td colSpan={10} className="px-4 py-10 text-center text-[11px] font-mono text-[#2a4060]">NO LISTINGS AVAILABLE</td></tr>
                    ) : filtered.map((l: any) => {
                      const vs = valueScore(l.qualityScore, l.price);
                      const owned = purchases.some(p => p.listingId === l.id);
                      const watched = watchlistIds.has(l.id);
                      const canAfford = credits >= parseFloat(l.price);
                      const aiScore = l.leadData?.leadScore ?? l.qualityScore;
                      return (
                        <tr key={l.id} className={`hover:bg-[#0a1628] transition-colors group ${owned ? "opacity-60" : ""}`}>
                          {/* Watchlist heart */}
                          <td className="px-3 py-3">
                            <button onClick={() => watchlistMutation.mutate({ listingId: l.id })}
                              className={`transition-colors ${watched ? "text-[#ff4d4d]" : "text-[#2a4060] hover:text-[#ff4d4d]"}`}
                              title={watched ? "Remove from watchlist" : "Add to watchlist"}>
                              {watched ? <Heart className="w-4 h-4 fill-current" /> : <Heart className="w-4 h-4" />}
                            </button>
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-1.5">
                              <div className="w-2 h-2 rounded-full" style={{ background: COLORS[l.industry] || "#4a6080" }} />
                              <span className="text-[11px] font-mono font-semibold text-[#94b4d4]">{l.industry?.toUpperCase()}</span>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-[11px] font-mono text-[#94b4d4]">{l.geography}</td>
                          <td className="px-3 py-3 text-[14px] font-mono font-bold text-[#00d084] num">${l.price}</td>
                          {/* AI Score with breakdown tooltip on hover */}
                          <td className="px-3 py-3">
                            <ScoreBadge
                              score={aiScore}
                              leadData={l.leadData ?? undefined}
                              size="md"
                            />
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[12px] font-mono font-bold num" style={{ color: l.qualityScore>=90?"#00d084":l.qualityScore>=75?"#fbbf24":"#ff4d4d" }}>
                                {l.qualityScore}
                              </span>
                              <div className="w-10 h-1.5 bg-[#0a1120] rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{ width:`${l.qualityScore}%`, background: l.qualityScore>=90?"#00d084":l.qualityScore>=75?"#fbbf24":"#ff4d4d" }} />
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <VsChip score={vs} />
                          </td>
                          <td className="px-3 py-3 text-[11px] font-mono text-[#4a6080] num">{l.timesResold}</td>
                          <td className="px-3 py-3">
                            <div className="flex gap-1 flex-wrap">
                              {l.featured && <span className="badge-featured">FEATURED</span>}
                              {vs >= 25 && <span className="badge-best-value">BEST VALUE</span>}
                              {aiScore >= 80 && <span className="text-[8px] font-mono text-[#00d084] border border-[#00d08440] bg-[#00d08415] px-1.5 py-0.5 rounded-sm">PRIME</span>}
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            {owned ? (
                              <span className="text-[10px] font-mono text-[#4a6080]">OWNED</span>
                            ) : (
                              <button
                                onClick={() => setConfirm(l)}
                                disabled={!canAfford}
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono font-bold rounded-sm transition-colors whitespace-nowrap ${
                                  canAfford
                                    ? "bg-[#0d1e3a] border border-[#2563eb] text-[#38bdf8] hover:bg-[#1a3a6b]"
                                    : "bg-[#0a0a0a] border border-[#2a3040] text-[#3a4050] cursor-not-allowed"
                                }`}>
                                <ShoppingCart className="w-3 h-3" />
                                BUY ${l.price}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-2.5 border-t border-[#1e2d4a] flex items-center justify-between">
                <span className="text-[10px] font-mono text-[#3a5070]">{filtered.length} LISTINGS · {watchlistIds.size} WATCHED</span>
                <span className="text-[9px] font-mono text-[#2a4060]">Click ♥ to watchlist · Value Score = Quality÷Price×10</span>
              </div>
            </div>

            {/* Low balance warning */}
            {credits < 50 && (
              <div className="flex items-center gap-3 px-4 py-3 bg-[#1a0808] border border-[#ff4d4d40] rounded-sm">
                <AlertTriangle className="w-4 h-4 text-[#ff4d4d] flex-shrink-0" />
                <span className="text-[11px] font-mono text-[#ff4d4d]">LOW BALANCE — Add funds to continue purchasing leads</span>
              </div>
            )}
            </div>
          </div>
        )}

        {/* ── WATCHLIST ───────────────────────────────────────────────────── */}
        {tab === "watchlist" && (
          <div className="fade-in space-y-4">
            {watchlistListings.length === 0 ? (
              <div className="bg-[#0d1526] border border-[#1e2d4a] rounded-sm p-10 text-center">
                <Heart className="w-8 h-8 text-[#1e2d4a] mx-auto mb-3" />
                <p className="text-[11px] font-mono text-[#2a4060]">YOUR WATCHLIST IS EMPTY</p>
                <p className="text-[10px] font-mono text-[#1e2d4a] mt-1">Click ♥ on any listing in the Order Book to save it here</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-[#4a6080]">{watchlistListings.length} SAVED LISTINGS</span>
                </div>
                <div className="bg-[#0d1526] border border-[#1e2d4a] rounded-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[#1e2d4a]">
                          {["INDUSTRY","GEO","PRICE","QUALITY","VALUE","STATUS","BADGES","ACTIONS"].map(h => (
                            <th key={h} className="px-3 py-2.5 text-left text-[9px] font-mono tracking-widest text-[#3a5070] whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#0a1120]">
                        {watchlistListings.map((l: any) => {
                          const vs = valueScore(l.qualityScore, l.price);
                          const canAfford = credits >= parseFloat(l.price);
                          return (
                            <tr key={l.id} className="hover:bg-[#0a1628] transition-colors">
                              <td className="px-3 py-3">
                                <div className="flex items-center gap-1.5">
                                  <div className="w-2 h-2 rounded-full" style={{ background: COLORS[l.industry] || "#4a6080" }} />
                                  <span className="text-[11px] font-mono text-[#94b4d4]">{l.industry?.toUpperCase()}</span>
                                </div>
                              </td>
                              <td className="px-3 py-3 text-[11px] font-mono text-[#94b4d4]">{l.geography}</td>
                              <td className="px-3 py-3 text-[14px] font-mono font-bold text-[#00d084] num">${l.price}</td>
                              <td className="px-3 py-3">
                                <span className="text-[13px] font-mono font-bold num" style={{ color: l.qualityScore>=90?"#00d084":l.qualityScore>=75?"#fbbf24":"#ff4d4d" }}>{l.qualityScore}</span>
                              </td>
                              <td className="px-3 py-3"><VsChip score={vs} /></td>
                              <td className="px-3 py-3">
                                <span className={`text-[10px] font-mono ${l.isActive ? "text-[#00d084]" : "text-[#4a6080]"}`}>{l.isActive ? "AVAILABLE" : "SOLD"}</span>
                              </td>
                              <td className="px-3 py-3">
                                <div className="flex gap-1">
                                  {l.featured && <span className="badge-featured">FEATURED</span>}
                                  {vs >= 25 && <span className="badge-best-value">BEST VALUE</span>}
                                </div>
                              </td>
                              <td className="px-3 py-3">
                                <div className="flex items-center gap-2">
                                  {l.isActive && (
                                    <button onClick={() => setConfirm(l)} disabled={!canAfford}
                                      className={`flex items-center gap-1 px-3 py-1.5 text-[10px] font-mono font-bold rounded-sm transition-colors ${canAfford ? "bg-[#0d1e3a] border border-[#2563eb] text-[#38bdf8] hover:bg-[#1a3a6b]" : "bg-[#0a0a0a] border border-[#2a3040] text-[#3a4050] cursor-not-allowed"}`}>
                                      BUY
                                    </button>
                                  )}
                                  <button onClick={() => watchlistMutation.mutate({ listingId: l.id })}
                                    className="text-[#ff4d4d] hover:text-[#ff8080] transition-colors" title="Remove">
                                    <HeartOff className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* Price Alerts section */}
            <div className="bg-[#0d1526] border border-[#1e2d4a] rounded-sm p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BellRing className="w-4 h-4 text-[#fbbf24]" />
                  <span className="text-[10px] font-mono tracking-widest text-[#4a6080]">PRICE ALERTS</span>
                </div>
                <button onClick={() => setShowAlertForm(v => !v)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0d1e3a] border border-[#2563eb] text-[#38bdf8] text-[10px] font-mono rounded-sm hover:bg-[#1a3a6b] transition-colors">
                  {showAlertForm ? <X className="w-3 h-3" /> : <Bell className="w-3 h-3" />}
                  {showAlertForm ? "CANCEL" : "NEW ALERT"}
                </button>
              </div>

              {showAlertForm && (
                <div className="mb-4 p-3 bg-[#060e1c] border border-[#1e3a5f] rounded-sm fade-in">
                  <p className="text-[9px] font-mono text-[#4a6080] tracking-widest mb-3">NOTIFY WHEN PRICE DROPS BELOW TARGET</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[9px] font-mono text-[#3a5070] mb-1">INDUSTRY</label>
                      <select value={alertForm.industry} onChange={e => setAlertForm(p => ({ ...p, industry: e.target.value }))}
                        className="w-full bg-[#0a1120] border border-[#1e2d4a] text-[#94b4d4] text-[11px] font-mono px-2 py-2 rounded-sm focus:outline-none focus:border-[#2563eb]">
                        {["healthcare","medicare","insurance","final_expense"].map(i => <option key={i} value={i}>{i.toUpperCase()}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] font-mono text-[#3a5070] mb-1">STATE</label>
                      <input value={alertForm.geography} onChange={e => setAlertForm(p => ({ ...p, geography: e.target.value.toUpperCase() }))}
                        placeholder="FL" maxLength={2}
                        className="w-full bg-[#0a1120] border border-[#1e2d4a] text-[#94b4d4] text-[11px] font-mono px-2 py-2 rounded-sm focus:outline-none focus:border-[#2563eb] placeholder-[#2a4060]" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-mono text-[#3a5070] mb-1">TARGET PRICE ($)</label>
                      <input type="number" value={alertForm.targetPrice} onChange={e => setAlertForm(p => ({ ...p, targetPrice: e.target.value }))}
                        placeholder="35.00"
                        className="w-full bg-[#0a1120] border border-[#1e2d4a] text-[#94b4d4] text-[11px] font-mono px-2 py-2 rounded-sm focus:outline-none focus:border-[#2563eb] placeholder-[#2a4060]" />
                    </div>
                  </div>
                  <button onClick={() => createAlertMutation.mutate({ userId: 1, ...alertForm, triggered: false })}
                    disabled={createAlertMutation.isPending || !alertForm.targetPrice}
                    className="mt-3 px-4 py-2 bg-[#0d1e3a] border border-[#2563eb] text-[#38bdf8] text-[10px] font-mono rounded-sm hover:bg-[#1a3a6b] transition-colors disabled:opacity-40">
                    {createAlertMutation.isPending ? "CREATING..." : "CREATE ALERT →"}
                  </button>
                </div>
              )}

              <div className="space-y-2">
                {priceAlerts.length === 0 ? (
                  <p className="text-[10px] font-mono text-[#2a4060] py-2">No price alerts set. Create one to get notified.</p>
                ) : priceAlerts.map((a: any) => (
                  <div key={a.id} className="flex items-center gap-3 p-2.5 bg-[#060e1c] border border-[#1e2d4a] rounded-sm">
                    <Bell className={`w-3.5 h-3.5 flex-shrink-0 ${a.triggered ? "text-[#00d084]" : "text-[#fbbf24]"}`} />
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-mono text-[#94b4d4]">{a.industry?.toUpperCase()} / {a.geography}</span>
                      <span className="text-[10px] font-mono text-[#4a6080] ml-3">Target: <span className="text-[#00d084]">${a.targetPrice}</span></span>
                      {a.triggered && <span className="ml-3 text-[9px] font-mono text-[#00d084]">✓ TRIGGERED</span>}
                    </div>
                    <button onClick={() => deleteAlertMutation.mutate(a.id)}
                      className="text-[#2a4060] hover:text-[#ff4d4d] transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── PORTFOLIO ───────────────────────────────────────────────────── */}
        {tab === "portfolio" && (
          <div className="fade-in space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "TOTAL ACQUIRED",   value: purchases.length,                color: "text-[#38bdf8]"  },
                { label: "TOTAL SPENT",      value: `$${purchases.reduce((s: number, p: any) => s + parseFloat(p.pricePaid), 0).toFixed(2)}`, color: "text-[#ff4d4d]" },
                { label: "AVG QUALITY",      value: purchases.length ? Math.round(purchases.reduce((s: number, p: any) => s + p.qualityAtPurchase, 0) / purchases.length) : 0, color: "text-[#00d084]" },
                { label: "CREDIT BALANCE",   value: `$${credits.toFixed(2)}`,        color: "text-[#00d084]"  },
              ].map(k => (
                <div key={k.label} className="bg-[#0d1526] border border-[#1e2d4a] rounded-sm p-4">
                  <div className={`text-[20px] font-mono font-bold num ${k.color}`}>{k.value}</div>
                  <div className="text-[8px] font-mono text-[#3a5070] mt-1">{k.label}</div>
                </div>
              ))}
            </div>

            {/* Purchase history table */}
            <div className="bg-[#0d1526] border border-[#1e2d4a] rounded-sm overflow-hidden">
              <div className="px-4 py-2.5 border-b border-[#1e2d4a]">
                <span className="text-[10px] font-mono tracking-widest text-[#4a6080]">PURCHASE HISTORY</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#1e2d4a]">
                      {["LEAD","NAME","STATE","INDUSTRY","GEO","PRICE PAID","QUALITY","DATE"].map(h => (
                        <th key={h} className="px-3 py-2.5 text-left text-[9px] font-mono tracking-widest text-[#3a5070] whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#0a1120]">
                    {purchases.length === 0 ? (
                      <tr><td colSpan={8} className="px-4 py-10 text-center text-[11px] font-mono text-[#2a4060]">NO PURCHASES YET</td></tr>
                    ) : purchases.map((p: any) => (
                      <tr key={p.purchaseId} className="hover:bg-[#0a1628] transition-colors">
                        <td className="px-3 py-3 text-[11px] font-mono text-[#4a6080] num">#{p.leadId}</td>
                        <td className="px-3 py-3 text-[11px] font-mono font-semibold text-[#c8daf0]">
                          {p.firstName} {p.lastName}
                        </td>
                        <td className="px-3 py-3 text-[11px] font-mono text-[#94b4d4]">{p.state}</td>
                        <td className="px-3 py-3 text-[10px] font-mono text-[#4a6080]">{p.industry?.toUpperCase()}</td>
                        <td className="px-3 py-3 text-[10px] font-mono text-[#4a6080]">{p.geography}</td>
                        <td className="px-3 py-3 text-[12px] font-mono font-bold text-[#00d084] num">${p.pricePaid}</td>
                        <td className="px-3 py-3">
                          <span className="text-[11px] font-mono font-bold num" style={{ color: p.qualityAtPurchase>=90?"#00d084":p.qualityAtPurchase>=75?"#fbbf24":"#ff4d4d" }}>
                            {p.qualityAtPurchase}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-[9px] font-mono text-[#2a4060]">
                          {p.purchaseDate ? new Date(p.purchaseDate).toLocaleDateString() : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Credit packages */}
            <div className="bg-[#0d1526] border border-[#1e2d4a] rounded-sm p-4">
              <p className="text-[10px] font-mono tracking-widest text-[#4a6080] mb-4">ADD FUNDS — SELECT A PACKAGE</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {packages.map((pkg: any) => (
                  <div key={pkg.id} className="bg-[#060e1c] border border-[#1e2d4a] hover:border-[#2563eb] rounded-sm p-4 transition-colors">
                    <div className="text-[10px] font-mono tracking-widest text-[#4a6080] mb-1">{pkg.name?.toUpperCase()}</div>
                    <div className="text-[22px] font-mono font-bold text-[#38bdf8] num">${pkg.price}</div>
                    <div className="text-[11px] font-mono text-[#94b4d4] num">{pkg.credits.toLocaleString()} credits</div>
                    {parseFloat(pkg.discountPercentage) > 0 && (
                      <div className="text-[9px] font-mono text-[#00d084] mt-1">SAVE {parseFloat(pkg.discountPercentage).toFixed(0)}%</div>
                    )}
                    <button onClick={() => depositMutation.mutate({ packageId: pkg.id, amount: pkg.price })}
                      disabled={depositMutation.isPending}
                      className="w-full mt-3 py-2 bg-[#0d1e3a] hover:bg-[#1a3a6b] border border-[#2563eb] text-[#38bdf8] text-[10px] font-mono rounded-sm transition-colors disabled:opacity-40">
                      PURCHASE →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── AI SIGNALS ──────────────────────────────────────────────────── */}
        {tab === "ai-signals" && (
          <div className="fade-in space-y-5">
            {/* Predictions grid */}
            <div className="bg-[#0d1526] border border-[#1e2d4a] rounded-sm p-4">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-4 h-4 text-[#a78bfa]" />
                <span className="text-[10px] font-mono tracking-widest text-[#4a6080]">AI DEMAND INTELLIGENCE</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {predictions.slice(0, 8).map((p: any) => (
                  <div key={p.id} className="bg-[#060e1c] border border-[#1e2d4a] rounded-sm p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] font-mono text-[#4a6080]">{p.industry?.toUpperCase()}/{p.geography}</span>
                      <span className="text-[8px] font-mono text-[#2a4060]">{parseFloat(p.confidence).toFixed(0)}% conf</span>
                    </div>
                    <div className="text-[28px] font-mono font-bold num" style={{ color: p.predictedDemand>=85?"#00d084":p.predictedDemand>=70?"#fbbf24":"#ff4d4d" }}>
                      {p.predictedDemand}
                    </div>
                    <div className="text-[8px] font-mono text-[#3a5070] mb-2">DEMAND INDEX</div>
                    <div className="h-1 bg-[#0a1120] rounded-full overflow-hidden">
                      <div className="h-full pipeline-bar rounded-full" style={{ width:`${p.predictedDemand}%`, background: p.predictedDemand>=85?"#00d084":p.predictedDemand>=70?"#fbbf24":"#ff4d4d" }} />
                    </div>
                    {p.factors && (
                      <div className="mt-2 space-y-0.5">
                        {Object.entries(p.factors).map(([k, v]) => (
                          <div key={k} className="flex justify-between text-[8px] font-mono">
                            <span className="text-[#2a4060]">{k}</span>
                            <span className="text-[#4a6080] num">{v as number}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Market radar */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#0d1526] border border-[#1e2d4a] rounded-sm p-4">
                <p className="text-[10px] font-mono tracking-widest text-[#4a6080] mb-4">MARKET HEALTH RADAR</p>
                <ResponsiveContainer width="100%" height={200}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#1e2d4a" />
                    <PolarAngleAxis dataKey="axis" tick={{ fill: "#4a6080", fontSize: 9, fontFamily: "monospace" }} />
                    <Radar dataKey="value" stroke="#2563eb" fill="#2563eb" fillOpacity={0.2} />
                    <Tooltip contentStyle={{ background: "#0d1526", border: "1px solid #1e2d4a", fontFamily: "monospace", fontSize: 10, color: "#c8daf0" }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-[#0d1526] border border-[#1e2d4a] rounded-sm p-4">
                <p className="text-[10px] font-mono tracking-widest text-[#4a6080] mb-4">VALUE SCORE DISTRIBUTION</p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={allListings.slice(0, 12).map(l => ({ id: `#${l.id}`, vs: valueScore(l.qualityScore, l.price), price: l.price }))} barSize={16}>
                    <XAxis dataKey="id" tick={{ fill: "#4a6080", fontSize: 8, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#2a4060", fontSize: 9, fontFamily: "monospace" }} axisLine={false} tickLine={false} width={24} />
                    <Tooltip contentStyle={{ background: "#0d1526", border: "1px solid #1e2d4a", fontFamily: "monospace", fontSize: 10, color: "#c8daf0" }} />
                    <Bar dataKey="vs" radius={[2,2,0,0]}>
                      {allListings.slice(0, 12).map((l, i) => {
                        const vs = valueScore(l.qualityScore, l.price);
                        return <Cell key={i} fill={vs>=25?"#00d084":vs>=15?"#fbbf24":"#ff4d4d"} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
