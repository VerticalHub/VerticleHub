import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "wouter";
import {
  Activity, Users, TrendingUp, DollarSign, Bell, PhoneCall, ShoppingCart,
  ArrowRight, Zap, CheckCircle2, AlertTriangle, BarChart2, Shield, Clock,
  Award, ArrowUpRight, ArrowDownRight, Package, Target,
} from "lucide-react";
import Header from "@/components/Header";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie,
} from "recharts";

// ── Animated counter hook ──────────────────────────────────────────────────
function useCountUp(target: number, duration = 1100, decimals = 0) {
  const [val, setVal] = useState(0);
  const rafRef = useRef<number | null>(null);
  useEffect(() => {
    if (!target && target !== 0) return;
    const startTs = performance.now();
    const startVal = 0;
    const animate = (now: number) => {
      const p = Math.min((now - startTs) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const current = startVal + (target - startVal) * eased;
      setVal(parseFloat(current.toFixed(decimals)));
      if (p < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration, decimals]);
  return val;
}

// ── Candlestick chart ──────────────────────────────────────────────────────
interface OHLCDatum {
  day: string;
  [key: string]: any;
}

interface SegmentMeta { key: string; label: string; color: string }

function CandlestickChart({ data, segments }: { data: OHLCDatum[]; segments: SegmentMeta[] }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; datum: OHLCDatum; seg: SegmentMeta } | null>(null);
  const [dims, setDims] = useState({ w: 600, h: 180 });

  useEffect(() => {
    const obs = new ResizeObserver(entries => {
      for (const e of entries) setDims({ w: e.contentRect.width, h: 180 });
    });
    if (svgRef.current?.parentElement) obs.observe(svgRef.current.parentElement);
    return () => obs.disconnect();
  }, []);

  if (!data.length || !segments.length) return null;

  const PAD = { top: 16, bottom: 28, left: 32, right: 12 };
  const chartW = dims.w - PAD.left - PAD.right;
  const chartH = dims.h - PAD.top - PAD.bottom;

  // Global min/max across all segments in view
  let globalMin = Infinity, globalMax = -Infinity;
  for (const d of data) {
    for (const seg of segments) {
      const l = d[`${seg.key}_l`], h = d[`${seg.key}_h`];
      if (l !== undefined) globalMin = Math.min(globalMin, l);
      if (h !== undefined) globalMax = Math.max(globalMax, h);
    }
  }
  const pad = (globalMax - globalMin) * 0.1;
  const yMin = globalMin - pad;
  const yMax = globalMax + pad;

  const scaleY = (v: number) => PAD.top + chartH - ((v - yMin) / (yMax - yMin)) * chartH;
  const segCount = segments.length;
  const slotW = chartW / data.length;
  const groupW = slotW * 0.72;
  const candleW = Math.max(3, Math.floor(groupW / segCount) - 2);

  const yTicks = [yMin + pad, (yMin + yMax) / 2, yMax - pad].map(v => parseFloat(v.toFixed(1)));

  return (
    <div className="relative">
      <svg ref={svgRef} width="100%" height={dims.h} className="overflow-visible">
        {/* Y-axis grid lines + labels */}
        {yTicks.map((t, i) => (
          <g key={i}>
            <line
              x1={PAD.left} x2={dims.w - PAD.right}
              y1={scaleY(t)} y2={scaleY(t)}
              stroke="#1e2d4a" strokeWidth={1} strokeDasharray="3 4"
            />
            <text x={PAD.left - 4} y={scaleY(t) + 3.5}
              textAnchor="end" fontSize={8} fontFamily="monospace" fill="#3a5070">
              ${t.toFixed(0)}
            </text>
          </g>
        ))}

        {/* Candles */}
        {data.map((d, di) => {
          const slotX = PAD.left + di * slotW;
          const groupX = slotX + (slotW - groupW) / 2;
          return segments.map((seg, si) => {
            const o = d[`${seg.key}_o`];
            const h = d[`${seg.key}_h`];
            const l = d[`${seg.key}_l`];
            const c = d[`${seg.key}_c`];
            if (o === undefined) return null;
            const bullish = c >= o;
            const color = bullish ? seg.color : "#ff4d4d";
            const bodyTop = scaleY(Math.max(o, c));
            const bodyBot = scaleY(Math.min(o, c));
            const bodyH = Math.max(1.5, bodyBot - bodyTop);
            const cx = groupX + si * (candleW + 2) + candleW / 2;
            const x = groupX + si * (candleW + 2);
            return (
              <g key={`${di}-${si}`}
                onMouseEnter={e => {
                  const rect = svgRef.current?.getBoundingClientRect();
                  setTooltip({ x: cx + (rect?.left || 0), y: scaleY(h) + (rect?.top || 0) - 8, datum: d, seg });
                }}
                onMouseLeave={() => setTooltip(null)}
                style={{ cursor: "crosshair" }}>
                {/* High wick */}
                <line x1={cx} x2={cx} y1={scaleY(h)} y2={bodyTop} stroke={color} strokeWidth={1} opacity={0.8} />
                {/* Low wick */}
                <line x1={cx} x2={cx} y1={bodyBot} y2={scaleY(l)} stroke={color} strokeWidth={1} opacity={0.8} />
                {/* Body */}
                <rect
                  x={x} y={bodyTop} width={candleW} height={bodyH}
                  fill={bullish ? color : "transparent"}
                  stroke={color} strokeWidth={bullish ? 0 : 1}
                  opacity={0.85}
                />
              </g>
            );
          });
        })}

        {/* X-axis day labels */}
        {data.map((d, di) => (
          <text key={di}
            x={PAD.left + di * slotW + slotW / 2}
            y={dims.h - 6}
            textAnchor="middle" fontSize={8} fontFamily="monospace" fill="#3a5070">
            {d.day}
          </text>
        ))}
      </svg>

      {/* Floating tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none bg-[#0a1120] border border-[#1e2d4a] rounded-sm px-3 py-2 shadow-xl"
          style={{ left: tooltip.x + 10, top: tooltip.y }}>
          <div className="text-[9px] font-mono tracking-widest mb-1.5" style={{ color: tooltip.seg.color }}>
            {tooltip.seg.label} · {tooltip.datum.day}
          </div>
          {["o","h","l","c"].map(k => (
            <div key={k} className="flex justify-between gap-4 text-[9px] font-mono">
              <span className="text-[#3a5070]">{k.toUpperCase()}</span>
              <span className="text-[#94b4d4] num">${tooltip.datum[`${tooltip.seg.key}_${k}`]?.toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── KPI stat card with glow + counter ─────────────────────────────────────
interface KpiCardProps {
  label: string;
  rawValue: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  subLabel: string;
  subValue: string;
  icon: any;
  iconColor: string;
  borderColor: string;
  glowColor: string;
  trend: "up" | "down" | "neutral";
  trendLabel?: string;
}

function KpiCard({ label, rawValue, prefix = "", suffix = "", decimals = 0, subLabel, subValue, icon: Icon, iconColor, borderColor, glowColor, trend, trendLabel }: KpiCardProps) {
  const animated = useCountUp(rawValue, 1200, decimals);
  const display = `${prefix}${animated.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${suffix}`;

  return (
    <div
      className="bg-[#060e1c] rounded-sm p-4 relative overflow-hidden group hover:scale-[1.02] transition-transform"
      style={{ border: `1px solid ${borderColor}`, boxShadow: `0 0 0 1px ${glowColor}10` }}>
      {/* Glow blob */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at 50% 0%, ${glowColor}12 0%, transparent 70%)` }} />
      {/* Corner shimmer */}
      <div className="absolute top-0 right-0 w-16 h-16 opacity-5 pointer-events-none"
        style={{ background: `radial-gradient(circle at top right, ${glowColor}, transparent 70%)` }} />

      <div className="flex items-start justify-between mb-3">
        <div className="p-1.5 rounded-sm" style={{ background: `${glowColor}18` }}>
          <Icon className="w-4 h-4" style={{ color: glowColor }} />
        </div>
        {trend === "up"      && <ArrowUpRight   className="w-3.5 h-3.5 text-[#00d084]" />}
        {trend === "down"    && <ArrowDownRight  className="w-3.5 h-3.5 text-[#ff4d4d]" />}
        {trend === "neutral" && <TrendingUp className="w-3.5 h-3.5 text-[#4a6080]" />}
      </div>

      <div className="font-mono font-bold leading-none mb-1 num transition-all"
        style={{ fontSize: display.length > 8 ? "18px" : "22px", color: glowColor }}>
        {display}
      </div>
      <div className="text-[8px] font-mono tracking-widest text-[#3a5070] mb-1">{label}</div>
      <div className="flex items-center gap-1.5 mt-2 pt-2 border-t" style={{ borderColor: `${borderColor}80` }}>
        <span className="text-[8px] font-mono text-[#2a4060]">{subLabel}</span>
        <span className="text-[9px] font-mono ml-auto" style={{ color: glowColor }}>{subValue}</span>
      </div>
      {trendLabel && (
        <div className={`absolute top-3 right-8 text-[8px] font-mono ${trend === "up" ? "text-[#00d084]" : trend === "down" ? "text-[#ff4d4d]" : "text-[#4a6080]"}`}>
          {trendLabel}
        </div>
      )}
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────
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
  new: "#38bdf8", contacted: "#fbbf24", qualified: "#a78bfa", converted: "#00d084", archived: "#4a6080",
};
const SOURCES_COLORS = ["#38bdf8","#a78bfa","#00d084","#fbbf24","#ff4d4d"];

const alertIcon = (type: string) => {
  if (type === "purchase")      return <CheckCircle2 className="w-3.5 h-3.5 text-[#00d084]" />;
  if (type === "market_signal") return <TrendingUp   className="w-3.5 h-3.5 text-[#a78bfa]" />;
  if (type === "low_balance")   return <DollarSign   className="w-3.5 h-3.5 text-[#fbbf24]" />;
  if (type === "prime_lead")    return <Zap          className="w-3.5 h-3.5 text-[#00d084]" />;
  if (type === "dnc")           return <AlertTriangle className="w-3.5 h-3.5 text-[#ff4d4d]" />;
  if (type === "converted")     return <Award        className="w-3.5 h-3.5 text-[#a78bfa]" />;
  return <Bell className="w-3.5 h-3.5 text-[#38bdf8]" />;
};

// ── Main dashboard ─────────────────────────────────────────────────────────
export default function Dashboard() {
  const { data: kpiResp, isLoading: kpiLoading } = useQuery<any>({
    queryKey: ["/api/dashboard/kpi"],
    queryFn: () => fetch("/api/dashboard/kpi").then(r => r.json()),
    refetchInterval: 30_000,
  });

  const { data: dashResp } = useQuery<any>({
    queryKey: ["/api/dashboard"],
    queryFn: () => fetch("/api/dashboard").then(r => r.json()),
    refetchInterval: 30_000,
  });

  const { data: leadsResp } = useQuery<any>({
    queryKey: ["/api/leads"],
    queryFn: () => fetch("/api/leads").then(r => r.json()),
    staleTime: 60_000,
  });

  const { data: alertsResp } = useQuery<any>({
    queryKey: ["/api/alerts"],
    queryFn: () => fetch("/api/alerts").then(r => r.json()),
    refetchInterval: 30_000,
  });

  const kpi      = kpiResp?.data;
  const dash     = dashResp?.data;
  const stats    = dash?.leadStats;
  const allLeads = leadsResp?.data || [];
  const recentAlerts = (alertsResp?.data || []).slice(0, 5);

  const recentLeads = [...allLeads]
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const statusData = stats ? Object.entries(stats.byStatus).map(([k, v]) => ({
    name: k.charAt(0).toUpperCase() + k.slice(1), count: v as number, color: STATUS_COLORS[k] || "#4a6080",
  })) : [];

  const sourceData = stats ? Object.entries(stats.bySource || {}).map(([k, v]) => ({
    name: k.replace(/_/g, " ").toUpperCase(), value: v as number,
  })) : [];

  const ohlcData: OHLCDatum[]    = kpi?.ohlc || [];
  const segments: SegmentMeta[]  = kpi?.segments || [];

  const kpiCards: KpiCardProps[] = [
    {
      label: "LEADS BOUGHT TODAY",
      rawValue: kpi ? parseInt(kpi.purchasedToday) : 0,
      subLabel: "vs yesterday",
      subValue: kpi ? `${kpi.purchasedToday} acquired` : "—",
      icon: ShoppingCart,
      iconColor: "#38bdf8",
      borderColor: "#1e3a5f",
      glowColor: "#38bdf8",
      trend: "up",
    },
    {
      label: "REVENUE THIS WEEK",
      rawValue: kpi ? parseFloat(kpi.weeklyRevenue) : 0,
      prefix: "$",
      decimals: 2,
      subLabel: "total spend",
      subValue: kpi ? `$${kpi.totalSpent} all-time` : "—",
      icon: DollarSign,
      iconColor: "#00d084",
      borderColor: "#0d2d1a",
      glowColor: "#00d084",
      trend: "up",
    },
    {
      label: "CONVERSION RATE",
      rawValue: kpi ? parseFloat(kpi.conversionRate) : 0,
      suffix: "%",
      decimals: 1,
      subLabel: "leads converted",
      subValue: stats ? `${stats.convertedCount} of ${stats.total}` : "—",
      icon: Target,
      iconColor: "#a78bfa",
      borderColor: "#1e1a3a",
      glowColor: "#a78bfa",
      trend: parseFloat(kpi?.conversionRate || "0") >= 10 ? "up" : "neutral",
    },
    {
      label: "PORTFOLIO ROI",
      rawValue: kpi ? parseFloat(kpi.roi) : 0,
      suffix: "%",
      decimals: 1,
      subLabel: "vs total spent",
      subValue: kpi ? `$${kpi.portfolioValue} est. value` : "—",
      icon: TrendingUp,
      iconColor: parseFloat(kpi?.roi || "0") >= 0 ? "#00d084" : "#ff4d4d",
      borderColor: parseFloat(kpi?.roi || "0") >= 0 ? "#0d2d1a" : "#2d0d0d",
      glowColor: parseFloat(kpi?.roi || "0") >= 0 ? "#00d084" : "#ff4d4d",
      trend: parseFloat(kpi?.roi || "0") >= 0 ? "up" : "down",
    },
    {
      label: "ACTIVE LISTINGS",
      rawValue: kpi ? parseInt(kpi.activeListings) : 0,
      subLabel: "on marketplace",
      subValue: kpi ? `${kpi.activeListings} available` : "—",
      icon: Package,
      iconColor: "#a78bfa",
      borderColor: "#1e1a3a",
      glowColor: "#a78bfa",
      trend: "neutral",
    },
    {
      label: "PORTFOLIO VALUE",
      rawValue: kpi ? parseFloat(kpi.portfolioValue) : 0,
      prefix: "$",
      decimals: 2,
      subLabel: "est. market value",
      subValue: kpi ? `${kpi.totalPurchases} leads held` : "—",
      icon: Award,
      iconColor: "#fbbf24",
      borderColor: "#2a1d00",
      glowColor: "#fbbf24",
      trend: "up",
    },
  ];

  return (
    <div className="min-h-screen bg-[#070d1a] flex flex-col">
      <Header />

      <main className="flex-1 p-4 md:p-6 max-w-screen-2xl mx-auto w-full">

        {/* Page title */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-[14px] font-mono font-bold text-[#c8daf0] tracking-widest">OPERATIONS DASHBOARD</h1>
            <p className="text-[10px] font-mono text-[#4a6080] mt-0.5">
              Real-time lead intelligence · {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00d084] blink" />
            <span className="text-[9px] font-mono text-[#00d084]">LIVE</span>
          </div>
        </div>

        {/* ── Animated KPI cards ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
          {kpiCards.map(card => (
            <KpiCard key={card.label} {...card} />
          ))}
        </div>

        {/* ── Candlestick price chart ────────────────────────────────────── */}
        <div className="bg-[#0d1526] border border-[#1e2d4a] rounded-sm p-4 mb-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <span className="text-[10px] font-mono tracking-widest text-[#4a6080]">SEGMENT PRICE CHART — 7 DAY OHLC</span>
              <p className="text-[9px] font-mono text-[#2a4060] mt-0.5">Lead price discovery per insurance vertical · Hover candles for details</p>
            </div>
            {/* Legend */}
            <div className="flex flex-wrap gap-4">
              {segments.map(seg => (
                <div key={seg.key} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ background: seg.color }} />
                  <span className="text-[9px] font-mono text-[#4a6080]">{seg.label}</span>
                </div>
              ))}
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-transparent border border-[#ff4d4d]" />
                <span className="text-[9px] font-mono text-[#4a6080]">Bearish</span>
              </div>
            </div>
          </div>

          {kpiLoading ? (
            <div className="h-[180px] shimmer rounded-sm" />
          ) : ohlcData.length > 0 ? (
            <CandlestickChart data={ohlcData} segments={segments} />
          ) : (
            <div className="h-[180px] flex items-center justify-center text-[10px] font-mono text-[#2a4060]">
              NO PRICE DATA AVAILABLE
            </div>
          )}

          {/* Segment price summary strip */}
          {kpi && segments.length > 0 && ohlcData.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-3 border-t border-[#1e2d4a]">
              {segments.map(seg => {
                const last = ohlcData[ohlcData.length - 1];
                const first = ohlcData[0];
                const close  = last[`${seg.key}_c`] as number;
                const open   = first[`${seg.key}_o`] as number;
                const chg    = close - open;
                const chgPct = ((chg / open) * 100).toFixed(1);
                const bull   = chg >= 0;
                return (
                  <div key={seg.key} className="flex items-center justify-between">
                    <div>
                      <div className="text-[9px] font-mono text-[#4a6080]">{seg.label}</div>
                      <div className="text-[14px] font-mono font-bold num" style={{ color: seg.color }}>
                        ${close.toFixed(2)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-[10px] font-mono font-bold ${bull ? "text-[#00d084]" : "text-[#ff4d4d]"}`}>
                        {bull ? "▲" : "▼"} {Math.abs(chg).toFixed(2)}
                      </div>
                      <div className={`text-[9px] font-mono ${bull ? "text-[#00d084]" : "text-[#ff4d4d]"}`}>
                        {bull ? "+" : ""}{chgPct}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Main 3-col layout ──────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Left 2-cols: pipeline + interest + recent leads */}
          <div className="lg:col-span-2 space-y-4">

            {/* Pipeline status */}
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
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart data={statusData} barSize={32}>
                    <XAxis dataKey="name" tick={{ fill: "#4a6080", fontSize: 9, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#2a4060", fontSize: 9, fontFamily: "monospace" }} axisLine={false} tickLine={false} width={25} />
                    <Tooltip contentStyle={{ background: "#0d1526", border: "1px solid #1e2d4a", fontFamily: "monospace", fontSize: 11, color: "#c8daf0" }} cursor={{ fill: "rgba(37,99,235,0.05)" }} />
                    <Bar dataKey="count" radius={[2,2,0,0]}>
                      {statusData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-36 flex items-center justify-center text-[10px] font-mono text-[#2a4060]">NO DATA</div>
              )}
              <div className="grid grid-cols-5 gap-2 mt-3">
                {Object.entries(stats?.byStatus || {}).map(([k, v]) => (
                  <div key={k} className="text-center">
                    <div className="text-[14px] font-mono font-bold num" style={{ color: STATUS_COLORS[k] }}>{v as number}</div>
                    <div className="text-[8px] font-mono text-[#3a5070] tracking-widest mt-0.5">{k.toUpperCase()}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Interest + source */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#0d1526] border border-[#1e2d4a] rounded-sm p-4">
                <span className="text-[10px] font-mono tracking-widest text-[#4a6080] block mb-3">INTEREST BREAKDOWN</span>
                <div className="space-y-3">
                  {[
                    { label: "ACA / OBAMACARE",  value: stats?.acaCount  || 0, color: "#38bdf8" },
                    { label: "MEDICARE",          value: stats?.medicareCount || 0, color: "#a78bfa" },
                    { label: "FINAL EXPENSE",     value: stats?.finalExpCount || 0, color: "#00d084" },
                    { label: "DNC (EXCLUDED)",    value: stats?.dncCount  || 0, color: "#ff4d4d"  },
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

              <div className="bg-[#0d1526] border border-[#1e2d4a] rounded-sm p-4">
                <span className="text-[10px] font-mono tracking-widest text-[#4a6080] block mb-3">LEAD SOURCES</span>
                {sourceData.length > 0 && (
                  <ResponsiveContainer width="100%" height={100}>
                    <PieChart>
                      <Pie data={sourceData} dataKey="value" cx="40%" cy="50%" innerRadius={32} outerRadius={48} paddingAngle={3}>
                        {sourceData.map((_: any, i: number) => <Cell key={i} fill={SOURCES_COLORS[i % SOURCES_COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: "#0d1526", border: "1px solid #1e2d4a", fontFamily: "monospace", fontSize: 10, color: "#c8daf0" }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
                <div className="space-y-1.5 mt-1">
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

            {/* Recent captures */}
            <div className="bg-[#0d1526] border border-[#1e2d4a] rounded-sm">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1e2d4a]">
                <span className="text-[10px] font-mono tracking-widest text-[#4a6080]">RECENT CAPTURES</span>
                <Link href="/admin">
                  <span className="text-[9px] font-mono text-[#2563eb] hover:text-[#38bdf8] cursor-pointer flex items-center gap-1">
                    VIEW ALL <ArrowRight className="w-3 h-3" />
                  </span>
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

          {/* Right col: quick actions + signals + alerts + health */}
          <div className="space-y-4">

            {/* Quick actions */}
            <div className="bg-[#0d1526] border border-[#1e2d4a] rounded-sm p-4">
              <span className="text-[10px] font-mono tracking-widest text-[#4a6080] block mb-3">QUICK ACTIONS</span>
              <div className="space-y-2">
                {[
                  { href: "/home",        icon: Activity,     label: "CAPTURE LEAD",   desc: "New intake form",   color: "#38bdf8" },
                  { href: "/marketplace", icon: ShoppingCart, label: "BROWSE MARKET",  desc: "Buy leads",         color: "#a78bfa" },
                  { href: "/admin",       icon: BarChart2,    label: "LEAD DATABASE",  desc: "Search & manage",   color: "#00d084" },
                  { href: "/admin",       icon: Shield,       label: "COMMAND CENTER", desc: "Analytics & AI",    color: "#fbbf24" },
                ].map(item => (
                  <Link key={item.label} href={item.href}>
                    <div className="flex items-center gap-3 p-2.5 bg-[#060e1c] border border-[#1e2d4a] rounded-sm hover:border-[#2563eb] hover:bg-[#0a1628] transition-colors cursor-pointer group">
                      <item.icon className="w-4 h-4 flex-shrink-0" style={{ color: item.color }} />
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-mono font-semibold" style={{ color: item.color }}>{item.label}</div>
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
                  { state: "FL", industry: "Medicare",  demand: 94, color: "#00d084", change: "+12%" },
                  { state: "CA", industry: "ACA",       demand: 88, color: "#38bdf8", change: "+8%"  },
                  { state: "NY", industry: "Medicare",  demand: 81, color: "#38bdf8", change: "+4%"  },
                  { state: "TX", industry: "Insurance", demand: 72, color: "#fbbf24", change: "-2%"  },
                ].map(sig => (
                  <div key={sig.state + sig.industry} className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-mono text-[#94b4d4]">{sig.state} · {sig.industry}</div>
                      <div className="h-1 bg-[#0a1120] rounded-full mt-1 overflow-hidden w-28">
                        <div className="h-full pipeline-bar rounded-full" style={{ width: `${sig.demand}%`, background: sig.color }} />
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[12px] font-mono font-bold num" style={{ color: sig.color }}>{sig.demand}</div>
                      <div className={`text-[9px] font-mono ${sig.change.startsWith("+") ? "text-[#00d084]" : "text-[#ff4d4d]"}`}>
                        {sig.change}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Alerts */}
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

            {/* Portfolio health */}
            <div className="bg-[#0d1526] border border-[#1e2d4a] rounded-sm p-4">
              <span className="text-[10px] font-mono tracking-widest text-[#4a6080] block mb-3">PORTFOLIO HEALTH</span>
              <div className="space-y-3">
                {[
                  { label: "PORTFOLIO VALUE",   value: kpi ? `$${parseFloat(kpi.portfolioValue).toFixed(2)}` : "—", color: "#fbbf24" },
                  { label: "TOTAL INVESTED",     value: kpi ? `$${parseFloat(kpi.totalSpent).toFixed(2)}`    : "—", color: "#ff4d4d" },
                  { label: "EST. ROI",           value: kpi ? `${kpi.roi}%`                                  : "—", color: kpi && parseFloat(kpi.roi) >= 0 ? "#00d084" : "#ff4d4d" },
                  { label: "ACTIVE LISTINGS",    value: kpi ? `${kpi.activeListings}`                        : "—", color: "#a78bfa" },
                  { label: "QUALIFIED PIPELINE", value: stats ? `${stats.byStatus.qualified ?? 0}`           : "—", color: "#a78bfa" },
                  { label: "DNC EXCLUDED",       value: stats ? `${stats.dncCount ?? 0}`                     : "—", color: "#ff4d4d" },
                ].map(r => (
                  <div key={r.label} className="flex items-center justify-between">
                    <span className="text-[9px] font-mono text-[#4a6080]">{r.label}</span>
                    <span className="text-[12px] font-mono font-bold num" style={{ color: r.color }}>{r.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
