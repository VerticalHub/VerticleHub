import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Activity, BarChart2, Shield, DollarSign, Zap, Package,
  Database, TrendingUp, Search, ArrowRight, Clock, Keyboard,
  LayoutDashboard, Users, Heart, Bell,
} from "lucide-react";

interface PaletteItem {
  id: string;
  label: string;
  sublabel?: string;
  icon: any;
  action: () => void;
  category: string;
  color?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function CommandPalette({ open, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const [, setLocation] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef  = useRef<HTMLDivElement>(null);

  // Dynamic recent leads
  const { data: leadsResp } = useQuery<any>({
    queryKey: ["/api/leads/search", query],
    queryFn: () => fetch(`/api/leads/search?q=${encodeURIComponent(query)}&dnc=false`).then(r => r.json()),
    enabled: open && query.length >= 2,
    staleTime: 10_000,
  });
  const searchedLeads: any[] = leadsResp?.data?.slice(0, 4) || [];

  const navigate = (path: string) => {
    setLocation(path);
    onClose();
  };

  const baseItems: PaletteItem[] = [
    // Navigation
    { id: "nav-dashboard",   label: "Dashboard",       sublabel: "Operations overview",     icon: LayoutDashboard, category: "NAVIGATE",   color: "text-[#38bdf8]",  action: () => navigate("/dashboard")   },
    { id: "nav-leads",       label: "Lead Operations", sublabel: "Pipeline & analytics",    icon: Activity,        category: "NAVIGATE",   color: "text-[#38bdf8]",  action: () => navigate("/leads")       },
    { id: "nav-marketplace", label: "Marketplace",     sublabel: "Buy & sell leads",        icon: BarChart2,       category: "NAVIGATE",   color: "text-[#a78bfa]",  action: () => navigate("/marketplace") },
    { id: "nav-admin",       label: "Command Center",  sublabel: "Admin & analytics",       icon: Shield,          category: "NAVIGATE",   color: "text-[#ff4d4d]",  action: () => navigate("/admin")       },
    { id: "nav-capture",     label: "Capture Lead",    sublabel: "New intake form",         icon: Activity,        category: "NAVIGATE",   color: "text-[#00d084]",  action: () => navigate("/home")        },
    // Quick actions
    { id: "act-watchlist",   label: "My Watchlist",    sublabel: "Saved marketplace leads", icon: Heart,           category: "ACTIONS",    color: "text-[#ff4d4d]",  action: () => navigate("/marketplace") },
    { id: "act-credits",     label: "Add Credits",     sublabel: "Top up your balance",     icon: DollarSign,      category: "ACTIONS",    color: "text-[#00d084]",  action: () => navigate("/marketplace") },
    { id: "act-export",      label: "Export Leads",    sublabel: "Download CSV",            icon: Database,        category: "ACTIONS",    color: "text-[#fbbf24]",  action: () => { window.open("/api/export/leads"); onClose(); } },
    { id: "act-signals",     label: "AI Signals",      sublabel: "Demand predictions",      icon: Zap,             category: "ACTIONS",    color: "text-[#a78bfa]",  action: () => navigate("/admin")       },
    { id: "act-portfolio",   label: "My Portfolio",    sublabel: "Purchased leads",         icon: Package,         category: "ACTIONS",    color: "text-[#38bdf8]",  action: () => navigate("/marketplace") },
    { id: "act-priceAlerts", label: "Price Alerts",    sublabel: "Set buy notifications",   icon: Bell,            category: "ACTIONS",    color: "text-[#fbbf24]",  action: () => navigate("/marketplace") },
    { id: "act-market",      label: "Market Trends",   sublabel: "Industry trend data",     icon: TrendingUp,      category: "ACTIONS",    color: "text-[#38bdf8]",  action: () => navigate("/admin")       },
    { id: "act-users",       label: "User Management", sublabel: "View all accounts",       icon: Users,           category: "ACTIONS",    color: "text-[#ff4d4d]",  action: () => navigate("/admin")       },
  ];

  // Dynamic lead results
  const leadItems: PaletteItem[] = searchedLeads.map(l => ({
    id: `lead-${l.id}`,
    label: `${l.firstName} ${l.lastName}`,
    sublabel: `${l.state} · ${l.interestedInACA ? "ACA " : ""}${l.interestedInMedicare ? "Medicare " : ""}${l.interestedInFinalExpense ? "Final Exp" : ""} · Score ${l.leadScore || 50}`,
    icon: Activity,
    category: "LEADS",
    color: "text-[#38bdf8]",
    action: () => navigate("/admin"),
  }));

  const allItems = [...leadItems, ...baseItems];

  const filtered = query.trim() === ""
    ? baseItems
    : allItems.filter(item =>
        item.label.toLowerCase().includes(query.toLowerCase()) ||
        item.sublabel?.toLowerCase().includes(query.toLowerCase()) ||
        item.category.toLowerCase().includes(query.toLowerCase())
      );

  const grouped = filtered.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, PaletteItem[]>);

  const flat = Object.values(grouped).flat();

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => { setSelected(0); }, [query]);

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (!open) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setSelected(s => Math.min(s + 1, flat.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
    if (e.key === "Enter" && flat[selected]) { flat[selected].action(); }
    if (e.key === "Escape") onClose();
  }, [open, flat, selected, onClose]);

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  // Scroll selected item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${selected}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [selected]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] px-4 cmd-backdrop">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#020609]/80 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-lg bg-[#0a1120] border border-[#1e2d4a] rounded-sm shadow-2xl overflow-hidden glow-blue">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#1e2d4a]">
          <Search className="w-4 h-4 text-[#2a4060] flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search commands, leads, navigate..."
            className="flex-1 bg-transparent text-[#c8daf0] text-[13px] font-mono focus:outline-none placeholder-[#2a4060]"
          />
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <kbd className="text-[9px] font-mono text-[#2a4060] border border-[#1e2d4a] rounded-sm px-1.5 py-0.5">ESC</kbd>
          </div>
        </div>

        {/* Results */}
        <div ref={listRef} className="overflow-y-auto max-h-80">
          {flat.length === 0 ? (
            <div className="px-4 py-8 text-center text-[11px] font-mono text-[#2a4060]">
              NO RESULTS — TRY A DIFFERENT QUERY
            </div>
          ) : (
            Object.entries(grouped).map(([category, items]) => {
              let idx = flat.indexOf(items[0]);
              return (
                <div key={category}>
                  <div className="px-4 py-2 bg-[#070d1a]">
                    <span className="text-[9px] font-mono tracking-widest text-[#2a4060]">{category}</span>
                  </div>
                  {items.map(item => {
                    const itemIdx = flat.indexOf(item);
                    const isSelected = itemIdx === selected;
                    return (
                      <div
                        key={item.id}
                        data-idx={itemIdx}
                        onClick={item.action}
                        className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                          isSelected ? "bg-[#0d1a2d] border-l-2 border-[#2563eb]" : "border-l-2 border-transparent hover:bg-[#0a1628]"
                        }`}>
                        <item.icon className={`w-4 h-4 flex-shrink-0 ${item.color || "text-[#4a6080]"}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-mono text-[#c8daf0]">{item.label}</p>
                          {item.sublabel && <p className="text-[10px] font-mono text-[#4a6080] truncate">{item.sublabel}</p>}
                        </div>
                        {isSelected && <ArrowRight className="w-3.5 h-3.5 text-[#2563eb] flex-shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-[#1e2d4a] flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <kbd className="text-[9px] font-mono text-[#2a4060] border border-[#1e2d4a] rounded-sm px-1.5 py-0.5">↑↓</kbd>
            <span className="text-[9px] font-mono text-[#2a4060]">navigate</span>
          </div>
          <div className="flex items-center gap-1.5">
            <kbd className="text-[9px] font-mono text-[#2a4060] border border-[#1e2d4a] rounded-sm px-1.5 py-0.5">↵</kbd>
            <span className="text-[9px] font-mono text-[#2a4060]">select</span>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <Keyboard className="w-3 h-3 text-[#2a4060]" />
            <span className="text-[9px] font-mono text-[#2a4060]">⌘K to toggle</span>
          </div>
        </div>
      </div>
    </div>
  );
}
