import { Link } from "wouter";
import { Activity } from "lucide-react";
import { SITE } from "@/lib/site";

// Shell for signed-out pages: simple top bar, readable type, footer with legal links.
export default function PublicLayout({ children, signedIn = false }: { children: React.ReactNode; signedIn?: boolean }) {
  return (
    <div className="min-h-screen bg-[#070d1a] text-[#c8daf0] flex flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 bg-[#0d1e3a] text-[#38bdf8] px-3 py-2 rounded-sm font-mono text-sm">
        Skip to content
      </a>
      <header className="border-b border-[#1e2d4a] bg-[#070d1a]/95 sticky top-0 z-40 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/">
            <span className="flex items-center gap-2 cursor-pointer" aria-label={`${SITE.name} home`}>
              <span className="w-7 h-7 rounded-sm bg-[#0ea5e9] flex items-center justify-center">
                <Activity className="w-4 h-4 text-white" aria-hidden />
              </span>
              <span className="font-mono font-bold text-[15px] tracking-tight">
                <span className="text-white">LEAD</span><span className="text-[#38bdf8]">HEALTH</span>
              </span>
            </span>
          </Link>
          <nav className="flex items-center gap-2 sm:gap-4 font-mono text-[13px]">
            <a href="/#how-it-works" className="hidden sm:inline text-[#94b4d4] hover:text-white">How it works</a>
            <a href="/#faq" className="hidden sm:inline text-[#94b4d4] hover:text-white">FAQ</a>
            {signedIn ? (
              <Link href="/dashboard"><span className="px-3 py-1.5 rounded-sm bg-[#0ea5e9] text-[#04121f] font-bold hover:bg-[#38bdf8] cursor-pointer">Open app</span></Link>
            ) : (
              <>
                <Link href="/login"><span className="text-[#c8daf0] hover:text-white cursor-pointer">Sign in</span></Link>
                <Link href="/login?tab=register"><span className="px-3 py-1.5 rounded-sm bg-[#0ea5e9] text-[#04121f] font-bold hover:bg-[#38bdf8] cursor-pointer">Create account</span></Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main id="main" className="flex-1">{children}</main>

      <footer className="border-t border-[#1e2d4a] mt-16">
        <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col sm:flex-row gap-4 sm:items-center justify-between font-mono text-[12px] text-[#7a9abf]">
          <p>© {new Date().getFullYear()} {SITE.name}. Lead &amp; call exchange for health insurance agents.</p>
          <nav aria-label="Legal" className="flex flex-wrap gap-x-5 gap-y-2">
            <Link href="/privacy"><span className="hover:text-white cursor-pointer">Privacy</span></Link>
            <Link href="/terms"><span className="hover:text-white cursor-pointer">Terms</span></Link>
            <Link href="/opt-out"><span className="hover:text-white cursor-pointer">Do not contact me</span></Link>
            {SITE.supportEmail && <a href={`mailto:${SITE.supportEmail}`} className="hover:text-white">{SITE.supportEmail}</a>}
          </nav>
        </div>
      </footer>
    </div>
  );
}
