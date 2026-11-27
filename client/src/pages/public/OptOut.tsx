import { useState } from "react";
import { Helmet } from "react-helmet";
import { Link } from "wouter";
import { CheckCircle2 } from "lucide-react";
import PublicLayout from "@/components/PublicLayout";
import { SITE } from "@/lib/site";
import { apiRequest, apiErrorMessage } from "@/lib/queryClient";

// Public Do Not Call / opt-out request form for consumers.
export default function OptOut() {
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!phone.trim() && !email.trim()) { setError("Enter your phone number, your email, or both."); return; }
    setStatus("sending");
    try {
      await apiRequest("POST", "/api/opt-out", { phoneNumber: phone, email });
      setStatus("done");
    } catch (err) {
      setError(apiErrorMessage(err, "Could not record your request. Please try again."));
      setStatus("idle");
    }
  };

  const input = "w-full bg-[#060e1c] border border-[#2a4060] focus:border-[#38bdf8] text-white text-[15px] px-3 py-2.5 rounded-sm focus:outline-none";

  return (
    <PublicLayout>
      <Helmet>
        <title>{`Stop Calls and Opt Out | ${SITE.name}`}</title>
        <meta name="description" content="Ask us to stop contacting you and remove your information from sale on LeadHealth." />
        <link rel="canonical" href={`${SITE.url}/opt-out`} />
      </Helmet>
      <section className="max-w-xl mx-auto px-4 py-12">
        <h1 className="font-mono font-bold text-white text-[30px]">Stop calls and opt out</h1>
        <p className="mt-4 text-[15px] leading-relaxed text-[#a9c1dd]">
          If you were contacted about health insurance and want it to stop, enter the phone number and/or email you used.
          We'll add them to our Do Not Call list and take any matching leads off the market so they can't be sold.
          Agents who already bought your information will see it marked Do Not Call.
        </p>

        {status === "done" ? (
          <div role="status" className="mt-8 bg-[#001a0d] border border-[#00d08440] rounded-sm p-5 flex gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#00d084] flex-shrink-0 mt-0.5" aria-hidden />
            <div>
              <p className="font-mono font-bold text-[#00d084]">Request received</p>
              <p className="mt-1 text-[14px] text-[#a9c1dd]">
                We'll stop contacting you and remove your information from sale. It can take a short time for agents who already
                have your details to update their lists; you can also tell any caller to stop.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-8 space-y-5" noValidate>
            <div>
              <label htmlFor="opt-phone" className="block font-mono text-[13px] text-[#c8daf0] mb-1.5">Phone number</label>
              <input id="opt-phone" type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="(555) 555-5555" className={input} />
            </div>
            <div>
              <label htmlFor="opt-email" className="block font-mono text-[13px] text-[#c8daf0] mb-1.5">Email</label>
              <input id="opt-email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" className={input} />
            </div>
            {error && <p role="alert" className="text-[14px] text-[#ff8080]">{error}</p>}
            <button type="submit" disabled={status === "sending"}
              className="w-full py-3 rounded-sm bg-[#0ea5e9] text-[#04121f] font-mono font-bold text-[14px] hover:bg-[#38bdf8] disabled:opacity-60">
              {status === "sending" ? "Sending…" : "Stop contacting me"}
            </button>
            <p className="text-[13px] text-[#7a9abf]">
              We use this information only to honor your request. See our <Link href="/privacy"><span className="text-[#38bdf8] underline cursor-pointer">privacy policy</span></Link>.
            </p>
          </form>
        )}
      </section>
    </PublicLayout>
  );
}
