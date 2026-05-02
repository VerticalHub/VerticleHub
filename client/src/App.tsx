import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Leads from "@/pages/Leads";
import Home from "@/pages/Home";
import ThankYou from "@/pages/ThankYou";
import Marketplace from "@/pages/Marketplace";
import Admin from "@/pages/Admin";
import NotFound from "@/pages/not-found";
import { Helmet } from "react-helmet";

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => <Redirect to="/leads" />} />
      <Route path="/leads" component={Leads} />
      <Route path="/home" component={Home} />
      <Route path="/thank-you" component={ThankYou} />
      <Route path="/marketplace" component={Marketplace} />
      <Route path="/admin" component={Admin} />
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
