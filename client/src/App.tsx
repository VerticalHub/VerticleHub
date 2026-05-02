import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Leads from "@/pages/Leads";
import Home from "@/pages/Home";
import ThankYou from "@/pages/ThankYou";
import Marketplace from "@/pages/Marketplace";
import Admin from "@/pages/Admin";
import Login from "@/pages/Login";
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

  if (!data?.success && location !== "/login") {
    return <Redirect to="/login" />;
  }

  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/" component={() => <Redirect to="/leads" />} />
      <Route path="/leads"       component={() => <AuthGuard><Leads /></AuthGuard>} />
      <Route path="/home"        component={() => <AuthGuard><Home /></AuthGuard>} />
      <Route path="/thank-you"   component={() => <AuthGuard><ThankYou /></AuthGuard>} />
      <Route path="/marketplace" component={() => <AuthGuard><Marketplace /></AuthGuard>} />
      <Route path="/admin"       component={() => <AuthGuard><Admin /></AuthGuard>} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Helmet>
          <title>HealthLead Pro | Healthcare Lead Intelligence Platform</title>
          <meta name="description" content="Professional healthcare lead generation, resale marketplace, and AI demand intelligence platform." />
          <meta name="keywords" content="health insurance leads, lead marketplace, ACA leads, medicare leads, healthcare lead generation" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1" />
          <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
        </Helmet>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
