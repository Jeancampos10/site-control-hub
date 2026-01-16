import { Link } from "react-router-dom";
import { 
  Upload, 
  Download, 
  Mountain, 
  Droplets, 
  FlaskConical, 
  FileText,
  ClipboardList,
  ArrowRight,
  Users,
  MapPin,
  Package,
  Building2,
  Shovel,
  Truck,
  Settings,
  TrendingUp,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePermissions } from "@/hooks/usePermissions";
import { useGoogleSheets } from "@/hooks/useGoogleSheets";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface QuickActionCard {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  color: string;
  bgColor: string;
}

const apontamentoCards: QuickActionCard[] = [
  {
    title: "Carga",
    description: "Registrar cargas de material",
    icon: Upload,
    href: "/apontador/carga",
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
  {
    title: "Lançamento",
    description: "Registrar descargas",
    icon: Download,
    href: "/apontador/lancamento",
    color: "text-info",
    bgColor: "bg-info/10",
  },
  {
    title: "Pedreira",
    description: "Apontar carregamentos",
    icon: Mountain,
    href: "/apontador/pedreira",
    color: "text-warning",
    bgColor: "bg-warning/10",
  },
  {
    title: "Pipas",
    description: "Registrar viagens",
    icon: Droplets,
    href: "/apontador/pipas",
    color: "text-info",
    bgColor: "bg-info/10",
  },
  {
    title: "CAL",
    description: "Movimentação de CAL",
    icon: FlaskConical,
    href: "/apontador/cal",
    color: "text-success",
    bgColor: "bg-success/10",
  },
];

const cadastroCards: QuickActionCard[] = [
  {
    title: "Apontadores",
    description: "Gerenciar apontadores",
    icon: Users,
    href: "/cadastros/apontadores",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    title: "Locais",
    description: "Origem e destino",
    icon: MapPin,
    href: "/cadastros/locais",
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
  {
    title: "Materiais",
    description: "Tipos de materiais",
    icon: Package,
    href: "/cadastros/materiais",
    color: "text-warning",
    bgColor: "bg-warning/10",
  },
  {
    title: "Fornecedores",
    description: "Fornecedores de CAL",
    icon: Building2,
    href: "/cadastros/fornecedores",
    color: "text-info",
    bgColor: "bg-info/10",
  },
  {
    title: "Escavadeiras",
    description: "Cadastro de escavadeiras",
    icon: Shovel,
    href: "/cadastros/escavadeiras",
    color: "text-success",
    bgColor: "bg-success/10",
  },
  {
    title: "Caminhões",
    description: "Basculantes e reboques",
    icon: Truck,
    href: "/cadastros/basculantes",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
];

export default function PainelApontador() {
  const { permissionLevel, canAccessCadastros, isSalaTecnica } = usePermissions();
  const { data: cargaData } = useGoogleSheets('carga');
  const { data: descargaData } = useGoogleSheets('descarga');

  // Stats do dia
  const today = format(new Date(), 'dd/MM/yyyy');
  const cargasHoje = cargaData?.filter(c => c.Data === today).length || 0;
  const descargasHoje = descargaData?.filter(d => d.Data === today).length || 0;

  const getRoleBadge = () => {
    switch (permissionLevel) {
      case 'administrador':
        return <Badge className="bg-primary text-primary-foreground">Administrador</Badge>;
      case 'sala_tecnica':
        return <Badge className="bg-info text-info-foreground">Sala Técnica</Badge>;
      default:
        return <Badge variant="secondary">Apontador</Badge>;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="page-header">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-accent/80 text-accent-foreground shadow-lg">
              <ClipboardList className="h-6 w-6" />
            </div>
            <div>
              <h1 className="page-title">Painel do Apontador</h1>
              <p className="page-subtitle">
                {format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {getRoleBadge()}
        </div>
      </div>

      {/* Stats Rápidos */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="kpi-card-primary">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cargas Hoje</p>
                <p className="text-2xl font-bold">{cargasHoje}</p>
              </div>
              <div className="rounded-full bg-primary/10 p-2">
                <Upload className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="kpi-card-accent">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Descargas Hoje</p>
                <p className="text-2xl font-bold">{descargasHoje}</p>
              </div>
              <div className="rounded-full bg-accent/10 p-2">
                <Download className="h-5 w-5 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="kpi-card-success">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="text-lg font-semibold text-success">Online</p>
              </div>
              <div className="rounded-full bg-success/10 p-2">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Hora</p>
                <p className="text-lg font-semibold">{format(new Date(), 'HH:mm')}</p>
              </div>
              <div className="rounded-full bg-muted p-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ações Rápidas - Apontamentos */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Apontamentos</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/apontador/apropriacao/relatorios" className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              Ver Relatórios
            </Link>
          </Button>
        </div>
        
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {apontamentoCards.map((card) => (
            <Link key={card.href} to={card.href}>
              <Card className="group h-full cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1">
                <CardContent className="p-5">
                  <div className={`mb-3 inline-flex rounded-lg p-2.5 ${card.bgColor}`}>
                    <card.icon className={`h-6 w-6 ${card.color}`} />
                  </div>
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {card.title}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {card.description}
                  </p>
                  <div className="mt-3 flex items-center text-sm text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    Acessar <ArrowRight className="ml-1 h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Cadastros - Apenas para Sala Técnica e Admin */}
      {canAccessCadastros && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Cadastros (Dados Mestres)
            </h2>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {cadastroCards.map((card) => (
              <Link key={card.href} to={card.href}>
                <Card className="group h-full cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5">
                  <CardContent className="p-4">
                    <div className={`mb-2 inline-flex rounded-lg p-2 ${card.bgColor}`}>
                      <card.icon className={`h-5 w-5 ${card.color}`} />
                    </div>
                    <h3 className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">
                      {card.title}
                    </h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {card.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Relatórios Rápidos */}
      <div>
        <div className="mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Relatórios
          </h2>
        </div>
        
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link to="/apontador/apropriacao/relatorios">
            <Card className="group cursor-pointer transition-all hover:shadow-md border-l-4 border-l-accent">
              <CardContent className="p-4 flex items-center gap-3">
                <FileText className="h-5 w-5 text-accent" />
                <div>
                  <p className="font-medium text-sm">Apropriação</p>
                  <p className="text-xs text-muted-foreground">Carga e Lançamento</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          
          <Link to="/apontador/pedreira/relatorio">
            <Card className="group cursor-pointer transition-all hover:shadow-md border-l-4 border-l-warning">
              <CardContent className="p-4 flex items-center gap-3">
                <Mountain className="h-5 w-5 text-warning" />
                <div>
                  <p className="font-medium text-sm">Pedreira</p>
                  <p className="text-xs text-muted-foreground">Carregamentos</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          
          <Link to="/apontador/pipas/relatorio">
            <Card className="group cursor-pointer transition-all hover:shadow-md border-l-4 border-l-info">
              <CardContent className="p-4 flex items-center gap-3">
                <Droplets className="h-5 w-5 text-info" />
                <div>
                  <p className="font-medium text-sm">Pipas</p>
                  <p className="text-xs text-muted-foreground">Viagens</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          
          <Link to="/apontador/cal/relatorio">
            <Card className="group cursor-pointer transition-all hover:shadow-md border-l-4 border-l-success">
              <CardContent className="p-4 flex items-center gap-3">
                <FlaskConical className="h-5 w-5 text-success" />
                <div>
                  <p className="font-medium text-sm">CAL</p>
                  <p className="text-xs text-muted-foreground">Movimentação</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
