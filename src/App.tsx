import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider } from "@/contexts/AppContext";
import { AppLayout } from "@/components/AppLayout";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// App pages
import DashboardPage from "./pages/app/DashboardPage";
import AgentChatPage from "./pages/app/AgentChatPage";
import PaymentIntentsPage from "./pages/app/PaymentIntentsPage";
import IntentDetailPage from "./pages/app/IntentDetailPage";
import WalletsPage from "./pages/app/WalletsPage";
import WalletDetailPage from "./pages/app/WalletDetailPage";
import CrossChainPage from "./pages/app/CrossChainPage";
import X402DirectoryPage from "./pages/app/X402DirectoryPage";
import TransactionsPage from "./pages/app/TransactionsPage";
import GuardStudioPage from "./pages/app/GuardStudioPage";
import DevelopersPage from "./pages/app/DevelopersPage";
import SettingsPage from "./pages/app/SettingsPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AppProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            
            {/* App routes with shared layout */}
            <Route path="/app" element={<AppLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="agent" element={<AgentChatPage />} />
              <Route path="intents" element={<PaymentIntentsPage />} />
              <Route path="intents/:id" element={<IntentDetailPage />} />
              <Route path="wallets" element={<WalletsPage />} />
              <Route path="wallets/:id" element={<WalletDetailPage />} />
              <Route path="crosschain" element={<CrossChainPage />} />
              <Route path="x402" element={<X402DirectoryPage />} />
              <Route path="transactions" element={<TransactionsPage />} />
              <Route path="guards" element={<GuardStudioPage />} />
              <Route path="developers" element={<DevelopersPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
