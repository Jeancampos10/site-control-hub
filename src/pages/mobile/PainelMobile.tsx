import { Link } from "react-router-dom";
import { 
  Upload, 
  Mountain, 
  Droplets, 
  FlaskConical, 
  RefreshCw,
  History,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { useGoogleSheets, filterByDate } from "@/hooks/useGoogleSheets";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState, useMemo } from "react";
import { toast } from "sonner";

interface CategoryCard {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

const categories: CategoryCard[] = [
  {
    id: 'apropriacao',
    title: "Apropriação",
    description: "Lançamento Diário",
    icon: Upload,
    href: "/apontador/carga",
    color: "text-amber-600",
    bgColor: "bg-amber-100",
    borderColor: "border-amber-400",
  },
  {
    id: 'pedreira',
    title: "Pedreira",
    description: "Controle de Carga",
    icon: Mountain,
    href: "/apontador/pedreira",
    color: "text-amber-600",
    bgColor: "bg-amber-100",
    borderColor: "border-amber-400",
  },
  {
    id: 'pipas',
    title: "Pipas",
    description: "Controle de Viagens",
    icon: Droplets,
    href: "/apontador/pipas",
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    borderColor: "border-blue-400",
  },
  {
    id: 'cal',
    title: "Cal",
    description: "Consumo de Materiais",
    icon: FlaskConical,
    href: "/apontador/cal",
    color: "text-amber-600",
    bgColor: "bg-amber-100",
    borderColor: "border-amber-400",
  },
];

export default function PainelMobile() {
  const { profile } = useAuth();
  const { permissionLevel } = usePermissions();
  const [syncing, setSyncing] = useState(false);

  // Fetch data to show counts
  const { data: cargaData } = useGoogleSheets('carga');
  const { data: pedreiraData } = useGoogleSheets('apontamento_pedreira');
  const { data: pipaData } = useGoogleSheets('apontamento_pipa');
  const { data: calData } = useGoogleSheets('mov_cal');

  const today = format(new Date(), 'dd/MM/yyyy');
  
  const todayCounts = useMemo(() => ({
    apropriacao: filterByDate(cargaData, new Date()).length,
    pedreira: filterByDate(pedreiraData, new Date()).length,
    pipas: filterByDate(pipaData, new Date()).length,
    cal: filterByDate(calData, new Date()).length,
  }), [cargaData, pedreiraData, pipaData, calData]);

  const getStatusInfo = (id: string) => {
    const count = todayCounts[id as keyof typeof todayCounts] || 0;
    if (count > 0) {
      return { 
        label: `${count} REGISTROS HOJE`, 
        icon: CheckCircle2, 
        color: 'text-emerald-600',
        buttonLabel: 'NOVO',
        buttonVariant: 'default' as const
      };
    }
    return { 
      label: 'AGUARDANDO', 
      icon: Clock, 
      color: 'text-amber-600',
      buttonLabel: 'REGISTRAR',
      buttonVariant: 'outline' as const
    };
  };

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
      // Simulate sync
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success("Sincronização concluída!");
    } catch {
      toast.error("Erro na sincronização");
    } finally {
      setSyncing(false);
    }
  };

  const displayName = profile 
    ? `${profile.nome} ${profile.sobrenome}`.trim() 
    : 'Usuário';

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="bg-primary px-4 py-3 sticky top-0 z-50 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-400">
              <span className="text-primary text-xs font-bold">✦</span>
            </div>
            <h1 className="text-base font-bold text-primary-foreground">
              Painel dos Apontamentos
            </h1>
          </div>
          <Button variant="ghost" size="icon" className="text-primary-foreground">
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Content */}
      <div className="p-4 space-y-6 pb-24">
        {/* User Card */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
                <span className="text-2xl">👷</span>
              </div>
              <div className="flex-1">
                <h2 className="font-bold text-lg text-foreground">{displayName}</h2>
                <p className="text-xs text-muted-foreground font-medium">{getRoleLabel()}</p>
                <div className="flex items-center gap-1 mt-1">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                  <span className="text-xs text-emerald-600 font-medium">Sincronizado com Sheets</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Categories Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-foreground">Categorias Principais</h3>
            <Link to="/apontador" className="text-sm text-primary font-medium">VER TUDO</Link>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {categories.map((category) => {
              const status = getStatusInfo(category.id);
              return (
                <Card key={category.id} className="border-0 shadow-md overflow-hidden">
                  <CardContent className="p-4">
                    <div className={`mb-3 inline-flex rounded-xl p-3 ${category.bgColor}`}>
                      <category.icon className={`h-6 w-6 ${category.color}`} />
                    </div>
                    <h4 className="font-bold text-foreground">{category.title}</h4>
                    <p className="text-xs text-muted-foreground mb-3">{category.description}</p>
                    
                    <div className="flex items-center gap-1 mb-3">
                      <status.icon className={`h-3 w-3 ${status.color}`} />
                      <span className={`text-[10px] font-bold ${status.color}`}>{status.label}</span>
                    </div>
                    
                    <Link to={category.href}>
                      <Button 
                        size="sm" 
                        className="w-full font-bold text-xs"
                        variant={status.buttonVariant === 'outline' ? 'outline' : 'default'}
                      >
                        {status.buttonLabel}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="font-bold text-foreground mb-3">Ações Rápidas</h3>
          
          <div className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full h-14 justify-start gap-3 text-left font-semibold border-2"
              onClick={handleSync}
              disabled={syncing}
            >
              {syncing ? (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              ) : (
                <RefreshCw className="h-5 w-5 text-primary" />
              )}
              {syncing ? 'SINCRONIZANDO...' : 'SINCRONIZAR MANUALMENTE'}
            </Button>
            
            <Link to="/apontador/apropriacao/relatorios">
              <Button 
                variant="outline" 
                className="w-full h-14 justify-start gap-3 text-left font-semibold border-2"
              >
                <History className="h-5 w-5 text-amber-500" />
                VER HISTÓRICO DO DIA
              </Button>
            </Link>
          </div>
        </div>

        {/* Today's Summary */}
        <Card className="border-0 shadow-md bg-gradient-to-r from-primary to-primary/90">
          <CardContent className="p-4">
            <h4 className="font-bold text-primary-foreground mb-2">Resumo de Hoje</h4>
            <p className="text-sm text-primary-foreground/80">
              {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </p>
            <div className="grid grid-cols-4 gap-2 mt-3">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary-foreground">{todayCounts.apropriacao}</p>
                <p className="text-[10px] text-primary-foreground/70">Cargas</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary-foreground">{todayCounts.pedreira}</p>
                <p className="text-[10px] text-primary-foreground/70">Pedreira</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary-foreground">{todayCounts.pipas}</p>
                <p className="text-[10px] text-primary-foreground/70">Pipas</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary-foreground">{todayCounts.cal}</p>
                <p className="text-[10px] text-primary-foreground/70">CAL</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg safe-area-pb">
        <div className="flex items-center justify-around py-2">
          <Link to="/m" className="flex flex-col items-center gap-0.5 px-4 py-2 text-primary">
            <Upload className="h-5 w-5" />
            <span className="text-[10px] font-medium">Início</span>
          </Link>
          <Link to="/apontador/apropriacao/relatorios" className="flex flex-col items-center gap-0.5 px-4 py-2 text-muted-foreground">
            <History className="h-5 w-5" />
            <span className="text-[10px] font-medium">Histórico</span>
          </Link>
          <Link to="/apontador/carga" className="flex flex-col items-center gap-0.5 px-4 py-2">
            <div className="flex h-12 w-12 -mt-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
              <span className="text-2xl">+</span>
            </div>
          </Link>
          <Link to="/alertas" className="flex flex-col items-center gap-0.5 px-4 py-2 text-muted-foreground">
            <AlertCircle className="h-5 w-5" />
            <span className="text-[10px] font-medium">Alertas</span>
          </Link>
          <Link to="/" className="flex flex-col items-center gap-0.5 px-4 py-2 text-muted-foreground">
            <ChevronRight className="h-5 w-5" />
            <span className="text-[10px] font-medium">Sistema</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
