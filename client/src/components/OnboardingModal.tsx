import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  Activity, DollarSign, ShoppingCart, X, ChevronRight, ChevronLeft,
  Zap, BarChart2, Shield, Star, TrendingUp, CheckCircle2, ArrowRight,
} from "lucide-react";

const STORAGE_KEY = "hlp-onboarded";

const STEPS = [
  {
    id: 1,
    tag: "WELCOME",
    title: "Welcome to LeadHealth",
    subtitle: "The #1 Healthcare Lead Intelligence Platform",
    color: "#38bdf8",
    icon: Activity,
    content: (
      <div className="space-y-3">
        <p className="text-[11px] font-mono text-[#4a6080] leading-relaxed">
          You now have access to a real-time marketplace of verified healthcare leads — scored, ranked, and ready to work.
        </p>
        <div className="grid grid-cols-2 gap-2 mt-3">
          {[
            { icon: Zap,        color: "#00d084", label: "AI Lead Scoring",     desc: "Every lead rated 0–100" },
            { icon: BarChart2,  color: "#38bdf8", label: "Live Marketplace",    desc: "Real-time order book" },
            { icon: TrendingUp, color: "#a78bfa", label: "Price Intelligence",  desc: "30-day price history" },
            { icon: Shield,     color: "#fbbf24", label: "Verified Data",       desc: "TCPA-compliant leads" },
          ].map(({ icon: Icon, color, label, desc }) => (
            <div key={label} className="flex items-start gap-2.5 p-2.5 bg-[#060e1c] border border-[#1e2d4a] rounded-sm">
              <Icon className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color }} />
              <div>
                <p className="text-[10px] font-mono font-bold text-[#94b4d4]">{label}</p>
                <p className="text-[9px] font-mono text-[#3a5070] mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-2 p-2.5 bg-[#001a0d] border border-[#00d08430] rounded-sm">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#00d084] shrink-0" />
          <p className="text-[10px] font-mono text-[#00d084]">Your account is active. Let's get you set up in 2 quick steps.</p>
        </div>
      </div>
    ),
    cta: "GET STARTED",
    ctaIcon: ChevronRight,
  },
  {
    id: 2,
    tag: "STEP 1 OF 2",
    title: "Fund Your Account",
    subtitle: "Credits are used to purchase leads",
    color: "#00d084",
    icon: DollarSign,
    content: (
      <div className="space-y-3">
        <p className="text-[11px] font-mono text-[#4a6080] leading-relaxed">
          Leads range from <span className="text-[#00d084] font-bold">$15–$85</span> depending on type, quality score, and geography. Start with a credit package that fits your workflow.
        </p>
        <div className="space-y-2">
          {[
            { label: "STARTER",     amount: "$50",  leads: "~3–5 leads",  color: "#38bdf8",  hot: false },
            { label: "PROFESSIONAL", amount: "$150", leads: "~8–12 leads", color: "#00d084",  hot: true  },
            { label: "ENTERPRISE",  amount: "$500", leads: "30+ leads",   color: "#a78bfa",  hot: false },
          ].map(({ label, amount, leads, color, hot }) => (
            <div key={label} className={`flex items-center justify-between px-3 py-2.5 rounded-sm border ${hot ? "border-[#00d08440] bg-[#001a0d]" : "border-[#1e2d4a] bg-[#060e1c]"}`}>
              <div className="flex items-center gap-2">
                {hot && <span className="text-[8px] font-mono text-[#00d084] border border-[#00d08440] px-1.5 rounded-sm">POPULAR</span>}
                <span className="text-[10px] font-mono font-bold" style={{ color }}>{label}</span>
              </div>
              <div className="text-right">
                <span className="text-[13px] font-mono font-bold text-[#c8daf0]">{amount}</span>
                <span className="text-[9px] font-mono text-[#3a5070] ml-1.5">{leads}</span>
              </div>
            </div>
          ))}
        </div>
        <p className="text-[9px] font-mono text-[#2a4060]">
          Credits never expire. You can add more anytime from the Marketplace → Fund Account panel.
        </p>
      </div>
    ),
    cta: "FUND MY ACCOUNT →",
    ctaIcon: ArrowRight,
    ctaAction: "fund",
  },
  {
    id: 3,
    tag: "STEP 2 OF 2",
    title: "Browse the Marketplace",
    subtitle: "Find, score, and acquire leads instantly",
    color: "#a78bfa",
    icon: ShoppingCart,
    content: (
      <div className="space-y-3">
        <p className="text-[11px] font-mono text-[#4a6080] leading-relaxed">
          The marketplace Order Book shows live listings. Use the AI score, filters, and price sparklines to find the best leads for your book of business.
        </p>
        <div className="space-y-2">
          {[
            { step: "01", text: "Use filters to narrow by state, age, interest type, or score", color: "#38bdf8" },
            { step: "02", text: "Sort by AI Score or Value Score to surface the best ROI leads", color: "#00d084" },
            { step: "03", text: "Click VIEW on any lead to see full contact info and score breakdown", color: "#a78bfa" },
            { step: "04", text: "Hit BUY to instantly acquire — the lead moves to your Portfolio", color: "#fbbf24" },
          ].map(({ step, text, color }) => (
            <div key={step} className="flex items-start gap-3">
              <span className="text-[11px] font-mono font-bold shrink-0 num" style={{ color }}>{step}</span>
              <p className="text-[10px] font-mono text-[#4a6080] leading-snug">{text}</p>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 p-2.5 bg-[#0d1e3a] border border-[#2563eb40] rounded-sm">
          <Star className="w-3.5 h-3.5 text-[#a78bfa] shrink-0" />
          <p className="text-[10px] font-mono text-[#94b4d4]">
            Star any listing to add it to your Watchlist and monitor price changes over time.
          </p>
        </div>
      </div>
    ),
    cta: "GO TO MARKETPLACE",
    ctaIcon: ArrowRight,
    ctaAction: "marketplace",
  },
];

export default function OnboardingModal() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [, setLocation] = useLocation();

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
    } catch {}
  }, []);

  const dismiss = () => {
    try { localStorage.setItem(STORAGE_KEY, "true"); } catch {}
    setVisible(false);
  };

  const handleCta = () => {
    const current = STEPS[step];
    if (current.ctaAction === "fund") {
      dismiss();
      setLocation("/marketplace");
      return;
    }
    if (current.ctaAction === "marketplace") {
      dismiss();
      setLocation("/marketplace");
      return;
    }
    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
    } else {
      dismiss();
    }
  };

  if (!visible) return null;

  const current = STEPS[step];
  const Icon = current.icon;
  const CtaIcon = current.ctaIcon;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#020609]/80 backdrop-blur-sm" onClick={dismiss} />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-[#0d1526] border border-[#1e2d4a] rounded-sm shadow-2xl fade-in overflow-hidden">

        {/* Accent bar */}
        <div className="h-[2px] w-full" style={{ background: `linear-gradient(90deg, ${current.color}80, ${current.color}, ${current.color}80)` }} />

        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-4 pb-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-sm flex items-center justify-center border" style={{ background: `${current.color}15`, borderColor: `${current.color}40` }}>
              <Icon className="w-4 h-4" style={{ color: current.color }} />
            </div>
            <div>
              <p className="text-[8px] font-mono tracking-widest" style={{ color: current.color }}>{current.tag}</p>
              <h2 className="text-[14px] font-mono font-bold text-[#c8daf0] leading-tight">{current.title}</h2>
            </div>
          </div>
          <button onClick={dismiss} className="text-[#2a4060] hover:text-[#94b4d4] transition-colors p-0.5" title="Skip onboarding">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="px-5 pt-0.5 pb-3 text-[9px] font-mono text-[#3a5070] tracking-wide">{current.subtitle}</p>

        {/* Divider */}
        <div className="h-px bg-[#0f1a2e] mx-5" />

        {/* Body */}
        <div className="px-5 py-4">
          {current.content}
        </div>

        {/* Footer */}
        <div className="px-5 pb-4 flex items-center justify-between">
          {/* Step dots */}
          <div className="flex items-center gap-1.5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === step ? 16 : 6,
                  height: 6,
                  background: i === step ? current.color : "#1e2d4a",
                }}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {step > 0 && (
              <button
                onClick={() => setStep(s => s - 1)}
                className="flex items-center gap-1 px-3 py-1.5 text-[9px] font-mono text-[#4a6080] hover:text-[#94b4d4] border border-[#1e2d4a] hover:border-[#2a4060] rounded-sm transition-colors">
                <ChevronLeft className="w-3 h-3" /> BACK
              </button>
            )}
            <button
              onClick={() => dismiss()}
              className="px-3 py-1.5 text-[9px] font-mono text-[#2a4060] hover:text-[#4a6080] transition-colors">
              SKIP
            </button>
            <button
              onClick={handleCta}
              className="flex items-center gap-1.5 px-4 py-1.5 text-[10px] font-mono font-bold rounded-sm transition-all hover:opacity-90"
              style={{ background: current.color, color: "#050a14" }}>
              {current.cta}
              <CtaIcon className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
