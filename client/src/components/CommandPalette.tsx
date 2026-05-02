import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import {
  Activity, BarChart2, Shield, DollarSign, Zap, Package,
  Database, TrendingUp, Search, ArrowRight, Clock, Keyboard
} from "lucide-react";

interface PaletteItem {
  id: string;
  label: string;
  description: string;
  icon: any;
  category: "navigate" | "action" | "recent";
  href?: string;
  action?: () => void;
  shortcut?: string;
  color: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function CommandPalette({ open, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const [, navigate] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);

  const items: PaletteItem[] = [
    { id: "leads",       label: "Leads Intelligence", description: "Real-time lead feed & analytics", icon: Activity,   category: "navigate", href: "/leads",       color: "#38bdf8" },
    { id: "marketplace", label: "Marketplace",         description: "Order book & lead acquisition",  icon: BarChart2,  category: "navigate", href: "/marketplace", color: "#00d084" },
    { id: "admin",       label: "Command Center",       description: "Admin dashboard & analytics",   icon: Shield,     category: "navigate", href: "/admin",       color: "#a78bfa" },
    { id: "fund",        label: "Fund Account",         description: "Deposit credits & packages",    icon: DollarSign, category: "action",   href: "/marketplace", color: "#fbbf24" },
    { id: "signal",      label: "Generate AI Signal",   description: "Run demand prediction model",   icon: Zap,        category: "action",   href: "/marketplace", color: "#fb923c" },
    { id: "listing",     label: "New Listing",          description: "List a lead for sale",          icon: Package,    category: "action",   href: "/admin",       color: "#00d084" },
    { id: "leaddb",      label: "Lead Database",        description: "Browse all captured leads",     icon: Database,   category: "action",   href: "/admin",       color: "#38bdf8" },
    { id: "trends",      label: "Market Data",          description: "Historical price & volume data",icon: TrendingUp, category: "action",   href: "/admin",       color: "#4ade80" },
    { id: "r-leads",     label: "Leads Intelligence",   description: "Visited 2 min ago",             icon: Clock,      category: "recent",   href: "/leads",       color: "#4a6080" },
    { id: "r-market",    label: "Marketplace",          description: "Visited 8 min ago",             icon: Clock,      category: "recent",   href: "/marketplace", color: "#4a6080" },
  ];

  const filtered = query
    ? items.filter(i =>
        i.label.toLowerCase().includes(query.toLowerCase()) ||
        i.description.toLowerCase().includes(query.toLowerCase())
      )
    : items;

  const categories = [
    { key: "navigate", label: "Navigate" },
    { key: "action",   label: "Quick Actions" },
    { key: "recent",   label: "Recent" },
  ] as const;

  const go = useCallback((item: PaletteItem) => {
    if (item.href) navigate(item.href);
    if (item.action) item.action();
    onClose();
  }, [navigate, onClose]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    setSelected(0);
  }, [query]);

  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "ArrowDown") { e.preventDefault(); setSelected(s => Math.min(s + 1, filtered.length - 1)); }
      if (e.key === "ArrowUp")   { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
      if (e.key === "Enter" && filtered[selected]) go(filtered[selected]);
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [open, filtered, selected, go, onClose]);

  if (!open) return null;

  let globalIndex = 0;

  return (
    <div
      className="cmd-backdrop fixed inset-0 z-[9000] flex items-start justify-center pt-[12vh] px-4"
      style={{ backgroundColor: "rgba(4, 8, 18, 0.85)", backdropFilter: "blur(4px)" }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="cmd-panel w-full max-w-[580px] bg-[#0a1120] border border-[#1e2d4a] rounded-sm shadow-2xl overflow-hidden">
        {/* Search bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#1e2d4a]">
          <Search className="w-4 h-4 text-[#4a6080] flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search pages, actions..."
            className="flex-1 bg-transparent text-[#c8daf0] font-mono text-[13px] outline-none placeholder-[#2a4060]"
          />
          <kbd className="text-[9px] font-mono text-[#2a4060] bg-[#060e1c] border border-[#1e2d4a] px-1.5 py-0.5 rounded-sm">ESC</kbd>
        </div>

        {/* Results */}
        <div className="max-h-[420px] overflow-y-auto py-1">
          {filtered.length === 0 ? (
            <div className="py-10 text-center text-[#2a4060] font-mono text-[11px]">No results for "{query}"</div>
          ) : (
            categories.map(({ key, label }) => {
              const group = filtered.filter(i => i.category === key);
              if (!group.length) return null;
              return (
                <div key={key}>
                  <p className="px-4 py-1.5 text-[9px] font-mono tracking-widest text-[#2a4060] uppercase border-b border-[#0d1526]">
                    {label}
                  </p>
                  {group.map(item => {
                    const idx = globalIndex++;
                    const Icon = item.icon;
                    const isSelected = idx === selected;
                    return (
                      <div
                        key={item.id}
                        onClick={() => go(item)}
                        onMouseEnter={() => setSelected(idx)}
                        className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${
                          isSelected ? "bg-[#0d1e35]" : "hover:bg-[#0d1526]"
                        }`}
                      >
                        <div className="w-7 h-7 rounded-sm flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${item.color}18` }}>
                          <Icon className="w-3.5 h-3.5" style={{ color: item.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-mono text-[#c8daf0] font-medium">{item.label}</p>
                          <p className="text-[10px] font-mono text-[#4a6080] truncate">{item.description}</p>
                        </div>
                        {isSelected && (
                          <ArrowRight className="w-3.5 h-3.5 text-[#4a6080] flex-shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 px-4 py-2 border-t border-[#1e2d4a] bg-[#060e1c]">
          {[["↑↓", "navigate"], ["↵", "select"], ["esc", "close"]].map(([k, l]) => (
            <div key={k} className="flex items-center gap-1.5">
              <kbd className="text-[9px] font-mono text-[#4a6080] bg-[#0d1526] border border-[#1e2d4a] px-1.5 py-0.5 rounded-sm">{k}</kbd>
              <span className="text-[9px] font-mono text-[#2a4060]">{l}</span>
            </div>
          ))}
          <div className="ml-auto flex items-center gap-1.5">
            <Keyboard className="w-3 h-3 text-[#2a4060]" />
            <span className="text-[9px] font-mono text-[#2a4060]">⌘K to toggle</span>
          </div>
        </div>
      </div>
    </div>
  );
}
