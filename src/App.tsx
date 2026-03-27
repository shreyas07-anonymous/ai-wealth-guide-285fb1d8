import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/AppLayout";
import Landing from "./pages/Landing";
import HealthScore from "./pages/HealthScore";
import TaxOptimizer from "./pages/TaxOptimizer";
import FirePlanner from "./pages/FirePlanner";
import LifeEventAdvisor from "./pages/LifeEventAdvisor";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/score" element={<HealthScore />} />
            <Route path="/tax" element={<TaxOptimizer />} />
            <Route path="/fire" element={<FirePlanner />} />
            <Route path="/life-event" element={<LifeEventAdvisor />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
