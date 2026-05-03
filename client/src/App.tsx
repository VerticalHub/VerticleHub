import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme";
import OnboardingModal from "@/components/OnboardingModal";
import Leads from "@/pages/Leads";
import Home from "@/pages/Home";
import ThankYou from "@/pages/ThankYou";
import Marketplace from "@/pages/Marketplace";
import Admin from "@/pages/Admin";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import SellLeads from "@/pages/SellLeads";
import Referrals from "@/pages/Referrals";
import Profile from "@/pages/Profile";
import NotFound from "@/pages/not-found";
import { Helmet } from "react-helmet";

function AuthGuard({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { data, isLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: () => fetch("/api/auth/me").then(r => r.json()),
    retry: false,
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#070d1a] flex items-center justify-center">
        <div className="text-[12px] font-mono text-[#2a4060] tracking-widest animate-pulse">AUTHENTICATING...</div>
      </div>
    );
  }

  if (!data?.success && location !== "/login") return <Redirect to="/login" />;
  return (
    <>
      <OnboardingModal />
      {children}
    </>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login"       component={Login} />
      <Route path="/"            component={() => <Redirect to="/dashboard" />} />
      <Route path="/dashboard"   component={() => <AuthGuard><Dashboard /></AuthGuard>} />
      <Route path="/leads"       component={() => <AuthGuard><Leads /></AuthGuard>} />
      <Route path="/home"        component={() => <AuthGuard><Home /></AuthGuard>} />
      <Route path="/thank-you"   component={() => <AuthGuard><ThankYou /></AuthGuard>} />
      <Route path="/marketplace" component={() => <AuthGuard><Marketplace /></AuthGuard>} />
      <Route path="/sell"        component={() => <AuthGuard><SellLeads /></AuthGuard>} />
      <Route path="/referrals"   component={() => <AuthGuard><Referrals /></AuthGuard>} />
      <Route path="/admin"       component={() => <AuthGuard><Admin /></AuthGuard>} />
      <Route path="/profile"     component={() => <AuthGuard><Profile /></AuthGuard>} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
      <TooltipProvider>
        <Helmet>
          <title>LeadHealth — The Lead & Call Exchange for Health Insurance Agents</title>
          <meta name="description" content="Buy and sell verified ACA, Medicare, and Final Expense leads and calls on the live LeadHealth exchange. Real-time pricing, AI demand intelligence, and TCPA-compliant lead generation for health insurance agents." />
          <meta name="keywords" content="health insurance leads, buy health insurance leads, sell health insurance leads, ACA leads, medicare leads, final expense leads, health insurance calls, lead exchange, lead marketplace, insurance lead trading, TCPA leads, medicare advantage leads, obamacare leads, insurance agent leads" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1" />
          <meta name="robots" content="index, follow" />
          <meta name="author" content="LeadHealth" />
          <meta property="og:type" content="website" />
          <meta property="og:site_name" content="LeadHealth" />
          <meta property="og:url" content="https://www.leadhealth.co/" />
          <meta property="og:title" content="LeadHealth — The Lead & Call Exchange for Health Insurance Agents" />
          <meta property="og:description" content="Buy and sell verified ACA, Medicare, and Final Expense leads and calls on the live LeadHealth exchange. Real-time pricing, AI demand intelligence, and TCPA-compliant lead generation." />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:site" content="@leadhealthco" />
          <meta name="twitter:url" content="https://www.leadhealth.co/" />
          <meta name="twitter:title" content="LeadHealth — The Lead & Call Exchange for Health Insurance Agents" />
          <meta name="twitter:description" content="Buy and sell verified ACA, Medicare, and Final Expense leads and calls on the live LeadHealth exchange." />
          <link rel="canonical" href="https://www.leadhealth.co/" />
          <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
        </Helmet>
        <Toaster />
        <Router />
      </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
