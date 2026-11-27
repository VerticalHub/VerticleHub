import { lazy, Suspense } from "react";
import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme";
import { Helmet } from "react-helmet";

// Each page is its own chunk, so visitors only download the code for the page they open.
const OnboardingModal = lazy(() => import("@/components/OnboardingModal"));
const Leads       = lazy(() => import("@/pages/Leads"));
const Home        = lazy(() => import("@/pages/Home"));
const ThankYou    = lazy(() => import("@/pages/ThankYou"));
const Marketplace = lazy(() => import("@/pages/Marketplace"));
const Admin       = lazy(() => import("@/pages/Admin"));
const Login       = lazy(() => import("@/pages/Login"));
const Dashboard   = lazy(() => import("@/pages/Dashboard"));
const SellLeads   = lazy(() => import("@/pages/SellLeads"));
const Referrals   = lazy(() => import("@/pages/Referrals"));
const Profile     = lazy(() => import("@/pages/Profile"));
const NotFound    = lazy(() => import("@/pages/not-found"));
const Landing     = lazy(() => import("@/pages/public/Landing"));
const OptOut      = lazy(() => import("@/pages/public/OptOut"));
const Privacy     = lazy(() => import("@/pages/public/Legal").then(m => ({ default: m.Privacy })));
const Terms       = lazy(() => import("@/pages/public/Legal").then(m => ({ default: m.Terms })));

function useMe() {
  return useQuery<any>({
    queryKey: ["/api/auth/me"],
    queryFn: () => fetch("/api/auth/me").then(r => r.json()),
    retry: false,
    staleTime: 60_000,
  });
}

function Loading({ label = "LOADING..." }: { label?: string }) {
  return (
    <div className="min-h-screen bg-[#070d1a] flex items-center justify-center">
      <div className="text-[12px] font-mono text-[#7a9abf] tracking-widest animate-pulse" role="status">{label}</div>
    </div>
  );
}

function AuthGuard({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const [location] = useLocation();
  const { data, isLoading } = useMe();

  if (isLoading) return <Loading label="AUTHENTICATING..." />;
  if (!data?.success && location !== "/login") return <Redirect to="/login" />;
  if (adminOnly && data?.data?.role !== "admin") return <Redirect to="/dashboard" />;
  return (
    <>
      {/* Signed-in app pages are private: keep them out of search results. */}
      <Helmet><meta name="robots" content="noindex, nofollow" /></Helmet>
      <OnboardingModal />
      {children}
    </>
  );
}

const guarded = (Page: React.ComponentType, adminOnly = false) => () => <AuthGuard adminOnly={adminOnly}><Page /></AuthGuard>;

function Router() {
  return (
    <Suspense fallback={<Loading />}>
      <Switch>
        {/* Public */}
        <Route path="/"            component={Landing} />
        <Route path="/login"       component={Login} />
        <Route path="/privacy"     component={Privacy} />
        <Route path="/terms"       component={Terms} />
        <Route path="/opt-out"     component={OptOut} />
        {/* Signed in */}
        <Route path="/dashboard"   component={guarded(Dashboard)} />
        <Route path="/leads"       component={guarded(Leads)} />
        <Route path="/home"        component={guarded(Home)} />
        <Route path="/thank-you"   component={guarded(ThankYou)} />
        <Route path="/marketplace" component={guarded(Marketplace)} />
        <Route path="/sell"        component={guarded(SellLeads)} />
        <Route path="/referrals"   component={guarded(Referrals)} />
        <Route path="/profile"     component={guarded(Profile)} />
        <Route path="/admin"       component={guarded(Admin, true)} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
      <TooltipProvider>
        <Helmet defaultTitle="LeadHealth — The Lead & Call Exchange for Health Insurance Agents">
          <meta name="description" content="A marketplace where health insurance agents buy and sell ACA, Medicare and Final Expense leads. Every lead is scored 0–100, TCPA consent is tracked, and Do Not Call requests are enforced." />
        </Helmet>
        <Toaster />
        <Router />
      </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
