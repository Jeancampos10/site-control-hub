import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Fuel, Package, Truck, Wrench, Clock, AlertTriangle, RefreshCw, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGoogleSheets } from "@/hooks/useGoogleSheets";
import { useOrdensServico } from "@/hooks/useOrdensServico";
import { 
  transformAbastecimentoData, 
  transformVeiculosData,
  transformGeralData,
  type AbastecimentoRecord,
  type VeiculoRecord 
} from "@/lib/abastech/sheetsDataTransform";
import { generateAllAlerts, type Alert } from "@/lib/abastech/alertsEngine";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Badge } from "@/components/ui/badge";

export default function CombustivelDashboard() {
  // Fetch data from Google Sheets
  const { data: abastecimentoData, isLoading: loadingAbast, refetch: refetchAbast } = useGoogleSheets('AbastecimentoCanteiro01');
  const { data: veiculosData, isLoading: loadingVeiculos, refetch: refetchVeiculos } = useGoogleSheets('Veiculos');
  const { data: geralData, isLoading: loadingGeral, refetch: refetchGeral } = useGoogleSheets('Geral');
  const { data: ordensServico, isLoading: loadingOS } = useOrdensServico();

  const isLoading = loadingAbast || loadingVeiculos || loadingGeral || loadingOS;

  // Transform data
  const abastecimentos = useMemo<AbastecimentoRecord[]>(() => {
    if (!abastecimentoData) return [];
    return transformAbastecimentoData(abastecimentoData);
  }, [abastecimentoData]);

  const veiculos = useMemo<VeiculoRecord[]>(() => {
    if (!veiculosData) return [];
    return transformVeiculosData(veiculosData);
  }, [veiculosData]);

  const geral = useMemo(() => {
    if (!geralData) return [];
    return transformGeralData(geralData);
  }, [geralData]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    // Estoque atual (último registro do Geral)
    const ultimoGeral = geral[geral.length - 1];
    const estoqueDiesel = ultimoGeral?.estoqueAtual || 0;
    const estoqueAnterior = geral.length > 1 ? geral[geral.length - 2]?.estoqueAtual || 0 : estoqueDiesel;
    const variacaoEstoque = estoqueAnterior > 0 ? ((estoqueDiesel - estoqueAnterior) / estoqueAnterior) * 100 : 0;

    // Veículos
    const veiculosAtivos = veiculos.filter(v => v.status === 'active').length;
    const veiculosManutencao = veiculos.filter(v => v.status === 'warning').length;
    const totalVeiculos = veiculos.length;

    // OS abertas
    const osAbertas = ordensServico?.filter(os => os.status === 'Em Andamento' || os.status === 'Aguardando Peças').length || 0;

    // Consumo do período (últimos 7 dias de abastecimentos)
    const consumoTotal = abastecimentos.slice(-50).reduce((sum, a) => sum + a.quantidadeCombustivel, 0);

    // Generate alerts
    const alerts = generateAllAlerts(abastecimentos, [], undefined);
    const alertasCriticos = alerts.filter(a => a.severity === 'critical').length;
    const alertasWarning = alerts.filter(a => a.severity === 'warning').length;

    return {
      estoqueDiesel,
      variacaoEstoque,
      veiculosAtivos,
      veiculosManutencao,
      totalVeiculos,
      osAbertas,
      consumoTotal,
      alertasCriticos,
      alertasWarning,
      totalAlertas: alertasCriticos + alertasWarning,
      alerts: alerts.slice(0, 5), // Top 5 alerts
    };
  }, [geral, veiculos, ordensServico, abastecimentos]);

  const handleRefresh = () => {
    refetchAbast();
    refetchVeiculos();
    refetchGeral();
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('pt-BR').format(Math.round(num));
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Dashboard - Combustível e Manutenção
          </h1>
          <p className="text-muted-foreground">
            Visão geral das operações de abastecimento e manutenção
          </p>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estoque Diesel</CardTitle>
            <Fuel className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <div className="text-2xl font-bold">{formatNumber(kpis.estoqueDiesel)} L</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  {kpis.variacaoEstoque >= 0 ? (
                    <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                  ) : (
                    <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
                  )}
                  <span className={kpis.variacaoEstoque >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {kpis.variacaoEstoque >= 0 ? '+' : ''}{kpis.variacaoEstoque.toFixed(1)}%
                  </span>
                  <span className="ml-1">vs anterior</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Veículos Ativos</CardTitle>
            <Truck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <div className="text-2xl font-bold">{kpis.veiculosAtivos}</div>
                <p className="text-xs text-muted-foreground">
                  de {kpis.totalVeiculos} total ({kpis.veiculosManutencao} em manutenção)
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">OS Abertas</CardTitle>
            <Wrench className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <div className="text-2xl font-bold">{kpis.osAbertas}</div>
                <p className="text-xs text-muted-foreground">Ordens de serviço pendentes</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas</CardTitle>
            <AlertTriangle className={`h-4 w-4 ${kpis.alertasCriticos > 0 ? 'text-red-500' : 'text-yellow-500'}`} />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <div className="text-2xl font-bold">{kpis.totalAlertas}</div>
                <div className="flex gap-2 text-xs">
                  {kpis.alertasCriticos > 0 && (
                    <Badge variant="destructive" className="text-xs">{kpis.alertasCriticos} críticos</Badge>
                  )}
                  {kpis.alertasWarning > 0 && (
                    <Badge variant="secondary" className="text-xs">{kpis.alertasWarning} avisos</Badge>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section */}
      {kpis.alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Alertas Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {kpis.alerts.map((alert) => (
                <AlertItem key={alert.id} alert={alert} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Access Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link to="/combustivel/abastecimento">
          <Card className="cursor-pointer transition-all hover:bg-muted/50 hover:shadow-md">
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="rounded-lg bg-orange-100 p-3 dark:bg-orange-900/50">
                <Fuel className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold">Abastecimento</h3>
                <p className="text-sm text-muted-foreground">
                  {isLoading ? '...' : `${abastecimentos.length} registros`}
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/combustivel/estoques">
          <Card className="cursor-pointer transition-all hover:bg-muted/50 hover:shadow-md">
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="rounded-lg bg-blue-100 p-3 dark:bg-blue-900/50">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold">Estoques</h3>
                <p className="text-sm text-muted-foreground">
                  {isLoading ? '...' : `${formatNumber(kpis.estoqueDiesel)} L diesel`}
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/combustivel/manutencao">
          <Card className="cursor-pointer transition-all hover:bg-muted/50 hover:shadow-md">
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="rounded-lg bg-yellow-100 p-3 dark:bg-yellow-900/50">
                <Wrench className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <h3 className="font-semibold">Manutenção</h3>
                <p className="text-sm text-muted-foreground">
                  {isLoading ? '...' : `${kpis.osAbertas} OS abertas`}
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Secondary Quick Access */}
      <div className="grid gap-4 md:grid-cols-2">
        <Link to="/combustivel/frota">
          <Card className="cursor-pointer transition-all hover:bg-muted/50 hover:shadow-md">
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="rounded-lg bg-green-100 p-3 dark:bg-green-900/50">
                <Truck className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold">Frota</h3>
                <p className="text-sm text-muted-foreground">
                  {isLoading ? '...' : `${kpis.totalVeiculos} veículos cadastrados`}
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/combustivel/horimetros">
          <Card className="cursor-pointer transition-all hover:bg-muted/50 hover:shadow-md">
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="rounded-lg bg-purple-100 p-3 dark:bg-purple-900/50">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold">Horímetros</h3>
                <p className="text-sm text-muted-foreground">Controle de horas trabalhadas</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}

// Alert Item Component
function AlertItem({ alert }: { alert: Alert }) {
  const severityColors = {
    critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  };

  const severityLabels = {
    critical: 'Crítico',
    warning: 'Aviso',
    info: 'Info',
  };

  return (
    <div className={`rounded-lg p-3 ${severityColors[alert.severity]}`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'} className="text-xs">
              {severityLabels[alert.severity]}
            </Badge>
            <span className="font-medium">{alert.title}</span>
          </div>
          <p className="mt-1 text-sm opacity-90">{alert.message}</p>
        </div>
      </div>
    </div>
  );
}
