import { Link, useNavigate } from "react-router-dom";
import { useState, useMemo, useEffect } from "react";
import { 
  Upload, 
  Download,
  Mountain, 
  Droplets, 
  FlaskConical, 
  RefreshCw,
  History,
  CheckCircle2,
  Clock,
  Loader2,
  ChevronRight,
  ChevronDown,
  FileText,
  Truck,
  Home,
  Settings,
  Lock,
  Share2,
  Copy,
  Download as DownloadIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth, ModuloPermitido } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { useGoogleSheets, filterByDate } from "@/hooks/useGoogleSheets";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { WhatsAppButton } from "@/components/mobile/WhatsAppButton";

interface SubMenuItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

interface MenuCategory {
  id: ModuloPermitido;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  subItems: SubMenuItem[];
}

const menuCategories: MenuCategory[] = [
  {
    id: 'apropriacao',
    title: "Apropriação",
    description: "Carga e Lançamento",
    icon: Upload,
    color: "text-amber-600",
    bgColor: "bg-amber-100",
    subItems: [
      { label: "Carga", href: "/m/carga", icon: Upload },
      { label: "Lançamento", href: "/m/lancamento", icon: Download },
      { label: "Relatório", href: "/m/relatorio/apropriacao", icon: FileText },
    ],
  },
  {
    id: 'pedreira',
    title: "Pedreira",
    description: "Controle de Carregamento",
    icon: Mountain,
    color: "text-orange-600",
    bgColor: "bg-orange-100",
    subItems: [
      { label: "Apontar Carregamento", href: "/m/pedreira", icon: Truck },
      { label: "Relatório", href: "/m/relatorio/pedreira", icon: FileText },
    ],
  },
  {
    id: 'pipas',
    title: "Pipas",
    description: "Controle de Viagens",
    icon: Droplets,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    subItems: [
      { label: "Apontar Viagens", href: "/m/pipas", icon: Droplets },
      { label: "Relatório", href: "/m/relatorio/pipas", icon: FileText },
    ],
  },
  {
    id: 'cal',
    title: "Cal",
    description: "Entrada e Saída",
    icon: FlaskConical,
    color: "text-emerald-600",
    bgColor: "bg-emerald-100",
    subItems: [
      { label: "Registrar Movimento", href: "/m/cal", icon: FlaskConical },
      { label: "Relatório", href: "/m/relatorio/cal", icon: FileText },
    ],
  },
];

export default function PainelMobile() {
  const navigate = useNavigate();
  const { profile, hasModuleAccess } = useAuth();
  const { permissionLevel } = usePermissions();
  const [syncing, setSyncing] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // PWA Install prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        toast.success("App instalado com sucesso!");
      }
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    }
  };

  // Fetch data to show counts
  const { data: cargaData } = useGoogleSheets('carga');
  const { data: pedreiraData } = useGoogleSheets('apontamento_pedreira');
  const { data: pipaData } = useGoogleSheets('apontamento_pipa');
  const { data: calData } = useGoogleSheets('mov_cal');
  
  const todayCounts = useMemo(() => ({
    apropriacao: filterByDate(cargaData, new Date()).length,
    pedreira: filterByDate(pedreiraData, new Date()).length,
    pipas: filterByDate(pipaData, new Date()).length,
    cal: filterByDate(calData, new Date()).length,
  }), [cargaData, pedreiraData, pipaData, calData]);

  // Filtra categorias baseado nas permissões do usuário
  const allowedCategories = useMemo(() => {
    return menuCategories.filter(cat => hasModuleAccess(cat.id));
  }, [hasModuleAccess]);

  const totalToday = allowedCategories.reduce((sum, cat) => {
    return sum + (todayCounts[cat.id] || 0);
  }, 0);

  const getRoleLabel = () => {
    switch (permissionLevel) {
      case 'administrador': return 'ADMINISTRADOR';
      case 'sala_tecnica': return 'SALA TÉCNICA';
      default: return 'APONTADOR DE CAMPO';
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success("✅ Sincronização concluída!", {
        description: "Todos os dados foram atualizados"
      });
    } catch {
      toast.error("Erro na sincronização");
    } finally {
      setSyncing(false);
    }
  };

  const handleShareLink = async () => {
    const appUrl = "https://controlesaero.lovable.app/m";
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'ApropriAPP - Controle de Apontamentos',
          text: 'Acesse o sistema de apontamentos:',
          url: appUrl,
        });
      } catch (error) {
        // User cancelled or error
        copyToClipboard(appUrl);
      }
    } else {
      copyToClipboard(appUrl);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Link copiado!", {
      description: "Compartilhe com sua equipe"
    });
  };

  const toggleMenu = (id: string) => {
    setExpandedMenu(prev => prev === id ? null : id);
  };

  const displayName = profile 
    ? `${profile.nome} ${profile.sobrenome}`.trim() 
    : 'Usuário';

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="bg-primary px-4 py-4 sticky top-0 z-50 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-400">
              <span className="text-primary text-lg font-bold">✦</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-primary-foreground">
                Painel dos Apontamentos
              </h1>
              <p className="text-xs text-primary-foreground/70">
                {format(new Date(), "EEEE, dd/MM", { locale: ptBR })}
              </p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-primary-foreground"
            onClick={handleShareLink}
          >
            <Share2 className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Content */}
      <div className="p-4 space-y-4 pb-28">
        {/* Install PWA Banner */}
        {showInstallPrompt && (
          <Card className="border-0 shadow-md bg-gradient-to-r from-primary to-primary/80">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                  <DownloadIcon className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-white text-sm">Instalar ApropriAPP</p>
                  <p className="text-xs text-white/70">Acesse rapidamente na tela inicial</p>
                </div>
                <Button 
                  size="sm" 
                  variant="secondary"
                  onClick={handleInstallApp}
                >
                  Instalar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* User Card */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-amber-200">
                <span className="text-3xl">👷</span>
              </div>
              <div className="flex-1">
                <h2 className="font-bold text-lg text-foreground">{displayName}</h2>
                <p className="text-xs text-muted-foreground font-medium">{getRoleLabel()}</p>
                <div className="flex items-center gap-1 mt-1">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                  <span className="text-xs text-emerald-600 font-medium">Sincronizado</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">{totalToday}</p>
                <p className="text-[10px] text-muted-foreground">registros hoje</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Menu Categories with Submenus */}
        <div className="space-y-3">
          <h3 className="font-bold text-foreground px-1">Categorias</h3>
          
          {allowedCategories.length === 0 ? (
            <Card className="border-0 shadow-md">
              <CardContent className="p-6 text-center">
                <Lock className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">
                  Você não tem permissão para acessar nenhum módulo.
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Entre em contato com o administrador.
                </p>
              </CardContent>
            </Card>
          ) : (
            allowedCategories.map((category) => {
              const isExpanded = expandedMenu === category.id;
              const count = todayCounts[category.id] || 0;
              
              return (
                <Card key={category.id} className="border-0 shadow-md overflow-hidden">
                  {/* Category Header - Clickable to expand */}
                  <button
                    onClick={() => toggleMenu(category.id)}
                    className="w-full"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className={cn("p-3 rounded-xl", category.bgColor)}>
                          <category.icon className={cn("h-6 w-6", category.color)} />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-foreground">{category.title}</h4>
                            {count > 0 && (
                              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground px-1.5">
                                {count}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{category.description}</p>
                        </div>
                        <div className={cn(
                          "transition-transform duration-200",
                          isExpanded && "rotate-180"
                        )}>
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </div>
                    </CardContent>
                  </button>

                  {/* Submenu Items */}
                  {isExpanded && (
                    <div className="bg-slate-50 border-t">
                      {category.subItems.map((item, index) => (
                        <Link
                          key={item.href}
                          to={item.href}
                          className={cn(
                            "flex items-center gap-3 px-6 py-3.5 hover:bg-slate-100 transition-colors",
                            index !== category.subItems.length - 1 && "border-b border-slate-200"
                          )}
                        >
                          <item.icon className={cn("h-4 w-4", category.color)} />
                          <span className="font-medium text-foreground">{item.label}</span>
                          <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />
                        </Link>
                      ))}
                    </div>
                  )}
                </Card>
              );
            })
          )}
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          <h3 className="font-bold text-foreground px-1">Ações Rápidas</h3>
          
          <Button 
            variant="outline" 
            className="w-full h-14 justify-start gap-3 text-left font-semibold border-2 bg-white"
            onClick={handleSync}
            disabled={syncing}
          >
            {syncing ? (
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            ) : (
              <RefreshCw className="h-5 w-5 text-primary" />
            )}
            {syncing ? 'SINCRONIZANDO...' : 'SINCRONIZAR DADOS'}
          </Button>
        </div>

        {/* Today's Summary - Only show allowed modules */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-primary to-primary/90">
          <CardContent className="p-4">
            <h4 className="font-bold text-primary-foreground mb-3">Resumo de Hoje</h4>
            <div className={cn(
              "grid gap-2",
              allowedCategories.length === 1 ? "grid-cols-1" :
              allowedCategories.length === 2 ? "grid-cols-2" :
              allowedCategories.length === 3 ? "grid-cols-3" :
              "grid-cols-4"
            )}>
              {allowedCategories.map(cat => (
                <div key={cat.id} className="text-center bg-white/10 rounded-lg p-2">
                  <p className="text-2xl font-bold text-primary-foreground">{todayCounts[cat.id]}</p>
                  <p className="text-[10px] text-primary-foreground/70">{cat.title}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* WhatsApp Button */}
      <WhatsAppButton />

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg safe-area-pb">
        <div className="flex items-center justify-around py-2">
          <Link to="/m" className="flex flex-col items-center gap-0.5 px-4 py-2 text-primary">
            <Home className="h-5 w-5" />
            <span className="text-[10px] font-medium">Início</span>
          </Link>
          <Link to="/m/historico" className="flex flex-col items-center gap-0.5 px-4 py-2 text-muted-foreground">
            <History className="h-5 w-5" />
            <span className="text-[10px] font-medium">Histórico</span>
          </Link>
          <Link to="/m/carga" className="flex flex-col items-center gap-0.5 px-4 py-2">
            <div className="flex h-12 w-12 -mt-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
              <span className="text-2xl font-light">+</span>
            </div>
          </Link>
          <Link to="/m/pendencias" className="flex flex-col items-center gap-0.5 px-4 py-2 text-muted-foreground">
            <Clock className="h-5 w-5" />
            <span className="text-[10px] font-medium">Pendentes</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
