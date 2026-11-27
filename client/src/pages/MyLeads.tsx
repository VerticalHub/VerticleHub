import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Download, Phone, Mail, Search, ShoppingCart, ShieldAlert } from "lucide-react";
import Header from "@/components/Header";
import LeadDetailModal from "@/components/LeadDetailModal";

type MyLead = {
  id: number; firstName: string; lastName: string; email: string; phoneNumber: string;
  state: string; zipCode: string; interestedInACA: boolean | null; interestedInMedicare: boolean | null;
  interestedInFinalExpense: boolean | null; tcpaConsent: boolean | null; dnc: boolean | null;
  leadScore: number | null; pricePaid: string; purchaseDate: string | null; buyerNotes: string | null;
};

function formatPhone(p: string) {
  const d = (p || "").replace(/\D/g, "");
  return d.length === 10 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : p;
}

function interests(l: MyLead) {
  return [l.interestedInACA && "ACA", l.interestedInMedicare && "Medicare", l.interestedInFinalExpense && "Final Expense"]
    .filter(Boolean).join(", ") || "—";
}

// The leads a buyer has purchased, with full contact details.
export default function MyLeads() {
  const [query, setQuery] = useState("");
  const [openLead, setOpenLead] = useState<number | null>(null);
  const { data, isLoading } = useQuery<any>({
    queryKey: ["/api/my-leads"],
    queryFn: () => fetch("/api/my-leads").then(r => r.json()),
  });
  const leads: MyLead[] = data?.data || [];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return leads;
    return leads.filter(l =>
      `${l.firstName} ${l.lastName} ${l.email} ${l.phoneNumber} ${l.state} ${l.zipCode}`.toLowerCase().includes(q));
  }, [leads, query]);

  return (
    <div className="min-h-screen bg-[#070d1a] flex flex-col">
      <Header />
      <main className="flex-1 p-4 md:p-6 max-w-screen-2xl mx-auto w-full">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
          <div>
            <h1 className="text-[14px] font-mono font-bold text-[#c8daf0] tracking-widest">MY LEADS</h1>
            <p className="text-[11px] font-mono text-[#7a9abf] mt-1">
              {leads.length} purchased lead{leads.length === 1 ? "" : "s"} · full contact details · notes are private to you
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="relative">
              <span className="sr-only">Search your leads</span>
              <Search className="w-3.5 h-3.5 text-[#4a6080] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search name, phone, state…"
                className="bg-[#060e1c] border border-[#1e2d4a] focus:border-[#2563eb] text-[#c8daf0] text-[11px] font-mono pl-8 pr-3 py-2 rounded-sm w-56 focus:outline-none" />
            </label>
            <a href="/api/export/my-leads"
              className={`flex items-center gap-1.5 px-3 py-2 text-[10px] font-mono font-bold rounded-sm border border-[#2563eb] text-[#38bdf8] bg-[#0d1e3a] hover:bg-[#1a3a6b] ${leads.length ? "" : "pointer-events-none opacity-40"}`}>
              <Download className="w-3.5 h-3.5" /> EXPORT CSV
            </a>
          </div>
        </div>

        {isLoading ? (
          <div className="text-[11px] font-mono text-[#7a9abf] animate-pulse">Loading your leads…</div>
        ) : leads.length === 0 ? (
          <div className="bg-[#0d1526] border border-[#1e2d4a] rounded-sm p-10 text-center">
            <ShoppingCart className="w-6 h-6 text-[#38bdf8] mx-auto mb-3" />
            <p className="text-[12px] font-mono text-[#c8daf0]">You haven't bought any leads yet.</p>
            <p className="text-[11px] font-mono text-[#7a9abf] mt-1">Leads you buy show up here with full contact details.</p>
            <Link href="/marketplace">
              <span className="inline-block mt-4 px-4 py-2 text-[10px] font-mono font-bold rounded-sm border border-[#2563eb] text-[#38bdf8] bg-[#0d1e3a] hover:bg-[#1a3a6b] cursor-pointer">
                BROWSE THE MARKETPLACE →
              </span>
            </Link>
          </div>
        ) : (
          <div className="bg-[#0d1526] border border-[#1e2d4a] rounded-sm overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#1e2d4a] text-[9px] font-mono tracking-widest text-[#7a9abf]">
                  <th className="px-4 py-3 font-normal">NAME</th>
                  <th className="px-4 py-3 font-normal">PHONE</th>
                  <th className="px-4 py-3 font-normal">EMAIL</th>
                  <th className="px-4 py-3 font-normal">STATE</th>
                  <th className="px-4 py-3 font-normal">INTEREST</th>
                  <th className="px-4 py-3 font-normal">SCORE</th>
                  <th className="px-4 py-3 font-normal">PAID</th>
                  <th className="px-4 py-3 font-normal">BOUGHT</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(l => (
                  <tr key={l.id} onClick={() => setOpenLead(l.id)}
                    className="border-b border-[#111c30] hover:bg-[#0a1424] cursor-pointer text-[11px] font-mono text-[#c8daf0]">
                    <td className="px-4 py-3">
                      <span className="font-bold">{l.firstName} {l.lastName}</span>
                      {l.dnc && (
                        <span className="ml-2 inline-flex items-center gap-1 text-[9px] text-[#ff4d4d] border border-[#ff4d4d40] px-1.5 py-0.5 rounded-sm" title="This person has asked not to be contacted">
                          <ShieldAlert className="w-3 h-3" /> DO NOT CALL
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {l.dnc ? <span className="text-[#7a9abf] line-through">{formatPhone(l.phoneNumber)}</span> : (
                        <a href={`tel:${l.phoneNumber}`} onClick={e => e.stopPropagation()} className="inline-flex items-center gap-1 text-[#38bdf8] hover:underline">
                          <Phone className="w-3 h-3" /> {formatPhone(l.phoneNumber)}
                        </a>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <a href={`mailto:${l.email}`} onClick={e => e.stopPropagation()} className="inline-flex items-center gap-1 text-[#38bdf8] hover:underline">
                        <Mail className="w-3 h-3" /> {l.email}
                      </a>
                    </td>
                    <td className="px-4 py-3">{l.state} {l.zipCode}</td>
                    <td className="px-4 py-3 text-[#94b4d4]">{interests(l)}</td>
                    <td className="px-4 py-3 num">{l.leadScore ?? "—"}</td>
                    <td className="px-4 py-3 num">${parseFloat(l.pricePaid).toFixed(2)}</td>
                    <td className="px-4 py-3 text-[#94b4d4] whitespace-nowrap">
                      {l.purchaseDate ? new Date(l.purchaseDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-6 text-center text-[11px] font-mono text-[#7a9abf]">No leads match "{query}".</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
      {openLead != null && (
        <LeadDetailModal leadId={openLead} isOwned onClose={() => setOpenLead(null)} />
      )}
    </div>
  );
}
