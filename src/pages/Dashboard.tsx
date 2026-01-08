import { useState, useMemo } from "react";
import { Truck, Box, HardHat, Activity, Building2 } from "lucide-react";
import { KPICard } from "@/components/dashboard/KPICard";
import { ProductionChart } from "@/components/dashboard/ProductionChart";
import { LocalChart } from "@/components/dashboard/LocalChart";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { DataTable } from "@/components/dashboard/DataTable";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { EmpresaDetailDialog } from "@/components/dashboard/EmpresaDetailDialog";
import { useGoogleSheets, CargaRow, EquipamentoRow, CaminhaoRow, filterByDate } from "@/hooks/useGoogleSheets";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Dashboard() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedEmpresa, setSelectedEmpresa] = useState<string | null>(null);
  
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

    // Média de viagens por caminhão
    const mediaViagensPorCaminhao = caminhoesAtivos > 0 ? (totalViagens / caminhoesAtivos) : 0;

    return {
      totalViagens,
      volumeTotal,
      escavadeirasAtivas,
      totalEscavadeiras,
      caminhoesAtivos,
      totalCaminhoes,
      mediaViagensPorCaminhao,
    };
  }, [cargaData, equipamentosData, caminhoesData]);

  // Resumo por empresa (equipamentos e caminhões)
  const resumoPorEmpresa = useMemo(() => {
    if (!cargaData || cargaData.length === 0) return [];

    const empresaEquipamentos: Record<string, Set<string>> = {};
    const empresaCaminhoes: Record<string, Set<string>> = {};

    cargaData.forEach(row => {
      // Equipamentos por empresa
      const empresaEq = row.Empresa_Eq || 'Não Informada';
      if (!empresaEquipamentos[empresaEq]) {
        empresaEquipamentos[empresaEq] = new Set();
      }
      if (row.Prefixo_Eq) empresaEquipamentos[empresaEq].add(row.Prefixo_Eq);

      // Caminhões por empresa
      const empresaCb = row.Empresa_Cb || 'Não Informada';
      if (!empresaCaminhoes[empresaCb]) {
        empresaCaminhoes[empresaCb] = new Set();
      }
      if (row.Prefixo_Cb) empresaCaminhoes[empresaCb].add(row.Prefixo_Cb);
    });

    // Combinar todas as empresas
    const todasEmpresas = new Set([...Object.keys(empresaEquipamentos), ...Object.keys(empresaCaminhoes)]);

    return Array.from(todasEmpresas).map(empresa => ({
      empresa,
      equipamentos: empresaEquipamentos[empresa]?.size || 0,
      caminhoes: empresaCaminhoes[empresa]?.size || 0,
    })).filter(e => e.equipamentos > 0 || e.caminhoes > 0)
      .sort((a, b) => (b.equipamentos + b.caminhoes) - (a.equipamentos + a.caminhoes));
  }, [cargaData]);

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

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <KPICard
          title="Viagens"
          value={kpis.totalViagens.toLocaleString('pt-BR')}
          subtitle="Hoje"
          icon={Activity}
          variant="accent"
        />
        <KPICard
          title="Vol. Transportado"
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
          title="Média/Caminhão"
          value={kpis.mediaViagensPorCaminhao.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}
          subtitle="Viagens"
          icon={Truck}
          variant="default"
        />
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
                    <span className="flex items-center gap-1">
                      <HardHat className="h-3 w-3" />
                      {item.equipamentos}
                    </span>
                    <span className="flex items-center gap-1">
                      <Truck className="h-3 w-3" />
                      {item.caminhoes}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog de detalhes da empresa */}
      <EmpresaDetailDialog
        open={!!selectedEmpresa}
        onOpenChange={(open) => !open && setSelectedEmpresa(null)}
        empresa={selectedEmpresa}
        cargaData={cargaData || []}
      />

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
