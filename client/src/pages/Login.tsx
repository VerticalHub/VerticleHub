import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Activity, Lock, User, Eye, EyeOff, AlertCircle, Gift } from "lucide-react";
import { apiRequest, apiErrorMessage, queryClient } from "@/lib/queryClient";

export default function Login() {
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [tab, setTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [refCode, setRefCode] = useState("");
  const [error, setError] = useState("");

  // Pick up ?ref= from URL on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) { setRefCode(ref); setTab("register"); }
  }, []);

  const loginMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/auth/login", { username, password }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setLocation("/dashboard");
    },
    onError: (err: any) => setError(apiErrorMessage(err, "Invalid credentials")),
  });

  const registerMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/auth/register", { username, password, email, refCode: refCode || undefined }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setLocation("/dashboard");
    },
    onError: (err: any) => setError(apiErrorMessage(err, "Registration failed")),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (tab === "login") loginMutation.mutate();
    else registerMutation.mutate();
  };

  const isPending = loginMutation.isPending || registerMutation.isPending;

  return (
    <div className="min-h-screen bg-[#070d1a] flex flex-col items-center justify-center p-4">
      {/* Ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#0ea5e9] opacity-[0.03] rounded-full blur-3xl" />
      </div>

      {/* Logo */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-9 h-9 rounded-sm bg-[#0ea5e9] flex items-center justify-center">
          <Activity className="w-5 h-5 text-white" />
        </div>
        <h1 className="leading-none">
          <span className="text-[18px] font-bold font-mono text-white tracking-tight">LEAD</span>
          <span className="text-[18px] font-bold font-mono text-[#0ea5e9] tracking-tight">HEALTH</span>
        </h1>
      </div>

      {/* Referral banner */}
      {refCode && tab === "register" && (
        <div className="w-full max-w-sm mb-4 flex items-center gap-3 bg-[#0a1a0d] border border-[#00d08440] rounded-sm px-4 py-3">
          <Gift className="w-4 h-4 text-[#00d084] flex-shrink-0" />
          <div>
            <p className="text-[10px] font-mono font-bold text-[#00d084]">YOU WERE REFERRED!</p>
            <p className="text-[9px] font-mono text-[#3a5070] mt-0.5">Sign up now — your referrer earns $25 in credits after your first purchase</p>
          </div>
        </div>
      )}

      {/* Card */}
      <div className="w-full max-w-sm bg-[#0d1526] border border-[#1e2d4a] rounded-sm shadow-2xl">
        {/* Tabs */}
        <div className="flex border-b border-[#1e2d4a]">
          {(["login", "register"] as const).map(t => (
            <button key={t} onClick={() => { setTab(t); setError(""); }}
              className={`flex-1 py-3 text-[11px] font-mono tracking-widest transition-colors ${tab === t ? "text-[#38bdf8] border-b-2 border-[#38bdf8] -mb-px" : "text-[#4a6080] hover:text-[#94b4d4]"}`}>
              {t === "login" ? "SIGN IN" : "REGISTER"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[9px] font-mono tracking-widest text-[#4a6080] mb-1.5">USERNAME</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#2a4060]" />
              <input
                type="text" value={username} onChange={e => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full bg-[#060e1c] border border-[#1e2d4a] text-[#94b4d4] text-[12px] font-mono pl-9 pr-3 py-2.5 rounded-sm focus:outline-none focus:border-[#2563eb] placeholder-[#1e2d4a]"
                required
              />
            </div>
          </div>

          {tab === "register" && (
            <div>
              <label className="block text-[9px] font-mono tracking-widest text-[#4a6080] mb-1.5">EMAIL (OPTIONAL)</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full bg-[#060e1c] border border-[#1e2d4a] text-[#94b4d4] text-[12px] font-mono px-3 py-2.5 rounded-sm focus:outline-none focus:border-[#2563eb] placeholder-[#1e2d4a]"
              />
            </div>
          )}

          <div>
            <label className="block text-[9px] font-mono tracking-widest text-[#4a6080] mb-1.5">PASSWORD</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#2a4060]" />
              <input
                type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#060e1c] border border-[#1e2d4a] text-[#94b4d4] text-[12px] font-mono pl-9 pr-10 py-2.5 rounded-sm focus:outline-none focus:border-[#2563eb] placeholder-[#1e2d4a]"
                required
              />
              <button type="button" onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#2a4060] hover:text-[#94b4d4]">
                {showPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {tab === "register" && (
            <div>
              <label className="block text-[9px] font-mono tracking-widest text-[#4a6080] mb-1.5">
                REFERRAL CODE <span className="text-[#3a5070]">(OPTIONAL — EARN YOUR REFERRER $25)</span>
              </label>
              <div className="relative">
                <Gift className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#2a4060]" />
                <input
                  type="text" value={refCode} onChange={e => setRefCode(e.target.value.toUpperCase())}
                  placeholder="e.g. ADMIN123"
                  className="w-full bg-[#060e1c] border border-[#1e2d4a] text-[#94b4d4] text-[12px] font-mono pl-9 pr-3 py-2.5 rounded-sm focus:outline-none focus:border-[#a78bfa] placeholder-[#1e2d4a] tracking-widest"
                />
              </div>
              {refCode && (
                <p className="text-[9px] font-mono text-[#00d084] mt-1">✓ Referral code will be applied on signup</p>
              )}
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 bg-[#1a0808] border border-[#ff4d4d40] rounded-sm px-3 py-2">
              <AlertCircle className="w-3.5 h-3.5 text-[#ff4d4d] flex-shrink-0" />
              <p className="text-[10px] font-mono text-[#ff4d4d]">{error}</p>
            </div>
          )}

          <button type="submit" disabled={isPending}
            className="w-full py-3 bg-[#0d1e3a] hover:bg-[#1a3a6b] border border-[#2563eb] text-[#38bdf8] font-mono font-bold text-[12px] rounded-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
            {isPending ? "AUTHENTICATING..." : tab === "login" ? "SIGN IN →" : "CREATE ACCOUNT →"}
          </button>

        </form>
      </div>

      <p className="mt-6 text-[9px] font-mono text-[#1e2d4a]">
        LEADHEALTH · THE LEAD & CALL EXCHANGE FOR HEALTH INSURANCE AGENTS
      </p>
    </div>
  );
}
