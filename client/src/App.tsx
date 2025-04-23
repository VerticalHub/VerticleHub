import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/Home";
import ThankYou from "@/pages/ThankYou";
import NotFound from "@/pages/not-found";
import { Helmet } from "react-helmet";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home}/>
      <Route path="/thank-you" component={ThankYou}/>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Helmet>
          <title>HealthCare Connect | Find Affordable Insurance Coverage Options</title>
          <meta name="description" content="Find affordable healthcare coverage options including ACA/Obamacare, Medicare, and Final Expense/Life Insurance. Get personalized quotes from trusted providers." />
          <meta name="keywords" content="health insurance, obamacare, affordable care act, medicare, final expense insurance, life insurance, healthcare coverage, insurance quotes" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1" />
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Montserrat:wght@500;600;700&display=swap" rel="stylesheet" />
        </Helmet>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
