import { Link } from "wouter";
import { Helmet } from "react-helmet";
import Header from "@/components/Header";
import { AlertTriangle, ArrowLeft, Activity, BarChart2, Shield } from "lucide-react";

export default function NotFound() {
  return (
    <>
      <Helmet>
        <title>404 — Page Not Found | LeadHealth</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <Header />
      <div className="min-h-screen bg-[#070d1a] text-[#c8daf0] flex items-center justify-center px-4">
        <div className="max-w-lg w-full">
          {/* Terminal card */}
          <div className="terminal-card overflow-hidden">
            <div className="terminal-header flex items-center gap-2">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ff4d4d]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#fbbf24]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#00d084]" />
              </div>
              <span className="text-[9px] font-mono text-[#4a6080] tracking-widest ml-2">SYSTEM · ROUTE_RESOLVER</span>
            </div>

            <div className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-sm bg-[#2e0a0a] border border-[#ff4d4d40] mb-6">
                <AlertTriangle className="w-8 h-8 text-[#ff4d4d]" />
              </div>

              <div className="font-mono mb-2">
                <span className="text-[72px] font-bold leading-none" style={{ color: "#1e2d4a" }}>4</span>
                <span className="text-[72px] font-bold leading-none text-[#ff4d4d]">0</span>
                <span className="text-[72px] font-bold leading-none" style={{ color: "#1e2d4a" }}>4</span>
              </div>

              <p className="text-[13px] font-mono font-bold text-[#c8daf0] mb-1 tracking-widest">ROUTE NOT FOUND</p>
              <p className="text-[11px] font-mono text-[#4a6080] mb-8">
                The requested path does not exist in this terminal session.
              </p>

              {/* Quick nav */}
              <div className="space-y-2 mb-6">
                {[
                  { href: "/leads",       label: "LEADS INTELLIGENCE", icon: Activity,  color: "#38bdf8" },
                  { href: "/marketplace", label: "MARKETPLACE",        icon: BarChart2, color: "#00d084" },
                  { href: "/admin",       label: "COMMAND CENTER",     icon: Shield,    color: "#a78bfa" },
                ].map(({ href, label, icon: Icon, color }) => (
                  <Link key={href} href={href}>
                    <div className="flex items-center gap-3 px-4 py-2.5 bg-[#060e1c] border border-[#1e2d4a] rounded-sm hover:border-[#2563eb] hover:bg-[#0d1e35] transition-colors cursor-pointer group">
                      <div className="w-6 h-6 rounded-sm flex items-center justify-center" style={{ backgroundColor: `${color}18` }}>
                        <Icon className="w-3.5 h-3.5" style={{ color }} />
                      </div>
                      <span className="text-[11px] font-mono font-semibold text-[#4a6080] group-hover:text-[#94b4d4] transition-colors tracking-widest">
                        {label}
                      </span>
                      <ArrowLeft className="w-3 h-3 text-[#2a4060] group-hover:text-[#4a6080] ml-auto rotate-180" />
                    </div>
                  </Link>
                ))}
              </div>

              <div className="text-[9px] font-mono text-[#1e2d4a] space-y-0.5">
                <p>ERR: PATH_RESOLUTION_FAILED</p>
                <p>CODE: 404 · PLATFORM: LEADHEALTH</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
