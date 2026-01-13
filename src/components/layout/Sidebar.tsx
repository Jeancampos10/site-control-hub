import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Truck,
  Download,
  Upload,
  Users,
  FileText,
  Bell,
  HardHat,
  Droplets,
  Mountain,
  LogOut,
  Menu,
  X,
  FlaskConical,
} from "lucide-react";
import logoApropriapp from "@/assets/logo-apropriapp.png";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface NavItem {
  label: string;
  icon: React.ElementType;
  href: string;
}

const navigationItems: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/" },
  { label: "Carga", icon: Upload, href: "/carga" },
  { label: "Descarga", icon: Download, href: "/descarga" },
  { label: "Frota Geral", icon: Truck, href: "/frota" },
  { label: "Controle de CAL", icon: FlaskConical, href: "/cal" },
  { label: "Apontamento Pedreira", icon: Mountain, href: "/pedreira" },
  { label: "Apontamento Pipas", icon: Droplets, href: "/pipas" },
  { label: "Apontadores", icon: HardHat, href: "/apontadores" },
  { label: "Colaboradores", icon: Users, href: "/colaboradores" },
  { label: "Relatórios", icon: FileText, href: "/relatorios" },
  { label: "Alertas", icon: Bell, href: "/alertas" },
];

const roleLabels: Record<string, string> = {
  admin_principal: "Administrador Principal",
  admin: "Administrador",
  colaborador: "Colaborador",
  visualizacao: "Visualização",
};

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, role, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    toast.success("Logout realizado com sucesso!");
    navigate("/auth");
  };

  const isActive = (href: string) => location.pathname === href;

  const initials = profile 
    ? `${profile.nome?.[0] || ''}${profile.sobrenome?.[0] || ''}`.toUpperCase()
    : 'US';

  const displayName = profile 
    ? `${profile.nome} ${profile.sobrenome}`.trim() || 'Usuário'
    : 'Usuário';

  const roleLabel = role ? roleLabels[role] || role : 'Carregando...';

  const NavContent = () => (
    <>
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4">
        <img 
          src={logoApropriapp} 
          alt="ApropriAPP Logo" 
          className="h-10 object-contain"
        />
        <div>
          <h1 className="text-base font-bold text-sidebar-foreground">ApropriAPP</h1>
          <p className="text-[10px] text-sidebar-foreground/60">Gestão Inteligente</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="custom-scrollbar flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {navigationItems.map((item) => (
            <li key={item.href}>
              <Link
                to={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "nav-item",
                  isActive(item.href) && "nav-item-active"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent/50 px-3 py-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-primary text-sm font-semibold text-sidebar-primary-foreground">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-sidebar-foreground">{displayName}</p>
            <p className="truncate text-xs text-sidebar-foreground/60">{roleLabel}</p>
          </div>
          <button 
            onClick={handleSignOut}
            className="rounded-md p-1.5 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            title="Sair"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg lg:hidden"
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 flex h-screen w-64 flex-col bg-sidebar transition-transform duration-300 lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <NavContent />
      </aside>
    </>
  );
}
