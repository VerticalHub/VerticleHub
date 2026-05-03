import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Copy, CheckCheck, Users, DollarSign, Gift, Share2, Link2, TrendingUp, Star } from "lucide-react";
import Header from "@/components/Header";

export default function Referrals() {
  const [copied, setCopied] = useState(false);

  const { data: meResp } = useQuery<any>({
    queryKey: ["/api/auth/me"],
    queryFn: () => fetch("/api/auth/me").then(r => r.json()),
    staleTime: 60_000,
  });
  const me = meResp?.data;

  const { data: refResp, isLoading } = useQuery<any>({
    queryKey: ["/api/referrals/my"],
    queryFn: () => fetch("/api/referrals/my").then(r => r.json()),
  });
  const refData = refResp?.data;
  const referrals: any[] = refData?.referrals || [];
  const refCode: string  = refData?.code || "";
  const totalEarned: number = refData?.totalEarned ?? 0;
  const refLink = refCode ? `${window.location.origin}/login?ref=${refCode}` : "";

  const copyCode = () => {
    navigator.clipboard.writeText(refCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const copyLink = () => {
    navigator.clipboard.writeText(refLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#070d1a]">
      <Header />
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">

        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[13px] font-mono font-bold text-[#c8daf0] tracking-widest">REFERRAL PROGRAM</h1>
            <p className="text-[10px] font-mono text-[#3a5070] mt-0.5">Earn $25 in credits for every new user you refer</p>
          </div>
          <div className="flex items-center gap-1.5 border border-[#1e2d4a] rounded-sm px-3 py-1.5 bg-[#0d1526]">
            <Gift className="w-3.5 h-3.5 text-[#a78bfa]" />
            <span className="text-[10px] font-mono text-[#a78bfa] font-bold">$25 PER REFERRAL</span>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "YOUR CODE",      value: refCode || "LOADING…", color: "text-[#38bdf8]",  icon: Share2    },
            { label: "TOTAL REFERRALS",value: referrals.length,       color: "text-[#a78bfa]", icon: Users     },
            { label: "TOTAL EARNED",   value: `$${totalEarned.toFixed(2)}`, color: "text-[#00d084]", icon: DollarSign },
            { label: "PENDING",        value: referrals.filter(r => r.status === "pending").length, color: "text-[#fbbf24]", icon: TrendingUp },
          ].map(k => (
            <div key={k.label} className="bg-[#0d1526] border border-[#1e2d4a] rounded-sm p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[8px] font-mono tracking-widest text-[#3a5070]">{k.label}</span>
                <k.icon className={`w-3.5 h-3.5 ${k.color}`} />
              </div>
              <div className={`text-[20px] font-mono font-bold num ${k.color} break-all`}>{k.value}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Referral code share box */}
          <div className="bg-[#0d1526] border border-[#1e2d4a] rounded-sm p-5 space-y-4">
            <p className="text-[10px] font-mono tracking-widest text-[#4a6080]">YOUR REFERRAL CREDENTIALS</p>

            {/* Code */}
            <div>
              <p className="text-[9px] font-mono text-[#3a5070] mb-2">REFERRAL CODE</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-[#060e1c] border border-[#1e2d4a] rounded-sm px-4 py-3 flex items-center justify-center">
                  <span className="text-[22px] font-mono font-bold text-[#38bdf8] tracking-[0.3em] num">
                    {refCode || "——————"}
                  </span>
                </div>
                <button onClick={copyCode}
                  className="p-3 bg-[#0d1e3a] border border-[#2563eb] rounded-sm hover:bg-[#1a3a6b] transition-colors text-[#38bdf8] flex-shrink-0">
                  {copied ? <CheckCheck className="w-4 h-4 text-[#00d084]" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Link */}
            <div>
              <p className="text-[9px] font-mono text-[#3a5070] mb-2">REFERRAL LINK</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-[#060e1c] border border-[#1e2d4a] rounded-sm px-3 py-2 overflow-hidden">
                  <span className="text-[10px] font-mono text-[#4a6080] truncate block">{refLink || "—"}</span>
                </div>
                <button onClick={copyLink}
                  className="p-2.5 bg-[#060e1c] border border-[#1e2d4a] rounded-sm hover:border-[#2563eb] transition-colors text-[#4a6080] hover:text-[#38bdf8] flex-shrink-0">
                  <Link2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {copied && (
              <div className="flex items-center gap-2 bg-[#001a0d] border border-[#00d08440] rounded-sm px-3 py-2">
                <CheckCheck className="w-3.5 h-3.5 text-[#00d084]" />
                <span className="text-[10px] font-mono text-[#00d084]">Copied to clipboard!</span>
              </div>
            )}
          </div>

          {/* How it works */}
          <div className="bg-[#0d1526] border border-[#1e2d4a] rounded-sm p-5 space-y-4">
            <p className="text-[10px] font-mono tracking-widest text-[#4a6080]">HOW IT WORKS</p>
            <div className="space-y-3">
              {[
                { step: "01", title: "SHARE YOUR CODE",    desc: "Send your unique referral code or link to a colleague",    color: "text-[#38bdf8]" },
                { step: "02", title: "THEY REGISTER",      desc: "New user signs up and enters your code during registration", color: "text-[#a78bfa]" },
                { step: "03", title: "YOU EARN $25",       desc: "$25 in credits is instantly added to your account balance",  color: "text-[#00d084]" },
                { step: "04", title: "BUY MORE LEADS",     desc: "Use your credits to purchase premium leads on the marketplace", color: "text-[#fbbf24]" },
              ].map(s => (
                <div key={s.step} className="flex items-start gap-3">
                  <div className={`text-[11px] font-mono font-bold ${s.color} w-6 flex-shrink-0`}>{s.step}</div>
                  <div>
                    <p className={`text-[10px] font-mono font-bold ${s.color}`}>{s.title}</p>
                    <p className="text-[10px] font-mono text-[#3a5070] mt-0.5">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-[#060e1c] border border-[#1e2d4a] rounded-sm p-3 mt-2">
              <div className="flex items-center gap-2 mb-1">
                <Star className="w-3 h-3 text-[#fbbf24]" />
                <span className="text-[9px] font-mono text-[#fbbf24] font-bold">NO LIMIT ON REFERRALS</span>
              </div>
              <p className="text-[9px] font-mono text-[#2a4060]">
                Refer as many users as you want. Every verified signup earns you $25 in platform credits with no cap.
              </p>
            </div>
          </div>
        </div>

        {/* Referral history table */}
        <div className="bg-[#0d1526] border border-[#1e2d4a] rounded-sm overflow-hidden">
          <div className="px-4 py-2.5 border-b border-[#1e2d4a] flex items-center justify-between">
            <span className="text-[10px] font-mono tracking-widest text-[#4a6080]">
              REFERRAL HISTORY — {referrals.length} TOTAL
            </span>
            {totalEarned > 0 && (
              <span className="text-[10px] font-mono text-[#00d084] font-bold">
                TOTAL EARNED: ${totalEarned.toFixed(2)}
              </span>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1e2d4a]">
                  {["#", "REFEREE", "DATE", "CREDIT AWARDED", "STATUS"].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-[9px] font-mono tracking-widest text-[#3a5070]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#0a1120]">
                {isLoading ? (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-[11px] font-mono text-[#2a4060] animate-pulse">LOADING...</td></tr>
                ) : referrals.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Users className="w-8 h-8 text-[#1e2d4a]" />
                        <div>
                          <p className="text-[11px] font-mono text-[#2a4060]">NO REFERRALS YET</p>
                          <p className="text-[10px] font-mono text-[#1e2d4a] mt-1">Share your code above to start earning</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : referrals.map((r: any, i: number) => (
                  <tr key={r.id} className="hover:bg-[#0a1628] transition-colors">
                    <td className="px-4 py-3 text-[11px] font-mono text-[#2a4060] num">{i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#1a3a6b] flex items-center justify-center">
                          <span className="text-[9px] font-bold text-[#38bdf8]">
                            {r.refereeName?.[0]?.toUpperCase() || "?"}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-[#c8daf0]">{r.refereeName || `User #${r.refereeId}`}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[10px] font-mono text-[#4a6080]">
                      {r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[12px] font-mono font-bold text-[#00d084] num">
                        +${parseFloat(r.creditAwarded || "25").toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-sm ${
                        r.status === "completed" ? "bg-[#001a0d] text-[#00d084] border border-[#00d08440]" :
                        "bg-[#1a1200] text-[#fbbf24] border border-[#fbbf2440]"
                      }`}>
                        {r.status?.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Leaderboard-style tip */}
        <div className="bg-[#0a0f1e] border border-[#1e2d4a] rounded-sm p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-sm bg-[#1a0d3a] border border-[#a78bfa40] flex items-center justify-center flex-shrink-0">
            <Gift className="w-5 h-5 text-[#a78bfa]" />
          </div>
          <div>
            <p className="text-[11px] font-mono font-bold text-[#a78bfa]">PRO TIP: Share in healthcare agent groups</p>
            <p className="text-[10px] font-mono text-[#3a5070] mt-0.5">
              Post your referral link in Facebook groups, WhatsApp threads, or LinkedIn posts targeting health insurance agents.
              Each signup earns you $25 — 10 referrals = $250 in free lead credits.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
