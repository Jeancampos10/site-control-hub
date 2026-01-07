import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Carga from "./pages/Carga";
import Descarga from "./pages/Descarga";
import Equipamentos from "./pages/frota/Equipamentos";
import Caminhoes from "./pages/frota/Caminhoes";
import Reboque from "./pages/frota/Reboque";
import FrotaPipa from "./pages/frota/Pipa";
import Pedreira from "./pages/Pedreira";
import Pipas from "./pages/Pipas";
import Apontadores from "./pages/Apontadores";
import Colaboradores from "./pages/Colaboradores";
import Relatorios from "./pages/Relatorios";
import Alertas from "./pages/Alertas";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const LayoutWrapper = ({ children }: { children: React.ReactNode }) => (
  <AppLayout>{children}</AppLayout>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/carga" element={<LayoutWrapper><Carga /></LayoutWrapper>} />
          <Route path="/descarga" element={<LayoutWrapper><Descarga /></LayoutWrapper>} />
          <Route path="/frota/equipamentos" element={<LayoutWrapper><Equipamentos /></LayoutWrapper>} />
          <Route path="/frota/caminhoes" element={<LayoutWrapper><Caminhoes /></LayoutWrapper>} />
          <Route path="/frota/reboque" element={<LayoutWrapper><Reboque /></LayoutWrapper>} />
          <Route path="/frota/pipa" element={<LayoutWrapper><FrotaPipa /></LayoutWrapper>} />
          <Route path="/pedreira" element={<LayoutWrapper><Pedreira /></LayoutWrapper>} />
          <Route path="/pipas" element={<LayoutWrapper><Pipas /></LayoutWrapper>} />
          <Route path="/apontadores" element={<LayoutWrapper><Apontadores /></LayoutWrapper>} />
          <Route path="/colaboradores" element={<LayoutWrapper><Colaboradores /></LayoutWrapper>} />
          <Route path="/relatorios" element={<LayoutWrapper><Relatorios /></LayoutWrapper>} />
          <Route path="/alertas" element={<LayoutWrapper><Alertas /></LayoutWrapper>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
