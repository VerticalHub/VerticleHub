import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  FunnelChart, Funnel, LabelList,
} from "recharts";
import {
  Activity, Users, TrendingUp, Target, Zap, MapPin,
  CheckCircle2, Clock, PhoneCall, AlertTriangle, BarChart2,
  ArrowRight, Award, Shield,
} from "lucide-react";
import { Link } from "wouter";

const INTERESTS = ["ACA", "Medicare", "Final Expense"];
const STATES = ["FL","CA","TX","NY","AZ","GA","IL","NJ","PA","OH"];
const QUALITY_COLORS = { high: "#00d084", med: "#fbbf24", low: "#ff4d4d" };

const STATUS_COLORS: Record<string, string> = {
  new:       "#38bdf8",
  contacted: "#fbbf24",
  qualified: "#a78bfa",
  converted: "#00d084",
  archived:  "#4a6080",
};

function relTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

type Tab = "capture" | "pipeline" | "analytics" | "crm";

export default function Leads() {
  const [tab, setTab] = useState<Tab>("pipeline");
  const [liveFeed, setLiveFeed] = useState<any[]>([]);
  const feedRef = useRef<HTMLDivElement>(null);

  // ── Real data ──────────────────────────────────────────────────────────────
  const { data: statsResp } = useQuery<any>({
    queryKey: ["/api/leads/stats"],
    queryFn: () => fetch("/api/leads/stats").then(r => r.json()),
    refetchInterval: 30_000,
  });
  const stats = statsResp?.data;

  const { data: leadsResp } = useQuery<any>({
    queryKey: ["/api/leads"],
    queryFn: () => fetch("/api/leads").then(r => r.json()),
    refetchInterval: 60_000,
  });
  const allLeads: any[] = leadsResp?.data || [];

  const { data: activitiesResp } = useQuery<any>({
    queryKey: ["/api/activities/recent"],
    queryFn: () => fetch("/api/activities/recent?userId=1&limit=20").then(r => r.json()),
    refetchInterval: 30_000,
    enabled: tab === "crm",
  });
  const activities: any[] = activitiesResp?.data || [];

  const { data: followUpsResp } = useQuery<any>({
    queryKey: ["/api/follow-ups"],
    queryFn: () => fetch("/api/follow-ups?userId=1").then(r => r.json()),
    enabled: tab === "crm",
  });
  const followUps: any[] = followUpsResp?.data || [];

  // ── Live feed simulation using real leads ─────────────────────────────────
  useEffect(() => {
    if (allLeads.length > 0) {
      setLiveFeed(allLeads.slice(0, 8).map(l => ({
        ...l,
        liveTime: new Date(l.createdAt).getTime(),
      })));
    }

    const interval = setInterval(() => {
      if (allLeads.length === 0) return;
      const sample = allLeads[Math.floor(Math.random() * allLeads.length)];
      const synth = {
        ...sample,
        id: Date.now(),
        firstName: ["Alex","Sam","Jordan","Taylor","Morgan","Riley","Casey","Drew"][Math.floor(Math.random()*8)],
        lastName:  ["Smith","Brown","Davis","Wilson","Garcia","Lee","Chen","Martinez"][Math.floor(Math.random()*8)],
        state: STATES[Math.floor(Math.random() * STATES.length)],
        liveTime: Date.now(),
        interestedInACA:          Math.random() > 0.5,
        interestedInMedicare:     Math.random() > 0.6,
        interestedInFinalExpense: Math.random() > 0.7,
        tcpaConsent:              Math.random() > 0.3,
        leadScore:                Math.floor(Math.random() * 50) + 50,
      };
      setLiveFeed(prev => [synth, ...prev].slice(0, 12));
    }, 8000);
    return () => clearInterval(interval);
  }, [allLeads.length]);

  // ── Pipeline data from real stats ─────────────────────────────────────────
  const pipelineData = stats ? [
    { name: "NEW",       value: stats.byStatus.new || 0,       fill: "#38bdf8", pct: stats.total ? Math.round((stats.byStatus.new||0) / stats.total * 100) : 0 },
    { name: "CONTACTED", value: stats.byStatus.contacted || 0, fill: "#fbbf24", pct: stats.total ? Math.round((stats.byStatus.contacted||0) / stats.total * 100) : 0 },
    { name: "QUALIFIED", value: stats.byStatus.qualified || 0, fill: "#a78bfa", pct: stats.total ? Math.round((stats.byStatus.qualified||0) / stats.total * 100) : 0 },
    { name: "CONVERTED", value: stats.byStatus.converted || 0, fill: "#00d084", pct: stats.total ? Math.round((stats.byStatus.converted||0) / stats.total * 100) : 0 },
    { name: "ARCHIVED",  value: stats.byStatus.archived || 0,  fill: "#4a6080", pct: stats.total ? Math.round((stats.byStatus.archived||0) / stats.total * 100) : 0 },
  ] : [];

  // Quality distribution from real lead scores
  const qualityBuckets = { high: 0, med: 0, low: 0 };
  for (const l of allLeads) {
    const score = l.leadScore || 50;
    if (score >= 80) qualityBuckets.high++;
    else if (score >= 60) qualityBuckets.med++;
    else qualityBuckets.low++;
  }
  const qualityData = [
    { name: "HIGH (80+)", value: qualityBuckets.high, color: "#00d084" },
    { name: "MED (60-79)", value: qualityBuckets.med, color: "#fbbf24" },
    { name: "LOW (<60)",   value: qualityBuckets.low, color: "#ff4d4d" },
  ];

  // State distribution
  const stateData = stats ? Object.entries(stats.byState).sort((a: any, b: any) => (b[1] as number) - (a[1] as number)).slice(0, 8).map(([k, v]) => ({ state: k, count: v })) : [];

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "pipeline",  label: "PIPELINE",  icon: TrendingUp },
    { id: "analytics", label: "ANALYTICS", icon: BarChart2  },
    { id: "crm",       label: "CRM",       icon: PhoneCall  },
    { id: "capture",   label: "CAPTURE",   icon: Activity   },
  ];

  return (
    <div className="min-h-screen bg-[#070d1a] flex flex-col">
      <Header />

      <main className="flex-1 p-4 md:p-6 max-w-screen-2xl mx-auto w-full">
        {/* Page header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-[14px] font-mono font-bold text-[#c8daf0] tracking-widest">LEAD OPERATIONS CENTER</h1>
            <p className="text-[10px] font-mono text-[#4a6080]">
              {stats?.total ?? 0} total leads · {stats?.today ?? 0} captured today · {stats?.convertedCount ?? 0} converted
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00d084] blink" />
            <span className="text-[9px] font-mono text-[#00d084]">LIVE</span>
          </div>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 mb-5">
          {[
            { label: "TOTAL",     value: stats?.total ?? "—",              color: "text-[#38bdf8]"  },
            { label: "TODAY",     value: stats?.today ?? "—",              color: "text-[#fbbf24]"  },
            { label: "QUALIFIED", value: stats?.byStatus?.qualified ?? "—",color: "text-[#a78bfa]"  },
            { label: "CONVERTED", value: stats?.byStatus?.converted ?? "—",color: "text-[#00d084]"  },
            { label: "TCPA ✓",   value: stats?.tcpaCount ?? "—",          color: "text-[#00d084]"  },
            { label: "DNC",       value: stats?.dncCount ?? "—",           color: "text-[#ff4d4d]"  },
          ].map(k => (
            <div key={k.label} className="bg-[#0d1526] border border-[#1e2d4a] rounded-sm px-3 py-2.5">
              <div className={`text-[18px] font-mono font-bold num ${k.color}`}>{k.value}</div>
              <div className="text-[8px] font-mono text-[#3a5070] tracking-widest">{k.label}</div>
            </div>
          ))}
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

        {/* ── PIPELINE ────────────────────────────────────────────────────── */}
        {tab === "pipeline" && (
          <div className="fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Pipeline funnel */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-[#0d1526] border border-[#1e2d4a] rounded-sm p-4">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] font-mono tracking-widest text-[#4a6080]">LEAD PIPELINE FUNNEL</p>
                    <Link href="/admin">
                      <span className="text-[9px] font-mono text-[#2563eb] hover:text-[#38bdf8] cursor-pointer flex items-center gap-1">
                        MANAGE <ArrowRight className="w-3 h-3" />
                      </span>
                    </Link>
                  </div>
                  <div className="space-y-3">
                    {pipelineData.map((stage, i) => (
                      <div key={stage.name} className="flex items-center gap-4">
                        <div className="w-20 text-right">
                          <span className="text-[9px] font-mono text-[#4a6080]">{stage.name}</span>
                        </div>
                        <div className="flex-1 h-8 bg-[#060e1c] rounded-sm overflow-hidden relative">
                          <div
                            className="h-full pipeline-bar flex items-center px-3"
                            style={{ width: `${Math.max(5, stage.pct)}%`, background: stage.fill, opacity: 0.8 }}>
                          </div>
                          <div className="absolute inset-0 flex items-center px-3">
                            <span className="text-[10px] font-mono font-bold text-white num">{stage.value}</span>
                          </div>
                        </div>
                        <div className="w-10 text-right">
                          <span className="text-[10px] font-mono num" style={{ color: stage.fill }}>{stage.pct}%</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Conversion rate */}
                  {stats && (
                    <div className="mt-4 pt-4 border-t border-[#1e2d4a] grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-[16px] font-mono font-bold text-[#a78bfa] num">
                          {stats.total ? `${((stats.byStatus.qualified||0) / stats.total * 100).toFixed(1)}%` : "—"}
                        </div>
                        <div className="text-[8px] font-mono text-[#3a5070]">QUAL RATE</div>
                      </div>
                      <div className="text-center">
                        <div className="text-[16px] font-mono font-bold text-[#00d084] num">
                          {stats.total ? `${((stats.byStatus.converted||0) / stats.total * 100).toFixed(1)}%` : "—"}
                        </div>
                        <div className="text-[8px] font-mono text-[#3a5070]">CONV RATE</div>
                      </div>
                      <div className="text-center">
                        <div className="text-[16px] font-mono font-bold text-[#38bdf8] num">
                          {((stats.tcpaCount||0) / (stats.total||1) * 100).toFixed(0)}%
                        </div>
                        <div className="text-[8px] font-mono text-[#3a5070]">TCPA %</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Interest breakdown */}
                <div className="bg-[#0d1526] border border-[#1e2d4a] rounded-sm p-4">
                  <p className="text-[10px] font-mono tracking-widest text-[#4a6080] mb-4">INTEREST DISTRIBUTION</p>
                  <div className="space-y-4">
                    {[
                      { label: "ACA / OBAMACARE", value: stats?.acaCount || 0, color: "#38bdf8" },
                      { label: "MEDICARE",         value: stats?.medicareCount || 0, color: "#a78bfa" },
                      { label: "FINAL EXPENSE",    value: stats?.finalExpCount || 0, color: "#00d084" },
                    ].map(item => {
                      const pct = stats?.total ? (item.value / stats.total) * 100 : 0;
                      return (
                        <div key={item.label}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-mono text-[#4a6080]">{item.label}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[12px] font-mono font-bold num" style={{ color: item.color }}>{item.value}</span>
                              <span className="text-[9px] font-mono text-[#2a4060]">{pct.toFixed(0)}%</span>
                            </div>
                          </div>
                          <div className="h-2 bg-[#060e1c] rounded-full overflow-hidden">
                            <div className="h-full pipeline-bar rounded-full" style={{ width: `${pct}%`, background: item.color }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Live feed */}
              <div>
                <div className="bg-[#0d1526] border border-[#1e2d4a] rounded-sm h-full">
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1e2d4a]">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00d084] blink" />
                      <span className="text-[10px] font-mono tracking-widest text-[#4a6080]">LIVE FEED</span>
                    </div>
                    <span className="text-[9px] font-mono text-[#2a4060]">{liveFeed.length} captures</span>
                  </div>
                  <div ref={feedRef} className="divide-y divide-[#0a1120] max-h-[520px] overflow-y-auto">
                    {liveFeed.map((l: any, i) => (
                      <div key={`${l.id}-${i}`} className="px-4 py-3 hover:bg-[#0a1628] transition-colors fade-in">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] font-mono font-semibold text-[#c8daf0]">{l.firstName} {l.lastName}</span>
                          <span className="text-[9px] font-mono text-[#2a4060]">{relTime(new Date(l.liveTime || l.createdAt).toISOString())}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[9px] font-mono text-[#4a6080]">{l.state}</span>
                          {l.interestedInACA     && <span className="text-[8px] font-mono text-[#38bdf8] bg-[#0a1a2a] px-1.5 py-0.5 rounded-sm">ACA</span>}
                          {l.interestedInMedicare && <span className="text-[8px] font-mono text-[#a78bfa] bg-[#1a0a2a] px-1.5 py-0.5 rounded-sm">MED</span>}
                          {l.interestedInFinalExpense && <span className="text-[8px] font-mono text-[#00d084] bg-[#0a2a1a] px-1.5 py-0.5 rounded-sm">FE</span>}
                          {l.tcpaConsent && <span className="text-[8px] font-mono text-[#00d084]">TCPA✓</span>}
                          <span className="text-[8px] font-mono num" style={{ color: (l.leadScore||50)>=80?"#00d084":(l.leadScore||50)>=60?"#fbbf24":"#ff4d4d" }}>
                            SCR {l.leadScore||50}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── ANALYTICS ───────────────────────────────────────────────────── */}
        {tab === "analytics" && (
          <div className="fade-in space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* State distribution */}
              <div className="bg-[#0d1526] border border-[#1e2d4a] rounded-sm p-4">
                <p className="text-[10px] font-mono tracking-widest text-[#4a6080] mb-4">LEADS BY STATE (TOP 8)</p>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={stateData} barSize={22}>
                    <XAxis dataKey="state" tick={{ fill: "#4a6080", fontSize: 9, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#2a4060", fontSize: 9, fontFamily: "monospace" }} axisLine={false} tickLine={false} width={24} />
                    <Tooltip contentStyle={{ background: "#0d1526", border: "1px solid #1e2d4a", fontFamily: "monospace", fontSize: 10, color: "#c8daf0" }} cursor={{ fill: "rgba(37,99,235,0.05)" }} />
                    <Bar dataKey="count" fill="#2563eb" radius={[2,2,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Quality distribution */}
              <div className="bg-[#0d1526] border border-[#1e2d4a] rounded-sm p-4">
                <p className="text-[10px] font-mono tracking-widest text-[#4a6080] mb-4">LEAD SCORE DISTRIBUTION</p>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={qualityData} barSize={50}>
                    <XAxis dataKey="name" tick={{ fill: "#4a6080", fontSize: 9, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#2a4060", fontSize: 9, fontFamily: "monospace" }} axisLine={false} tickLine={false} width={24} />
                    <Tooltip contentStyle={{ background: "#0d1526", border: "1px solid #1e2d4a", fontFamily: "monospace", fontSize: 10, color: "#c8daf0" }} cursor={{ fill: "rgba(37,99,235,0.05)" }} />
                    <Bar dataKey="value" radius={[2,2,0,0]}>
                      {qualityData.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Full leads table */}
            <div className="bg-[#0d1526] border border-[#1e2d4a] rounded-sm overflow-hidden">
              <div className="px-4 py-2.5 border-b border-[#1e2d4a] flex items-center justify-between">
                <span className="text-[10px] font-mono tracking-widest text-[#4a6080]">ALL LEADS DATABASE</span>
                <Link href="/admin">
                  <span className="text-[9px] font-mono text-[#2563eb] hover:text-[#38bdf8] cursor-pointer flex items-center gap-1">
                    FULL MANAGEMENT <ArrowRight className="w-3 h-3" />
                  </span>
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#1e2d4a]">
                      {["NAME","STATE","INTEREST","STATUS","TCPA","SCORE","DNC","CAPTURED"].map(h => (
                        <th key={h} className="px-3 py-2.5 text-left text-[9px] font-mono tracking-widest text-[#3a5070] whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#0a1120]">
                    {allLeads.slice(0, 20).map((l: any) => (
                      <tr key={l.id} className="hover:bg-[#0a1628] transition-colors">
                        <td className="px-3 py-3">
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
                        <td className="px-3 py-3">
                          <span className={`badge-${l.status || "new"}`}>{(l.status || "new").toUpperCase()}</span>
                        </td>
                        <td className="px-3 py-3">
                          <span className={`text-[10px] font-mono ${l.tcpaConsent ? "text-[#00d084]" : "text-[#4a6080]"}`}>
                            {l.tcpaConsent ? "✓" : "✗"}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <span className="text-[11px] font-mono font-bold num" style={{ color: (l.leadScore||50)>=80?"#00d084":(l.leadScore||50)>=60?"#fbbf24":"#ff4d4d" }}>
                            {l.leadScore || 50}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <span className={`text-[10px] font-mono ${l.dnc ? "text-[#ff4d4d]" : "text-[#2a4060]"}`}>
                            {l.dnc ? "DNC" : "—"}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-[9px] font-mono text-[#2a4060]">
                          {new Date(l.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {allLeads.length > 20 && (
                <div className="px-4 py-2.5 border-t border-[#1e2d4a] text-center">
                  <Link href="/admin">
                    <span className="text-[10px] font-mono text-[#2563eb] hover:text-[#38bdf8] cursor-pointer">
                      + {allLeads.length - 20} more leads — Open Command Center for full management
                    </span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── CRM ─────────────────────────────────────────────────────────── */}
        {tab === "crm" && (
          <div className="fade-in grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Recent activities */}
            <div className="bg-[#0d1526] border border-[#1e2d4a] rounded-sm">
              <div className="px-4 py-2.5 border-b border-[#1e2d4a]">
                <span className="text-[10px] font-mono tracking-widest text-[#4a6080]">RECENT ACTIVITY LOG</span>
              </div>
              <div className="divide-y divide-[#0a1120] max-h-80 overflow-y-auto">
                {activities.length === 0 ? (
                  <div className="px-4 py-8 text-center text-[10px] font-mono text-[#2a4060]">NO ACTIVITIES YET</div>
                ) : activities.map((a: any) => (
                  <div key={a.id} className="px-4 py-3 hover:bg-[#0a1628] transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        {a.type === "call"  && <PhoneCall className="w-3.5 h-3.5 text-[#38bdf8]" />}
                        {a.type === "email" && <Zap       className="w-3.5 h-3.5 text-[#a78bfa]" />}
                        {a.type === "note"  && <Activity  className="w-3.5 h-3.5 text-[#4a6080]" />}
                        <span className="text-[11px] font-mono font-semibold text-[#c8daf0]">Lead #{a.leadId}</span>
                        <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded-sm ${
                          a.disposition === "converted" ? "text-[#00d084] bg-[#0a2a1a]" :
                          a.disposition === "contacted" ? "text-[#38bdf8] bg-[#0a1a2a]" :
                          a.disposition === "voicemail" ? "text-[#fbbf24] bg-[#1a1200]" :
                          "text-[#4a6080] bg-[#0a1120]"
                        }`}>
                          {a.disposition?.toUpperCase()}
                        </span>
                      </div>
                      <span className="text-[9px] font-mono text-[#2a4060]">{relTime(a.createdAt)}</span>
                    </div>
                    {a.notes && <p className="text-[10px] font-mono text-[#4a6080] ml-5 truncate">{a.notes}</p>}
                    {a.duration && <p className="text-[9px] font-mono text-[#2a4060] ml-5">{a.duration}s call</p>}
                  </div>
                ))}
              </div>
            </div>

            {/* Follow-ups + quick stats */}
            <div className="space-y-4">
              <div className="bg-[#0d1526] border border-[#1e2d4a] rounded-sm">
                <div className="px-4 py-2.5 border-b border-[#1e2d4a] flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-[#ff4d4d]" />
                  <span className="text-[10px] font-mono tracking-widest text-[#4a6080]">PENDING FOLLOW-UPS</span>
                </div>
                <div className="divide-y divide-[#0a1120] max-h-52 overflow-y-auto">
                  {followUps.length === 0 ? (
                    <div className="px-4 py-6 text-center text-[10px] font-mono text-[#2a4060]">NO PENDING FOLLOW-UPS</div>
                  ) : followUps.map((f: any) => (
                    <div key={f.id} className="flex items-start gap-3 px-4 py-3 hover:bg-[#0a1628] transition-colors">
                      <Clock className="w-3.5 h-3.5 text-[#fbbf24] mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-mono text-[#c8daf0]">Lead #{f.leadId}</p>
                        <p className="text-[10px] font-mono text-[#4a6080] truncate">{f.notes || "Callback scheduled"}</p>
                        {f.followUpAt && (
                          <p className="text-[9px] font-mono text-[#fbbf24]">Due: {new Date(f.followUpAt).toLocaleDateString()}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CRM Quick Stats */}
              <div className="bg-[#0d1526] border border-[#1e2d4a] rounded-sm p-4">
                <p className="text-[10px] font-mono tracking-widest text-[#4a6080] mb-3">CRM SUMMARY</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "TOTAL ACTIVITIES", value: activities.length, color: "text-[#38bdf8]" },
                    { label: "FOLLOW-UPS DUE",   value: followUps.length,  color: "text-[#ff4d4d]" },
                    { label: "CONVERTED",         value: stats?.byStatus?.converted || 0, color: "text-[#00d084]" },
                    { label: "IN PIPELINE",       value: (stats?.byStatus?.contacted||0) + (stats?.byStatus?.qualified||0), color: "text-[#a78bfa]" },
                  ].map(k => (
                    <div key={k.label} className="bg-[#060e1c] border border-[#1e2d4a] rounded-sm p-3">
                      <div className={`text-[18px] font-mono font-bold num ${k.color}`}>{k.value}</div>
                      <div className="text-[8px] font-mono text-[#3a5070] tracking-widest mt-0.5">{k.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── CAPTURE ─────────────────────────────────────────────────────── */}
        {tab === "capture" && (
          <div className="fade-in max-w-2xl">
            <div className="bg-[#0d1526] border border-[#1e2d4a] rounded-sm p-6">
              <div className="flex items-center gap-2 mb-5">
                <Activity className="w-4 h-4 text-[#38bdf8]" />
                <p className="text-[10px] font-mono tracking-widest text-[#4a6080]">CAPTURE A NEW LEAD</p>
              </div>
              <div className="text-center py-8">
                <p className="text-[11px] font-mono text-[#4a6080] mb-4">Use the full lead capture form to intake new prospects</p>
                <Link href="/home">
                  <div className="inline-flex items-center gap-2 px-6 py-3 bg-[#0d1e3a] hover:bg-[#1a3a6b] border border-[#2563eb] text-[#38bdf8] font-mono font-bold text-[12px] rounded-sm transition-colors cursor-pointer">
                    <Activity className="w-4 h-4" />
                    OPEN LEAD CAPTURE FORM →
                  </div>
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
