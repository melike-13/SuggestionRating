import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import AppShell from "@/components/layouts/AppShell";
import Dashboard from "@/pages/dashboard";
import Suggestions from "@/pages/suggestions";
import NewSuggestion from "@/pages/new-suggestion";
import SuggestionDetails from "@/pages/suggestion-details";
import ReviewSuggestions from "@/pages/admin/review";
import RewardManagement from "@/pages/admin/rewards";
import Reports from "@/pages/admin/reports";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/suggestions" component={Suggestions} />
      <Route path="/suggestions/new" component={NewSuggestion} />
      <Route path="/suggestions/:id" component={SuggestionDetails} />
      <Route path="/admin/review" component={ReviewSuggestions} />
      <Route path="/admin/rewards" component={RewardManagement} />
      <Route path="/admin/reports" component={Reports} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppShell>
        <Router />
      </AppShell>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
