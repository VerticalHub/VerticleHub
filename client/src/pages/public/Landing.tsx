import { useQuery } from "@tanstack/react-query";
import { Link, Redirect } from "wouter";
import { Helmet } from "react-helmet";
import { ShieldCheck, Gauge, Clock, Ban, Lock, Download, Tag, Upload, ShoppingCart, PhoneCall } from "lucide-react";
import PublicLayout from "@/components/PublicLayout";
import { SITE } from "@/lib/site";

const FAQ: { q: string; a: string }[] = [
  {
    q: "What kinds of leads are on LeadHealth?",
    a: "Consumer leads for health insurance: ACA/Obamacare, Medicare, and Final Expense life insurance. Each listing shows the state, the coverage the person asked about, and a 0–100 lead score before you buy.",
  },
  {
    q: "How is the lead score calculated?",
    a: "Seven factors: TCPA consent (25 points), the type of coverage requested (20), how well the person's age fits that coverage (15), how recently the lead was captured (15), demand in their state (10), income fit (8), and how complete the record is (7). Leads scoring 80 or more are marked PRIME.",
  },
  {
    q: "What do I see before and after I buy?",
    a: "Before purchase you see the score, state, coverage interest, birth year and an approximate income, with the name and contact details hidden. After purchase you get the full name, phone, email, ZIP and date of birth, and you can export your leads to CSV.",
  },
  {
    q: "Can a lead be sold to more than one buyer?",
    a: "Each listing is sold to one buyer and comes off the market as soon as it's bought. You can't buy the same lead twice.",
  },
  {
    q: "How do you handle TCPA consent and Do Not Call requests?",
    a: "Sellers must attest that the consumer gave TCPA consent before a lead can be listed, and the consent source is recorded with the lead. Leads on the Do Not Call list can't be purchased, and consumers can opt out at any time on our opt-out page, which removes their leads from sale.",
  },
  {
    q: "How do I pay?",
    a: "You buy leads with prepaid account credits. Online card payments aren't available yet; contact us and we'll add credits to your account.",
  },
  {
    q: "Can I sell my own leads?",
    a: "Yes. Submit a lead with the consumer's details and TCPA consent, set your asking price, and it's scored and listed on the marketplace.",
  },
];

const FEATURES = [
  { icon: Gauge,       title: "Scored before you buy",   body: "Every lead gets a transparent 0–100 score from seven factors, so you can compare price against quality." },
  { icon: ShieldCheck, title: "TCPA consent tracked",    body: "Consent and its source are stored with each lead. Sellers can't list a lead without attesting to consent." },
  { icon: Ban,         title: "Do Not Call enforced",    body: "Leads on the DNC list can't be bought, and consumer opt-out requests pull matching leads off the market." },
  { icon: Clock,       title: "Freshness shown",         body: "Lead quality decays 2% per hour after capture, so older leads are visibly older." },
  { icon: Lock,        title: "Private notes",           body: "Log call outcomes and notes on the leads you own. Other buyers never see them." },
  { icon: Download,    title: "Export anytime",          body: "Download your purchased leads to CSV for your dialer or CRM." },
];

function faqJsonLd() {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map(f => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  });
}

export default function Landing() {
  // Signed-in users go straight to the app.
  const { data } = useQuery<any>({
    queryKey: ["/api/auth/me"],
    queryFn: () => fetch("/api/auth/me").then(r => r.json()),
    retry: false,
    staleTime: 60_000,
  });
  if (data?.success) return <Redirect to="/dashboard" />;

  return (
    <PublicLayout>
      <Helmet>
        <title>LeadHealth — Buy &amp; Sell ACA, Medicare and Final Expense Leads</title>
        <meta name="description" content="A marketplace where health insurance agents buy and sell ACA, Medicare and Final Expense leads. Every lead is scored 0–100, TCPA consent is tracked, and Do Not Call requests are enforced." />
        <link rel="canonical" href={`${SITE.url}/`} />
        <script type="application/ld+json">{faqJsonLd()}</script>
      </Helmet>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-16 pb-14 grid lg:grid-cols-[1.2fr_1fr] gap-10 items-center">
        <div>
          <p className="font-mono text-[12px] tracking-[0.2em] text-[#38bdf8] mb-4">LEAD &amp; CALL EXCHANGE</p>
          <h1 className="font-mono font-bold text-white text-[32px] sm:text-[44px] leading-[1.1] tracking-tight">
            Buy and sell health insurance leads, priced by quality.
          </h1>
          <p className="mt-5 text-[16px] leading-relaxed text-[#a9c1dd] max-w-xl">
            LeadHealth is a marketplace for insurance agents. Browse ACA, Medicare and Final Expense leads with a
            transparent score, consent status and freshness shown up front. Pay only for the leads you choose.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/login?tab=register">
              <span className="inline-block px-5 py-3 rounded-sm bg-[#0ea5e9] text-[#04121f] font-mono font-bold text-[14px] hover:bg-[#38bdf8] cursor-pointer">Create a free account</span>
            </Link>
            <a href="#how-it-works" className="inline-block px-5 py-3 rounded-sm border border-[#2a4060] text-[#c8daf0] font-mono text-[14px] hover:border-[#38bdf8]">See how it works</a>
          </div>
          <p className="mt-4 font-mono text-[12px] text-[#7a9abf]">No subscription. You pay per lead with prepaid credits.</p>
        </div>

        {/* Example listing card: illustrates what a buyer sees before purchase */}
        <figure className="bg-[#0d1526] border border-[#1e2d4a] rounded-sm p-5 font-mono" aria-label="Example of a marketplace listing">
          <figcaption className="text-[11px] tracking-widest text-[#7a9abf] mb-4">EXAMPLE LISTING</figcaption>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white text-[15px] font-bold">Medicare · FL</p>
              <p className="text-[12px] text-[#7a9abf] mt-1">Name and contact hidden until purchase</p>
            </div>
            <span className="text-[12px] font-bold px-2 py-1 rounded-sm bg-[#00d08420] text-[#00d084] border border-[#00d08440]">PRIME 86</span>
          </div>
          <dl className="mt-5 grid grid-cols-2 gap-3 text-[12px]">
            {[["Birth year", "1957"], ["TCPA consent", "Yes · web form"], ["Freshness", "94%"], ["Phone", "(***) ***-8821"]].map(([k, v]) => (
              <div key={k} className="bg-[#060e1c] border border-[#1e2d4a] rounded-sm p-3">
                <dt className="text-[#7a9abf] text-[10px] tracking-widest uppercase">{k}</dt>
                <dd className="text-[#c8daf0] mt-1">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-5 flex items-center justify-between">
            <span className="text-white text-[20px] font-bold">$61.00</span>
            <span className="text-[12px] px-3 py-1.5 rounded-sm border border-[#2563eb] text-[#38bdf8]">Buy lead</span>
          </div>
        </figure>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-t border-[#1e2d4a] bg-[#091220]">
        <div className="max-w-6xl mx-auto px-4 py-14">
          <h2 className="font-mono font-bold text-white text-[24px]">How it works</h2>
          <div className="mt-8 grid md:grid-cols-2 gap-6">
            <div className="bg-[#0d1526] border border-[#1e2d4a] rounded-sm p-6">
              <h3 className="font-mono text-[#38bdf8] text-[14px] tracking-widest flex items-center gap-2"><ShoppingCart className="w-4 h-4" aria-hidden /> FOR BUYERS</h3>
              <ol className="mt-4 space-y-3 text-[15px] text-[#a9c1dd] list-decimal list-inside">
                <li>Create an account and add credits.</li>
                <li>Filter the marketplace by coverage type, state and price; compare scores.</li>
                <li>Buy a lead to unlock the full name, phone, email and ZIP.</li>
                <li>Call, log notes privately, and export your leads to CSV.</li>
              </ol>
            </div>
            <div className="bg-[#0d1526] border border-[#1e2d4a] rounded-sm p-6">
              <h3 className="font-mono text-[#00d084] text-[14px] tracking-widest flex items-center gap-2"><Upload className="w-4 h-4" aria-hidden /> FOR SELLERS</h3>
              <ol className="mt-4 space-y-3 text-[15px] text-[#a9c1dd] list-decimal list-inside">
                <li>Submit a lead with the consumer's details.</li>
                <li>Attest that TCPA consent was obtained and documented.</li>
                <li>Set your asking price ($1–$500).</li>
                <li>The lead is scored and listed on the marketplace.</li>
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 py-14">
        <h2 className="font-mono font-bold text-white text-[24px]">Built for compliant outreach</h2>
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(f => (
            <div key={f.title} className="bg-[#0d1526] border border-[#1e2d4a] rounded-sm p-5">
              <f.icon className="w-5 h-5 text-[#38bdf8]" aria-hidden />
              <h3 className="mt-3 font-mono font-bold text-white text-[15px]">{f.title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-[#a9c1dd]">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Lead types */}
      <section className="border-y border-[#1e2d4a] bg-[#091220]">
        <div className="max-w-6xl mx-auto px-4 py-14">
          <h2 className="font-mono font-bold text-white text-[24px]">Lead types</h2>
          <div className="mt-8 grid md:grid-cols-3 gap-4">
            {[
              { t: "ACA / Obamacare", d: "People shopping for marketplace health plans, including those who may qualify for premium tax credits.", c: "#38bdf8" },
              { t: "Medicare",        d: "People turning 65 or already on Medicare who asked about plan options.", c: "#a78bfa" },
              { t: "Final Expense",   d: "People interested in final expense or burial life insurance.", c: "#00d084" },
            ].map(x => (
              <div key={x.t} className="bg-[#0d1526] border border-[#1e2d4a] rounded-sm p-5">
                <Tag className="w-4 h-4" style={{ color: x.c }} aria-hidden />
                <h3 className="mt-3 font-mono font-bold text-white text-[15px]">{x.t}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-[#a9c1dd]">{x.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="max-w-3xl mx-auto px-4 py-14">
        <h2 className="font-mono font-bold text-white text-[24px]">Frequently asked questions</h2>
        <div className="mt-6 divide-y divide-[#1e2d4a] border-y border-[#1e2d4a]">
          {FAQ.map(f => (
            <details key={f.q} className="group py-4">
              <summary className="cursor-pointer list-none flex items-center justify-between gap-4 font-mono text-[15px] text-white">
                {f.q}
                <span className="text-[#38bdf8] group-open:rotate-45 transition-transform text-[20px] leading-none" aria-hidden>+</span>
              </summary>
              <p className="mt-3 text-[15px] leading-relaxed text-[#a9c1dd]">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="bg-[#0d1526] border border-[#1e2d4a] rounded-sm p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="font-mono font-bold text-white text-[22px] flex items-center gap-2"><PhoneCall className="w-5 h-5 text-[#38bdf8]" aria-hidden /> Start working better leads</h2>
            <p className="mt-2 text-[15px] text-[#a9c1dd]">Create an account to browse the marketplace and see live listings.</p>
          </div>
          <Link href="/login?tab=register">
            <span className="inline-block px-5 py-3 rounded-sm bg-[#0ea5e9] text-[#04121f] font-mono font-bold text-[14px] hover:bg-[#38bdf8] cursor-pointer whitespace-nowrap">Create a free account</span>
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
}
