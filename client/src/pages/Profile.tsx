import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import {
  User, DollarSign, ShoppingCart, Star, TrendingUp, Edit2, Check, X,
  Calendar, Shield, MapPin, BarChart2, Package, CreditCard, Activity,
  Award, Clock,
} from "lucide-react";

const INDUSTRY_LABELS: Record<string, string> = {
  medicare: "Medicare", healthcare: "Healthcare", insurance: "Insurance",
  final_expense: "Final Expense", aca: "ACA", life_insurance: "Life Insurance",
};
const INDUSTRY_COLORS: Record<string, string> = {
  medicare: "#38bdf8", healthcare: "#00d084", insurance: "#a78bfa",
  final_expense: "#fbbf24", aca: "#ff4d4d", life_insurance: "#0ea5e9",
};

function StatCard({ icon: Icon, label, value, sub, color = "#38bdf8" }: any) {
  return (
    <div className="bg-[#0d1526] border border-[#1e2d4a] rounded-sm p-4 flex items-start gap-3">
      <div className="w-8 h-8 rounded-sm flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div>
        <p className="text-[9px] font-mono tracking-widest text-[#3a5070]">{label}</p>
        <p className="text-[18px] font-mono font-bold text-[#c8daf0] num leading-tight">{value}</p>
        {sub && <p className="text-[9px] font-mono text-[#2a4060] mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function Profile() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingName, setEditingName] = useState(false);
  const [nameVal, setNameVal] = useState("");

  const { data: meResp } = useQuery<any>({
    queryKey: ["/api/auth/me"],
    queryFn: () => fetch("/api/auth/me").then(r => r.json()),
    staleTime: 30_000,
  });
  const me = meResp?.data;

  const { data: creditsResp, isLoading: creditsLoading } = useQuery<any>({
    queryKey: ["/api/credits/1"],
    queryFn: () => fetch("/api/credits/1").then(r => r.json()),
  });
  const balance = parseFloat(creditsResp?.data?.balance || "0");

  const { data: txResp, isLoading: txLoading } = useQuery<any>({
    queryKey: ["/api/credits/1/transactions"],
    queryFn: () => fetch("/api/credits/1/transactions").then(r => r.json()),
  });
  const transactions: any[] = txResp?.data || [];

  const { data: purchasesResp, isLoading: purchasesLoading } = useQuery<any>({
    queryKey: ["/api/purchases/1/detailed"],
    queryFn: () => fetch("/api/purchases/1/detailed").then(r => r.json()),
  });
  const purchases: any[] = purchasesResp?.data || [];

  const { data: watchlistResp } = useQuery<any>({ queryKey: ["/api/watchlist"] });
  const watchlistCount = watchlistResp?.data?.length || 0;

  // Derived stats
  const totalSpent = purchases.reduce((s: number, p: any) => s + parseFloat(p.pricePaid || 0), 0);
  const avgScore = purchases.length
    ? Math.round(purchases.reduce((s: number, p: any) => s + (p.qualityAtPurchase || 50), 0) / purchases.length)
    : 0;

  // Favorite segments
  const industryCounts: Record<string, number> = {};
  const geoCounts: Record<string, number> = {};
  for (const p of purchases) {
    if (p.industry) industryCounts[p.industry] = (industryCounts[p.industry] || 0) + 1;
    if (p.geography) geoCounts[p.geography]   = (geoCounts[p.geography]   || 0) + 1;
  }
  const topIndustries = Object.entries(industryCounts).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const topGeos       = Object.entries(geoCounts).sort((a, b) => b[1] - a[1]).slice(0, 4);

  // Display name: use displayName field if set, else username
  const displayName = me?.displayName || me?.username || "—";

  const updateNameMutation = useMutation({
    mutationFn: (name: string) => apiRequest("PATCH", "/api/users/1/display-name", { displayName: name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setEditingName(false);
      toast({ title: "Display name updated", variant: "success" as any });
    },
    onError: () => toast({ title: "Update failed", variant: "destructive" }),
  });

  const startEdit = () => { setNameVal(displayName); setEditingName(true); };
  const saveEdit  = () => { if (nameVal.trim()) updateNameMutation.mutate(nameVal.trim()); };
  const cancelEdit = () => setEditingName(false);

  const roleColor = (r?: string) => r === "admin" ? "#ff4d4d" : r === "manager" ? "#fbbf24" : "#00d084";

  return (
    <div className="min-h-screen bg-[#070d1a]">
      <Header />
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">

        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[16px] font-mono font-bold text-[#c8daf0] tracking-tight">MY PROFILE</h1>
            <p className="text-[10px] font-mono text-[#3a5070] mt-0.5">Account details, purchase history, and preferences</p>
          </div>
          <div className="text-[9px] font-mono text-[#2a4060]">USER ID: #1</div>
        </div>

        {/* Account card */}
        <div className="bg-[#0d1526] border border-[#1e2d4a] rounded-sm overflow-hidden">
          {/* Accent bar */}
          <div className="h-[2px]" style={{ background: "linear-gradient(90deg, #2563eb, #38bdf8, #2563eb)" }} />
          <div className="p-5">
            <div className="flex items-start gap-5">
              {/* Avatar */}
              <div className="w-16 h-16 rounded-sm bg-[#1a3a6b] border border-[#2563eb40] flex items-center justify-center flex-shrink-0">
                <span className="text-[28px] font-mono font-bold text-[#38bdf8]">
                  {displayName?.[0]?.toUpperCase() || "U"}
                </span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                {/* Display name */}
                <div className="flex items-center gap-2 mb-1">
                  {editingName ? (
                    <div className="flex items-center gap-2">
                      <input
                        autoFocus
                        value={nameVal}
                        onChange={e => setNameVal(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") cancelEdit(); }}
                        maxLength={32}
                        className="bg-[#060e1c] border border-[#2563eb] text-[#c8daf0] text-[14px] font-mono font-bold px-2 py-0.5 rounded-sm focus:outline-none w-48"
                      />
                      <button onClick={saveEdit} disabled={updateNameMutation.isPending} className="p-1 text-[#00d084] hover:text-[#00ff9d]">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={cancelEdit} className="p-1 text-[#2a4060] hover:text-[#ff4d4d]">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <h2 className="text-[16px] font-mono font-bold text-[#c8daf0]">{displayName}</h2>
                      <button onClick={startEdit} className="p-1 text-[#2a4060] hover:text-[#38bdf8] transition-colors" title="Edit display name">
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </>
                  )}
                </div>

                {/* Meta row */}
                <div className="flex flex-wrap items-center gap-3 mt-1">
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3 text-[#3a5070]" />
                    <span className="text-[10px] font-mono text-[#4a6080]">@{me?.username}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Shield className="w-3 h-3 text-[#3a5070]" />
                    <span className="text-[10px] font-mono font-bold" style={{ color: roleColor(me?.role) }}>
                      {(me?.role || "AGENT").toUpperCase()}
                    </span>
                  </div>
                  {me?.createdAt && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-[#3a5070]" />
                      <span className="text-[10px] font-mono text-[#4a6080]">
                        Member since {new Date(me.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                      </span>
                    </div>
                  )}
                </div>

                <p className="text-[9px] font-mono text-[#2a4060] mt-2">
                  Click the pencil icon to update your display name · Login credentials are separate
                </p>
              </div>

              {/* Balance */}
              <div className="text-right">
                <p className="text-[9px] font-mono tracking-widest text-[#3a5070]">CREDIT BALANCE</p>
                <p className="text-[22px] font-mono font-bold text-[#00d084] num">${balance.toFixed(2)}</p>
                <p className="text-[9px] font-mono text-[#2a4060]">Available to spend</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {purchasesLoading || creditsLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-[#0d1526] border border-[#1e2d4a] rounded-sm p-4 flex items-start gap-3">
                <div className="w-8 h-8 rounded-sm shimmer flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-2.5 shimmer rounded w-20" />
                  <div className="h-5 shimmer rounded w-14" />
                  <div className="h-2 shimmer rounded w-24" />
                </div>
              </div>
            ))
          ) : (
            <>
              <StatCard icon={ShoppingCart} label="TOTAL PURCHASES"   value={purchases.length}            sub="leads acquired"             color="#38bdf8" />
              <StatCard icon={DollarSign}  label="TOTAL SPENT"       value={`$${totalSpent.toFixed(2)}`} sub="across all purchases"       color="#00d084" />
              <StatCard icon={Star}        label="AVG QUALITY SCORE" value={avgScore || "—"}             sub="at time of purchase"        color="#fbbf24" />
              <StatCard icon={Package}     label="WATCHLIST"         value={watchlistCount}              sub="leads saved"                color="#a78bfa" />
            </>
          )}
        </div>

        {/* Two-column: segments + recent credits */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Favorite segments */}
          <div className="bg-[#0d1526] border border-[#1e2d4a] rounded-sm overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[#0f1a2e]">
              <TrendingUp className="w-3.5 h-3.5 text-[#4a6080]" />
              <p className="text-[9px] font-mono tracking-widest text-[#3a5070]">FAVORITE SEGMENTS</p>
            </div>
            <div className="p-4 space-y-4">
              {/* Industries */}
              <div>
                <p className="text-[8px] font-mono tracking-widest text-[#2a4060] mb-2">BY INDUSTRY</p>
                {purchasesLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full shimmer flex-shrink-0" />
                      <div className="h-2.5 shimmer rounded w-20" />
                      <div className="flex-1 h-1.5 shimmer rounded" />
                      <div className="h-2.5 shimmer rounded w-6" />
                    </div>
                  ))
                ) : topIndustries.length === 0 ? (
                  <p className="text-[10px] font-mono text-[#2a4060]">No purchases yet</p>
                ) : topIndustries.map(([ind, cnt]) => {
                  const pct = Math.round((cnt / purchases.length) * 100);
                  const color = INDUSTRY_COLORS[ind] || "#4a6080";
                  return (
                    <div key={ind} className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                      <span className="text-[10px] font-mono text-[#94b4d4] w-28 truncate">{INDUSTRY_LABELS[ind] || ind}</span>
                      <div className="flex-1 h-1.5 bg-[#0a1120] rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                      </div>
                      <span className="text-[9px] font-mono text-[#4a6080] num w-8 text-right">{cnt}x</span>
                    </div>
                  );
                })}
              </div>
              {/* Geographies */}
              <div>
                <p className="text-[8px] font-mono tracking-widest text-[#2a4060] mb-2">BY GEOGRAPHY</p>
                {purchasesLoading ? (
                  <div className="flex flex-wrap gap-1.5">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="h-6 w-16 shimmer rounded-sm" />
                    ))}
                  </div>
                ) : topGeos.length === 0 ? (
                  <p className="text-[10px] font-mono text-[#2a4060]">No purchases yet</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {topGeos.map(([geo, cnt]) => (
                      <div key={geo} className="flex items-center gap-1 px-2 py-1 bg-[#060e1c] border border-[#1e2d4a] rounded-sm">
                        <MapPin className="w-2.5 h-2.5 text-[#38bdf8]" />
                        <span className="text-[9px] font-mono text-[#94b4d4]">{geo}</span>
                        <span className="text-[9px] font-mono text-[#2a4060] num">×{cnt}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recent credit transactions */}
          <div className="bg-[#0d1526] border border-[#1e2d4a] rounded-sm overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[#0f1a2e]">
              <CreditCard className="w-3.5 h-3.5 text-[#4a6080]" />
              <p className="text-[9px] font-mono tracking-widest text-[#3a5070]">RECENT CREDIT ACTIVITY</p>
            </div>
            <div className="divide-y divide-[#0a1120] max-h-64 overflow-y-auto">
              {txLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full shimmer" />
                      <div className="space-y-1">
                        <div className="h-2.5 shimmer rounded w-24" />
                        <div className="h-2 shimmer rounded w-16" />
                      </div>
                    </div>
                    <div className="h-3 shimmer rounded w-12" />
                  </div>
                ))
              ) : transactions.length === 0 ? (
                <div className="px-4 py-6 text-center text-[10px] font-mono text-[#2a4060]">NO TRANSACTIONS YET</div>
              ) : transactions.slice(0, 12).map((tx: any) => {
                const positive = tx.type === "deposit" || tx.type === "referral_bonus" || tx.type === "credit";
                return (
                  <div key={tx.id} className="flex items-center justify-between px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${positive ? "bg-[#00d084]" : "bg-[#ff4d4d]"}`} />
                      <div>
                        <p className="text-[10px] font-mono text-[#94b4d4] capitalize">{(tx.type || "").replace(/_/g, " ")}</p>
                        {tx.createdAt && (
                          <p className="text-[8px] font-mono text-[#2a4060]">
                            {new Date(tx.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" })}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className={`text-[11px] font-mono font-bold num ${positive ? "text-[#00d084]" : "text-[#ff4d4d]"}`}>
                      {positive ? "+" : "−"}${Math.abs(parseFloat(tx.amount || 0)).toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Purchase history table */}
        <div className="bg-[#0d1526] border border-[#1e2d4a] rounded-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#0f1a2e]">
            <div className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-[#4a6080]" />
              <p className="text-[9px] font-mono tracking-widest text-[#3a5070]">PURCHASE HISTORY</p>
              <span className="text-[8px] font-mono text-[#2a4060]">— {purchases.length} total</span>
            </div>
            {purchases.length > 0 && (
              <div className="flex items-center gap-2">
                <Award className="w-3 h-3 text-[#fbbf24]" />
                <span className="text-[9px] font-mono text-[#fbbf24]">
                  ${totalSpent.toFixed(2)} lifetime value
                </span>
              </div>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#0a1120]">
                  {["DATE", "INDUSTRY", "GEOGRAPHY", "LEAD", "PRICE PAID", "QUALITY", "STATUS"].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-[9px] font-mono tracking-widest text-[#3a5070]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#0a1120]">
                {purchasesLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-3 shimmer rounded" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : purchases.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-[10px] font-mono text-[#2a4060]">
                      NO PURCHASES YET — browse the marketplace to get started
                    </td>
                  </tr>
                ) : purchases.map((p: any) => {
                  const color = INDUSTRY_COLORS[p.industry] || "#4a6080";
                  const q = p.qualityAtPurchase || 0;
                  return (
                    <tr key={p.purchaseId} className="hover:bg-[#0a1628] transition-colors">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5 text-[#2a4060]" />
                          <span className="text-[10px] font-mono text-[#4a6080]">
                            {p.purchaseDate ? new Date(p.purchaseDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" }) : "—"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                          <span className="text-[10px] font-mono text-[#94b4d4]">{INDUSTRY_LABELS[p.industry] || p.industry || "—"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-2.5 h-2.5 text-[#2a4060]" />
                          <span className="text-[10px] font-mono text-[#4a6080]">{p.geography || "—"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-[10px] font-mono text-[#94b4d4]">
                        {p.firstName && p.lastName ? `${p.firstName} ${p.lastName[0]}.` : `Lead #${p.leadId || p.listingId}`}
                      </td>
                      <td className="px-4 py-2.5 text-[13px] font-mono font-bold text-[#00d084] num">
                        ${parseFloat(p.pricePaid || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono font-bold num" style={{ color: q >= 80 ? "#00d084" : q >= 60 ? "#fbbf24" : "#ff4d4d" }}>
                            {q}
                          </span>
                          <div className="w-10 h-1 bg-[#0a1120] rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${q}%`, background: q >= 80 ? "#00d084" : q >= 60 ? "#fbbf24" : "#ff4d4d" }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-[8px] font-mono text-[#00d084] border border-[#00d08440] bg-[#001a0d] px-2 py-0.5 rounded-sm">OWNED</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
