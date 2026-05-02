import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Activity, BarChart2, Shield, Bell, ChevronDown, Wifi } from "lucide-react";

const tickers = [
  { label: "ACA DEMAND", value: "84.2", change: "+2.1%", up: true },
  { label: "MEDICARE", value: "91.7", change: "+0.8%", up: true },
  { label: "FINAL EXP", value: "67.3", change: "-1.4%", up: false },
  { label: "AVG LEAD $", value: "$34.50", change: "+5.2%", up: true },
  { label: "VOL 24H", value: "1,247", change: "+12.3%", up: true },
  { label: "CONV RATE", value: "18.4%", change: "-0.3%", up: false },
  { label: "FL MARKET", value: "78.9", change: "+3.1%", up: true },
  { label: "CA MARKET", value: "88.1", change: "+1.7%", up: true },
  { label: "TX MARKET", value: "72.4", change: "-0.9%", up: false },
  { label: "NY MARKET", value: "81.6", change: "+2.4%", up: true },
];

export default function Header() {
  const [location] = useLocation();
  const [tickerOffset, setTickerOffset] = useState(0);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const ticker = setInterval(() => {
      setTickerOffset(prev => (prev + 1) % tickers.length);
    }, 3000);
    return () => clearInterval(ticker);
  }, []);

  const navItems = [
    { href: "/", label: "LEADS", icon: Activity },
    { href: "/marketplace", label: "MARKETPLACE", icon: BarChart2 },
    { href: "/admin", label: "COMMAND CENTER", icon: Shield },
  ];

  return (
    <header className="sticky top-0 z-50 flex flex-col border-b border-[#1e2d4a] bg-[#070d1a]">
      {/* Ticker Bar */}
      <div className="bg-[#050a14] border-b border-[#1a2a42] px-4 py-1 overflow-hidden">
        <div className="flex items-center gap-6 overflow-x-auto scrollbar-none">
          {tickers.map((t, i) => (
            <div key={i} className="flex items-center gap-2 flex-shrink-0">
              <span className="text-[10px] text-[#4a6080] font-mono tracking-widest">{t.label}</span>
              <span className="text-[11px] font-mono font-bold text-[#94b4d4]">{t.value}</span>
              <span className={`text-[10px] font-mono ${t.up ? "text-[#00d084]" : "text-[#ff4d4d]"}`}>
                {t.change}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Nav */}
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-6">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="w-7 h-7 rounded bg-[#0ea5e9] flex items-center justify-center">
                <Activity className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="text-[13px] font-bold font-mono text-white tracking-tight">HEALTHLEAD</span>
                <span className="text-[13px] font-bold font-mono text-[#0ea5e9] tracking-tight">PRO</span>
              </div>
            </div>
          </Link>

          <nav className="flex items-center">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href}>
                <div className={`flex items-center gap-1.5 px-4 py-4 text-[11px] font-mono font-semibold tracking-widest border-b-2 transition-all cursor-pointer ${
                  location === href
                    ? "text-[#38bdf8] border-[#38bdf8]"
                    : "text-[#4a6080] border-transparent hover:text-[#94b4d4] hover:border-[#1e3a5f]"
                }`}>
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </div>
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Wifi className="w-3 h-3 text-[#00d084]" />
            <span className="text-[10px] font-mono text-[#00d084]">LIVE</span>
          </div>
          <div className="text-[11px] font-mono text-[#4a6080]">
            {time.toLocaleTimeString("en-US", { hour12: false })} EST
          </div>
          <button className="relative p-1.5 hover:bg-[#0d1526] rounded transition-colors">
            <Bell className="w-4 h-4 text-[#4a6080]" />
            <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-[#0ea5e9] rounded-full" />
          </button>
          <div className="flex items-center gap-2 bg-[#0d1526] border border-[#1e2d4a] rounded-sm px-3 py-1.5 cursor-pointer hover:border-[#2563eb] transition-colors">
            <div className="w-5 h-5 rounded-full bg-[#1a3a6b] flex items-center justify-center">
              <span className="text-[10px] font-bold text-[#38bdf8]">U</span>
            </div>
            <span className="text-[11px] font-mono text-[#94b4d4]">USER #1</span>
            <ChevronDown className="w-3 h-3 text-[#4a6080]" />
          </div>
        </div>
      </div>
    </header>
  );
}
