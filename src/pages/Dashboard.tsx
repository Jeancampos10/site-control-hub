import { Truck, Box, HardHat, MapPin, Activity, Package } from "lucide-react";
import { KPICard } from "@/components/dashboard/KPICard";
import { ProductionChart } from "@/components/dashboard/ProductionChart";
import { LocalChart } from "@/components/dashboard/LocalChart";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { DataTable } from "@/components/dashboard/DataTable";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { useGoogleSheets, CargaRow, EquipamentoRow, CaminhaoRow } from "@/hooks/useGoogleSheets";
import { useMemo } from "react";

export default function Dashboard() {
  const { data: cargaData } = useGoogleSheets<CargaRow>('carga');
  const { data: equipamentosData } = useGoogleSheets<EquipamentoRow>('equipamentos');
  const { data: caminhoesData } = useGoogleSheets<CaminhaoRow>('caminhao');

  // Calculate KPIs from real data
  const kpis = useMemo(() => {
    const totalViagens = cargaData?.reduce((acc, row) => {
      const viagens = parseInt(row.N_Viagens) || 0;
      return acc + viagens;
    }, 0) || 0;

    const volumeTotal = cargaData?.reduce((acc, row) => {
      const vol = parseFloat(row.Volume_Total) || 0;
      return acc + vol;
    }, 0) || 0;

    const escavadeirasAtivas = new Set(cargaData?.map(row => row.Prefixo_Eq).filter(Boolean)).size;
    const totalEscavadeiras = equipamentosData?.length || escavadeirasAtivas;

    const caminhoesAtivos = new Set(cargaData?.map(row => row.Prefixo_Cb).filter(Boolean)).size;
    const totalCaminhoes = caminhoesData?.length || caminhoesAtivos;

    const materiaisDoDia = new Set(cargaData?.map(row => row.Material).filter(Boolean)).size;
    const locaisAtivos = new Set(cargaData?.map(row => row.Local_da_Obra).filter(Boolean)).size;

    return {
      totalViagens,
      volumeTotal,
      escavadeirasAtivas,
      totalEscavadeiras,
      caminhoesAtivos,
      totalCaminhoes,
      materiaisDoDia,
      locaisAtivos,
    };
  }, [cargaData, equipamentosData, caminhoesData]);

  // Calculate material by excavator table
  const materialByExcavatorData = useMemo(() => {
    if (!cargaData) return [];

    const grouped: Record<string, Record<string, number>> = {};

    cargaData.forEach(row => {
      const escavadeira = row.Prefixo_Eq;
      const material = row.Material || 'Outros';
      const volume = parseFloat(row.Volume_Total) || 0;

      if (!escavadeira) return;

      if (!grouped[escavadeira]) {
        grouped[escavadeira] = {};
      }
      grouped[escavadeira][material] = (grouped[escavadeira][material] || 0) + volume;
    });

    return Object.entries(grouped).slice(0, 5).map(([escavadeira, materiais]) => {
      const total = Object.values(materiais).reduce((a, b) => a + b, 0);
      return {
        escavadeira,
        ...Object.fromEntries(
          Object.entries(materiais).map(([k, v]) => [k.toLowerCase().replace(/\s+/g, ''), `${v.toFixed(0)} m³`])
        ),
        total: `${total.toFixed(0)} m³`,
      };
    });
  }, [cargaData]);

  // Calculate location by excavator table
  const locationByExcavatorData = useMemo(() => {
    if (!cargaData) return [];

    const grouped: Record<string, Record<string, number>> = {};

    cargaData.forEach(row => {
      const escavadeira = row.Prefixo_Eq;
      const local = row.Local_da_Obra || 'Outros';
      const volume = parseFloat(row.Volume_Total) || 0;

      if (!escavadeira) return;

      if (!grouped[escavadeira]) {
        grouped[escavadeira] = {};
      }
      grouped[escavadeira][local] = (grouped[escavadeira][local] || 0) + volume;
    });

    return Object.entries(grouped).slice(0, 5).map(([escavadeira, locais]) => {
      const total = Object.values(locais).reduce((a, b) => a + b, 0);
      return {
        escavadeira,
        ...Object.fromEntries(
          Object.entries(locais).map(([k, v]) => [k.toLowerCase().replace(/\s+/g, '_'), `${v.toFixed(0)} m³`])
        ),
        total: `${total.toFixed(0)} m³`,
      };
    });
  }, [cargaData]);

  // Dynamic columns for material table
  const materialColumns = useMemo((): Array<{ key: string; label: string; className?: string }> => {
    if (!cargaData) return [{ key: "escavadeira", label: "Escavadeira" }];
    
    const materials = new Set(cargaData.map(row => row.Material).filter(Boolean));
    const cols: Array<{ key: string; label: string; className?: string }> = [{ key: "escavadeira", label: "Escavadeira" }];
    
    materials.forEach(m => {
      cols.push({ 
        key: m.toLowerCase().replace(/\s+/g, ''), 
        label: m,
        className: "text-right" 
      });
    });
    
    cols.push({ key: "total", label: "Total", className: "text-right font-semibold" });
    return cols.slice(0, 6); // Limit columns
  }, [cargaData]);

  // Dynamic columns for location table
  const locationColumns = useMemo((): Array<{ key: string; label: string; className?: string }> => {
    if (!cargaData) return [{ key: "escavadeira", label: "Escavadeira" }];
    
    const locations = new Set(cargaData.map(row => row.Local_da_Obra).filter(Boolean));
    const cols: Array<{ key: string; label: string; className?: string }> = [{ key: "escavadeira", label: "Escavadeira" }];
    
    Array.from(locations).slice(0, 3).forEach(l => {
      cols.push({ 
        key: l.toLowerCase().replace(/\s+/g, '_'), 
        label: l,
        className: "text-right" 
      });
    });
    
    cols.push({ key: "total", label: "Total", className: "text-right font-semibold" });
    return cols;
  }, [cargaData]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Dashboard Geral</h1>
        <p className="page-subtitle">
          Visão executiva das operações de terraplenagem em tempo real
        </p>
      </div>

      {/* Filters */}
      <FilterBar />

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KPICard
          title="Total de Viagens"
          value={kpis.totalViagens.toLocaleString('pt-BR')}
          subtitle="Registradas"
          icon={Activity}
          variant="accent"
        />
        <KPICard
          title="Volume Total"
          value={`${kpis.volumeTotal.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} m³`}
          subtitle="Movimentado"
          icon={Box}
          variant="primary"
        />
        <KPICard
          title="Escavadeiras"
          value={kpis.escavadeirasAtivas}
          subtitle={`de ${kpis.totalEscavadeiras} disponíveis`}
          icon={HardHat}
          variant="success"
        />
        <KPICard
          title="Caminhões"
          value={kpis.caminhoesAtivos}
          subtitle={`de ${kpis.totalCaminhoes} disponíveis`}
          icon={Truck}
          variant="default"
        />
        <KPICard
          title="Materiais"
          value={kpis.materiaisDoDia}
          subtitle="Tipos diferentes"
          icon={Package}
          variant="default"
        />
        <KPICard
          title="Locais Ativos"
          value={kpis.locaisAtivos}
          subtitle="Em operação"
          icon={MapPin}
          variant="default"
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ProductionChart cargaData={cargaData || []} />
        <LocalChart cargaData={cargaData || []} />
      </div>

      {/* Tables Row */}
      <div className="grid gap-4 lg:grid-cols-2">
        <DataTable
          title="Escavadeira × Material"
          subtitle="Produção por tipo de material"
          columns={materialColumns}
          data={materialByExcavatorData}
        />
        <DataTable
          title="Escavadeira × Local"
          subtitle="Produção por área de trabalho"
          columns={locationColumns}
          data={locationByExcavatorData}
        />
      </div>

      {/* Recent Activity */}
      <RecentActivity cargaData={cargaData || []} />
    </div>
  );
}
