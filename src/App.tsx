import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthProvider, useAuth } from "@/hooks/useAuth";

// Pages
import Index from "./pages/Index";
import Carga from "./pages/Carga";
import Descarga from "./pages/Descarga";
import FrotaGeral from "./pages/frota/FrotaGeral";
import Cal from "./pages/Cal";
import Pedreira from "./pages/Pedreira";
import Pipas from "./pages/Pipas";
import Apontadores from "./pages/Apontadores";
import Colaboradores from "./pages/Colaboradores";
import Relatorios from "./pages/Relatorios";
import Alertas from "./pages/Alertas";
import Auth from "./pages/Auth";
import PendingApproval from "./pages/PendingApproval";
import NotFound from "./pages/NotFound";
import GestaoUsuarios from "./pages/GestaoUsuarios";

// Painel do Apontador (mantido para compatibilidade)
import PainelApontador from "./pages/apontador/PainelApontador";

// Mobile
import AuthMobile from "./pages/mobile/AuthMobile";
import PainelMobile from "./pages/mobile/PainelMobile";
import CargaMobile from "./pages/mobile/CargaMobile";
import LancamentoMobile from "./pages/mobile/LancamentoMobile";
import PedreiraMobile from "./pages/mobile/PedreiraMobile";
import PipasMobile from "./pages/mobile/PipasMobile";
import CalMobile from "./pages/mobile/CalMobile";
import PendenciasOffline from "./pages/mobile/PendenciasOffline";
import HistoricoMobile from "./pages/mobile/HistoricoMobile";

// Cadastros
import CadastroApontadores from "./pages/cadastros/CadastroApontadores";
import CadastroLocais from "./pages/cadastros/CadastroLocais";
import CadastroMateriais from "./pages/cadastros/CadastroMateriais";
import CadastroFornecedores from "./pages/cadastros/CadastroFornecedores";
import CadastroEscavadeiras from "./pages/cadastros/CadastroEscavadeiras";
import CadastroBasculantes from "./pages/cadastros/CadastroBasculantes";
import CadastroReboques from "./pages/cadastros/CadastroReboques";
import CadastroEquipamentosGerais from "./pages/cadastros/CadastroEquipamentosGerais";

const queryClient = new QueryClient();

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isApproved, isAdminPrincipal } = useAuth();
  
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

  // Admin principal is always approved
  // Regular users need approval
  if (!isApproved && !isAdminPrincipal) {
    return <Navigate to="/pending-approval" replace />;
  }
  
  return <AppLayout>{children}</AppLayout>;
}

// Protected route for mobile (without AppLayout)
function ProtectedMobileRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isApproved, isAdminPrincipal } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/m/login" replace />;
  }

  if (!isApproved && !isAdminPrincipal) {
    return <Navigate to="/pending-approval" replace />;
  }
  
  return <>{children}</>;
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
            <Route path="/pending-approval" element={<PendingApproval />} />
            
            {/* Mobile Login - Rota dedicada */}
            <Route path="/m/login" element={<AuthMobile />} />
            
            {/* Mobile Routes - Sem AppLayout para experiência app-like */}
            <Route path="/m" element={<ProtectedMobileRoute><PainelMobile /></ProtectedMobileRoute>} />
            <Route path="/m/carga" element={<ProtectedMobileRoute><CargaMobile /></ProtectedMobileRoute>} />
            <Route path="/m/lancamento" element={<ProtectedMobileRoute><LancamentoMobile /></ProtectedMobileRoute>} />
            <Route path="/m/pedreira" element={<ProtectedMobileRoute><PedreiraMobile /></ProtectedMobileRoute>} />
            <Route path="/m/pipas" element={<ProtectedMobileRoute><PipasMobile /></ProtectedMobileRoute>} />
            <Route path="/m/cal" element={<ProtectedMobileRoute><CalMobile /></ProtectedMobileRoute>} />
            <Route path="/m/pendencias" element={<ProtectedMobileRoute><PendenciasOffline /></ProtectedMobileRoute>} />
            <Route path="/m/historico" element={<ProtectedMobileRoute><HistoricoMobile /></ProtectedMobileRoute>} />
            
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            
            {/* Painel do Apontador - Redirecionando para mobile */}
            <Route path="/apontador" element={<ProtectedRoute><PainelApontador /></ProtectedRoute>} />
            
            {/* Cadastros */}
            <Route path="/cadastros/apontadores" element={<ProtectedRoute><CadastroApontadores /></ProtectedRoute>} />
            <Route path="/cadastros/locais" element={<ProtectedRoute><CadastroLocais /></ProtectedRoute>} />
            <Route path="/cadastros/materiais" element={<ProtectedRoute><CadastroMateriais /></ProtectedRoute>} />
            <Route path="/cadastros/fornecedores" element={<ProtectedRoute><CadastroFornecedores /></ProtectedRoute>} />
            <Route path="/cadastros/escavadeiras" element={<ProtectedRoute><CadastroEscavadeiras /></ProtectedRoute>} />
            <Route path="/cadastros/basculantes" element={<ProtectedRoute><CadastroBasculantes /></ProtectedRoute>} />
            <Route path="/cadastros/reboques" element={<ProtectedRoute><CadastroReboques /></ProtectedRoute>} />
            <Route path="/cadastros/equipamentos-gerais" element={<ProtectedRoute><CadastroEquipamentosGerais /></ProtectedRoute>} />
            
            {/* Páginas existentes */}
            <Route path="/carga" element={<ProtectedRoute><Carga /></ProtectedRoute>} />
            <Route path="/descarga" element={<ProtectedRoute><Descarga /></ProtectedRoute>} />
            <Route path="/frota" element={<ProtectedRoute><FrotaGeral /></ProtectedRoute>} />
            <Route path="/cal" element={<ProtectedRoute><Cal /></ProtectedRoute>} />
            <Route path="/pedreira" element={<ProtectedRoute><Pedreira /></ProtectedRoute>} />
            <Route path="/pipas" element={<ProtectedRoute><Pipas /></ProtectedRoute>} />
            <Route path="/apontadores" element={<ProtectedRoute><Apontadores /></ProtectedRoute>} />
            <Route path="/colaboradores" element={<ProtectedRoute><Colaboradores /></ProtectedRoute>} />
            <Route path="/gestao-usuarios" element={<ProtectedRoute><GestaoUsuarios /></ProtectedRoute>} />
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
