import { ShoppingCart, X, AlertTriangle, CheckCircle2, TrendingDown, ShieldOff } from "lucide-react";

interface Listing {
  id: number; leadId?: number; industry: string; geography: string;
  qualityScore: number; timesResold: number; price: string; isActive: boolean;
}

interface Props {
  listing: Listing | null;
  balance: number;
  isPending: boolean;
  isDuplicate?: boolean;
  isDNC?: boolean;
  onConfirm: (id: number) => void;
  onClose: () => void;
}

const qColor = (s: number) => s >= 85 ? "#00d084" : s >= 65 ? "#fbbf24" : "#ff4d4d";
const qLabel = (s: number) => s >= 85 ? "PRIME" : s >= 65 ? "GOOD" : "AGED";

export default function PurchaseConfirmModal({ listing, balance, isPending, isDuplicate, isDNC, onConfirm, onClose }: Props) {
  if (!listing) return null;

  const price = parseFloat(listing.price);
  const remaining = balance - price;
  const canAfford = balance >= price;
  const canPurchase = canAfford && !isDuplicate && !isDNC;

  return (
    <div
      className="cmd-backdrop fixed inset-0 z-[9000] flex items-center justify-center px-4"
      style={{ backgroundColor: "rgba(4, 8, 18, 0.88)", backdropFilter: "blur(4px)" }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="cmd-panel w-full max-w-[440px] bg-[#0a1120] border border-[#1e2d4a] rounded-sm shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#1e2d4a] bg-[#060e1c]">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-[#00d084]" />
            <span className="text-[11px] font-mono font-bold text-[#c8daf0] tracking-widest">CONFIRM ORDER</span>
          </div>
          <button onClick={onClose} className="text-[#2a4060] hover:text-[#94b4d4] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* DNC warning */}
          {isDNC && (
            <div className="flex items-start gap-2 p-3 bg-[#1f0a0a] border border-[#ff4d4d60] rounded-sm">
              <ShieldOff className="w-4 h-4 text-[#ff4d4d] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] font-mono font-bold text-[#ff4d4d]">DO NOT CALL — BLOCKED</p>
                <p className="text-[10px] font-mono text-[#ff4d4d80] mt-0.5">This lead is on the DNC registry. Purchase is prohibited.</p>
              </div>
            </div>
          )}

          {/* Duplicate ownership warning */}
          {isDuplicate && !isDNC && (
            <div className="flex items-start gap-2 p-3 bg-[#1a1400] border border-[#fbbf2460] rounded-sm">
              <AlertTriangle className="w-4 h-4 text-[#fbbf24] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] font-mono font-bold text-[#fbbf24]">ALREADY IN YOUR PORTFOLIO</p>
                <p className="text-[10px] font-mono text-[#fbbf2480] mt-0.5">You already own this lead. Duplicate purchases are blocked.</p>
              </div>
            </div>
          )}

          {/* Listing summary */}
          <div className="bg-[#060e1c] border border-[#1e2d4a] rounded-sm p-4">
            <p className="terminal-label mb-3">ORDER DETAILS</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Listing ID",   value: `#${listing.id}`,                 color: "#38bdf8"  },
                { label: "Industry",     value: listing.industry.toUpperCase(),    color: "#94b4d4"  },
                { label: "Geography",    value: listing.geography,                 color: "#94b4d4"  },
                { label: "Times Resold", value: `${listing.timesResold}×`,         color: listing.timesResold > 2 ? "#ff4d4d" : "#fbbf24" },
              ].map(({ label, value, color }) => (
                <div key={label}>
                  <p className="terminal-label">{label}</p>
                  <p className="text-[12px] font-mono font-semibold mt-0.5" style={{ color }}>{value}</p>
                </div>
              ))}
            </div>

            {/* Quality bar */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1.5">
                <p className="terminal-label">Quality Score</p>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-mono font-bold" style={{ color: qColor(listing.qualityScore) }}>
                    {listing.qualityScore}
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-sm border"
                    style={{ color: qColor(listing.qualityScore), borderColor: `${qColor(listing.qualityScore)}40`, backgroundColor: `${qColor(listing.qualityScore)}12` }}>
                    {qLabel(listing.qualityScore)}
                  </span>
                </div>
              </div>
              <div className="w-full h-2 bg-[#0d1526] rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all"
                  style={{ width: `${listing.qualityScore}%`, backgroundColor: qColor(listing.qualityScore) }} />
              </div>
              <p className="text-[9px] font-mono text-[#2a4060] mt-1 flex items-center gap-1">
                <TrendingDown className="w-2.5 h-2.5" />
                Quality decays −5 pts per resale after this purchase
              </p>
            </div>
          </div>

          {/* Balance check */}
          <div className={`rounded-sm p-4 border ${canAfford ? "bg-[#0a2215] border-[#00d08430]" : "bg-[#1f0a0a] border-[#ff4d4d40]"}`}>
            <p className="terminal-label mb-3">BALANCE ANALYSIS</p>
            <div className="space-y-2 text-[12px] font-mono">
              <div className="flex items-center justify-between">
                <span className="text-[#4a6080]">Current Balance</span>
                <span className="text-[#00d084] font-bold">${balance.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#4a6080]">Order Cost</span>
                <span className="text-[#ff4d4d] font-bold">−${price.toFixed(2)}</span>
              </div>
              <div className="border-t border-[#1e2d4a] pt-2 flex items-center justify-between">
                <span className="text-[#94b4d4] font-semibold">Remaining Balance</span>
                <span className={`font-bold text-[13px] ${canAfford ? "text-[#00d084]" : "text-[#ff4d4d]"}`}>
                  ${remaining.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {!canAfford && !isDuplicate && !isDNC && (
            <div className="flex items-start gap-2 p-3 bg-[#1f0a0a] border border-[#ff4d4d40] rounded-sm">
              <AlertTriangle className="w-4 h-4 text-[#ff4d4d] flex-shrink-0 mt-0.5" />
              <p className="text-[11px] font-mono text-[#ff4d4d]">Insufficient credits. Fund your account to complete this order.</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3">
            <button onClick={onClose}
              className="flex-1 py-2.5 bg-transparent border border-[#1e2d4a] text-[#4a6080] font-mono text-[11px] font-semibold rounded-sm hover:border-[#2a3d5a] hover:text-[#94b4d4] transition-colors">
              CANCEL
            </button>
            <button
              onClick={() => onConfirm(listing.id)}
              disabled={!canPurchase || isPending}
              className={`flex-1 py-2.5 font-mono text-[11px] font-bold rounded-sm transition-colors flex items-center justify-center gap-2 ${
                canPurchase
                  ? "bg-[#0a2e1a] hover:bg-[#0d3d22] border border-[#00d084] text-[#00d084] cursor-pointer"
                  : "bg-[#0d1526] border border-[#1e2d4a] text-[#2a4060] cursor-not-allowed"
              }`}>
              {isPending ? (
                <>
                  <span className="w-3 h-3 rounded-full border-2 border-[#00d084] border-t-transparent animate-spin" />
                  PROCESSING…
                </>
              ) : isDNC ? (
                <><ShieldOff className="w-3.5 h-3.5" /> BLOCKED</>
              ) : isDuplicate ? (
                <><AlertTriangle className="w-3.5 h-3.5" /> DUPLICATE</>
              ) : (
                <><CheckCircle2 className="w-3.5 h-3.5" /> EXECUTE ORDER</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
