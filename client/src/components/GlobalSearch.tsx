import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Search, X, ArrowRight, Activity, BarChart2, Shield, DollarSign,
  LayoutDashboard, Heart, Package, Bell, TrendingUp, Zap, Upload, Gift,
  User, MapPin, Star,
} from "lucide-react";

interface ResultItem {
  id: string;
  label: string;
  sub?: string;
  icon: any;
  color: string;
  category: string;
  action: (go: (path: string) => void) => void;
}

const NAV_ITEMS: ResultItem[] = [
  { id: "n-dash",    label: "Dashboard",       sub: "KPIs & pipeline overview",      icon: LayoutDashboard, color: "#38bdf8", category: "PAGES", action: g => g("/dashboard")   },
  { id: "n-leads",   label: "Lead Operations", sub: "Full pipeline & analytics",     icon: Activity,        color: "#38bdf8", category: "PAGES", action: g => g("/leads")       },
  { id: "n-mkt",     label: "Marketplace",     sub: "Order book & lead buying",      icon: BarChart2,       color: "#a78bfa", category: "PAGES", action: g => g("/marketplace") },
  { id: "n-sell",    label: "Sell Leads",      sub: "Submit leads for approval",     icon: Upload,          color: "#00d084", category: "PAGES", action: g => g("/sell")        },
  { id: "n-ref",     label: "Referrals",       sub: "Your referral code & earnings", icon: Gift,            color: "#fbbf24", category: "PAGES", action: g => g("/referrals")   },
  { id: "n-admin",   label: "Command Center",  sub: "Admin panel & analytics",       icon: Shield,          color: "#ff4d4d", category: "PAGES", action: g => g("/admin")       },
  { id: "n-profile", label: "My Profile",      sub: "Account, history & settings",   icon: User,            color: "#38bdf8", category: "PAGES", action: g => g("/profile")     },
];

const ACTION_ITEMS: ResultItem[] = [
  { id: "a-fund",    label: "Fund Account",    sub: "Add credits to your balance",   icon: DollarSign,      color: "#00d084", category: "ACTIONS", action: g => g("/marketplace") },
  { id: "a-watch",   label: "My Watchlist",    sub: "Saved marketplace leads",       icon: Heart,           color: "#ff4d4d", category: "ACTIONS", action: g => g("/marketplace") },
  { id: "a-port",    label: "My Portfolio",    sub: "Purchased leads",               icon: Package,         color: "#38bdf8", category: "ACTIONS", action: g => g("/marketplace") },
  { id: "a-alerts",  label: "Price Alerts",    sub: "Set buy notifications",         icon: Bell,            color: "#fbbf24", category: "ACTIONS", action: g => g("/marketplace") },
  { id: "a-trends",  label: "Market Trends",   sub: "Industry demand signals",       icon: TrendingUp,      color: "#a78bfa", category: "ACTIONS", action: g => g("/admin")       },
  { id: "a-ai",      label: "AI Lead Signals", sub: "Demand predictions & scoring",  icon: Zap,             color: "#a78bfa", category: "ACTIONS", action: g => g("/admin")       },
];

const DEFAULT_ITEMS = [...NAV_ITEMS.slice(0, 3), ...ACTION_ITEMS.slice(0, 3)];

export default function GlobalSearch() {
  const [open, setOpen]   = useState(false);
  const [query, setQuery] = useState("");
  const [sel, setSel]     = useState(0);
  const [, setLocation]   = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const wrapRef  = useRef<HTMLDivElement>(null);

  const { data: leadsResp } = useQuery<any>({
    queryKey: ["/api/leads/search", query],
    queryFn: () => fetch(`/api/leads/search?q=${encodeURIComponent(query)}&dnc=false`).then(r => r.json()),
    enabled: query.length >= 2,
    staleTime: 10_000,
  });
  const leadHits: any[] = leadsResp?.data?.slice(0, 5) || [];

  const { data: listingsResp } = useQuery<any>({
    queryKey: ["/api/lead-listings"],
    staleTime: 30_000,
  });
  const allListings: any[] = listingsResp?.data || [];

  const go = (path: string) => {
    setLocation(path);
    setOpen(false);
    setQuery("");
  };

  // Build results
  const leadResults: ResultItem[] = leadHits.map(l => ({
    id: `l-${l.id}`,
    label: `${l.firstName} ${l.lastName}`,
    sub: `${l.state} · ${[l.interestedInACA && "ACA", l.interestedInMedicare && "Medicare", l.interestedInFinalExpense && "Final Exp"].filter(Boolean).join(", ")} · Score ${l.leadScore ?? 50}`,
    icon: User,
    color: "#00d084",
    category: "LEADS",
    action: g => g("/leads"),
  }));

  const listingResults: ResultItem[] = query.length >= 2
    ? allListings
        .filter(l =>
          l.industry?.toLowerCase().includes(query.toLowerCase()) ||
          l.geography?.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, 3)
        .map(l => ({
          id: `ls-${l.id}`,
          label: `${l.industry?.toUpperCase()} — ${l.geography}`,
          sub: `$${l.price} · Quality ${l.qualityScore} · ${l.timesResold}x resold`,
          icon: MapPin,
          color: "#38bdf8",
          category: "LISTINGS",
          action: g => g("/marketplace"),
        }))
    : [];

  const staticFiltered = [...NAV_ITEMS, ...ACTION_ITEMS].filter(item =>
    item.label.toLowerCase().includes(query.toLowerCase()) ||
    item.sub?.toLowerCase().includes(query.toLowerCase())
  );

  const results: ResultItem[] = query.trim().length < 2
    ? DEFAULT_ITEMS
    : [...leadResults, ...listingResults, ...staticFiltered];

  const grouped = results.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ResultItem[]>);
  const flat = Object.values(grouped).flat();

  // Keyboard navigation
  const handleKey = useCallback((e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setSel(s => Math.min(s + 1, flat.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setSel(s => Math.max(s - 1, 0)); }
    if (e.key === "Enter" && flat[sel]) { flat[sel].action(go); }
    if (e.key === "Escape") { setOpen(false); setQuery(""); inputRef.current?.blur(); }
  }, [open, flat, sel]);

  // Scroll selected into view
  useEffect(() => {
    if (!open) return;
    const el = panelRef.current?.querySelector(`[data-si="${sel}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [sel, open]);

  useEffect(() => { setSel(0); }, [query]);

  // Close on outside click
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  // ⌘K also focuses this
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, []);

  return (
    <div ref={wrapRef} className="relative hidden md:block">
      {/* Search input */}
      <div className={`flex items-center gap-2 border rounded-sm px-3 py-1.5 transition-all duration-200 ${
        open
          ? "border-[#2563eb] bg-[#060e1c] w-64"
          : "border-[#1e2d4a] bg-[#0a1120] w-44 hover:border-[#2a4060]"
      }`}>
        <Search className={`w-3.5 h-3.5 flex-shrink-0 transition-colors ${open ? "text-[#38bdf8]" : "text-[#2a4060]"}`} />
        <input
          ref={inputRef}
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKey}
          placeholder="Search..."
          className="flex-1 min-w-0 bg-transparent text-[11px] font-mono text-[#c8daf0] placeholder-[#2a4060] focus:outline-none"
        />
        {query ? (
          <button onClick={() => { setQuery(""); inputRef.current?.focus(); }} className="text-[#2a4060] hover:text-[#94b4d4]">
            <X className="w-3 h-3" />
          </button>
        ) : (
          <kbd className="text-[8px] font-mono text-[#2a4060] border border-[#1e2d4a] rounded px-1 py-0.5 leading-none flex-shrink-0">⌘K</kbd>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div
          ref={panelRef}
          className="absolute top-full left-0 mt-1.5 w-80 bg-[#0a1120] border border-[#1e2d4a] rounded-sm shadow-2xl z-[90] overflow-hidden fade-in">

          {/* Header hint */}
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#070d1a]">
            <span className="text-[8px] font-mono tracking-widest text-[#2a4060]">
              {query.length < 2 ? "QUICK ACCESS" : `${flat.length} RESULT${flat.length !== 1 ? "S" : ""}`}
            </span>
            <div className="flex items-center gap-1.5">
              <kbd className="text-[8px] font-mono text-[#2a4060] border border-[#1e2d4a] rounded px-1">↑↓</kbd>
              <kbd className="text-[8px] font-mono text-[#2a4060] border border-[#1e2d4a] rounded px-1">↵</kbd>
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto">
            {flat.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <Search className="w-5 h-5 text-[#1e2d4a] mx-auto mb-2" />
                <p className="text-[10px] font-mono text-[#2a4060]">NO RESULTS FOR "{query.toUpperCase()}"</p>
              </div>
            ) : (
              Object.entries(grouped).map(([cat, items]) => (
                <div key={cat}>
                  <div className="px-3 py-1.5 bg-[#070d1a] sticky top-0">
                    <span className="text-[8px] font-mono tracking-widest text-[#2a4060]">{cat}</span>
                  </div>
                  {items.map(item => {
                    const idx = flat.indexOf(item);
                    const active = idx === sel;
                    return (
                      <div
                        key={item.id}
                        data-si={idx}
                        onMouseEnter={() => setSel(idx)}
                        onClick={() => item.action(go)}
                        className={`flex items-center gap-2.5 px-3 py-2.5 cursor-pointer transition-colors border-l-2 ${
                          active
                            ? "bg-[#0d1a2d] border-[#2563eb]"
                            : "border-transparent hover:bg-[#0a1628]"
                        }`}>
                        <div className="w-6 h-6 rounded-sm flex items-center justify-center flex-shrink-0"
                          style={{ background: `${item.color}15` }}>
                          <item.icon className="w-3 h-3" style={{ color: item.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-mono text-[#c8daf0] leading-tight">{item.label}</p>
                          {item.sub && (
                            <p className="text-[9px] font-mono text-[#3a5070] truncate mt-0.5">{item.sub}</p>
                          )}
                        </div>
                        {active && <ArrowRight className="w-3 h-3 text-[#2563eb] flex-shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-3 py-2 border-t border-[#070d1a] flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Star className="w-2.5 h-2.5 text-[#2a4060]" />
              <span className="text-[8px] font-mono text-[#2a4060]">Leads, pages, actions</span>
            </div>
            <span className="text-[8px] font-mono text-[#1e2d4a]">ESC to close</span>
          </div>
        </div>
      )}
    </div>
  );
}
