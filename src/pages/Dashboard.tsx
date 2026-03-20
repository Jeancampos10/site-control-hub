import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Fuel, 
  Droplet, 
  Wrench, 
  AlertTriangle, 
  FileText, 
  Truck, 
  HardHat, 
  Activity, 
  Box, 
  Building2,
  Clock,
  ShieldAlert,
  Gauge,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { KPICard } from "@/components/dashboard/KPICard";
import { ProductionChart } from "@/components/dashboard/ProductionChart";
import { LocalChart } from "@/components/dashboard/LocalChart";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { DataTable } from "@/components/dashboard/DataTable";
import { EmpresaDetailDialog } from "@/components/dashboard/EmpresaDetailDialog";
import { useGoogleSheets, CargaRow, EquipamentoRow, CaminhaoRow, filterByDate } from "@/hooks/useGoogleSheets";

// Mock data for alerts - replace with real data later
const alertItems = [
  { label: "Revisões vencidas", count: 3, severity: "high" as const },
  { label: "Tacógrafo", count: 1, severity: "medium" as const },
  { label: "Licenças a vencer", count: 2, severity: "high" as const },
  { label: "Consumo fora do padrão (Diesel)", count: 4, severity: "medium" as const },
  { label: "Consumo fora do padrão (Lubrif.)", count: 1, severity: "low" as const },
  { label: "Insumos - Estoque mínimo", count: 2, severity: "high" as const },
];

const severityColor = {
  high: "bg-red-500/10 text-red-600 border-red-200",
  medium: "bg-yellow-500/10 text-yellow-600 border-yellow-200",
  low: "bg-blue-500/10 text-blue-600 border-blue-200",
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [selectedEmpresa, setSelectedEmpresa] = useState<string | null>(null);
  const selectedDate = new Date();

  const { data: allCargaData } = useGoogleSheets<CargaRow>('carga');
  const { data: equipamentosData } = useGoogleSheets<EquipamentoRow>('equipamentos');
  const { data: caminhoesData } = useGoogleSheets<CaminhaoRow>('caminhao');

  const cargaData = useMemo(() => filterByDate(allCargaData, selectedDate), [allCargaData, selectedDate]);

  // KPIs
  const kpis = useMemo(() => {
    const totalViagens = cargaData?.reduce((acc, row) => acc + (parseInt(row.N_Viagens) || 0), 0) || 0;
    const volumeTotal = cargaData?.reduce((acc, row) => acc + (parseFloat(row.Volume_Total) || 0), 0) || 0;
    const escavadeirasAtivas = new Set(cargaData?.map(r => r.Prefixo_Eq).filter(Boolean)).size;
    const caminhoesAtivos = new Set(cargaData?.map(r => r.Prefixo_Cb).filter(Boolean)).size;
    return { totalViagens, volumeTotal, escavadeirasAtivas, caminhoesAtivos, totalEscavadeiras: equipamentosData?.length || escavadeirasAtivas, totalCaminhoes: caminhoesData?.length || caminhoesAtivos };
  }, [cargaData, equipamentosData, caminhoesData]);

  // Resumo por empresa
  const resumoPorEmpresa = useMemo(() => {
    if (!cargaData || cargaData.length === 0) return [];
    const empresaEquipamentos: Record<string, Set<string>> = {};
    const empresaCaminhoes: Record<string, Set<string>> = {};
    cargaData.forEach(row => {
      const empresaEq = row.Empresa_Eq || 'Não Informada';
      if (!empresaEquipamentos[empresaEq]) empresaEquipamentos[empresaEq] = new Set();
      if (row.Prefixo_Eq) empresaEquipamentos[empresaEq].add(row.Prefixo_Eq);
      const empresaCb = row.Empresa_Cb || 'Não Informada';
      if (!empresaCaminhoes[empresaCb]) empresaCaminhoes[empresaCb] = new Set();
      if (row.Prefixo_Cb) empresaCaminhoes[empresaCb].add(row.Prefixo_Cb);
    });
    const todasEmpresas = new Set([...Object.keys(empresaEquipamentos), ...Object.keys(empresaCaminhoes)]);
    return Array.from(todasEmpresas).map(empresa => ({
      empresa,
      equipamentos: empresaEquipamentos[empresa]?.size || 0,
      caminhoes: empresaCaminhoes[empresa]?.size || 0,
    })).filter(e => e.equipamentos > 0 || e.caminhoes > 0)
      .sort((a, b) => (b.equipamentos + b.caminhoes) - (a.equipamentos + a.caminhoes));
  }, [cargaData]);

  // Tables
  const materialByExcavatorData = useMemo(() => {
    if (!cargaData || cargaData.length === 0) return [];
    const grouped: Record<string, Record<string, number>> = {};
    cargaData.forEach(row => {
      const esc = row.Prefixo_Eq; const mat = row.Material || 'Outros'; const v = parseInt(row.N_Viagens) || 1;
      if (!esc) return;
      if (!grouped[esc]) grouped[esc] = {};
      grouped[esc][mat] = (grouped[esc][mat] || 0) + v;
    });
    return Object.entries(grouped).map(([escavadeira, materiais]) => {
      const total = Object.values(materiais).reduce((a, b) => a + b, 0);
      return { escavadeira, ...Object.fromEntries(Object.entries(materiais).map(([k, v]) => [k.toLowerCase().replace(/\s+/g, ''), v])), total };
    }).sort((a, b) => b.total - a.total).slice(0, 8);
  }, [cargaData]);

  const materialColumns = useMemo((): Array<{ key: string; label: string; className?: string }> => {
    if (!cargaData || cargaData.length === 0) return [{ key: "escavadeira", label: "Escavadeira" }];
    const materials = new Set(cargaData.map(r => r.Material).filter(Boolean));
    const cols: Array<{ key: string; label: string; className?: string }> = [{ key: "escavadeira", label: "Escavadeira" }];
    Array.from(materials).slice(0, 4).forEach(m => cols.push({ key: m.toLowerCase().replace(/\s+/g, ''), label: m, className: "text-right" }));
    cols.push({ key: "total", label: "Total", className: "text-right font-semibold" });
    return cols;
  }, [cargaData]);

  const formattedDate = selectedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  const totalAlerts = alertItems.reduce((a, b) => a + b.count, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Visão geral das operações • {formattedDate}</p>
      </div>

      {/* Quick Action Buttons Row */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        {/* Estoque Atual */}
        <Card 
          className="cursor-pointer transition-all hover:shadow-lg hover:border-primary/40 group"
          onClick={() => navigate('/controle/abastecimentos')}
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-blue-500/10 p-3">
                  <Fuel className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Estoque Atual</h3>
                  <p className="text-xs text-muted-foreground">Combustíveis</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <div className="flex gap-3">
              <div className="flex-1 rounded-lg bg-muted/60 p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">Diesel S10</p>
                <p className="text-lg font-bold text-foreground">65%</p>
                <div className="h-1.5 w-full rounded-full bg-muted mt-2">
                  <div className="h-1.5 rounded-full bg-green-500" style={{ width: '65%' }} />
                </div>
              </div>
              <div className="flex-1 rounded-lg bg-muted/60 p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">Arla</p>
                <p className="text-lg font-bold text-foreground">42%</p>
                <div className="h-1.5 w-full rounded-full bg-muted mt-2">
                  <div className="h-1.5 rounded-full bg-yellow-500" style={{ width: '42%' }} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Equipamentos em Oficina */}
        <Card 
          className="cursor-pointer transition-all hover:shadow-lg hover:border-primary/40 group"
          onClick={() => navigate('/controle/manutencao')}
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-orange-500/10 p-3">
                  <Wrench className="h-6 w-6 text-orange-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Equipamentos em Oficina</h3>
                  <p className="text-xs text-muted-foreground">Manutenção ativa</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2">
                <span className="text-sm">PC-200 #03</span>
                <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">Preventiva</Badge>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2">
                <span className="text-sm">CB-012</span>
                <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">Corretiva</Badge>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2">
                <span className="text-sm">CB-045</span>
                <Badge variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-50">Aguardando peça</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alertas */}
        <Card 
          className="cursor-pointer transition-all hover:shadow-lg hover:border-primary/40 group"
          onClick={() => navigate('/alertas')}
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-red-500/10 p-3">
                  <AlertTriangle className="h-6 w-6 text-red-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Alertas</h3>
                  <p className="text-xs text-muted-foreground">{totalAlerts} pendências</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <div className="space-y-1.5 max-h-[140px] overflow-y-auto custom-scrollbar">
              {alertItems.map((alert) => (
                <div key={alert.label} className="flex items-center justify-between rounded-lg bg-muted/60 px-3 py-1.5">
                  <span className="text-sm truncate flex-1">{alert.label}</span>
                  <Badge variant="outline" className={`ml-2 text-xs ${severityColor[alert.severity]}`}>
                    {alert.count}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <KPICard title="Viagens" value={kpis.totalViagens.toLocaleString('pt-BR')} subtitle="Hoje" icon={Activity} variant="accent" />
        <KPICard title="Vol. Transportado" value={`${kpis.volumeTotal.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} m³`} subtitle="Movimentado" icon={Box} variant="primary" />
        <KPICard title="Escavadeiras" value={kpis.escavadeirasAtivas} subtitle={`de ${kpis.totalEscavadeiras}`} icon={HardHat} variant="success" />
        <KPICard title="Caminhões" value={kpis.caminhoesAtivos} subtitle={`de ${kpis.totalCaminhoes}`} icon={Truck} variant="default" />
      </div>

      {/* Resumo por Empresa */}
      {resumoPorEmpresa.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4" />
              Resumo por Empresa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {resumoPorEmpresa.map((item) => (
                <button 
                  key={item.empresa}
                  onClick={() => setSelectedEmpresa(item.empresa)}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border hover:bg-muted hover:border-primary/50 transition-colors cursor-pointer text-left w-full"
                >
                  <span className="font-medium text-sm truncate flex-1">{item.empresa}</span>
                  <div className="flex gap-3 text-sm text-muted-foreground ml-2">
                    <span className="flex items-center gap-1"><HardHat className="h-3 w-3" />{item.equipamentos}</span>
                    <span className="flex items-center gap-1"><Truck className="h-3 w-3" />{item.caminhoes}</span>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <EmpresaDetailDialog
        open={!!selectedEmpresa}
        onOpenChange={(open) => !open && setSelectedEmpresa(null)}
        empresa={selectedEmpresa}
        cargaData={cargaData || []}
      />

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ProductionChart cargaData={cargaData || []} />
        <LocalChart cargaData={cargaData || []} />
      </div>

      {/* Tables */}
      <DataTable
        title="Escavadeira × Material"
        subtitle="Total de viagens por tipo de material"
        columns={materialColumns}
        data={materialByExcavatorData}
      />

      {/* Recent Activity */}
      <RecentActivity cargaData={cargaData || []} />
    </div>
  );
}
