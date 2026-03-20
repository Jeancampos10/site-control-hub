import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { HardHat, ArrowRight, LayoutDashboard, Wrench, FileText, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import Dashboard from "./Dashboard";

const roleLabels: Record<string, string> = {
  admin_principal: "Administrador Principal",
  admin: "Administrador",
  colaborador: "Colaborador",
  visualizacao: "Visualização",
};

function WelcomeScreen({ onContinue }: { onContinue: () => void }) {
  const { profile, role } = useAuth();
  const navigate = useNavigate();

  const quickLinks = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/" },
    { label: "Controle", icon: Wrench, href: "/controle" },
    { label: "Frota Geral", icon: Truck, href: "/frota" },
    { label: "Relatórios", icon: FileText, href: "/relatorios" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/10 p-4">
      <div className="w-full max-w-lg text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Logo */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-accent mb-6 shadow-lg">
          <HardHat className="h-10 w-10 text-accent-foreground" />
        </div>

        {/* Welcome Message */}
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Bem-vindo, {profile?.nome || 'Usuário'}!
        </h1>
        <p className="text-muted-foreground mb-2">
          Você está logado como <span className="font-semibold text-primary">{roleLabels[role || 'colaborador']}</span>
        </p>
        <p className="text-sm text-muted-foreground mb-8">
          {profile?.email}
        </p>

        {/* Quick Links Card */}
        <div className="bg-card rounded-2xl shadow-card p-6 border border-border mb-6">
          <h2 className="text-sm font-semibold text-muted-foreground mb-4">ACESSO RÁPIDO</h2>
          <div className="grid grid-cols-2 gap-3">
            {quickLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => {
                  onContinue();
                  if (link.href !== '/') {
                    navigate(link.href);
                  }
                }}
                className="flex items-center gap-3 rounded-xl bg-muted/50 p-4 text-left transition-all hover:bg-primary/10 hover:shadow-md"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <link.icon className="h-5 w-5 text-primary" />
                </div>
                <span className="font-medium text-foreground">{link.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Continue Button */}
        <Button
          onClick={onContinue}
          size="lg"
          className="w-full gap-2 bg-gradient-accent text-accent-foreground hover:opacity-90"
        >
          Ir para o Dashboard
          <ArrowRight className="h-5 w-5" />
        </Button>

        {/* Time */}
        <p className="text-xs text-muted-foreground mt-6">
          {new Date().toLocaleDateString('pt-BR', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
      </div>
    </div>
  );
}

const Index = () => {
  const [showWelcome, setShowWelcome] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    // Check if user just logged in (session storage flag)
    const justLoggedIn = sessionStorage.getItem('justLoggedIn');
    if (justLoggedIn === 'true' && user) {
      setShowWelcome(true);
      sessionStorage.removeItem('justLoggedIn');
    }
  }, [user]);

  const handleContinue = () => {
    setShowWelcome(false);
  };

  return (
    <>
      {showWelcome && <WelcomeScreen onContinue={handleContinue} />}
      <Dashboard />
    </>
  );
};

export default Index;
