import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
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
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return <AppLayout>{children}</AppLayout>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/carga" element={<ProtectedRoute><Carga /></ProtectedRoute>} />
            <Route path="/descarga" element={<ProtectedRoute><Descarga /></ProtectedRoute>} />
            <Route path="/frota/equipamentos" element={<ProtectedRoute><Equipamentos /></ProtectedRoute>} />
            <Route path="/frota/caminhoes" element={<ProtectedRoute><Caminhoes /></ProtectedRoute>} />
            <Route path="/frota/reboque" element={<ProtectedRoute><Reboque /></ProtectedRoute>} />
            <Route path="/frota/pipa" element={<ProtectedRoute><FrotaPipa /></ProtectedRoute>} />
            <Route path="/pedreira" element={<ProtectedRoute><Pedreira /></ProtectedRoute>} />
            <Route path="/pipas" element={<ProtectedRoute><Pipas /></ProtectedRoute>} />
            <Route path="/apontadores" element={<ProtectedRoute><Apontadores /></ProtectedRoute>} />
            <Route path="/colaboradores" element={<ProtectedRoute><Colaboradores /></ProtectedRoute>} />
            <Route path="/relatorios" element={<ProtectedRoute><Relatorios /></ProtectedRoute>} />
            <Route path="/alertas" element={<ProtectedRoute><Alertas /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
