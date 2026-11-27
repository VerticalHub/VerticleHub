// Per-route <head> tags and a plain-HTML version of each public page, injected
// into index.html by the production server. Crawlers and link previews that don't
// run JavaScript get real content; React replaces the #root content on load.

const SITE_URL = "https://www.leadhealth.co";

type PageMeta = { title: string; description: string; body: string };

const nav = `<nav><a href="/">LeadHealth</a> · <a href="/login">Sign in</a> · <a href="/privacy">Privacy</a> · <a href="/terms">Terms</a> · <a href="/opt-out">Do not contact me</a></nav>`;

export const PUBLIC_PAGES: Record<string, PageMeta> = {
  "/": {
    title: "LeadHealth — Buy & Sell ACA, Medicare and Final Expense Leads",
    description: "A marketplace where health insurance agents buy and sell ACA, Medicare and Final Expense leads. Every lead is scored 0–100, TCPA consent is tracked, and Do Not Call requests are enforced.",
    body: `<h1>Buy and sell health insurance leads, priced by quality.</h1>
<p>LeadHealth is a marketplace for insurance agents. Browse ACA, Medicare and Final Expense leads with a transparent score, consent status and freshness shown up front. Pay only for the leads you choose.</p>
<h2>How it works</h2>
<p>Buyers add credits, filter the marketplace by coverage type, state and price, and buy a lead to unlock its full contact details. Sellers submit leads with TCPA consent, set a price, and the lead is scored and listed.</p>
<h2>Built for compliant outreach</h2>
<ul><li>Every lead is scored 0–100 from seven factors.</li><li>TCPA consent and its source are stored with each lead.</li><li>Leads on the Do Not Call list can't be bought.</li><li>Lead quality decays 2% per hour after capture.</li><li>Private notes and CSV export for the leads you own.</li></ul>
<p><a href="/login?tab=register">Create a free account</a></p>`,
  },
  "/login": {
    title: "Sign In | LeadHealth",
    description: "Sign in to LeadHealth or create a free account to buy and sell ACA, Medicare and Final Expense leads.",
    body: `<h1>Sign in to LeadHealth</h1><p>Sign in or create a free account to buy and sell health insurance leads.</p>`,
  },
  "/privacy": {
    title: "Privacy Policy | LeadHealth",
    description: "How LeadHealth collects, uses and shares personal information, and how to opt out.",
    body: `<h1>Privacy Policy</h1><p>How LeadHealth collects, uses and shares personal information, and the choices you have, including how to stop being contacted.</p>`,
  },
  "/terms": {
    title: "Terms of Service | LeadHealth",
    description: "The terms for using the LeadHealth lead marketplace.",
    body: `<h1>Terms of Service</h1><p>The terms for buying and selling leads on LeadHealth, including consent and compliance requirements.</p>`,
  },
  "/opt-out": {
    title: "Stop Calls and Opt Out | LeadHealth",
    description: "Ask us to stop contacting you and remove your information from sale on LeadHealth.",
    body: `<h1>Stop calls and opt out</h1><p>Enter the phone number or email you used and we'll add it to our Do Not Call list and take matching leads off the market.</p>`,
  },
};

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Returns index.html with route-specific tags. Signed-in app routes get noindex.
export function renderIndexHtml(template: string, pathname: string, isKnownRoute: boolean): string {
  const page = PUBLIC_PAGES[pathname];
  let html = template;
  if (page) {
    const url = `${SITE_URL}${pathname === "/" ? "/" : pathname}`;
    html = html
      .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(page.title)}</title>`)
      .replace(/(<meta name="description" content=")[^"]*(")/, `$1${esc(page.description)}$2`)
      .replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`)
      .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${url}$2`)
      .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${esc(page.title)}$2`)
      .replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${esc(page.title)}$2`)
      .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${esc(page.description)}$2`)
      .replace(/(<meta name="twitter:description" content=")[^"]*(")/, `$1${esc(page.description)}$2`)
      .replace('<div id="root"></div>', `<div id="root"><div class="prerender">${nav}${page.body}</div></div>`);
  } else {
    html = html
      .replace(/<link rel="canonical"[^>]*>\s*/, "")
      .replace("</head>", `  <meta name="robots" content="noindex" />\n  </head>`);
    if (!isKnownRoute) html = html.replace(/<title>[\s\S]*?<\/title>/, "<title>Page Not Found | LeadHealth</title>");
  }
  return html;
}
