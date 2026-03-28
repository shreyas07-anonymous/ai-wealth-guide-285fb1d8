import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { UserProfileProvider } from "@/contexts/UserProfileContext";
import { AppLayout } from "@/components/AppLayout";
import Landing from "./pages/Landing";
import Privacy from "./pages/Privacy";
import QuickScore from "./pages/QuickScore";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import HealthScore from "./pages/HealthScore";
import TaxOptimizer from "./pages/TaxOptimizer";
import FirePlanner from "./pages/FirePlanner";
import LifeEventAdvisor from "./pages/LifeEventAdvisor";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <UserProfileProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppLayout>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/quick-score" element={<QuickScore />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/score" element={<HealthScore />} />
              <Route path="/tax" element={<TaxOptimizer />} />
              <Route path="/fire" element={<FirePlanner />} />
              <Route path="/life-event" element={<LifeEventAdvisor />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
        </BrowserRouter>
      </UserProfileProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
