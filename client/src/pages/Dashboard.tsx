import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Activity, Users, TrendingUp, DollarSign, Bell, PhoneCall, ShoppingCart,
  ArrowRight, Zap, CheckCircle2, AlertTriangle, BarChart2, Shield, Clock,
  Target, Award, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import Header from "@/components/Header";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";

function relTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const STATUS_COLORS: Record<string, string> = {
  new:       "#38bdf8",
  contacted: "#fbbf24",
  qualified: "#a78bfa",
  converted: "#00d084",
  archived:  "#4a6080",
};

const activityIcon = (type: string) => {
  if (type === "call")  return <PhoneCall className="w-3.5 h-3.5 text-[#38bdf8]" />;
  if (type === "email") return <Zap        className="w-3.5 h-3.5 text-[#a78bfa]" />;
  return <Activity className="w-3.5 h-3.5 text-[#4a6080]" />;
};

export default function Dashboard() {
  const { data: dashResp, isLoading } = useQuery<any>({
    queryKey: ["/api/dashboard"],
    queryFn: () => fetch("/api/dashboard?userId=1").then(r => r.json()),
    refetchInterval: 30_000,
  });
  const { data: leadsResp } = useQuery<any>({
    queryKey: ["/api/leads"],
    queryFn: () => fetch("/api/leads").then(r => r.json()),
    staleTime: 60_000,
  });
  const { data: alertsResp } = useQuery<any>({
    queryKey: ["/api/alerts"],
    queryFn: () => fetch("/api/alerts?userId=1").then(r => r.json()),
    refetchInterval: 30_000,
  });
  const { data: listingsResp } = useQuery<any>({
    queryKey: ["/api/lead-listings/all"],
    queryFn: () => fetch("/api/lead-listings/all").then(r => r.json()),
    staleTime: 60_000,
  });

  const dash = dashResp?.data;
  const stats = dash?.leadStats;
  const allLeads = leadsResp?.data || [];
  const recentAlerts = (alertsResp?.data || []).slice(0, 5);
  const allListings = listingsResp?.data || [];
  const activeListings = allListings.filter((l: any) => l.isActive);

  // Status bar chart data
  const statusData = stats ? Object.entries(stats.byStatus).map(([k, v]) => ({
    name: k.charAt(0).toUpperCase() + k.slice(1),
    count: v as number,
    color: STATUS_COLORS[k] || "#4a6080",
  })) : [];

  // Source distribution
  const sourceData = stats ? Object.entries(stats.bySource || {}).map(([k, v]) => ({
    name: k.replace(/_/g, " ").toUpperCase(),
    value: v as number,
  })) : [];

  // Recent leads (last 5)
  const recentLeads = [...allLeads].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  // KPI cards
  const kpis = [
    {
      label: "TOTAL LEADS",
      value: stats?.total ?? "—",
      sub: `+${stats?.today || 0} today`,
      up: true,
      icon: <Users className="w-5 h-5 text-[#38bdf8]" />,
      color: "text-[#38bdf8]",
      border: "border-[#1e3a5f]",
      bg: "bg-[#060e1c]",
    },
    {
      label: "CREDIT BALANCE",
      value: dash ? `$${parseFloat(dash.balance).toFixed(2)}` : "—",
      sub: "Available funds",
      up: true,
      icon: <DollarSign className="w-5 h-5 text-[#00d084]" />,
      color: "text-[#00d084]",
      border: "border-[#0d2d1a]",
      bg: "bg-[#060e1c]",
    },
    {
      label: "ACTIVE LISTINGS",
      value: dash?.activeListings ?? "—",
      sub: `${dash?.totalListings ?? 0} total`,
      up: true,
      icon: <ShoppingCart className="w-5 h-5 text-[#a78bfa]" />,
      color: "text-[#a78bfa]",
      border: "border-[#1e1a3a]",
      bg: "bg-[#060e1c]",
    },
    {
      label: "CONVERSIONS",
      value: stats?.convertedCount ?? "—",
      sub: stats?.total ? `${((stats.convertedCount / stats.total) * 100).toFixed(1)}% rate` : "—",
      up: true,
      icon: <Award className="w-5 h-5 text-[#fbbf24]" />,
      color: "text-[#fbbf24]",
      border: "border-[#2a1d00]",
      bg: "bg-[#060e1c]",
    },
    {
      label: "TCPA CONSENTED",
      value: stats?.tcpaCount ?? "—",
      sub: stats?.total ? `${((stats.tcpaCount / stats.total) * 100).toFixed(0)}% of total` : "—",
      up: true,
      icon: <CheckCircle2 className="w-5 h-5 text-[#00d084]" />,
      color: "text-[#00d084]",
      border: "border-[#0d2d1a]",
      bg: "bg-[#060e1c]",
    },
    {
      label: "PENDING FOLLOW-UPS",
      value: dash?.pendingFollowUps ?? "—",
      sub: "Callbacks due",
      up: false,
      icon: <Clock className="w-5 h-5 text-[#ff4d4d]" />,
      color: "text-[#ff4d4d]",
      border: "border-[#2d0d0d]",
      bg: "bg-[#060e1c]",
    },
  ];

  const alertIcon = (type: string) => {
    if (type === "purchase")     return <CheckCircle2 className="w-3.5 h-3.5 text-[#00d084]" />;
    if (type === "market_signal") return <TrendingUp  className="w-3.5 h-3.5 text-[#a78bfa]" />;
    if (type === "low_balance")  return <DollarSign   className="w-3.5 h-3.5 text-[#fbbf24]" />;
    if (type === "prime_lead")   return <Zap          className="w-3.5 h-3.5 text-[#00d084]" />;
    if (type === "dnc")          return <AlertTriangle className="w-3.5 h-3.5 text-[#ff4d4d]" />;
    if (type === "converted")    return <Award        className="w-3.5 h-3.5 text-[#a78bfa]" />;
    return <Bell className="w-3.5 h-3.5 text-[#38bdf8]" />;
  };

  const SOURCES_COLORS = ["#38bdf8", "#a78bfa", "#00d084", "#fbbf24", "#ff4d4d"];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#070d1a] flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-[12px] font-mono text-[#2a4060] tracking-widest animate-pulse">LOADING DASHBOARD...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070d1a] flex flex-col">
      <Header />

      <main className="flex-1 p-4 md:p-6 max-w-screen-2xl mx-auto w-full">
        {/* Page title */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-[14px] font-mono font-bold text-[#c8daf0] tracking-widest">OPERATIONS DASHBOARD</h1>
            <p className="text-[10px] font-mono text-[#4a6080] mt-0.5">Real-time lead intelligence · {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00d084] blink" />
            <span className="text-[9px] font-mono text-[#00d084]">LIVE DATA</span>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
          {kpis.map((k) => (
            <div key={k.label} className={`${k.bg} border ${k.border} rounded-sm p-4 fade-in`}>
              <div className="flex items-start justify-between mb-2">
                {k.icon}
                {k.up
                  ? <ArrowUpRight className="w-3.5 h-3.5 text-[#00d084]" />
                  : <ArrowDownRight className="w-3.5 h-3.5 text-[#ff4d4d]" />
                }
              </div>
              <div className={`text-[22px] font-mono font-bold num ${k.color} leading-none`}>{k.value}</div>
              <div className="text-[8px] font-mono text-[#4a6080] tracking-widest mt-1">{k.label}</div>
              <div className="text-[9px] font-mono text-[#2a4060] mt-0.5">{k.sub}</div>
            </div>
          ))}
        </div>

        {/* Main layout: charts + feeds */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Left: charts (2/3 width) */}
          <div className="lg:col-span-2 space-y-4">

            {/* Status distribution chart */}
            <div className="bg-[#0d1526] border border-[#1e2d4a] rounded-sm p-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-mono tracking-widest text-[#4a6080]">LEAD PIPELINE STATUS</span>
                <Link href="/admin">
                  <span className="text-[9px] font-mono text-[#2563eb] hover:text-[#38bdf8] cursor-pointer flex items-center gap-1">
                    MANAGE <ArrowRight className="w-3 h-3" />
                  </span>
                </Link>
              </div>
              {statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={statusData} barSize={28}>
                    <XAxis dataKey="name" tick={{ fill: "#4a6080", fontSize: 9, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#2a4060", fontSize: 9, fontFamily: "monospace" }} axisLine={false} tickLine={false} width={25} />
                    <Tooltip
                      contentStyle={{ background: "#0d1526", border: "1px solid #1e2d4a", fontFamily: "monospace", fontSize: 11, color: "#c8daf0" }}
                      cursor={{ fill: "rgba(37,99,235,0.05)" }}
                    />
                    <Bar dataKey="count" radius={[2,2,0,0]}>
                      {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-40 flex items-center justify-center text-[10px] font-mono text-[#2a4060]">NO DATA YET</div>
              )}

              {/* Pipeline numbers */}
              <div className="grid grid-cols-5 gap-2 mt-3">
                {Object.entries(stats?.byStatus || {}).map(([k, v]) => (
                  <div key={k} className="text-center">
                    <div className="text-[14px] font-mono font-bold num" style={{ color: STATUS_COLORS[k] }}>{v as number}</div>
                    <div className="text-[8px] font-mono text-[#3a5070] tracking-widest mt-0.5">{k.toUpperCase()}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Industry breakdown + Source distribution */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Industry stats */}
              <div className="bg-[#0d1526] border border-[#1e2d4a] rounded-sm p-4">
                <span className="text-[10px] font-mono tracking-widest text-[#4a6080] block mb-3">INTEREST BREAKDOWN</span>
                <div className="space-y-3">
                  {[
                    { label: "ACA / OBAMACARE", value: stats?.acaCount || 0, color: "#38bdf8" },
                    { label: "MEDICARE", value: stats?.medicareCount || 0, color: "#a78bfa" },
                    { label: "FINAL EXPENSE", value: stats?.finalExpCount || 0, color: "#00d084" },
                    { label: "DNC (EXCLUDED)", value: stats?.dncCount || 0, color: "#ff4d4d" },
                  ].map(item => {
                    const pct = stats?.total ? (item.value / stats.total) * 100 : 0;
                    return (
                      <div key={item.label}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[9px] font-mono text-[#4a6080]">{item.label}</span>
                          <span className="text-[11px] font-mono font-bold num" style={{ color: item.color }}>{item.value}</span>
                        </div>
                        <div className="h-1 bg-[#0a1120] rounded-full overflow-hidden">
                          <div className="h-full pipeline-bar rounded-full" style={{ width: `${pct}%`, background: item.color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Source distribution */}
              <div className="bg-[#0d1526] border border-[#1e2d4a] rounded-sm p-4">
                <span className="text-[10px] font-mono tracking-widest text-[#4a6080] block mb-3">LEAD SOURCES</span>
                {sourceData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={110}>
                    <PieChart>
                      <Pie data={sourceData} dataKey="value" cx="40%" cy="50%" innerRadius={35} outerRadius={52} paddingAngle={3}>
                        {sourceData.map((_: any, i: number) => <Cell key={i} fill={SOURCES_COLORS[i % SOURCES_COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: "#0d1526", border: "1px solid #1e2d4a", fontFamily: "monospace", fontSize: 10, color: "#c8daf0" }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : null}
                <div className="space-y-1.5 mt-2">
                  {sourceData.slice(0, 4).map((s: any, i: number) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: SOURCES_COLORS[i % SOURCES_COLORS.length] }} />
                        <span className="text-[9px] font-mono text-[#4a6080]">{s.name}</span>
                      </div>
                      <span className="text-[10px] font-mono text-[#94b4d4] num">{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Leads */}
            <div className="bg-[#0d1526] border border-[#1e2d4a] rounded-sm">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1e2d4a]">
                <span className="text-[10px] font-mono tracking-widest text-[#4a6080]">RECENT CAPTURES</span>
                <Link href="/admin">
                  <span className="text-[9px] font-mono text-[#2563eb] hover:text-[#38bdf8] cursor-pointer flex items-center gap-1">VIEW ALL <ArrowRight className="w-3 h-3" /></span>
                </Link>
              </div>
              <div className="divide-y divide-[#0d1120]">
                {recentLeads.length === 0 ? (
                  <div className="px-4 py-6 text-center text-[10px] font-mono text-[#2a4060]">NO LEADS YET</div>
                ) : recentLeads.map((l: any) => {
                  const status = l.status || "new";
                  return (
                    <div key={l.id} className="flex items-center gap-3 px-4 py-3 hover:bg-[#0a1628] transition-colors">
                      <div className="w-7 h-7 rounded-sm bg-[#1a3a6b] flex items-center justify-center flex-shrink-0">
                        <span className="text-[11px] font-mono font-bold text-[#38bdf8]">{l.firstName?.[0] || "?"}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono font-semibold text-[#c8daf0]">{l.firstName} {l.lastName}</span>
                          <span className={`badge-${status}`}>{status.toUpperCase()}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-[9px] font-mono text-[#4a6080]">{l.state}</span>
                          {l.interestedInACA    && <span className="text-[8px] font-mono text-[#38bdf8]">ACA</span>}
                          {l.interestedInMedicare && <span className="text-[8px] font-mono text-[#a78bfa]">MEDICARE</span>}
                          {l.interestedInFinalExpense && <span className="text-[8px] font-mono text-[#00d084]">FINAL EXP</span>}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-[10px] font-mono font-bold text-[#94b4d4] num">SCR {l.leadScore || 50}</div>
                        <div className="text-[9px] font-mono text-[#2a4060]">{relTime(l.createdAt)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: alerts + quick actions */}
          <div className="space-y-4">
            {/* Quick actions */}
            <div className="bg-[#0d1526] border border-[#1e2d4a] rounded-sm p-4">
              <span className="text-[10px] font-mono tracking-widest text-[#4a6080] block mb-3">QUICK ACTIONS</span>
              <div className="space-y-2">
                {[
                  { href: "/home",        icon: Activity,      label: "CAPTURE LEAD",   desc: "New intake form",   color: "text-[#38bdf8]" },
                  { href: "/marketplace", icon: ShoppingCart,  label: "BROWSE MARKET",  desc: "Buy leads",         color: "text-[#a78bfa]" },
                  { href: "/admin",       icon: BarChart2,     label: "LEAD DATABASE",  desc: "Search & manage",   color: "text-[#00d084]" },
                  { href: "/admin",       icon: Shield,        label: "COMMAND CENTER", desc: "Analytics & AI",    color: "text-[#fbbf24]" },
                ].map(item => (
                  <Link key={item.label} href={item.href}>
                    <div className="flex items-center gap-3 p-2.5 bg-[#060e1c] border border-[#1e2d4a] rounded-sm hover:border-[#2563eb] hover:bg-[#0a1628] transition-colors cursor-pointer group">
                      <item.icon className={`w-4 h-4 ${item.color} flex-shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <div className={`text-[11px] font-mono font-semibold ${item.color}`}>{item.label}</div>
                        <div className="text-[9px] font-mono text-[#2a4060]">{item.desc}</div>
                      </div>
                      <ArrowRight className="w-3 h-3 text-[#2a4060] group-hover:text-[#38bdf8] transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Market signals */}
            <div className="bg-[#0d1526] border border-[#1e2d4a] rounded-sm p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-3.5 h-3.5 text-[#a78bfa]" />
                <span className="text-[10px] font-mono tracking-widest text-[#4a6080]">MARKET SIGNALS</span>
              </div>
              <div className="space-y-2.5">
                {[
                  { state: "FL", industry: "Medicare",   demand: 94, color: "#00d084", change: "+12%" },
                  { state: "CA", industry: "ACA",        demand: 88, color: "#38bdf8", change: "+8%"  },
                  { state: "NY", industry: "Medicare",   demand: 81, color: "#38bdf8", change: "+4%"  },
                  { state: "TX", industry: "Insurance",  demand: 72, color: "#fbbf24", change: "-2%"  },
                ].map(sig => (
                  <div key={sig.state+sig.industry} className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-mono text-[#94b4d4]">{sig.state} · {sig.industry}</div>
                      <div className="h-1 bg-[#0a1120] rounded-full mt-1 overflow-hidden w-28">
                        <div className="h-full pipeline-bar rounded-full" style={{ width: `${sig.demand}%`, background: sig.color }} />
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[12px] font-mono font-bold num" style={{ color: sig.color }}>{sig.demand}</div>
                      <div className={`text-[9px] font-mono ${sig.change.startsWith("+") ? "text-[#00d084]" : "text-[#ff4d4d]"}`}>{sig.change}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Alerts */}
            <div className="bg-[#0d1526] border border-[#1e2d4a] rounded-sm">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1e2d4a]">
                <span className="text-[10px] font-mono tracking-widest text-[#4a6080]">RECENT ALERTS</span>
                <span className="text-[9px] font-mono text-[#2a4060]">{recentAlerts.filter((a: any) => !a.read).length} unread</span>
              </div>
              <div className="divide-y divide-[#0d1120]">
                {recentAlerts.length === 0 ? (
                  <div className="px-4 py-5 text-center text-[10px] font-mono text-[#2a4060]">NO ALERTS</div>
                ) : recentAlerts.map((a: any) => (
                  <div key={a.id} className={`flex gap-3 px-4 py-3 ${!a.read ? "bg-[#0d1a2d]" : ""}`}>
                    <div className="mt-0.5 flex-shrink-0">{alertIcon(a.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-mono font-semibold text-[#c8daf0] truncate">{a.title}</p>
                        {!a.read && <div className="w-1.5 h-1.5 bg-[#2563eb] rounded-full flex-shrink-0 ml-2" />}
                      </div>
                      <p className="text-[9px] font-mono text-[#4a6080] truncate mt-0.5">{a.body}</p>
                      <p className="text-[8px] font-mono text-[#2a4060] mt-0.5">{relTime(a.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Market health */}
            <div className="bg-[#0d1526] border border-[#1e2d4a] rounded-sm p-4">
              <span className="text-[10px] font-mono tracking-widest text-[#4a6080] block mb-3">PORTFOLIO HEALTH</span>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono text-[#4a6080]">AVG QUALITY SCORE</span>
                  <span className="text-[13px] font-mono font-bold text-[#00d084] num">{stats?.avgAgingScore ?? "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono text-[#4a6080]">ACTIVE MARKET LISTINGS</span>
                  <span className="text-[13px] font-mono font-bold text-[#a78bfa] num">{activeListings.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono text-[#4a6080]">DNC EXCLUDED</span>
                  <span className="text-[13px] font-mono font-bold text-[#ff4d4d] num">{stats?.dncCount ?? "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono text-[#4a6080]">QUALIFIED PIPELINE</span>
                  <span className="text-[13px] font-mono font-bold text-[#fbbf24] num">{stats?.byStatus?.qualified ?? "—"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
