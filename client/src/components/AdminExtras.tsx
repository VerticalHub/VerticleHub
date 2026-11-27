import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest, apiErrorMessage } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Admin-only: add credit to a user's account after taking payment outside the app.
export function AddCreditControl({ userId, username }: { userId: number; username: string }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const { toast } = useToast();
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/credits/purchase", { userId, amount: parseFloat(amount) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Credit added", description: `$${parseFloat(amount).toFixed(2)} added to ${username}.` });
      setAmount(""); setOpen(false);
    },
    onError: (err) => toast({ title: "Couldn't add credit", description: apiErrorMessage(err, "Try again."), variant: "destructive" }),
  });
  const valid = parseFloat(amount) > 0 && parseFloat(amount) <= 100000;

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-sm border border-[#00d08460] text-[#00d084] hover:bg-[#001a0d] whitespace-nowrap">
        + ADD CREDIT
      </button>
    );
  }
  return (
    <form className="flex items-center gap-1.5" onSubmit={e => { e.preventDefault(); if (valid) mutation.mutate(); }}>
      <label className="sr-only" htmlFor={`credit-${userId}`}>Amount in dollars for {username}</label>
      <input id={`credit-${userId}`} autoFocus inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
        placeholder="$" className="w-20 bg-[#060e1c] border border-[#1e2d4a] focus:border-[#00d084] text-[#c8daf0] text-[11px] font-mono px-2 py-1 rounded-sm focus:outline-none" />
      <button type="submit" disabled={!valid || mutation.isPending}
        className="text-[10px] font-mono font-bold px-2 py-1 rounded-sm bg-[#00d084] text-[#04121f] disabled:opacity-40">
        {mutation.isPending ? "…" : "ADD"}
      </button>
      <button type="button" onClick={() => { setOpen(false); setAmount(""); }} className="text-[10px] font-mono text-[#7a9abf] px-1" aria-label="Cancel">✕</button>
    </form>
  );
}

// Admin-only: consumer opt-out (Do Not Call) requests.
export function OptOutsPanel() {
  const { data, isLoading } = useQuery<any>({
    queryKey: ["/api/admin/opt-outs"],
    queryFn: () => fetch("/api/admin/opt-outs").then(r => r.json()),
  });
  const rows: any[] = data?.data || [];
  return (
    <div className="bg-[#0d1526] border border-[#1e2d4a] rounded-sm overflow-hidden fade-in">
      <div className="px-4 py-2.5 border-b border-[#1e2d4a]">
        <span className="text-[10px] font-mono tracking-widest text-[#94b4d4]">OPT-OUT REQUESTS — {rows.length}</span>
        <p className="text-[10px] font-mono text-[#7a9abf] mt-1">
          Submitted on the public /opt-out page. Matching leads are marked Do Not Call and removed from sale automatically.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#1e2d4a]">
              {["RECEIVED", "PHONE", "EMAIL", "LEADS MATCHED"].map(h => (
                <th key={h} className="px-4 py-2.5 text-left text-[9px] font-mono tracking-widest text-[#7a9abf]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#0a1120]">
            {isLoading ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-[11px] font-mono text-[#7a9abf]">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-[11px] font-mono text-[#7a9abf]">No opt-out requests yet.</td></tr>
            ) : rows.map(r => (
              <tr key={r.id} className="text-[11px] font-mono text-[#c8daf0]">
                <td className="px-4 py-2.5 whitespace-nowrap">{r.createdAt ? new Date(r.createdAt).toLocaleString() : "—"}</td>
                <td className="px-4 py-2.5">{r.phoneNumber || "—"}</td>
                <td className="px-4 py-2.5">{r.email || "—"}</td>
                <td className="px-4 py-2.5 num">{r.matchedLeads}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
