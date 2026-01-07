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
import { useGoogleSheets, ApontamentoPedreiraRow } from "@/hooks/useGoogleSheets";
import { TableLoader } from "@/components/ui/loading-spinner";
import { ErrorState } from "@/components/ui/error-state";

export default function Pedreira() {
  const { data: pedreiraData, isLoading, error, refetch } = useGoogleSheets<ApontamentoPedreiraRow>('apontamento_pedreira');

  // Calculate KPIs
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
            Controle de carregamentos e pesagens de pedreira
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            Filtros
          </Button>
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
          subtitle="Total"
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

      {/* Data Table */}
      {isLoading ? (
        <TableLoader />
      ) : error ? (
        <ErrorState 
          message="Não foi possível buscar os dados da planilha."
          onRetry={() => refetch()} 
        />
      ) : (
        <div className="chart-container overflow-hidden">
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
                  <TableHead className="data-table-header text-right">P. Vazio</TableHead>
                  <TableHead className="data-table-header text-right">P. Final</TableHead>
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
                      <TableCell className="text-right">{row.Peso_Vazio}</TableCell>
                      <TableCell className="text-right">{row.Peso_Final}</TableCell>
                      <TableCell className="text-right font-semibold">{row.Peso_Liquido}</TableCell>
                      <TableCell className="text-right">{row.Metro_Cubico}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={11} className="h-24 text-center text-muted-foreground">
                      Nenhum registro encontrado
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
      )}
    </div>
  );
}
