import { Link } from "wouter";
import { Helmet } from "react-helmet";
import PublicLayout from "@/components/PublicLayout";
import { SITE, legalName } from "@/lib/site";

function LegalPage({ title, path, description, children }: { title: string; path: string; description: string; children: React.ReactNode }) {
  return (
    <PublicLayout>
      <Helmet>
        <title>{`${title} | ${SITE.name}`}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={`${SITE.url}${path}`} />
      </Helmet>
      <article className="max-w-3xl mx-auto px-4 py-12 legal">
        <h1 className="font-mono font-bold text-white text-[30px]">{title}</h1>
        <p className="mt-2 font-mono text-[12px] text-[#7a9abf]">Last updated {SITE.legalUpdated}</p>
        <div className="mt-8 space-y-6 text-[15px] leading-relaxed text-[#a9c1dd] [&_h2]:font-mono [&_h2]:font-bold [&_h2]:text-white [&_h2]:text-[18px] [&_h2]:mt-10 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2 [&_a]:text-[#38bdf8] [&_a]:underline">
          {children}
        </div>
      </article>
    </PublicLayout>
  );
}

function Contact() {
  return SITE.supportEmail
    ? <>email us at <a href={`mailto:${SITE.supportEmail}`}>{SITE.supportEmail}</a></>
    : <>contact us through your account</>;
}

export function Privacy() {
  const org = legalName();
  return (
    <LegalPage title="Privacy Policy" path="/privacy" description={`How ${SITE.name} collects, uses and shares personal information, and how to opt out.`}>
      <p>
        This policy explains what personal information {org} ("we") collects through {SITE.name}, how we use and share it,
        and the choices you have. {SITE.name} is a marketplace where licensed insurance agents and agencies buy and sell
        leads from consumers who asked to be contacted about health insurance.
      </p>

      <h2>Information we collect</h2>
      <ul>
        <li><strong>Consumer lead information:</strong> name, email, phone number, ZIP code, state, date of birth, the coverage you asked about (ACA, Medicare, Final Expense), and, if you provide them, household size, annual income and whether you have Medicaid, Medicare or VA coverage. We also record whether and how you gave consent to be contacted.</li>
        <li><strong>Account information</strong> for agents who use the platform: username, email, password (stored only as a one-way hash), and activity such as purchases, credits and notes.</li>
        <li><strong>Technical information</strong> needed to run the service, such as a session cookie that keeps you signed in and basic server logs.</li>
      </ul>

      <h2>How we use and share information</h2>
      <ul>
        <li>If you submit your information as a consumer, it may be shared with or sold to insurance agents and agencies who use {SITE.name}, so they can contact you about the coverage you asked about. Before purchase, agents see only limited details (such as state, birth year and the coverage requested); your name and contact details are shown only to the agent who buys your lead.</li>
        <li>We use account information to operate the platform, process purchases and credits, prevent fraud and abuse, and communicate with users.</li>
        <li>We may disclose information when required by law or to protect our rights and users.</li>
        <li>We do not use third-party advertising trackers on {SITE.name}.</li>
      </ul>

      <h2>Your choices</h2>
      <ul>
        <li><strong>Stop being contacted:</strong> use our <Link href="/opt-out">opt-out page</Link>. We add your phone number or email to our Do Not Call list and take matching leads off the market so they can no longer be bought. Agents who already bought your lead see it flagged as Do Not Call. You can also tell any agent who calls you to stop.</li>
        <li><strong>Access, correction or deletion:</strong> to ask what information we hold about you or to have it corrected or deleted, <Contact />. Depending on where you live, you may have additional rights under state privacy laws.</li>
      </ul>

      <h2>Security and retention</h2>
      <p>
        Access to lead data requires a signed-in account, and full contact details are limited to administrators and the agent who bought a lead.
        Passwords are hashed and connections are encrypted. We keep information for as long as needed to operate the marketplace and meet legal obligations,
        and we keep Do Not Call records so we can continue to honor them.
      </p>

      <h2>Children</h2>
      <p>{SITE.name} is not intended for anyone under 18, and we do not knowingly collect information from children.</p>

      <h2>Changes</h2>
      <p>We may update this policy. The date at the top shows when it last changed.</p>

      <h2>Contact</h2>
      <p>For privacy questions, <Contact />.</p>
    </LegalPage>
  );
}

export function Terms() {
  const org = legalName();
  return (
    <LegalPage title="Terms of Service" path="/terms" description={`The terms for using the ${SITE.name} lead marketplace.`}>
      <p>
        These terms govern your use of {SITE.name}, operated by {org}. By creating an account or using the service you agree to them.
      </p>

      <h2>Who can use {SITE.name}</h2>
      <ul>
        <li>You must be at least 18 and able to enter a binding agreement.</li>
        <li>You are responsible for holding any insurance licenses required where you contact consumers, and for keeping your login secure.</li>
      </ul>

      <h2>Buying leads</h2>
      <ul>
        <li>Leads are purchased with prepaid account credits. Each listing is sold to one buyer, and a purchase is final once the lead's details are revealed, except where we decide otherwise or the law requires.</li>
        <li>Lead scores and freshness indicators are estimates to help you compare leads. They are not a guarantee of contactability, eligibility or sale.</li>
        <li>You must use purchased leads only to contact consumers about the type of coverage they asked about.</li>
      </ul>

      <h2>Selling leads</h2>
      <ul>
        <li>You may list only leads you have the right to sell, collected lawfully from real consumers who gave prior express written consent to be contacted, including by automated means where applicable.</li>
        <li>You must keep records of that consent and provide them to us or a buyer on request.</li>
        <li>We may remove listings, reverse sales or suspend accounts for leads that are fake, duplicated, lack consent, or generate complaints.</li>
      </ul>

      <h2>Compliance</h2>
      <ul>
        <li>You are responsible for complying with all laws that apply to your outreach, including the Telephone Consumer Protection Act (TCPA), the Telemarketing Sales Rule, the National Do Not Call Registry, state telemarketing and insurance laws, and CMS marketing rules for Medicare.</li>
        <li>You must honor opt-out and Do Not Call requests promptly. Leads marked Do Not Call must not be contacted.</li>
      </ul>

      <h2>Acceptable use</h2>
      <p>Don't attempt to access data you haven't purchased, interfere with the service, scrape it, resell access to it, or use it to harass anyone.</p>

      <h2>Disclaimers and liability</h2>
      <p>
        The service is provided "as is." To the extent the law allows, {org} disclaims implied warranties and is not liable for indirect or consequential
        damages, and our total liability is limited to the amount you paid us in the three months before the claim.
      </p>

      <h2>Changes and termination</h2>
      <p>We may change these terms or the service, and may suspend or close accounts that break these terms. Continuing to use {SITE.name} after a change means you accept it.</p>

      <h2>Contact</h2>
      <p>Questions about these terms? <Contact />.</p>
    </LegalPage>
  );
}
