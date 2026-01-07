import { useState, useMemo } from "react";
import { Mountain, Plus, Filter, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { KPICard } from "@/components/dashboard/KPICard";
import { Truck, Box, Activity } from "lucide-react";
import { useGoogleSheets, ApontamentoPedreiraRow, filterByDate } from "@/hooks/useGoogleSheets";
import { TableLoader } from "@/components/ui/loading-spinner";
import { ErrorState } from "@/components/ui/error-state";
import { DateFilter } from "@/components/shared/DateFilter";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface MaterialSummary {
  material: string;
  viagens: number;
  toneladas: number;
}

export default function Pedreira() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { data: allData, isLoading, error, refetch } = useGoogleSheets<ApontamentoPedreiraRow>('apontamento_pedreira');

  // Filter data by selected date
  const pedreiraData = useMemo(() => {
    return filterByDate(allData, selectedDate);
  }, [allData, selectedDate]);

  // Calculate KPIs from filtered data
  const totalRegistros = pedreiraData?.length || 0;
  const pesoTotal = pedreiraData?.reduce((acc, row) => {
    const peso = parseFloat(row.Tonelada) || 0;
    return acc + peso;
  }, 0) || 0;
  const volumeTotal = pedreiraData?.reduce((acc, row) => {
    const vol = parseFloat(row.Metro_Cubico) || 0;
    return acc + vol;
  }, 0) || 0;
  const veiculosAtivos = new Set(pedreiraData?.map(row => row.Prefixo_Eq).filter(Boolean)).size;

  // Summary by material
  const materialSummary = useMemo((): MaterialSummary[] => {
    if (!pedreiraData) return [];
    
    const grouped = new Map<string, MaterialSummary>();
    
    pedreiraData.forEach(row => {
      const material = row.Material || 'Outros';
      
      if (!grouped.has(material)) {
        grouped.set(material, { material, viagens: 0, toneladas: 0 });
      }
      
      const summary = grouped.get(material)!;
      summary.viagens += 1;
      summary.toneladas += parseFloat(row.Tonelada) || 0;
    });
    
    return Array.from(grouped.values()).sort((a, b) => b.toneladas - a.toneladas);
  }, [pedreiraData]);

  const formattedDate = format(selectedDate, "dd 'de' MMMM", { locale: ptBR });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="page-header mb-0">
          <h1 className="page-title flex items-center gap-2">
            <Mountain className="h-6 w-6 text-accent" />
            Apontamento Pedreira
          </h1>
          <p className="page-subtitle">
            Controle de carregamentos e pesagens • {formattedDate}
          </p>
        </div>
        <div className="flex gap-2">
          <DateFilter date={selectedDate} onDateChange={setSelectedDate} />
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
          <Button size="sm" className="gap-2 bg-gradient-accent text-accent-foreground hover:opacity-90">
            <Plus className="h-4 w-4" />
            Novo Apontamento
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Carregamentos"
          value={totalRegistros}
          subtitle="Hoje"
          icon={Activity}
          variant="accent"
        />
        <KPICard
          title="Peso Total"
          value={`${pesoTotal.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} t`}
          subtitle="Transportado"
          icon={Box}
          variant="primary"
        />
        <KPICard
          title="Volume"
          value={`${volumeTotal.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} m³`}
          subtitle="Material"
          icon={Mountain}
          variant="success"
        />
        <KPICard
          title="Veículos"
          value={veiculosAtivos}
          subtitle="Utilizados"
          icon={Truck}
          variant="default"
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <TableLoader />
      ) : error ? (
        <ErrorState 
          message="Não foi possível buscar os dados da planilha."
          onRetry={() => refetch()} 
        />
      ) : (
        <div className="space-y-6">
          {/* Material Summary */}
          <div className="chart-container">
            <h3 className="mb-4 font-semibold">Resumo por Material</h3>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="data-table-header">Material</TableHead>
                    <TableHead className="data-table-header text-right">Viagens</TableHead>
                    <TableHead className="data-table-header text-right">Toneladas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {materialSummary.length > 0 ? (
                    materialSummary.map((row) => (
                      <TableRow key={row.material} className="data-table-row">
                        <TableCell>
                          <span className="status-badge bg-accent/10 text-accent">{row.material}</span>
                        </TableCell>
                        <TableCell className="text-right font-medium">{row.viagens}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {row.toneladas.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} t
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="h-16 text-center text-muted-foreground">
                        Nenhum registro encontrado para hoje
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Data Table */}
          <div className="chart-container overflow-hidden">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold">Registros Detalhados</h3>
              <p className="text-sm text-muted-foreground">{totalRegistros} registros</p>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="data-table-header">Data</TableHead>
                    <TableHead className="data-table-header">Hora</TableHead>
                    <TableHead className="data-table-header">Ordem</TableHead>
                    <TableHead className="data-table-header">Fornecedor</TableHead>
                    <TableHead className="data-table-header">Veículo</TableHead>
                    <TableHead className="data-table-header">Motorista</TableHead>
                    <TableHead className="data-table-header">Material</TableHead>
                    <TableHead className="data-table-header text-right">P. Líquido</TableHead>
                    <TableHead className="data-table-header text-right">m³</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pedreiraData && pedreiraData.length > 0 ? (
                    pedreiraData.slice(0, 50).map((row, idx) => (
                      <TableRow key={idx} className="data-table-row">
                        <TableCell className="font-medium">{row.Data}</TableCell>
                        <TableCell>{row.Hora}</TableCell>
                        <TableCell className="font-semibold text-primary">#{row.Ordem_Carregamento}</TableCell>
                        <TableCell>{row.Fornecedor}</TableCell>
                        <TableCell>
                          <div>
                            <span className="font-medium">{row.Prefixo_Eq}</span>
                            <p className="text-xs text-muted-foreground">{row.Placa}</p>
                          </div>
                        </TableCell>
                        <TableCell>{row.Motorista}</TableCell>
                        <TableCell>
                          <span className="status-badge bg-accent/10 text-accent">{row.Material}</span>
                        </TableCell>
                        <TableCell className="text-right font-semibold">{row.Peso_Liquido}</TableCell>
                        <TableCell className="text-right">{row.Metro_Cubico}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                        Nenhum registro encontrado para hoje
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            {pedreiraData && pedreiraData.length > 50 && (
              <div className="border-t border-border/50 px-4 py-3 text-center text-sm text-muted-foreground">
                Exibindo 50 de {pedreiraData.length} registros
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
