import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Activity, BarChart2, Shield, Bell, Keyboard, X, CheckCircle2, AlertTriangle, TrendingUp, Info, LogOut, DollarSign, Zap, LayoutDashboard, Menu, Upload, Gift } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import CommandPalette from "./CommandPalette";

interface TickerItem {
  label: string; value: string; change: string; up: boolean; raw: number;
}

const BASE_TICKERS: TickerItem[] = [
  { label: "ACA DEMAND",  value: "84.2",   change: "+2.1%",  up: true,  raw: 84.2  },
  { label: "MEDICARE",    value: "91.7",   change: "+0.8%",  up: true,  raw: 91.7  },
  { label: "FINAL EXP",  value: "67.3",   change: "-1.4%",  up: false, raw: 67.3  },
  { label: "AVG LEAD $",  value: "$34.50", change: "+5.2%",  up: true,  raw: 34.50 },
  { label: "VOL 24H",     value: "1,247",  change: "+12.3%", up: true,  raw: 1247  },
  { label: "CONV RATE",   value: "18.4%",  change: "-0.3%",  up: false, raw: 18.4  },
  { label: "FL MARKET",   value: "78.9",   change: "+3.1%",  up: true,  raw: 78.9  },
  { label: "CA MARKET",   value: "88.1",   change: "+1.7%",  up: true,  raw: 88.1  },
  { label: "TX MARKET",   value: "72.4",   change: "-0.9%",  up: false, raw: 72.4  },
  { label: "NY MARKET",   value: "81.6",   change: "+2.4%",  up: true,  raw: 81.6  },
  { label: "OPEN ORDERS", value: "312",    change: "+8.1%",  up: true,  raw: 312   },
  { label: "FILL RATE",   value: "94.2%",  change: "+0.6%",  up: true,  raw: 94.2  },
];

interface Alert {
  id: number; type: string; title: string; body: string | null; read: boolean; createdAt: string; leadId: number | null;
}

const alertIcon = (type: string) => {
  if (type === "purchase")     return <CheckCircle2 className="w-3.5 h-3.5 text-[#00d084]" />;
  if (type === "market_signal") return <TrendingUp  className="w-3.5 h-3.5 text-[#a78bfa]" />;
  if (type === "low_balance")  return <DollarSign   className="w-3.5 h-3.5 text-[#fbbf24]" />;
  if (type === "prime_lead")   return <Zap          className="w-3.5 h-3.5 text-[#00d084]" />;
  if (type === "dnc")          return <AlertTriangle className="w-3.5 h-3.5 text-[#ff4d4d]" />;
  if (type === "converted")    return <CheckCircle2 className="w-3.5 h-3.5 text-[#a78bfa]" />;
  return <Info className="w-3.5 h-3.5 text-[#38bdf8]" />;
};

const roleColor = (role?: string) => {
  if (role === "admin")  return "text-[#ff4d4d]";
  if (role === "agent")  return "text-[#00d084]";
  return "text-[#fbbf24]";
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

function isMarketOpen() {
  const now = new Date();
  const h = now.getUTCHours() - 5;
  return h >= 8 && h < 18 && now.getUTCDay() >= 1 && now.getUTCDay() <= 5;
}

export default function Header() {
  const [location, setLocation] = useLocation();
  const [tickers, setTickers] = useState<TickerItem[]>(BASE_TICKERS);
  const [time, setTime] = useState(new Date());
  const [cmdOpen, setCmdOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: alertsResp } = useQuery<any>({
    queryKey: ["/api/alerts/unread"],
    queryFn: () => fetch("/api/alerts/unread?userId=1").then(r => r.json()),
    refetchInterval: 30_000,
  });
  const { data: allAlertsResp } = useQuery<any>({
    queryKey: ["/api/alerts"],
    queryFn: () => fetch("/api/alerts?userId=1").then(r => r.json()),
    refetchInterval: 30_000,
    enabled: notifOpen,
  });
  const unreadAlerts: Alert[] = alertsResp?.data || [];
  const allAlerts: Alert[]   = allAlertsResp?.data || unreadAlerts;
  const unread = unreadAlerts.length;

  const markReadMutation = useMutation({
    mutationFn: (id: number) => apiRequest("PATCH", `/api/alerts/${id}/read`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/alerts/unread"] });
    },
  });
  const markAllMutation = useMutation({
    mutationFn: () => apiRequest("PATCH", "/api/alerts/read-all", { userId: 1 }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/alerts/unread"] });
    },
  });
  const logoutMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/auth/logout", {}),
    onSuccess: () => { queryClient.clear(); setLocation("/login"); },
  });

  const { data: meResp } = useQuery<any>({
    queryKey: ["/api/auth/me"],
    queryFn: () => fetch("/api/auth/me").then(r => r.json()),
    staleTime: 60_000,
  });
  const me = meResp?.data;

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setTickers(prev => prev.map(tk => {
        const delta = (Math.random() - 0.48) * 0.4;
        const next  = +(tk.raw + delta).toFixed(2);
        const chgRaw = parseFloat(tk.change) + (Math.random() - 0.5) * 0.1;
        const chg = (chgRaw >= 0 ? "+" : "") + chgRaw.toFixed(1) + "%";
        let display = next.toString();
        if (tk.label === "AVG LEAD $") display = `$${next.toFixed(2)}`;
        else if (tk.label === "CONV RATE" || tk.label === "FILL RATE") display = `${next.toFixed(1)}%`;
        else if (tk.label === "VOL 24H" || tk.label === "OPEN ORDERS") display = Math.round(next).toLocaleString();
        return { ...tk, raw: next, value: display, change: chg, up: chgRaw >= 0 };
      }));
    }, 2200);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setCmdOpen(o => !o); }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, []);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [location]);

  const doubled = [...tickers, ...tickers];
  const navItems = [
    { href: "/dashboard",   label: "DASHBOARD",      icon: LayoutDashboard },
    { href: "/leads",       label: "LEADS",          icon: Activity        },
    { href: "/marketplace", label: "MARKETPLACE",    icon: BarChart2       },
    { href: "/sell",        label: "SELL LEADS",     icon: Upload          },
    { href: "/referrals",   label: "REFERRALS",      icon: Gift            },
    { href: "/admin",       label: "COMMAND CENTER", icon: Shield          },
  ];
  const marketOpen = isMarketOpen();
  const displayAlerts = notifOpen ? allAlerts : unreadAlerts;

  return (
    <>
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />

      <header className="sticky top-0 z-50 flex flex-col border-b border-[#1e2d4a] bg-[#070d1a]">
        {/* Ticker */}
        <div className="bg-[#050a14] border-b border-[#1a2a42] py-1 overflow-hidden select-none">
          <div className="ticker-track">
            {doubled.map((t, i) => (
              <div key={i} className="flex items-center gap-1.5 px-4 flex-shrink-0 border-r border-[#0f1a2e] last:border-r-0">
                <span className="text-[9px] text-[#3a5070] font-mono tracking-widest whitespace-nowrap">{t.label}</span>
                <span className="text-[11px] font-mono font-bold text-[#94b4d4] whitespace-nowrap num">{t.value}</span>
                <span className={`text-[10px] font-mono whitespace-nowrap num ${t.up ? "text-[#00d084]" : "text-[#ff4d4d]"}`}>{t.change}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Nav bar */}
        <div className="flex items-center justify-between px-4 py-1.5">
          <div className="flex items-center gap-5">
            {/* Logo */}
            <Link href="/dashboard">
              <div className="flex items-center gap-2 cursor-pointer flex-shrink-0">
                <div className="w-7 h-7 rounded-sm bg-[#0ea5e9] flex items-center justify-center">
                  <Activity className="w-4 h-4 text-white" />
                </div>
                <div className="leading-none">
                  <span className="text-[13px] font-bold font-mono text-white tracking-tight">HEALTHLEAD</span>
                  <span className="text-[13px] font-bold font-mono text-[#0ea5e9] tracking-tight">PRO</span>
                </div>
              </div>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center">
              {navItems.map(({ href, label, icon: Icon }) => {
                const active = location === href || (href === "/leads" && location === "/");
                return (
                  <Link key={href} href={href}>
                    <div className={`flex items-center gap-1.5 px-3 py-3.5 text-[10px] font-mono font-semibold tracking-widest border-b-2 transition-all cursor-pointer ${
                      active ? "text-[#38bdf8] border-[#38bdf8]" : "text-[#4a6080] border-transparent hover:text-[#94b4d4] hover:border-[#1e3a5f]"
                    }`}>
                      <Icon className="w-3.5 h-3.5" />
                      {label}
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Market status */}
            <div className="hidden md:flex items-center gap-1.5 border border-[#1e2d4a] rounded-sm px-2.5 py-1">
              <span className={`w-1.5 h-1.5 rounded-full ${marketOpen ? "bg-[#00d084] blink" : "bg-[#ff4d4d]"}`} />
              <span className={`text-[9px] font-mono ${marketOpen ? "text-[#00d084]" : "text-[#ff4d4d]"}`}>MKT {marketOpen ? "OPEN" : "CLOSED"}</span>
            </div>

            {/* Clock */}
            <div className="hidden lg:block text-[11px] font-mono text-[#4a6080] num">
              {time.toLocaleTimeString("en-US", { hour12: false })} EST
            </div>

            {/* Cmd+K */}
            <button onClick={() => setCmdOpen(true)}
              className="hidden md:flex items-center gap-1.5 border border-[#1e2d4a] rounded-sm px-2.5 py-1 hover:border-[#2563eb] hover:text-[#38bdf8] transition-colors text-[#4a6080]">
              <Keyboard className="w-3 h-3" />
              <span className="text-[9px] font-mono">⌘K</span>
            </button>

            {/* Bell */}
            <div className="relative" ref={notifRef}>
              <button onClick={() => setNotifOpen(o => !o)}
                className="relative p-1.5 hover:bg-[#0d1526] rounded-sm transition-colors">
                <Bell className={`w-4 h-4 ${unread > 0 ? "text-[#94b4d4]" : "text-[#4a6080]"}`} />
                {unread > 0 && (
                  <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-[#2563eb] rounded-full text-[8px] font-bold text-white flex items-center justify-center pulse-blue">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="notif-panel absolute right-0 top-full mt-1 w-80 bg-[#0a1120] border border-[#1e2d4a] rounded-sm shadow-2xl z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1e2d4a]">
                    <span className="text-[10px] font-mono tracking-widest text-[#4a6080]">ALERTS & NOTIFICATIONS</span>
                    <div className="flex items-center gap-2">
                      {unread > 0 && (
                        <button onClick={() => markAllMutation.mutate()} className="text-[9px] font-mono text-[#2563eb] hover:text-[#38bdf8]">
                          MARK ALL READ
                        </button>
                      )}
                      <button onClick={() => setNotifOpen(false)}>
                        <X className="w-3 h-3 text-[#2a4060] hover:text-[#94b4d4]" />
                      </button>
                    </div>
                  </div>
                  <div className="divide-y divide-[#0d1526] max-h-72 overflow-y-auto">
                    {displayAlerts.length === 0 ? (
                      <div className="px-4 py-6 text-center text-[10px] font-mono text-[#2a4060]">NO ALERTS</div>
                    ) : displayAlerts.map((a: Alert) => (
                      <div key={a.id}
                        className={`flex gap-3 px-4 py-3 hover:bg-[#0f1e35] transition-colors cursor-pointer ${!a.read ? "bg-[#0d1a2d]" : ""}`}
                        onClick={() => !a.read && markReadMutation.mutate(a.id)}>
                        <div className="mt-0.5 flex-shrink-0">{alertIcon(a.type)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-[11px] font-mono font-semibold text-[#c8daf0]">{a.title}</p>
                            <span className="text-[9px] font-mono text-[#2a4060] flex-shrink-0 ml-2">{relTime(a.createdAt)}</span>
                          </div>
                          <p className="text-[10px] font-mono text-[#4a6080] mt-0.5 truncate">{a.body}</p>
                        </div>
                        {!a.read && <div className="w-1.5 h-1.5 bg-[#2563eb] rounded-full flex-shrink-0 mt-1.5" />}
                      </div>
                    ))}
                  </div>
                  <div className="px-4 py-2 border-t border-[#1e2d4a]">
                    <p className="text-[9px] font-mono text-center text-[#2a4060]">
                      {unread} unread · Real-time alerts enabled
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* User chip */}
            <div className="hidden md:flex items-center gap-2 bg-[#0d1526] border border-[#1e2d4a] rounded-sm px-3 py-1.5 cursor-pointer hover:border-[#2563eb] transition-colors group relative">
              <div className="w-5 h-5 rounded-full bg-[#1a3a6b] flex items-center justify-center">
                <span className="text-[10px] font-bold text-[#38bdf8]">{me?.username?.[0]?.toUpperCase() || "U"}</span>
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-[11px] font-mono text-[#94b4d4]">{me?.username?.toUpperCase() || "USER"}</span>
                <span className={`text-[9px] font-mono ${roleColor(me?.role)}`}>{(me?.role || "AGENT").toUpperCase()}</span>
              </div>
              <button onClick={() => logoutMutation.mutate()}
                className="hidden group-hover:flex items-center gap-1 text-[9px] font-mono text-[#4a6080] hover:text-[#ff4d4d] transition-colors ml-1"
                title="Sign out">
                <LogOut className="w-3 h-3" />
              </button>
            </div>

            {/* Mobile hamburger */}
            <button onClick={() => setMobileOpen(o => !o)}
              className="md:hidden p-2 text-[#4a6080] hover:text-[#94b4d4] hover:bg-[#0d1526] rounded-sm transition-colors">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-[#1e2d4a] bg-[#0a1120] fade-in">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = location === href;
              return (
                <Link key={href} href={href}>
                  <div className={`flex items-center gap-3 px-5 py-3.5 text-[11px] font-mono tracking-widest border-l-2 transition-all ${
                    active ? "text-[#38bdf8] border-[#38bdf8] bg-[#0d1a2d]" : "text-[#4a6080] border-transparent hover:text-[#94b4d4] hover:bg-[#0d1526]"
                  }`}>
                    <Icon className="w-4 h-4" />
                    {label}
                  </div>
                </Link>
              );
            })}
            <div className="flex items-center gap-3 px-5 py-3 border-t border-[#1e2d4a]">
              <div className="w-6 h-6 rounded-full bg-[#1a3a6b] flex items-center justify-center">
                <span className="text-[11px] font-bold text-[#38bdf8]">{me?.username?.[0]?.toUpperCase() || "U"}</span>
              </div>
              <div>
                <span className="text-[11px] font-mono text-[#94b4d4]">{me?.username?.toUpperCase() || "USER"}</span>
                <span className={`text-[9px] font-mono ml-2 ${roleColor(me?.role)}`}>{(me?.role || "AGENT").toUpperCase()}</span>
              </div>
              <button onClick={() => logoutMutation.mutate()} className="ml-auto flex items-center gap-1 text-[9px] font-mono text-[#4a6080] hover:text-[#ff4d4d]">
                <LogOut className="w-3.5 h-3.5" /> SIGN OUT
              </button>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
