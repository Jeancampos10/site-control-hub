import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Truck,
  Download,
  Upload,
  Users,
  FileText,
  Bell,
  Settings,
  ChevronDown,
  ChevronRight,
  HardHat,
  Droplets,
  Mountain,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  icon: React.ElementType;
  href?: string;
  children?: { label: string; href: string }[];
}

const navigation: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/" },
  { label: "Carga", icon: Upload, href: "/carga" },
  { label: "Descarga", icon: Download, href: "/descarga" },
  {
    label: "Frota Geral",
    icon: Truck,
    children: [
      { label: "Equipamentos", href: "/frota/equipamentos" },
      { label: "Caminhões", href: "/frota/caminhoes" },
      { label: "Caminhão Reboque", href: "/frota/reboque" },
      { label: "Caminhão Pipa", href: "/frota/pipa" },
    ],
  },
  { label: "Apontamento Pedreira", icon: Mountain, href: "/pedreira" },
  { label: "Apontamento Pipas", icon: Droplets, href: "/pipas" },
  { label: "Apontadores", icon: HardHat, href: "/apontadores" },
  { label: "Colaboradores", icon: Users, href: "/colaboradores" },
  { label: "Relatórios", icon: FileText, href: "/relatorios" },
  { label: "Alertas", icon: Bell, href: "/alertas" },
];

export function Sidebar() {
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>(["Frota Geral"]);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleExpand = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label) ? prev.filter((i) => i !== label) : [...prev, label]
    );
  };

  const isActive = (href: string) => location.pathname === href;
  const isChildActive = (children?: { label: string; href: string }[]) =>
    children?.some((child) => location.pathname === child.href);

  const NavContent = () => (
    <>
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
          <Truck className="h-5 w-5 text-sidebar-primary-foreground" />
        </div>
        <div>
          <h1 className="text-base font-bold text-sidebar-foreground">APROPRIAPP</h1>
          <p className="text-[10px] text-sidebar-foreground/60">Gestão de Obras</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="custom-scrollbar flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {navigation.map((item) => (
            <li key={item.label}>
              {item.children ? (
                <div>
                  <button
                    onClick={() => toggleExpand(item.label)}
                    className={cn(
                      "nav-item w-full justify-between",
                      isChildActive(item.children) && "bg-sidebar-accent text-sidebar-foreground"
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </span>
                    {expandedItems.includes(item.label) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                  {expandedItems.includes(item.label) && (
                    <ul className="ml-4 mt-1 space-y-1 border-l border-sidebar-border pl-4">
                      {item.children.map((child) => (
                        <li key={child.href}>
                          <Link
                            to={child.href}
                            onClick={() => setMobileOpen(false)}
                            className={cn(
                              "nav-item text-sm",
                              isActive(child.href) && "nav-item-active"
                            )}
                          >
                            {child.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : (
                <Link
                  to={item.href!}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "nav-item",
                    isActive(item.href!) && "nav-item-active"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent/50 px-3 py-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-primary text-sm font-semibold text-sidebar-primary-foreground">
            JC
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-sidebar-foreground">Jean Campos</p>
            <p className="truncate text-xs text-sidebar-foreground/60">Administrador</p>
          </div>
          <button className="rounded-md p-1.5 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground">
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
