import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search, Download, Shield, BarChart2, Plus, Activity,
  ChevronDown, ChevronRight, CheckSquare, Square, Users, TrendingUp,
  PhoneOff, RefreshCw, Edit3,
} from "lucide-react";
import Header from "@/components/Header";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line } from "recharts";

type Tab = "overview" | "leads" | "listings" | "new" | "market" | "users";

const STATUS_OPTS = ["new", "contacted", "qualified", "converted", "archived"];
const STATUS_COLORS: Record<string, string> = {
  new: "#38bdf8", contacted: "#fbbf24", qualified: "#a78bfa", converted: "#00d084", archived: "#4a6080",
};
const STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"];

function StatusBadge({ status }: { status?: string | null }) {
  const s = status || "new";
  return <span className={`badge-${s}`}>{s.toUpperCase()}</span>;
}

export default function Admin() {
  const [tab, setTab] = useState<Tab>("overview");
  const [search, setSearch] = useState("");
  const [filterState, setFilterState] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterTcpa, setFilterTcpa] = useState("");
  const [filterDnc, setFilterDnc] = useState("false");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [expanded, setExpanded] = useState<number | null>(null);
  const [editStatus, setEditStatus] = useState<Record<number, string>>({});
  const [newListing, setNewListing] = useState({ leadId: "", price: "", industry: "healthcare", geography: "" });
  const [genPred, setGenPred] = useState({ industry: "healthcare", geography: "CA" });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: statsResp } = useQuery<any>({
    queryKey: ["/api/leads/stats"],
    queryFn: () => fetch("/api/leads/stats").then(r => r.json()),
    refetchInterval: 30_000,
  });
  const stats = statsResp?.data;

  const searchParams = new URLSearchParams({ q: search, state: filterState, status: filterStatus, dnc: filterDnc });
  if (filterTcpa) searchParams.set("tcpa", filterTcpa);
  const { data: leadsResp, isLoading: leadsLoading } = useQuery<any>({
    queryKey: ["/api/leads/search", search, filterState, filterStatus, filterTcpa, filterDnc],
    queryFn: () => fetch(`/api/leads/search?${searchParams}`).then(r => r.json()),
    staleTime: 10_000,
  });
  const leads: any[] = leadsResp?.data || [];

  const { data: listingsResp } = useQuery<any>({
    queryKey: ["/api/lead-listings/all"],
    queryFn: () => fetch("/api/lead-listings/all").then(r => r.json()),
  });
  const listings: any[] = listingsResp?.data || [];

  const { data: trendsResp } = useQuery<any>({
    queryKey: ["/api/market-trends"],
    queryFn: () => fetch("/api/market-trends").then(r => r.json()),
    enabled: tab === "market",
  });
  const trends: any[] = trendsResp?.data || [];

  const { data: predsResp } = useQuery<any>({
    queryKey: ["/api/demand-predictions"],
    queryFn: () => fetch("/api/demand-predictions").then(r => r.json()),
    enabled: tab === "market",
  });
  const predictions: any[] = predsResp?.data || [];

  const { data: usersResp } = useQuery<any>({
    queryKey: ["/api/users"],
    queryFn: () => fetch("/api/users").then(r => r.json()),
    enabled: tab === "users",
  });
  const allUsers: any[] = usersResp?.data || [];

  // ── Mutations ──────────────────────────────────────────────────────────────
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiRequest("PATCH", `/api/leads/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads/search"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leads/stats"] });
      toast({ title: "Status updated" });
    },
  });

  const dncMutation = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/leads/${id}/dnc`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads/search"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leads/stats"] });
      toast({ title: "DNC marked", description: "Lead added to Do Not Call list." });
    },
  });

  const bulkDncMutation = useMutation({
    mutationFn: (leadIds: number[]) => apiRequest("POST", "/api/leads/bulk-dnc", { leadIds }),
    onSuccess: (_, ids) => {
      setSelected(new Set());
      queryClient.invalidateQueries({ queryKey: ["/api/leads/search"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leads/stats"] });
      toast({ title: "Bulk DNC applied", description: `${ids.length} leads marked as DNC.` });
    },
  });

  const createListingMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/lead-listings", data),
    onSuccess: () => {
      setNewListing({ leadId: "", price: "", industry: "healthcare", geography: "" });
      queryClient.invalidateQueries({ queryKey: ["/api/lead-listings/all"] });
      toast({ title: "Listing created", description: "Lead is now live on the marketplace." });
    },
  });

  const generatePredMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/demand-predictions/generate", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/demand-predictions"] });
      toast({ title: "AI prediction generated" });
    },
  });

  // ── Helpers ────────────────────────────────────────────────────────────────
  const toggleAll = () => {
    if (selected.size === leads.length) setSelected(new Set());
    else setSelected(new Set(leads.map((l: any) => l.id)));
  };
  const toggleOne = (id: number) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };
  const handleStatusSave = (id: number) => {
    if (editStatus[id] !== undefined) {
      updateStatusMutation.mutate({ id, status: editStatus[id] });
      setEditStatus(prev => { const n = { ...prev }; delete n[id]; return n; });
    }
  };
  const handleExport = () => {
    const params = new URLSearchParams();
    if (filterState)  params.set("state", filterState);
    if (filterStatus) params.set("status", filterStatus);
    window.open(`/api/export/leads?${params}`, "_blank");
  };

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "overview", label: "OVERVIEW",     icon: BarChart2  },
    { id: "leads",    label: "LEAD DB",      icon: Activity   },
    { id: "listings", label: "LISTINGS",     icon: Shield     },
    { id: "new",      label: "NEW LISTING",  icon: Plus       },
    { id: "market",   label: "MARKET DATA",  icon: TrendingUp },
    { id: "users",    label: "USERS",        icon: Users      },
  ];

  const stateChartData = stats
    ? Object.entries(stats.byState).sort((a: any, b: any) => (b[1] as number) - (a[1] as number)).slice(0, 8).map(([k, v]) => ({ state: k, count: v }))
    : [];

  return (
    <div className="min-h-screen bg-[#070d1a] flex flex-col">
      <Header />
      <main className="flex-1 p-4 md:p-6 max-w-screen-2xl mx-auto w-full">

        {/* Page header */}
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-5 h-5 text-[#ff4d4d]" />
          <div>
            <h1 className="text-[14px] font-mono font-bold text-[#c8daf0] tracking-widest">COMMAND CENTER</h1>
            <p className="text-[10px] font-mono text-[#4a6080]">Administration & intelligence hub</p>
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

        {/* ── OVERVIEW ────────────────────────────────────────────────────── */}
        {tab === "overview" && (
          <div className="space-y-5 fade-in">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {[
                { label: "TOTAL",     value: stats?.total ?? "—",                color: "text-[#38bdf8]"  },
                { label: "NEW",       value: stats?.byStatus?.new ?? "—",        color: "text-[#38bdf8]"  },
                { label: "CONTACTED", value: stats?.byStatus?.contacted ?? "—",  color: "text-[#fbbf24]"  },
                { label: "QUALIFIED", value: stats?.byStatus?.qualified ?? "—",  color: "text-[#a78bfa]"  },
                { label: "CONVERTED", value: stats?.byStatus?.converted ?? "—",  color: "text-[#00d084]"  },
                { label: "ARCHIVED",  value: stats?.byStatus?.archived ?? "—",   color: "text-[#4a6080]"  },
                { label: "TCPA ✓",   value: stats?.tcpaCount ?? "—",            color: "text-[#00d084]"  },
                { label: "DNC",       value: stats?.dncCount ?? "—",             color: "text-[#ff4d4d]"  },
                { label: "ACA INT",   value: stats?.acaCount ?? "—",             color: "text-[#38bdf8]"  },
                { label: "MEDICARE",  value: stats?.medicareCount ?? "—",        color: "text-[#a78bfa]"  },
                { label: "FINAL EXP", value: stats?.finalExpCount ?? "—",        color: "text-[#00d084]"  },
                { label: "TODAY",     value: stats?.today ?? "—",                color: "text-[#fbbf24]"  },
              ].map(k => (
                <div key={k.label} className="bg-[#0d1526] border border-[#1e2d4a] rounded-sm p-4">
                  <div className={`text-[22px] font-mono font-bold num ${k.color}`}>{k.value}</div>
                  <div className="text-[8px] font-mono text-[#3a5070] tracking-widest mt-1">{k.label}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#0d1526] border border-[#1e2d4a] rounded-sm p-4">
                <p className="text-[10px] font-mono tracking-widest text-[#4a6080] mb-4">STATUS DISTRIBUTION</p>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={Object.entries(stats?.byStatus || {}).map(([k, v]) => ({ name: k, count: v }))} barSize={28}>
                    <XAxis dataKey="name" tick={{ fill: "#4a6080", fontSize: 9, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#2a4060", fontSize: 9, fontFamily: "monospace" }} axisLine={false} tickLine={false} width={24} />
                    <Tooltip contentStyle={{ background: "#0d1526", border: "1px solid #1e2d4a", fontFamily: "monospace", fontSize: 10, color: "#c8daf0" }} cursor={{ fill: "rgba(37,99,235,0.05)" }} />
                    <Bar dataKey="count" radius={[2,2,0,0]}>
                      {Object.keys(stats?.byStatus || {}).map((k, i) => <Cell key={i} fill={STATUS_COLORS[k] || "#4a6080"} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-[#0d1526] border border-[#1e2d4a] rounded-sm p-4">
                <p className="text-[10px] font-mono tracking-widest text-[#4a6080] mb-4">TOP STATES BY VOLUME</p>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={stateChartData} barSize={22}>
                    <XAxis dataKey="state" tick={{ fill: "#4a6080", fontSize: 9, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#2a4060", fontSize: 9, fontFamily: "monospace" }} axisLine={false} tickLine={false} width={24} />
                    <Tooltip contentStyle={{ background: "#0d1526", border: "1px solid #1e2d4a", fontFamily: "monospace", fontSize: 10, color: "#c8daf0" }} cursor={{ fill: "rgba(37,99,235,0.05)" }} />
                    <Bar dataKey="count" fill="#2563eb" radius={[2,2,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Listings overview */}
            <div className="bg-[#0d1526] border border-[#1e2d4a] rounded-sm p-4">
              <p className="text-[10px] font-mono tracking-widest text-[#4a6080] mb-3">MARKETPLACE OVERVIEW</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-[22px] font-mono font-bold text-[#a78bfa] num">{listings.length}</div>
                  <div className="text-[9px] font-mono text-[#4a6080]">TOTAL LISTINGS</div>
                </div>
                <div>
                  <div className="text-[22px] font-mono font-bold text-[#00d084] num">{listings.filter(l => l.isActive).length}</div>
                  <div className="text-[9px] font-mono text-[#4a6080]">ACTIVE LISTINGS</div>
                </div>
                <div>
                  <div className="text-[22px] font-mono font-bold text-[#38bdf8] num">
                    ${listings.length ? (listings.reduce((s: number, l: any) => s + parseFloat(l.price), 0) / listings.length).toFixed(2) : "0.00"}
                  </div>
                  <div className="text-[9px] font-mono text-[#4a6080]">AVG PRICE</div>
                </div>
                <div>
                  <div className="text-[22px] font-mono font-bold text-[#fbbf24] num">
                    {listings.length ? Math.round(listings.reduce((s: number, l: any) => s + l.qualityScore, 0) / listings.length) : 0}
                  </div>
                  <div className="text-[9px] font-mono text-[#4a6080]">AVG QUALITY</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── LEAD DB ─────────────────────────────────────────────────────── */}
        {tab === "leads" && (
          <div className="fade-in space-y-3">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#2a4060]" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search name, email, phone, zip, state..."
                  className="w-full bg-[#060e1c] border border-[#1e2d4a] text-[#94b4d4] text-[11px] font-mono pl-9 pr-3 py-2 rounded-sm focus:outline-none focus:border-[#2563eb] placeholder-[#2a4060]" />
              </div>
              {[
                { value: filterState, set: setFilterState, opts: ["ALL STATES", ...STATES], keys: ["", ...STATES] },
              ].map(f => null)}
              <select value={filterState} onChange={e => setFilterState(e.target.value)}
                className="bg-[#060e1c] border border-[#1e2d4a] text-[#94b4d4] text-[11px] font-mono px-3 py-2 rounded-sm focus:outline-none focus:border-[#2563eb]">
                <option value="">ALL STATES</option>
                {STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                className="bg-[#060e1c] border border-[#1e2d4a] text-[#94b4d4] text-[11px] font-mono px-3 py-2 rounded-sm focus:outline-none focus:border-[#2563eb]">
                <option value="">ALL STATUS</option>
                {STATUS_OPTS.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
              </select>
              <select value={filterTcpa} onChange={e => setFilterTcpa(e.target.value)}
                className="bg-[#060e1c] border border-[#1e2d4a] text-[#94b4d4] text-[11px] font-mono px-3 py-2 rounded-sm focus:outline-none focus:border-[#2563eb]">
                <option value="">ALL TCPA</option>
                <option value="true">TCPA ✓</option>
                <option value="false">NO TCPA</option>
              </select>
              <select value={filterDnc} onChange={e => setFilterDnc(e.target.value)}
                className="bg-[#060e1c] border border-[#1e2d4a] text-[#94b4d4] text-[11px] font-mono px-3 py-2 rounded-sm focus:outline-none focus:border-[#2563eb]">
                <option value="false">EXCLUDE DNC</option>
                <option value="true">DNC ONLY</option>
                <option value="">ALL LEADS</option>
              </select>
              <button onClick={handleExport}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#060e1c] border border-[#1e2d4a] hover:border-[#2563eb] text-[#4a6080] hover:text-[#38bdf8] text-[10px] font-mono rounded-sm transition-colors">
                <Download className="w-3.5 h-3.5" /> CSV
              </button>
            </div>

            {/* Bulk bar */}
            {selected.size > 0 && (
              <div className="flex items-center gap-3 px-4 py-2.5 bg-[#0d1a2d] border border-[#2563eb] rounded-sm">
                <span className="text-[10px] font-mono text-[#38bdf8]">{selected.size} SELECTED</span>
                <button onClick={() => bulkDncMutation.mutate(Array.from(selected))}
                  disabled={bulkDncMutation.isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a0808] border border-[#ff4d4d40] text-[#ff4d4d] text-[10px] font-mono rounded-sm hover:border-[#ff4d4d] transition-colors">
                  <PhoneOff className="w-3 h-3" /> BULK DNC
                </button>
                <button onClick={() => setSelected(new Set())}
                  className="text-[9px] font-mono text-[#4a6080] hover:text-[#94b4d4] ml-auto">CLEAR</button>
              </div>
            )}

            {/* Table */}
            <div className="bg-[#0d1526] border border-[#1e2d4a] rounded-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#1e2d4a]">
                      <th className="px-3 py-2.5 text-left">
                        <button onClick={toggleAll} className="text-[#4a6080] hover:text-[#38bdf8]">
                          {selected.size === leads.length && leads.length > 0
                            ? <CheckSquare className="w-3.5 h-3.5 text-[#38bdf8]" />
                            : <Square className="w-3.5 h-3.5" />}
                        </button>
                      </th>
                      {["NAME","STATE","INTEREST","STATUS","TCPA","SCORE","DNC","ACTIONS"].map(h => (
                        <th key={h} className="px-3 py-2.5 text-left text-[9px] font-mono tracking-widest text-[#3a5070] whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#0a1120]">
                    {leadsLoading ? (
                      Array.from({ length: 6 }).map((_, i) => (
                        <tr key={i}>{Array.from({ length: 9 }).map((_, j) => (
                          <td key={j} className="px-3 py-3"><div className="h-3 shimmer rounded" /></td>
                        ))}</tr>
                      ))
                    ) : leads.length === 0 ? (
                      <tr><td colSpan={9} className="px-4 py-10 text-center text-[11px] font-mono text-[#2a4060]">
                        NO LEADS FOUND — adjust filters or capture new leads
                      </td></tr>
                    ) : leads.map((l: any) => (
                      <>
                        <tr key={l.id}
                          className={`hover:bg-[#0a1628] transition-colors cursor-pointer group ${l.dnc ? "opacity-50" : ""}`}
                          onClick={() => setExpanded(expanded === l.id ? null : l.id)}>
                          <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                            <button onClick={() => toggleOne(l.id)} className="text-[#4a6080] hover:text-[#38bdf8]">
                              {selected.has(l.id) ? <CheckSquare className="w-3.5 h-3.5 text-[#38bdf8]" /> : <Square className="w-3.5 h-3.5" />}
                            </button>
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <div className="text-[11px] font-mono font-semibold text-[#c8daf0]">{l.firstName} {l.lastName}</div>
                            <div className="text-[9px] font-mono text-[#3a5070]">{l.email}</div>
                          </td>
                          <td className="px-3 py-3 text-[11px] font-mono text-[#94b4d4]">{l.state}</td>
                          <td className="px-3 py-3">
                            <div className="flex gap-1 flex-wrap">
                              {l.interestedInACA     && <span className="text-[8px] font-mono text-[#38bdf8] bg-[#0a1a2a] px-1.5 py-0.5 rounded-sm">ACA</span>}
                              {l.interestedInMedicare && <span className="text-[8px] font-mono text-[#a78bfa] bg-[#1a0a2a] px-1.5 py-0.5 rounded-sm">MED</span>}
                              {l.interestedInFinalExpense && <span className="text-[8px] font-mono text-[#00d084] bg-[#0a2a1a] px-1.5 py-0.5 rounded-sm">FE</span>}
                            </div>
                          </td>
                          <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                            {editStatus[l.id] !== undefined ? (
                              <div className="flex items-center gap-1">
                                <select value={editStatus[l.id]}
                                  onChange={e => setEditStatus(prev => ({ ...prev, [l.id]: e.target.value }))}
                                  className="bg-[#060e1c] border border-[#2563eb] text-[#38bdf8] text-[9px] font-mono px-2 py-1 rounded-sm focus:outline-none">
                                  {STATUS_OPTS.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                                </select>
                                <button onClick={() => handleStatusSave(l.id)}
                                  className="text-[#00d084] hover:text-[#00ff9d] p-0.5">✓</button>
                                <button onClick={() => setEditStatus(prev => { const n = { ...prev }; delete n[l.id]; return n; })}
                                  className="text-[#4a6080] hover:text-[#94b4d4] p-0.5">✗</button>
                              </div>
                            ) : (
                              <button onClick={() => setEditStatus(prev => ({ ...prev, [l.id]: l.status || "new" }))}
                                className="group/s flex items-center gap-1.5">
                                <StatusBadge status={l.status} />
                                <Edit3 className="w-2.5 h-2.5 text-[#2a4060] opacity-0 group-hover/s:opacity-100 transition-opacity" />
                              </button>
                            )}
                          </td>
                          <td className="px-3 py-3">
                            <span className={`text-[10px] font-mono ${l.tcpaConsent ? "text-[#00d084]" : "text-[#4a6080]"}`}>
                              {l.tcpaConsent ? "✓ YES" : "✗ NO"}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-1">
                              <span className="text-[11px] font-mono font-bold num" style={{ color: (l.leadScore||50) >= 80 ? "#00d084" : (l.leadScore||50) >= 60 ? "#fbbf24" : "#ff4d4d" }}>
                                {l.leadScore || 50}
                              </span>
                              <div className="w-10 h-1.5 bg-[#0a1120] rounded-full overflow-hidden">
                                <div className="h-full pipeline-bar rounded-full"
                                  style={{ width: `${l.leadScore||50}%`, background: (l.leadScore||50) >= 80 ? "#00d084" : (l.leadScore||50) >= 60 ? "#fbbf24" : "#ff4d4d" }} />
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <span className={`text-[10px] font-mono ${l.dnc ? "text-[#ff4d4d]" : "text-[#2a4060]"}`}>
                              {l.dnc ? "DNC" : "—"}
                            </span>
                          </td>
                          <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              {!l.dnc && (
                                <button onClick={() => dncMutation.mutate(l.id)} title="Mark DNC"
                                  className="p-1 hover:bg-[#1a0808] text-[#4a6080] hover:text-[#ff4d4d] rounded-sm transition-colors">
                                  <PhoneOff className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {expanded === l.id
                                ? <ChevronDown className="w-3.5 h-3.5 text-[#38bdf8]" />
                                : <ChevronRight className="w-3.5 h-3.5 text-[#4a6080]" />}
                            </div>
                          </td>
                        </tr>

                        {/* Expanded row */}
                        {expanded === l.id && (
                          <tr key={`exp-${l.id}`}>
                            <td colSpan={9} className="px-6 py-4 bg-[#060e1c] border-t border-[#1a2a42]">
                              <div className="slide-down grid grid-cols-2 md:grid-cols-4 gap-5">
                                <div>
                                  <p className="text-[9px] font-mono text-[#3a5070] tracking-widest mb-2">CONTACT</p>
                                  <p className="text-[11px] font-mono text-[#94b4d4]">{l.phoneNumber}</p>
                                  <p className="text-[10px] font-mono text-[#4a6080]">{l.email}</p>
                                  <p className="text-[10px] font-mono text-[#4a6080]">{l.zipCode}, {l.state}</p>
                                </div>
                                <div>
                                  <p className="text-[9px] font-mono text-[#3a5070] tracking-widest mb-2">PROFILE</p>
                                  <p className="text-[10px] font-mono text-[#4a6080]">DOB: {l.dateOfBirth || "—"}</p>
                                  <p className="text-[10px] font-mono text-[#4a6080]">Income: {l.annualIncome ? `$${Number(l.annualIncome).toLocaleString()}` : "—"}</p>
                                  <p className="text-[10px] font-mono text-[#4a6080]">Household: {l.householdSize || "—"}</p>
                                  <p className="text-[10px] font-mono text-[#4a6080]">Source: {l.source || "web_form"}</p>
                                </div>
                                <div>
                                  <p className="text-[9px] font-mono text-[#3a5070] tracking-widest mb-2">ELIGIBILITY</p>
                                  <p className={`text-[10px] font-mono ${l.hasMedicaidMedicareVA ? "text-[#fbbf24]" : "text-[#4a6080]"}`}>Medicaid/VA: {l.hasMedicaidMedicareVA ? "YES" : "NO"}</p>
                                  <p className={`text-[10px] font-mono ${l.tcpaConsent ? "text-[#00d084]" : "text-[#ff4d4d]"}`}>TCPA: {l.tcpaConsent ? "✓ CONSENTED" : "✗ NOT CONSENTED"}</p>
                                  <p className={`text-[10px] font-mono ${l.dnc ? "text-[#ff4d4d]" : "text-[#4a6080]"}`}>DNC: {l.dnc ? "YES" : "NO"}</p>
                                  <p className="text-[10px] font-mono text-[#4a6080]">Aging Score: {l.agingScore ?? 100}%</p>
                                </div>
                                <div>
                                  <p className="text-[9px] font-mono text-[#3a5070] tracking-widest mb-2">NOTES & TAGS</p>
                                  <p className="text-[10px] font-mono text-[#4a6080]">{l.notes || "No notes recorded."}</p>
                                  <div className="mt-2 flex flex-wrap gap-1">
                                    {(l.tags || []).map((tag: string, i: number) => (
                                      <span key={i} className="text-[8px] font-mono text-[#a78bfa] bg-[#1a0a2a] px-2 py-0.5 rounded-sm">{tag}</span>
                                    ))}
                                  </div>
                                  <p className="text-[9px] font-mono text-[#2a4060] mt-2">Captured: {new Date(l.createdAt).toLocaleDateString()}</p>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-2.5 border-t border-[#1e2d4a] flex items-center justify-between">
                <span className="text-[10px] font-mono text-[#3a5070]">{leads.length} LEADS SHOWN</span>
                <span className="text-[9px] font-mono text-[#2a4060]">Click row to expand · Click status badge to edit inline</span>
              </div>
            </div>
          </div>
        )}

        {/* ── LISTINGS ────────────────────────────────────────────────────── */}
        {tab === "listings" && (
          <div className="fade-in">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono text-[#4a6080]">{listings.length} TOTAL · {listings.filter(l => l.isActive).length} ACTIVE</span>
              <button onClick={() => window.open("/api/export/listings", "_blank")}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#060e1c] border border-[#1e2d4a] hover:border-[#2563eb] text-[#4a6080] hover:text-[#38bdf8] text-[10px] font-mono rounded-sm transition-colors">
                <Download className="w-3.5 h-3.5" /> EXPORT
              </button>
            </div>
            <div className="bg-[#0d1526] border border-[#1e2d4a] rounded-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#1e2d4a]">
                      {["ID","LEAD","INDUSTRY","GEO","PRICE","QUALITY","RESOLD","FEATURED","STATUS","LISTED"].map(h => (
                        <th key={h} className="px-3 py-2.5 text-left text-[9px] font-mono tracking-widest text-[#3a5070] whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#0a1120]">
                    {listings.map((l: any) => (
                      <tr key={l.id} className="hover:bg-[#0a1628] transition-colors">
                        <td className="px-3 py-3 text-[11px] font-mono text-[#4a6080] num">{l.id}</td>
                        <td className="px-3 py-3 text-[11px] font-mono text-[#94b4d4] num">{l.leadId}</td>
                        <td className="px-3 py-3 text-[10px] font-mono text-[#94b4d4]">{l.industry?.toUpperCase()}</td>
                        <td className="px-3 py-3 text-[10px] font-mono text-[#94b4d4]">{l.geography}</td>
                        <td className="px-3 py-3 text-[12px] font-mono font-bold text-[#00d084] num">${l.price}</td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-mono font-bold num" style={{ color: l.qualityScore>=90?"#00d084":l.qualityScore>=75?"#fbbf24":"#ff4d4d" }}>{l.qualityScore}</span>
                            <div className="w-10 h-1 bg-[#0a1120] rounded-full overflow-hidden">
                              <div className="h-full pipeline-bar rounded-full" style={{ width:`${l.qualityScore}%`, background: l.qualityScore>=90?"#00d084":l.qualityScore>=75?"#fbbf24":"#ff4d4d" }} />
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-[11px] font-mono text-[#4a6080] num">{l.timesResold}</td>
                        <td className="px-3 py-3">
                          {l.featured ? <span className="badge-featured">FEATURED</span> : <span className="text-[#2a4060] text-[9px] font-mono">—</span>}
                        </td>
                        <td className="px-3 py-3">
                          <span className={`text-[10px] font-mono font-bold ${l.isActive?"text-[#00d084]":"text-[#4a6080]"}`}>
                            {l.isActive ? "ACTIVE" : "SOLD"}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-[9px] font-mono text-[#2a4060]">{new Date(l.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── NEW LISTING ──────────────────────────────────────────────────── */}
        {tab === "new" && (
          <div className="fade-in max-w-xl">
            <div className="bg-[#0d1526] border border-[#1e2d4a] rounded-sm p-6">
              <p className="text-[10px] font-mono tracking-widest text-[#4a6080] mb-5">CREATE MARKETPLACE LISTING</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-[9px] font-mono tracking-widest text-[#4a6080] mb-1.5">LEAD ID</label>
                  <input type="number" value={newListing.leadId} onChange={e => setNewListing(p => ({ ...p, leadId: e.target.value }))}
                    placeholder="Enter lead ID from the database"
                    className="w-full bg-[#060e1c] border border-[#1e2d4a] text-[#94b4d4] text-[12px] font-mono px-3 py-2.5 rounded-sm focus:outline-none focus:border-[#2563eb] placeholder-[#2a4060]" />
                </div>
                <div>
                  <label className="block text-[9px] font-mono tracking-widest text-[#4a6080] mb-1.5">PRICE ($)</label>
                  <input type="number" value={newListing.price} onChange={e => setNewListing(p => ({ ...p, price: e.target.value }))}
                    placeholder="e.g. 42.00"
                    className="w-full bg-[#060e1c] border border-[#1e2d4a] text-[#94b4d4] text-[12px] font-mono px-3 py-2.5 rounded-sm focus:outline-none focus:border-[#2563eb] placeholder-[#2a4060]" />
                </div>
                <div>
                  <label className="block text-[9px] font-mono tracking-widest text-[#4a6080] mb-1.5">INDUSTRY</label>
                  <select value={newListing.industry} onChange={e => setNewListing(p => ({ ...p, industry: e.target.value }))}
                    className="w-full bg-[#060e1c] border border-[#1e2d4a] text-[#94b4d4] text-[12px] font-mono px-3 py-2.5 rounded-sm focus:outline-none focus:border-[#2563eb]">
                    {["healthcare","medicare","insurance","final_expense","dental","vision"].map(i => <option key={i} value={i}>{i.toUpperCase()}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-mono tracking-widest text-[#4a6080] mb-1.5">GEOGRAPHY (STATE CODE)</label>
                  <input value={newListing.geography} onChange={e => setNewListing(p => ({ ...p, geography: e.target.value.toUpperCase() }))}
                    placeholder="FL" maxLength={2}
                    className="w-full bg-[#060e1c] border border-[#1e2d4a] text-[#94b4d4] text-[12px] font-mono px-3 py-2.5 rounded-sm focus:outline-none focus:border-[#2563eb] placeholder-[#2a4060]" />
                </div>
                <button
                  onClick={() => createListingMutation.mutate({ leadId: parseInt(newListing.leadId), price: newListing.price, industry: newListing.industry, geography: newListing.geography, qualityScore: 85, timesResold: 0, isActive: true, featured: false, sellerId: 1 })}
                  disabled={createListingMutation.isPending || !newListing.leadId || !newListing.price}
                  className="w-full py-3 bg-[#0d1e3a] hover:bg-[#1a3a6b] border border-[#2563eb] text-[#38bdf8] font-mono font-bold text-[12px] rounded-sm transition-colors disabled:opacity-40 flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" />
                  {createListingMutation.isPending ? "LISTING..." : "CREATE LISTING →"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── MARKET DATA ─────────────────────────────────────────────────── */}
        {tab === "market" && (
          <div className="fade-in space-y-5">
            <div className="bg-[#0d1526] border border-[#1e2d4a] rounded-sm p-4">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-mono tracking-widest text-[#4a6080]">AI DEMAND PREDICTIONS</p>
                <div className="flex gap-2">
                  <select value={genPred.industry} onChange={e => setGenPred(p => ({ ...p, industry: e.target.value }))}
                    className="bg-[#060e1c] border border-[#1e2d4a] text-[#94b4d4] text-[10px] font-mono px-2 py-1.5 rounded-sm focus:outline-none">
                    {["healthcare","medicare","insurance"].map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                  <select value={genPred.geography} onChange={e => setGenPred(p => ({ ...p, geography: e.target.value }))}
                    className="bg-[#060e1c] border border-[#1e2d4a] text-[#94b4d4] text-[10px] font-mono px-2 py-1.5 rounded-sm focus:outline-none">
                    {["CA","FL","TX","NY","AZ","GA","IL"].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <button onClick={() => generatePredMutation.mutate(genPred)} disabled={generatePredMutation.isPending}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0d1e3a] border border-[#2563eb] text-[#38bdf8] text-[10px] font-mono rounded-sm hover:bg-[#1a3a6b] transition-colors disabled:opacity-40">
                    <RefreshCw className={`w-3 h-3 ${generatePredMutation.isPending ? "animate-spin" : ""}`} /> GENERATE
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {predictions.slice(0, 8).map((p: any) => (
                  <div key={p.id} className="bg-[#060e1c] border border-[#1e2d4a] rounded-sm p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] font-mono text-[#4a6080]">{p.industry?.toUpperCase()}/{p.geography}</span>
                      <span className="text-[9px] font-mono text-[#2a4060]">{parseFloat(p.confidence).toFixed(0)}% conf</span>
                    </div>
                    <div className="text-[26px] font-mono font-bold num" style={{ color: p.predictedDemand>=85?"#00d084":p.predictedDemand>=70?"#fbbf24":"#ff4d4d" }}>
                      {p.predictedDemand}
                    </div>
                    <div className="text-[8px] font-mono text-[#3a5070] mb-2">DEMAND INDEX</div>
                    <div className="h-1 bg-[#0a1120] rounded-full overflow-hidden">
                      <div className="h-full pipeline-bar rounded-full" style={{ width:`${p.predictedDemand}%`, background: p.predictedDemand>=85?"#00d084":p.predictedDemand>=70?"#fbbf24":"#ff4d4d" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#0d1526] border border-[#1e2d4a] rounded-sm p-4">
              <p className="text-[10px] font-mono tracking-widest text-[#4a6080] mb-4">MARKET TREND DATA — VOLUME & AVG PRICE</p>
              {trends.length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={trends.slice(0, 20)}>
                    <XAxis dataKey="id" tick={{ fill: "#4a6080", fontSize: 9, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#2a4060", fontSize: 9, fontFamily: "monospace" }} axisLine={false} tickLine={false} width={38} />
                    <Tooltip contentStyle={{ background: "#0d1526", border: "1px solid #1e2d4a", fontFamily: "monospace", fontSize: 10, color: "#c8daf0" }} />
                    <Line type="monotone" dataKey="volume"   stroke="#38bdf8" dot={false} strokeWidth={2} />
                    <Line type="monotone" dataKey="avgPrice" stroke="#00d084" dot={false} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-[11px] font-mono text-[#2a4060] py-10">No trend data available</p>
              )}
            </div>
          </div>
        )}

        {/* ── USERS ───────────────────────────────────────────────────────── */}
        {tab === "users" && (
          <div className="fade-in">
            <div className="bg-[#0d1526] border border-[#1e2d4a] rounded-sm overflow-hidden">
              <div className="px-4 py-2.5 border-b border-[#1e2d4a]">
                <span className="text-[10px] font-mono tracking-widest text-[#4a6080]">USER ACCOUNTS — {allUsers.length} REGISTERED</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#1e2d4a]">
                      {["ID","USERNAME","EMAIL","ROLE","REGISTERED"].map(h => (
                        <th key={h} className="px-4 py-2.5 text-left text-[9px] font-mono tracking-widest text-[#3a5070]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#0a1120]">
                    {allUsers.length === 0 ? (
                      <tr><td colSpan={5} className="px-4 py-10 text-center text-[11px] font-mono text-[#2a4060]">NO USERS</td></tr>
                    ) : allUsers.map((u: any) => (
                      <tr key={u.id} className="hover:bg-[#0a1628] transition-colors">
                        <td className="px-4 py-3 text-[11px] font-mono text-[#4a6080] num">{u.id}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-[#1a3a6b] flex items-center justify-center">
                              <span className="text-[9px] font-bold text-[#38bdf8]">{u.username[0].toUpperCase()}</span>
                            </div>
                            <span className="text-[11px] font-mono text-[#c8daf0]">{u.username}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[10px] font-mono text-[#4a6080]">{u.email || "—"}</td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-mono font-bold ${u.role==="admin"?"text-[#ff4d4d]":u.role==="agent"?"text-[#00d084]":"text-[#fbbf24]"}`}>
                            {u.role?.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[10px] font-mono text-[#2a4060]">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
