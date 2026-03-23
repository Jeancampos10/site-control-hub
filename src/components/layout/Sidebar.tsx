import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Truck,
  Users,
  FileText,
  Bell,
  LogOut,
  Menu,
  Wrench,
  Fuel,
  CalendarClock,
  Gauge,
  Clock,
  X,
  ChevronDown,
  ChevronRight,
  MapPin,
  Package,
  Building2,
  Shovel,
  Settings,
  UserCog,
  ClipboardCheck,
  Server,
} from "lucide-react";
import logoAbastech from "@/assets/logo-abastech.png";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface NavItem {
  label: string;
  icon: React.ElementType;
  href?: string;
  children?: NavItem[];
}

// Menu de Cadastros (Dados Mestres)
const cadastrosMenu: NavItem = {
  label: "Cadastros",
  icon: Settings,
  children: [
    { label: "Fornecedores", icon: Building2, href: "/cadastros/fornecedores-geral" },
    { label: "Tanques / Locais", icon: Fuel, href: "/cadastros/tanques" },
    { label: "Obras", icon: Building2, href: "/cadastros/obras" },
    { label: "Tipos de Óleo", icon: Fuel, href: "/cadastros/tipos-oleo" },
    { label: "Mecânicos", icon: Wrench, href: "/cadastros/mecanicos" },
    { label: "Peças", icon: Package, href: "/cadastros/pecas" },
    { label: "Gestão de Usuários", icon: Users, href: "/gestao-usuarios" },
  ],
};

// Menu de Controle
const controleMenu: NavItem = {
  label: "Controle",
  icon: Gauge,
  children: [
    { label: "Visão Geral", icon: Gauge, href: "/controle" },
    { label: "Manutenção", icon: Wrench, href: "/controle/manutencao" },
    { label: "Horímetros", icon: Clock, href: "/controle/horimetros" },
    { label: "Abastecimentos", icon: Fuel, href: "/controle/abastecimentos" },
    { label: "Checklist", icon: ClipboardCheck, href: "/controle/checklist" },
  ],
};

// Itens de navegação principais
const mainNavigationItems: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/" },
  controleMenu,
  { label: "Frota Geral", icon: Truck, href: "/frota" },
  cadastrosMenu,
  { label: "Relatórios", icon: FileText, href: "/relatorios" },
  { label: "Alertas", icon: Bell, href: "/alertas" },
  { label: "Painel Servidor", icon: Server, href: "/servidor" },
];

const roleLabels: Record<string, string> = {
  admin_principal: "Administrador Principal",
  admin: "Gestor / Sala Técnica",
  colaborador: "Operador de Campo",
  visualizacao: "Somente Visualização",
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
  
  // Estilo especial para menu de Operação
  const isOperacaoMenu = item.label === "Operação";

  if (hasChildren) {
    return (
      <li>
        <button
          onClick={() => toggleExpand(item.label)}
          className={cn(
            "w-full flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
            "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground",
            isChildActive && "text-sidebar-foreground",
            level > 0 && "py-2 text-xs"
          )}
          style={{ paddingLeft: `${12 + level * 12}px` }}
        >
          <span className="flex items-center gap-3">
            <item.icon className="h-4 w-4" />
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
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set(["Operação"]));

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
          src={logoAbastech} 
          alt="Abastech Logo" 
          className="h-10 object-contain"
        />
        <div>
          <h1 className="text-base font-bold text-sidebar-foreground">Abastech</h1>
          <p className="text-[10px] text-sidebar-foreground/60">Gestão de Equipamentos</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="custom-scrollbar flex-1 overflow-y-auto px-3 py-2">
        <ul className="space-y-1">
          {mainNavigationItems
            .filter(item => item.label !== "Painel Servidor" || role === "admin_principal")
            .map((item) => (
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
