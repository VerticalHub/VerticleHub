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
  ArrowUpDown, Zap, X,
} from "lucide-react";

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

export default function Marketplace() {
  const [tab, setTab]             = useState<Tab>("order-book");
  const [search, setSearch]       = useState("");
  const [filterIndustry, setFI]   = useState("");
  const [filterGeo, setFG]        = useState("");
  const [sortBy, setSortBy]       = useState<"quality"|"price"|"value"|"featured"|"score">("featured");
  const [confirmListing, setConfirm] = useState<any>(null);
  const [alertForm, setAlertForm] = useState({ industry: "medicare", geography: "FL", targetPrice: "" });
  const [showAlertForm, setShowAlertForm] = useState(false);
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
      if (search && !`${l.industry} ${l.geography}`.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterIndustry && l.industry !== filterIndustry) return false;
      if (filterGeo && l.geography !== filterGeo) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "featured") {
        if (a.featured !== b.featured) return a.featured ? -1 : 1;
        return b.qualityScore - a.qualityScore;
      }
      if (sortBy === "score")    return (b.leadData?.leadScore ?? b.qualityScore) - (a.leadData?.leadScore ?? a.qualityScore);
      if (sortBy === "quality")  return b.qualityScore - a.qualityScore;
      if (sortBy === "price")    return parseFloat(a.price) - parseFloat(b.price);
      if (sortBy === "value")    return valueScore(b.qualityScore, b.price) - valueScore(a.qualityScore, a.price);
      return 0;
    });

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
          <div className="fade-in space-y-3">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-40">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#2a4060]" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search industry, state..."
                  className="w-full bg-[#060e1c] border border-[#1e2d4a] text-[#94b4d4] text-[11px] font-mono pl-9 pr-3 py-2 rounded-sm focus:outline-none focus:border-[#2563eb] placeholder-[#2a4060]" />
              </div>
              <select value={filterIndustry} onChange={e => setFI(e.target.value)}
                className="bg-[#060e1c] border border-[#1e2d4a] text-[#94b4d4] text-[11px] font-mono px-3 py-2 rounded-sm focus:outline-none focus:border-[#2563eb]">
                <option value="">ALL INDUSTRIES</option>
                {industries.map(i => <option key={i} value={i}>{i.toUpperCase()}</option>)}
              </select>
              <select value={filterGeo} onChange={e => setFG(e.target.value)}
                className="bg-[#060e1c] border border-[#1e2d4a] text-[#94b4d4] text-[11px] font-mono px-3 py-2 rounded-sm focus:outline-none focus:border-[#2563eb]">
                <option value="">ALL STATES</option>
                {geos.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
                className="bg-[#060e1c] border border-[#1e2d4a] text-[#94b4d4] text-[11px] font-mono px-3 py-2 rounded-sm focus:outline-none focus:border-[#2563eb]">
                <option value="featured">SORT: FEATURED</option>
                <option value="score">SORT: AI SCORE ↓</option>
                <option value="quality">SORT: QUALITY</option>
                <option value="value">SORT: VALUE SCORE</option>
                <option value="price">SORT: PRICE ↑</option>
              </select>
            </div>

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
