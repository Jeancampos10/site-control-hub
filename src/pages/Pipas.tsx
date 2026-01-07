import { useState, useMemo } from "react";
import { Droplets, Plus, Download } from "lucide-react";
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
import { Truck, Activity, Clock } from "lucide-react";
import { useGoogleSheets, ApontamentoPipaRow, filterByDate } from "@/hooks/useGoogleSheets";
import { TableLoader } from "@/components/ui/loading-spinner";
import { ErrorState } from "@/components/ui/error-state";
import { DateFilter } from "@/components/shared/DateFilter";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Pipas() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { data: allData, isLoading, error, refetch } = useGoogleSheets<ApontamentoPipaRow>('apontamento_pipa');

  // Filter data by selected date
  const pipasData = useMemo(() => {
    return filterByDate(allData, selectedDate);
  }, [allData, selectedDate]);

  // Calculate KPIs from filtered data
  const pipasAtivas = new Set(pipasData?.map(row => row.Prefixo).filter(Boolean)).size;
  const totalViagens = pipasData?.reduce((acc, row) => {
    const viagens = parseInt(row.N_Viagens) || 0;
    return acc + viagens;
  }, 0) || 0;
  const volumeAgua = pipasData?.reduce((acc, row) => {
    const capacidade = parseInt(row.Capacidade?.replace(/\D/g, '')) || 0;
    const viagens = parseInt(row.N_Viagens) || 0;
    return acc + (capacidade * viagens);
  }, 0) || 0;

  const formattedDate = format(selectedDate, "dd 'de' MMMM", { locale: ptBR });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="page-header mb-0">
          <h1 className="page-title flex items-center gap-2">
            <Droplets className="h-6 w-6 text-info" />
            Apontamento Pipas
          </h1>
          <p className="page-subtitle">
            Controle de caminhões pipa • {formattedDate}
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
          title="Pipas"
          value={pipasAtivas}
          subtitle="Utilizadas hoje"
          icon={Truck}
          variant="accent"
        />
        <KPICard
          title="Total Viagens"
          value={totalViagens}
          subtitle="Hoje"
          icon={Activity}
          variant="primary"
        />
        <KPICard
          title="Volume Água"
          value={`${volumeAgua.toLocaleString('pt-BR')} L`}
          subtitle="Estimado"
          icon={Droplets}
          variant="success"
        />
        <KPICard
          title="Registros"
          value={pipasData?.length || 0}
          subtitle="Hoje"
          icon={Clock}
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
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold">Carregamentos do Dia</h3>
            <p className="text-sm text-muted-foreground">{pipasData?.length || 0} registros</p>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="data-table-header">Data</TableHead>
                  <TableHead className="data-table-header">Prefixo</TableHead>
                  <TableHead className="data-table-header">Descrição</TableHead>
                  <TableHead className="data-table-header">Empresa</TableHead>
                  <TableHead className="data-table-header">Motorista</TableHead>
                  <TableHead className="data-table-header">Capacidade</TableHead>
                  <TableHead className="data-table-header">Chegada</TableHead>
                  <TableHead className="data-table-header">Saída</TableHead>
                  <TableHead className="data-table-header text-right">Viagens</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pipasData && pipasData.length > 0 ? (
                  pipasData.map((row, idx) => (
                    <TableRow key={idx} className="data-table-row">
                      <TableCell className="font-medium">{row.Data}</TableCell>
                      <TableCell className="font-semibold text-info">{row.Prefixo}</TableCell>
                      <TableCell>{row.Descricao}</TableCell>
                      <TableCell>{row.Empresa}</TableCell>
                      <TableCell>{row.Motorista}</TableCell>
                      <TableCell>
                        <span className="status-badge bg-info/10 text-info">{row.Capacidade}</span>
                      </TableCell>
                      <TableCell>{row.Hora_Chegada}</TableCell>
                      <TableCell>{row.Hora_Saida}</TableCell>
                      <TableCell className="text-right font-semibold">{row.N_Viagens}</TableCell>
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
          {pipasData && pipasData.length > 50 && (
            <div className="border-t border-border/50 px-4 py-3 text-center text-sm text-muted-foreground">
              Exibindo 50 de {pipasData.length} registros
            </div>
          )}
        </div>
      )}
    </div>
  );
}
