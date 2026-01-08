import { useState, useMemo } from "react";
import { Truck, Box, HardHat, MapPin, Activity, Package } from "lucide-react";
import { KPICard } from "@/components/dashboard/KPICard";
import { ProductionChart } from "@/components/dashboard/ProductionChart";
import { LocalChart } from "@/components/dashboard/LocalChart";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { DataTable } from "@/components/dashboard/DataTable";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { useGoogleSheets, CargaRow, EquipamentoRow, CaminhaoRow, filterByDate } from "@/hooks/useGoogleSheets";

export default function Dashboard() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  const { data: allCargaData } = useGoogleSheets<CargaRow>('carga');
  const { data: equipamentosData } = useGoogleSheets<EquipamentoRow>('equipamentos');
  const { data: caminhoesData } = useGoogleSheets<CaminhaoRow>('caminhao');

  // Filter carga data by selected date
  const cargaData = useMemo(() => {
    return filterByDate(allCargaData, selectedDate);
  }, [allCargaData, selectedDate]);

  // Calculate KPIs from filtered data
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

  // Calculate material by excavator table - WITH TRIP COUNTS
  const materialByExcavatorData = useMemo(() => {
    if (!cargaData || cargaData.length === 0) return [];

    const grouped: Record<string, Record<string, number>> = {};

    cargaData.forEach(row => {
      const escavadeira = row.Prefixo_Eq;
      const material = row.Material || 'Outros';
      const viagens = parseInt(row.N_Viagens) || 1;

      if (!escavadeira) return;

      if (!grouped[escavadeira]) {
        grouped[escavadeira] = {};
      }
      grouped[escavadeira][material] = (grouped[escavadeira][material] || 0) + viagens;
    });

    return Object.entries(grouped).map(([escavadeira, materiais]) => {
      const total = Object.values(materiais).reduce((a, b) => a + b, 0);
      return {
        escavadeira,
        ...Object.fromEntries(
          Object.entries(materiais).map(([k, v]) => [k.toLowerCase().replace(/\s+/g, ''), v])
        ),
        total,
      };
    }).sort((a, b) => b.total - a.total).slice(0, 8);
  }, [cargaData]);

  // Calculate location by excavator table - WITH TRIP COUNTS
  const locationByExcavatorData = useMemo(() => {
    if (!cargaData || cargaData.length === 0) return [];

    const grouped: Record<string, Record<string, number>> = {};

    cargaData.forEach(row => {
      const escavadeira = row.Prefixo_Eq;
      const local = row.Local_da_Obra || 'Outros';
      const viagens = parseInt(row.N_Viagens) || 1;

      if (!escavadeira) return;

      if (!grouped[escavadeira]) {
        grouped[escavadeira] = {};
      }
      grouped[escavadeira][local] = (grouped[escavadeira][local] || 0) + viagens;
    });

    return Object.entries(grouped).map(([escavadeira, locais]) => {
      const total = Object.values(locais).reduce((a, b) => a + b, 0);
      return {
        escavadeira,
        ...Object.fromEntries(
          Object.entries(locais).map(([k, v]) => [k.toLowerCase().replace(/\s+/g, '_'), v])
        ),
        total,
      };
    }).sort((a, b) => b.total - a.total).slice(0, 8);
  }, [cargaData]);

  // Dynamic columns for material table
  const materialColumns = useMemo((): Array<{ key: string; label: string; className?: string }> => {
    if (!cargaData || cargaData.length === 0) return [{ key: "escavadeira", label: "Escavadeira" }];
    
    const materials = new Set(cargaData.map(row => row.Material).filter(Boolean));
    const cols: Array<{ key: string; label: string; className?: string }> = [{ key: "escavadeira", label: "Escavadeira" }];
    
    Array.from(materials).slice(0, 4).forEach(m => {
      cols.push({ 
        key: m.toLowerCase().replace(/\s+/g, ''), 
        label: m,
        className: "text-right" 
      });
    });
    
    cols.push({ key: "total", label: "Total", className: "text-right font-semibold" });
    return cols;
  }, [cargaData]);

  // Dynamic columns for location table
  const locationColumns = useMemo((): Array<{ key: string; label: string; className?: string }> => {
    if (!cargaData || cargaData.length === 0) return [{ key: "escavadeira", label: "Escavadeira" }];
    
    const locations = new Set(cargaData.map(row => row.Local_da_Obra).filter(Boolean));
    const cols: Array<{ key: string; label: string; className?: string }> = [{ key: "escavadeira", label: "Escavadeira" }];
    
    Array.from(locations).slice(0, 3).forEach(l => {
      cols.push({ 
        key: l.toLowerCase().replace(/\s+/g, '_'), 
        label: l.length > 15 ? l.substring(0, 15) + '...' : l,
        className: "text-right" 
      });
    });
    
    cols.push({ key: "total", label: "Total", className: "text-right font-semibold" });
    return cols;
  }, [cargaData]);

  const formattedDate = selectedDate.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Dashboard Geral</h1>
        <p className="page-subtitle">
          Visão executiva das operações de terraplenagem • {formattedDate}
        </p>
      </div>

      {/* Filters */}
      <FilterBar selectedDate={selectedDate} onDateChange={setSelectedDate} />

      {/* KPI Cards - Better responsive grid */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        <KPICard
          title="Viagens"
          value={kpis.totalViagens.toLocaleString('pt-BR')}
          subtitle="Hoje"
          icon={Activity}
          variant="accent"
        />
        <KPICard
          title="Volume"
          value={`${kpis.volumeTotal.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} m³`}
          subtitle="Movimentado"
          icon={Box}
          variant="primary"
        />
        <KPICard
          title="Escavadeiras"
          value={kpis.escavadeirasAtivas}
          subtitle={`de ${kpis.totalEscavadeiras}`}
          icon={HardHat}
          variant="success"
        />
        <KPICard
          title="Caminhões"
          value={kpis.caminhoesAtivos}
          subtitle={`de ${kpis.totalCaminhoes}`}
          icon={Truck}
          variant="default"
        />
        <KPICard
          title="Materiais"
          value={kpis.materiaisDoDia}
          subtitle="Tipos"
          icon={Package}
          variant="default"
        />
        <KPICard
          title="Locais"
          value={kpis.locaisAtivos}
          subtitle="Ativos"
          icon={MapPin}
          variant="default"
        />
      </div>

      {/* Charts Row - Full width on mobile */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ProductionChart cargaData={cargaData || []} />
        <LocalChart cargaData={cargaData || []} />
      </div>

      {/* Tables Row - Full width on mobile */}
      <div className="grid gap-6 lg:grid-cols-2">
        <DataTable
          title="Escavadeira × Material"
          subtitle="Total de viagens por tipo de material"
          columns={materialColumns}
          data={materialByExcavatorData}
        />
        <DataTable
          title="Escavadeira × Local"
          subtitle="Total de viagens por área de trabalho"
          columns={locationColumns}
          data={locationByExcavatorData}
        />
      </div>

      {/* Recent Activity */}
      <RecentActivity cargaData={cargaData || []} />
    </div>
  );
}
