import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ArrowRight, LayoutDashboard, Wrench, FileText, Truck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoAbastech from "@/assets/logo-abastech.png";
import Dashboard from "./Dashboard";

const roleLabels: Record<string, string> = {
  admin_principal: "Administrador Principal",
  admin: "Gestor / Sala Técnica",
  colaborador: "Operador de Campo",
  visualizacao: "Visualização",
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

function WelcomeScreen({ onContinue }: { onContinue: () => void }) {
  const { profile, role } = useAuth();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  const quickLinks = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/" },
    { label: "Controle", icon: Wrench, href: "/controle" },
    { label: "Frota", icon: Truck, href: "/frota" },
    { label: "Relatórios", icon: FileText, href: "/relatorios" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
      
      {/* Watermark */}
      <div className="absolute inset-0 pointer-events-none select-none">
        <img src={logoAbastech} alt="" className="absolute -top-10 -right-16 h-64 opacity-[0.04] rotate-12" />
        <img src={logoAbastech} alt="" className="absolute -bottom-10 -left-16 h-64 opacity-[0.04] -rotate-12" />
        <div className="absolute top-[20%] left-[8%] text-foreground/[0.03] text-6xl font-black tracking-widest rotate-[-15deg]">
          ABASTECH
        </div>
        <div className="absolute bottom-[25%] right-[8%] text-foreground/[0.03] text-5xl font-black tracking-widest rotate-[10deg]">
          GESTÃO
        </div>
      </div>

      {/* Decorative blurs */}
      <div className="absolute top-16 left-16 w-56 h-56 rounded-full bg-accent/10 blur-3xl" />
      <div className="absolute bottom-16 right-16 w-72 h-72 rounded-full bg-primary/10 blur-3xl" />

      {/* Content */}
      <div 
        className={`relative z-10 w-full max-w-lg text-center px-4 transition-all duration-700 ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        {/* Logo with glow */}
        <div className="inline-block relative mb-6">
          <div className="absolute inset-0 bg-accent/20 rounded-full blur-2xl scale-150" />
          <img src={logoAbastech} alt="Abastech" className="relative h-24 mx-auto drop-shadow-lg" />
        </div>

        {/* Greeting */}
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles className="h-5 w-5 text-accent" />
          <span className="text-sm font-medium text-accent tracking-wide uppercase">{getGreeting()}</span>
          <Sparkles className="h-5 w-5 text-accent" />
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
          Olá, {profile?.nome || 'Usuário'}!
        </h1>
        <p className="text-muted-foreground mb-1">
          Logado como <span className="font-semibold text-primary">{roleLabels[role || 'colaborador']}</span>
        </p>
        <p className="text-sm text-muted-foreground/70 mb-8">
          {profile?.email}
        </p>

        {/* Quick Links */}
        <div className="bg-card/90 backdrop-blur-sm rounded-2xl shadow-2xl p-6 border border-border/50 mb-6">
          <h2 className="text-xs font-semibold text-muted-foreground mb-4 tracking-widest uppercase">Acesso Rápido</h2>
          <div className="grid grid-cols-2 gap-3">
            {quickLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => {
                  onContinue();
                  if (link.href !== '/') navigate(link.href);
                }}
                className="flex items-center gap-3 rounded-xl bg-muted/50 p-4 text-left transition-all duration-200 hover:bg-accent/10 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                  <link.icon className="h-5 w-5 text-accent" />
                </div>
                <span className="font-medium text-foreground">{link.label}</span>
              </button>
            ))}
          </div>
        </div>

        <Button
          onClick={onContinue}
          size="lg"
          className="w-full gap-2 bg-gradient-accent text-accent-foreground hover:opacity-90 shadow-lg h-12 text-base font-semibold"
        >
          Ir para o Dashboard
          <ArrowRight className="h-5 w-5" />
        </Button>

        <p className="text-xs text-muted-foreground/60 mt-6">
          {new Date().toLocaleDateString('pt-BR', { 
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
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
    const justLoggedIn = sessionStorage.getItem('justLoggedIn');
    if (justLoggedIn === 'true' && user) {
      setShowWelcome(true);
      sessionStorage.removeItem('justLoggedIn');
    }
  }, [user]);

  return (
    <>
      {showWelcome && <WelcomeScreen onContinue={() => setShowWelcome(false)} />}
      <Dashboard />
    </>
  );
};

export default Index;
