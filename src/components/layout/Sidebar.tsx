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
  ChevronDown,
  ChevronRight,
  ClipboardList,
  MapPin,
  Package,
  Building2,
  Shovel,
  Settings,
  UserCog,
  Smartphone,
} from "lucide-react";
import logoApropriapp from "@/assets/logo-apropriapp.png";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface NavItem {
  label: string;
  icon: React.ElementType;
  href?: string;
  children?: NavItem[];
}

// Menu estruturado do Painel do Apontador
const painelApontadorMenu: NavItem = {
  label: "Painel do Apontador",
  icon: ClipboardList,
  children: [
    {
      label: "Apropriação",
      icon: Upload,
      children: [
        { label: "Carga", icon: Upload, href: "/apontador/carga" },
        { label: "Lançamento", icon: Download, href: "/apontador/lancamento" },
        { label: "Relatórios", icon: FileText, href: "/apontador/apropriacao/relatorios" },
      ],
    },
    {
      label: "Pedreira",
      icon: Mountain,
      children: [
        { label: "Apontar Carregamento", icon: Truck, href: "/apontador/pedreira" },
        { label: "Relatório", icon: FileText, href: "/apontador/pedreira/relatorio" },
      ],
    },
    {
      label: "Pipas",
      icon: Droplets,
      children: [
        { label: "Apontar Viagens", icon: Droplets, href: "/apontador/pipas" },
        { label: "Relatório", icon: FileText, href: "/apontador/pipas/relatorio" },
      ],
    },
    {
      label: "Cal",
      icon: FlaskConical,
      children: [
        { label: "Registrar Movimento", icon: FlaskConical, href: "/apontador/cal" },
        { label: "Relatório", icon: FileText, href: "/apontador/cal/relatorio" },
      ],
    },
  ],
};

// Menu de Cadastros (Dados Mestres)
const cadastrosMenu: NavItem = {
  label: "Cadastros",
  icon: Settings,
  children: [
    { label: "Apontadores", icon: UserCog, href: "/cadastros/apontadores" },
    { label: "Locais", icon: MapPin, href: "/cadastros/locais" },
    { label: "Materiais", icon: Package, href: "/cadastros/materiais" },
    { label: "Fornecedores CAL", icon: Building2, href: "/cadastros/fornecedores" },
    {
      label: "Equipamentos",
      icon: Shovel,
      children: [
        { label: "Escavadeiras", icon: Shovel, href: "/cadastros/escavadeiras" },
        { label: "Caminhão Basculante", icon: Truck, href: "/cadastros/basculantes" },
        { label: "Caminhão Reboque", icon: Truck, href: "/cadastros/reboques" },
        { label: "Equipamentos Gerais", icon: Settings, href: "/cadastros/equipamentos-gerais" },
      ],
    },
  ],
};

// Itens de navegação principais (mantendo os existentes)
const mainNavigationItems: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/" },
  painelApontadorMenu,
  cadastrosMenu,
  { label: "Frota Geral", icon: Truck, href: "/frota" },
  { label: "Relatórios", icon: FileText, href: "/relatorios" },
  { label: "Alertas", icon: Bell, href: "/alertas" },
];

const roleLabels: Record<string, string> = {
  admin_principal: "Administrador Principal",
  admin: "Sala Técnica",
  colaborador: "Apontador",
  visualizacao: "Visualização",
};

// Componente para item de menu com subitens
function NavMenuItem({ 
  item, 
  level = 0, 
  isActive, 
  expandedItems,
  toggleExpand,
  setMobileOpen 
}: { 
  item: NavItem; 
  level?: number;
  isActive: (href: string) => boolean;
  expandedItems: Set<string>;
  toggleExpand: (label: string) => void;
  setMobileOpen: (open: boolean) => void;
}) {
  const hasChildren = item.children && item.children.length > 0;
  const isExpanded = expandedItems.has(item.label);
  const isCurrentActive = item.href ? isActive(item.href) : false;
  
  // Verifica se algum filho está ativo
  const hasActiveChild = (navItem: NavItem): boolean => {
    if (navItem.href && isActive(navItem.href)) return true;
    if (navItem.children) {
      return navItem.children.some(child => hasActiveChild(child));
    }
    return false;
  };
  
  const isChildActive = hasChildren && hasActiveChild(item);
  
  // Estilo especial para o Painel do Apontador
  const isPainelApontador = item.label === "Painel do Apontador";

  if (hasChildren) {
    return (
      <li>
        <button
          onClick={() => toggleExpand(item.label)}
          className={cn(
            "w-full flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
            "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground",
            isChildActive && "text-sidebar-foreground",
            isPainelApontador && "bg-gradient-to-r from-sidebar-primary/20 to-transparent border-l-2 border-sidebar-primary text-sidebar-foreground font-semibold",
            level > 0 && "py-2 text-xs"
          )}
          style={{ paddingLeft: `${12 + level * 12}px` }}
        >
          <span className="flex items-center gap-3">
            <item.icon className={cn("h-4 w-4", isPainelApontador && "text-sidebar-primary")} />
            {item.label}
          </span>
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
        
        {isExpanded && (
          <ul className="mt-1 space-y-0.5">
            {item.children.map((child) => (
              <NavMenuItem
                key={child.label}
                item={child}
                level={level + 1}
                isActive={isActive}
                expandedItems={expandedItems}
                toggleExpand={toggleExpand}
                setMobileOpen={setMobileOpen}
              />
            ))}
          </ul>
        )}
      </li>
    );
  }

  return (
    <li>
      <Link
        to={item.href || "#"}
        onClick={() => setMobileOpen(false)}
        className={cn(
          "nav-item",
          isCurrentActive && "nav-item-active",
          level > 0 && "py-2 text-xs"
        )}
        style={{ paddingLeft: `${12 + level * 12}px` }}
      >
        <item.icon className="h-4 w-4" />
        {item.label}
      </Link>
    </li>
  );
}

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, role, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set(["Painel do Apontador"]));

  const handleSignOut = async () => {
    await signOut();
    toast.success("Logout realizado com sucesso!");
    navigate("/auth");
  };

  const isActive = (href: string) => location.pathname === href;

  const toggleExpand = (label: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  };

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

      {/* App Mobile Destacado */}
      <div className="px-3 pt-4 pb-2">
        <Link
          to="/m"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-primary to-primary/80 px-4 py-3 text-primary-foreground shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-[1.02]"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
            <Smartphone className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold">App Mobile</p>
            <p className="text-xs text-primary-foreground/80">Apontar em campo</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="custom-scrollbar flex-1 overflow-y-auto px-3 py-2">
        <ul className="space-y-1">
          {mainNavigationItems.map((item) => (
            <NavMenuItem
              key={item.label}
              item={item}
              isActive={isActive}
              expandedItems={expandedItems}
              toggleExpand={toggleExpand}
              setMobileOpen={setMobileOpen}
            />
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
