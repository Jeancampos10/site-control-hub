import { ReactNode, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface AppLayoutProps {
  children: ReactNode;
}

const searchItems = [
  // Páginas
  { label: "Dashboard", href: "/", category: "Páginas" },
  { label: "Carga", href: "/carga", category: "Páginas" },
  { label: "Descarga", href: "/descarga", category: "Páginas" },
  { label: "Equipamentos", href: "/frota/equipamentos", category: "Páginas" },
  { label: "Caminhões", href: "/frota/caminhoes", category: "Páginas" },
  { label: "Caminhão Reboque", href: "/frota/reboque", category: "Páginas" },
  { label: "Caminhão Pipa", href: "/frota/pipa", category: "Páginas" },
  { label: "Apontamento Pedreira", href: "/pedreira", category: "Páginas" },
  { label: "Apontamento Pipas", href: "/pipas", category: "Páginas" },
  { label: "Apontadores", href: "/apontadores", category: "Páginas" },
  { label: "Colaboradores", href: "/colaboradores", category: "Páginas" },
  { label: "Relatórios", href: "/relatorios", category: "Páginas" },
  { label: "Alertas", href: "/alertas", category: "Páginas" },
  // Ações
  { label: "Novo Relatório", href: "/relatorios", category: "Ações" },
  { label: "Ver Alertas Pendentes", href: "/alertas", category: "Ações" },
  { label: "Gerenciar Colaboradores", href: "/colaboradores", category: "Ações" },
];

export function AppLayout({ children }: AppLayoutProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const filteredItems = useMemo(() => {
    if (!searchValue) return searchItems;
    const lower = searchValue.toLowerCase();
    return searchItems.filter(item => 
      item.label.toLowerCase().includes(lower) ||
      item.category.toLowerCase().includes(lower)
    );
  }, [searchValue]);

  const groupedItems = useMemo(() => {
    const groups: Record<string, typeof searchItems> = {};
    filteredItems.forEach(item => {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    });
    return groups;
  }, [filteredItems]);

  const handleSelect = (href: string) => {
    setOpen(false);
    setSearchValue("");
    navigate(href);
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:px-6">
          <div className="flex flex-1 items-center gap-4 pl-12 lg:pl-0">
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <div className="relative w-full max-w-md cursor-pointer">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Buscar equipamentos, locais, materiais..."
                    className="h-9 pl-9 pr-9 bg-muted/50 border-transparent focus:border-border focus:bg-background cursor-pointer"
                    value={searchValue}
                    onChange={(e) => {
                      setSearchValue(e.target.value);
                      if (!open) setOpen(true);
                    }}
                    onClick={() => setOpen(true)}
                  />
                  {searchValue && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSearchValue("");
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0" align="start">
                <Command>
                  <CommandList>
                    <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
                    {Object.entries(groupedItems).map(([category, items]) => (
                      <CommandGroup key={category} heading={category}>
                        {items.map((item) => (
                          <CommandItem
                            key={item.label + item.href}
                            value={item.label}
                            onSelect={() => handleSelect(item.href)}
                            className="cursor-pointer"
                          >
                            {item.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    ))}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="flex items-center gap-2">
            <NotificationDropdown />
          </div>
        </header>

        {/* Page Content */}
        <main className="min-h-[calc(100vh-4rem)] p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}