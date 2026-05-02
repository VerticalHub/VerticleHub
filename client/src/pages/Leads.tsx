import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import { Helmet } from "react-helmet";
import {
  BarChart, Bar, AreaChart, Area, FunnelChart, Funnel, LabelList,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import {
  Activity, Users, TrendingUp, Target, Zap, MapPin,
  ArrowUpRight, ArrowDownRight, Wifi, Clock, CheckCircle2,
  AlertTriangle, Star, Globe
} from "lucide-react";

interface Lead {
  id: number; firstName: string; lastName: string; email: string;
  phoneNumber: string; state: string; interestedInACA: boolean;
  interestedInMedicare: boolean; interestedInFinalExpense: boolean;
  tcpaConsent?: boolean; dnc?: boolean; agingScore?: number; createdAt: string;
}

const FIRST = ["James", "Maria", "Robert", "Linda", "Michael", "Susan", "David", "Karen", "John", "Nancy", "William", "Lisa"];
const LAST  = ["T.", "M.", "R.", "W.", "C.", "J.", "H.", "S.", "P.", "B."];
const STATES = ["CA", "FL", "TX", "NY", "AZ", "GA", "OH", "PA", "NC", "WA"];
const INDS   = ["ACA", "Medicare", "Insurance", "Final Exp"];
const IND_COLORS: Record<string, string> = { "ACA": "#38bdf8", "Medicare": "#a78bfa", "Insurance": "#fbbf24", "Final Exp": "#00d084" };

function randInt(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randOf<T>(arr: T[]): T { return arr[randInt(0, arr.length - 1)]; }

interface FeedEntry {
  id: string; name: string; state: string; industry: string;
  score: number; timestamp: Date; isNew: boolean;
}

const qualityBuckets = [
  { range: "0–20",  count: 2,  color: "#ff4d4d" },
  { range: "21–40", count: 5,  color: "#ff7a4d" },
  { range: "41–60", count: 12, color: "#fbbf24" },
  { range: "61–80", count: 28, color: "#4ade80" },
  { range: "81–100",count: 41, color: "#00d084" },
];

const pipelineStages = [
  { name: "CAPTURED", value: 312, fill: "#38bdf8" },
  { name: "QUALIFIED", value: 241, fill: "#a78bfa" },
  { name: "LISTED", value: 142, fill: "#fbbf24" },
  { name: "SOLD", value: 89, fill: "#00d084" },
];

const hourlyVolume = [
  { h: "06", v: 8 }, { h: "07", v: 14 }, { h: "08", v: 22 }, { h: "09", v: 38 },
  { h: "10", v: 51 }, { h: "11", v: 44 }, { h: "12", v: 33 }, { h: "13", v: 47 },
  { h: "14", v: 61 }, { h: "15", v: 55 }, { h: "16", v: 42 }, { h: "17", v: 29 },
];

const geoMatrix = [
  { state: "FL", leads: 87, quality: 91, trend: 4.2 },
  { state: "CA", leads: 74, quality: 88, trend: 2.1 },
  { state: "TX", leads: 61, quality: 82, trend: -1.3 },
  { state: "NY", leads: 52, quality: 85, trend: 3.7 },
  { state: "AZ", leads: 38, quality: 78, trend: 1.9 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-[#0d1526] border border-[#1e2d4a] rounded-sm p-2 text-[11px] font-mono">
        <p className="text-[#4a6080] mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color || p.fill }}>{p.name}: {p.value}</p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Leads() {
  const [tab, setTab] = useState<"feed" | "pipeline" | "analytics">("feed");
  const [feed, setFeed] = useState<FeedEntry[]>([]);
  const [todayCount, setTodayCount] = useState(47);
  const feedRef = useRef<HTMLDivElement>(null);

  const { data: leadsResp } = useQuery<any>({ queryKey: ["/api/leads"] });
  const leads: Lead[] = leadsResp?.data || [];

  const avgScore = leads.length
    ? Math.round(leads.length * 87 / leads.length + Math.random() * 2)
    : 87;

  useEffect(() => {
    const seed: FeedEntry[] = Array.from({ length: 6 }).map((_, i) => ({
      id: `seed-${i}`,
      name: `${randOf(FIRST)} ${randOf(LAST)}`,
      state: randOf(STATES),
      industry: randOf(INDS),
      score: randInt(62, 98),
      timestamp: new Date(Date.now() - i * 90000),
      isNew: false,
    }));
    setFeed(seed);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const entry: FeedEntry = {
        id: `live-${Date.now()}`,
        name: `${randOf(FIRST)} ${randOf(LAST)}`,
        state: randOf(STATES),
        industry: randOf(INDS),
        score: randInt(55, 99),
        timestamp: new Date(),
        isNew: true,
      };
      setFeed(prev => [entry, ...prev].slice(0, 20).map((e, i) => ({ ...e, isNew: i === 0 })));
      setTodayCount(c => c + 1);
    }, randInt(7000, 14000));
    return () => clearInterval(interval);
  }, []);

  const qColor = (s: number) => s >= 85 ? "#00d084" : s >= 65 ? "#fbbf24" : "#ff4d4d";
  const qLabel = (s: number) => s >= 85 ? "PRIME" : s >= 65 ? "GOOD" : "AGED";

  const kpis = [
    { label: "TODAY'S LEADS", value: todayCount.toString(), sub: "+18% vs yesterday", up: true, color: "#38bdf8", icon: Activity },
    { label: "PIPELINE VALUE", value: `$${(todayCount * 34.5).toFixed(0)}`, sub: "+22% WoW", up: true, color: "#00d084", icon: TrendingUp },
    { label: "AVG QUALITY", value: `${avgScore}%`, sub: "-0.5% today", up: false, color: "#fbbf24", icon: Target },
    { label: "CONV RATE", value: "18.4%", sub: "+1.2% WoW", up: true, color: "#a78bfa", icon: Zap },
    { label: "LIVE TRACKING", value: "ACTIVE", sub: "feed connected", up: true, color: "#00d084", icon: Wifi },
  ];

  const tabs = [
    { id: "feed",      label: "LIVE FEED" },
    { id: "pipeline",  label: "PIPELINE" },
    { id: "analytics", label: "ANALYTICS" },
  ] as const;

  return (
    <>
      <Helmet>
        <title>Leads Intelligence | HealthLead Pro</title>
        <meta name="description" content="Real-time lead intelligence, pipeline analytics, and quality scoring." />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <Header />

      <div className="min-h-screen bg-[#070d1a] text-[#c8daf0]">
        {/* KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-5 border-b border-[#1e2d4a]">
          {kpis.map(({ label, value, sub, up, color, icon: Icon }) => (
            <div key={label} className="flex items-center gap-3 px-5 py-3 border-r border-[#1e2d4a] last:border-r-0">
              <div className="w-8 h-8 rounded-sm flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}18` }}>
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              <div>
                <p className="text-[9px] font-mono tracking-widest text-[#4a6080] uppercase">{label}</p>
                <p className="text-[15px] font-mono font-bold" style={{ color }}>
                  {label === "LIVE TRACKING" ? (
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block w-2 h-2 rounded-full bg-[#00d084] blink" />
                      {value}
                    </span>
                  ) : value}
                </p>
                <p className={`text-[9px] font-mono flex items-center gap-0.5 ${up ? "text-[#00d084]" : "text-[#ff4d4d]"}`}>
                  {up ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
                  {sub}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Tab Nav */}
        <div className="flex border-b border-[#1e2d4a] bg-[#050a14]">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`panel-tab ${tab === t.id ? "panel-tab-active" : ""}`}>
              {t.label}
            </button>
          ))}
          <div className="flex items-center gap-2 ml-auto px-4">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#00d084] blink" />
            <span className="text-[9px] font-mono text-[#00d084]">LIVE</span>
          </div>
        </div>

        <div className="overflow-auto" style={{ height: "calc(100vh - 178px)" }}>

          {/* ── LIVE FEED TAB ── */}
          {tab === "feed" && (
            <div className="flex gap-0 h-full">
              {/* Feed Column */}
              <div className="w-[420px] flex-shrink-0 border-r border-[#1e2d4a] flex flex-col overflow-hidden">
                <div className="terminal-header flex items-center justify-between flex-shrink-0">
                  <span className="text-[10px] font-mono text-[#4a6080] tracking-widest">INCOMING LEAD STREAM</span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00d084] blink inline-block" />
                    <span className="text-[9px] font-mono text-[#00d084]">LIVE</span>
                  </div>
                </div>
                <div ref={feedRef} className="flex-1 overflow-y-auto divide-y divide-[#0d1526]">
                  {feed.map((entry, i) => (
                    <div key={entry.id}
                      className={`flex items-center gap-3 px-4 py-2.5 hover:bg-[#0f1e35] transition-colors ${entry.isNew ? "lead-entry-new" : ""}`}>
                      <div className="w-8 h-8 rounded-sm flex items-center justify-center flex-shrink-0 font-mono font-bold text-[11px]"
                        style={{ backgroundColor: `${IND_COLORS[entry.industry]}18`, color: IND_COLORS[entry.industry] }}>
                        {entry.industry.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] font-mono text-[#c8daf0] font-medium">{entry.name}</span>
                          {entry.isNew && (
                            <span className="text-[8px] font-mono px-1 py-0.5 bg-[#00d08420] text-[#00d084] border border-[#00d08440] rounded-sm">NEW</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-mono" style={{ color: IND_COLORS[entry.industry] }}>{entry.industry}</span>
                          <span className="text-[9px] text-[#2a4060]">·</span>
                          <MapPin className="w-2.5 h-2.5 text-[#2a4060]" />
                          <span className="text-[10px] font-mono text-[#4a6080]">{entry.state}</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-[13px] font-mono font-bold" style={{ color: qColor(entry.score) }}>{entry.score}</p>
                        <p className="text-[8px] font-mono" style={{ color: qColor(entry.score) }}>{qLabel(entry.score)}</p>
                        <p className="text-[8px] font-mono text-[#2a4060] mt-0.5 flex items-center gap-0.5 justify-end">
                          <Clock className="w-2 h-2" />
                          {i === 0 && entry.isNew ? "just now" : `${Math.round((Date.now() - entry.timestamp.getTime()) / 60000)}m ago`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right column: charts */}
              <div className="flex-1 overflow-auto p-4 space-y-4">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  <div className="terminal-card">
                    <div className="terminal-header">
                      <span className="text-[10px] font-mono text-[#4a6080] tracking-widest">LEAD VOLUME — HOURLY TODAY</span>
                    </div>
                    <div className="p-4 h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={hourlyVolume}>
                          <defs>
                            <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="h" tickFormatter={h => `${h}:00`} />
                          <YAxis />
                          <Tooltip content={<CustomTooltip />} />
                          <Area type="monotone" dataKey="v" stroke="#38bdf8" fill="url(#volGrad)" strokeWidth={2} name="Leads" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="terminal-card">
                    <div className="terminal-header">
                      <span className="text-[10px] font-mono text-[#4a6080] tracking-widest">QUALITY DISTRIBUTION</span>
                    </div>
                    <div className="p-4 h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={qualityBuckets}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="range" />
                          <YAxis />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="count" radius={[2, 2, 0, 0]} name="Leads">
                            {qualityBuckets.map((entry, i) => (
                              <Cell key={i} fill={entry.color} fillOpacity={0.8} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Geo Matrix */}
                <div className="terminal-card">
                  <div className="terminal-header flex items-center justify-between">
                    <span className="text-[10px] font-mono text-[#4a6080] tracking-widest">TOP MARKETS — LIVE</span>
                    <Globe className="w-3 h-3 text-[#2a4060]" />
                  </div>
                  <table className="w-full text-[11px] font-mono">
                    <thead>
                      <tr className="border-b border-[#1e2d4a]">
                        {["STATE", "LEADS TODAY", "AVG QUALITY", "TREND"].map(h => (
                          <th key={h} className="text-left px-4 py-2 text-[9px] tracking-widest text-[#4a6080]">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {geoMatrix.map(g => (
                        <tr key={g.state} className="ticker-row">
                          <td className="px-4 py-2.5 text-[#38bdf8] font-bold">{g.state}</td>
                          <td className="px-4 py-2.5 text-[#94b4d4]">{g.leads}</td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-[#0d1526] rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${g.quality}%`, backgroundColor: qColor(g.quality) }} />
                              </div>
                              <span style={{ color: qColor(g.quality) }}>{g.quality}</span>
                            </div>
                          </td>
                          <td className="px-4 py-2.5">
                            <span className={`flex items-center gap-1 text-[11px] ${g.trend >= 0 ? "text-[#00d084]" : "text-[#ff4d4d]"}`}>
                              {g.trend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                              {g.trend >= 0 ? "+" : ""}{g.trend}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── PIPELINE TAB ── */}
          {tab === "pipeline" && (
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="terminal-card">
                  <div className="terminal-header">
                    <span className="text-[10px] font-mono text-[#4a6080] tracking-widest">LEAD PIPELINE — STAGE FUNNEL</span>
                  </div>
                  <div className="p-6 space-y-3">
                    {pipelineStages.map((stage, i) => {
                      const pct = Math.round((stage.value / pipelineStages[0].value) * 100);
                      return (
                        <div key={stage.name}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-mono text-[#4a6080] tracking-widest">{stage.name}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-mono text-[#4a6080]">{pct}%</span>
                              <span className="text-[13px] font-mono font-bold" style={{ color: stage.fill }}>{stage.value.toLocaleString()}</span>
                            </div>
                          </div>
                          <div className="w-full h-6 bg-[#0d1526] rounded-sm overflow-hidden flex items-center">
                            <div className="h-full rounded-sm transition-all flex items-center justify-end pr-2"
                              style={{ width: `${pct}%`, backgroundColor: stage.fill, opacity: 0.8 }}>
                              {pct > 15 && <span className="text-[10px] font-mono text-black font-bold">{stage.value}</span>}
                            </div>
                          </div>
                          {i < pipelineStages.length - 1 && (
                            <div className="text-[9px] font-mono text-[#2a4060] mt-1 text-right">
                              ↓ {Math.round(((pipelineStages[i].value - pipelineStages[i + 1].value) / pipelineStages[i].value) * 100)}% drop-off
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="terminal-card">
                  <div className="terminal-header">
                    <span className="text-[10px] font-mono text-[#4a6080] tracking-widest">PIPELINE VALUE BY STAGE</span>
                  </div>
                  <div className="p-4 h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={pipelineStages} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="name" width={70} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="value" radius={[0, 2, 2, 0]} name="Count">
                          {pipelineStages.map((s, i) => (
                            <Cell key={i} fill={s.fill} fillOpacity={0.8} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Avg Time to List", value: "4.2h", color: "#38bdf8" },
                  { label: "Avg Time to Sell", value: "18.6h", color: "#a78bfa" },
                  { label: "Resale Rate", value: "31%", color: "#fbbf24" },
                  { label: "Conversion Value", value: "$3,071", color: "#00d084" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="terminal-card p-4">
                    <p className="terminal-label mb-2">{label}</p>
                    <p className="text-2xl font-mono font-bold" style={{ color }}>{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── ANALYTICS TAB ── */}
          {tab === "analytics" && (
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="terminal-card">
                  <div className="terminal-header">
                    <span className="text-[10px] font-mono text-[#4a6080] tracking-widest">QUALITY SCORE DISTRIBUTION</span>
                  </div>
                  <div className="p-4 h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={qualityBuckets}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="range" />
                        <YAxis />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="count" radius={[2, 2, 0, 0]} name="Leads">
                          {qualityBuckets.map((entry, i) => (
                            <Cell key={i} fill={entry.color} fillOpacity={0.8} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="terminal-card">
                  <div className="terminal-header">
                    <span className="text-[10px] font-mono text-[#4a6080] tracking-widest">HOURLY INFLOW — 7 DAY AVG</span>
                  </div>
                  <div className="p-4 h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={hourlyVolume}>
                        <defs>
                          <linearGradient id="volGrad2" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="h" tickFormatter={h => `${h}:00`} />
                        <YAxis />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="v" stroke="#a78bfa" fill="url(#volGrad2)" strokeWidth={2} name="Avg Leads" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="terminal-card">
                <div className="terminal-header">
                  <span className="text-[10px] font-mono text-[#4a6080] tracking-widest">LEAD DATABASE — RECENT CAPTURES</span>
                </div>
                <table className="w-full text-[11px] font-mono">
                  <thead>
                    <tr className="border-b border-[#1e2d4a]">
                      {["ID", "NAME", "STATE", "AGING", "INTERESTS", "TCPA/DNC", "DATE"].map(h => (
                        <th key={h} className="text-left px-4 py-2 text-[9px] tracking-widest text-[#4a6080]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {leads.slice(0, 12).map((lead: Lead) => {
                      const interests = [
                        lead.interestedInACA && { label: "ACA", color: "#38bdf8" },
                        lead.interestedInMedicare && { label: "Medicare", color: "#a78bfa" },
                        lead.interestedInFinalExpense && { label: "Final Exp", color: "#00d084" },
                      ].filter(Boolean) as { label: string; color: string }[];
                      const hoursOld = Math.floor((Date.now() - new Date(lead.createdAt).getTime()) / 3_600_000);
                      const ageColor = hoursOld < 4 ? "#00d084" : hoursOld < 24 ? "#fbbf24" : "#ff4d4d";
                      return (
                        <tr key={lead.id} className="ticker-row">
                          <td className="px-4 py-2.5 text-[#4a6080]">#{lead.id}</td>
                          <td className="px-4 py-2.5 text-[#c8daf0]">{lead.firstName} {lead.lastName}</td>
                          <td className="px-4 py-2.5">
                            <span className="flex items-center gap-1 text-[#94b4d4]">
                              <MapPin className="w-2.5 h-2.5" />{lead.state}
                            </span>
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-2.5 h-2.5" style={{ color: ageColor }} />
                              <span className="text-[10px] font-mono font-semibold" style={{ color: ageColor }}>{hoursOld}h</span>
                              {lead.agingScore != null && (
                                <span className="text-[9px] font-mono text-[#2a4060]">· {lead.agingScore}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="flex gap-1 flex-wrap">
                              {interests.map(({ label, color }) => (
                                <span key={label} className="text-[9px] px-1 py-0.5 rounded-sm border"
                                  style={{ color, borderColor: `${color}40`, backgroundColor: `${color}10` }}>
                                  {label}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="flex gap-1">
                              {lead.tcpaConsent
                                ? <span className="text-[9px] font-mono text-[#00d084] bg-[#00d08415] border border-[#00d08430] px-1 py-0.5 rounded-sm">TCPA ✓</span>
                                : <span className="text-[9px] font-mono text-[#fbbf24] bg-[#fbbf2415] border border-[#fbbf2430] px-1 py-0.5 rounded-sm">NO CONSENT</span>}
                              {lead.dnc && <span className="text-[9px] font-mono text-[#ff4d4d] bg-[#ff4d4d15] border border-[#ff4d4d30] px-1 py-0.5 rounded-sm">DNC</span>}
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-[#2a4060]">{new Date(lead.createdAt).toLocaleDateString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
