import { useState, useMemo } from "react";
import { Upload, Plus, Filter, Download } from "lucide-react";
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
import { Box, Truck, Activity } from "lucide-react";
import { useGoogleSheets, CargaRow, filterByDate } from "@/hooks/useGoogleSheets";
import { TableLoader } from "@/components/ui/loading-spinner";
import { ErrorState } from "@/components/ui/error-state";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Carga() {
  const [selectedDate] = useState<Date>(new Date()); // Default to today
  const { data: allCargaData, isLoading, error, refetch } = useGoogleSheets<CargaRow>('carga');

  // Filter data by selected date
  const cargaData = useMemo(() => {
    return filterByDate(allCargaData, selectedDate);
  }, [allCargaData, selectedDate]);

  // Calculate KPIs from filtered data
  const totalRegistros = cargaData?.length || 0;
  const totalViagens = cargaData?.reduce((acc, row) => {
    const viagens = parseInt(row.N_Viagens) || 0;
    return acc + viagens;
  }, 0) || 0;
  const volumeTotal = cargaData?.reduce((acc, row) => {
    const vol = parseFloat(row.Volume_Total) || 0;
    return acc + vol;
  }, 0) || 0;
  const escavadeirasAtivas = new Set(cargaData?.map(row => row.Prefixo_Eq).filter(Boolean)).size;
  const caminhoesAtivos = new Set(cargaData?.map(row => row.Prefixo_Cb).filter(Boolean)).size;

  const formattedDate = format(selectedDate, "dd 'de' MMMM", { locale: ptBR });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="page-header mb-0">
          <h1 className="page-title flex items-center gap-2">
            <Upload className="h-6 w-6 text-success" />
            Registro de Carga
          </h1>
          <p className="page-subtitle">
            Acompanhamento de carregamentos • {formattedDate}
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
            Nova Carga
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Cargas Hoje"
          value={totalRegistros}
          subtitle="Registros"
          icon={Activity}
          variant="accent"
        />
        <KPICard
          title="Total Viagens"
          value={totalViagens}
          subtitle="Hoje"
          icon={Truck}
          variant="primary"
        />
        <KPICard
          title="Volume Total"
          value={`${volumeTotal.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} m³`}
          subtitle="Carregado"
          icon={Box}
          variant="success"
        />
        <KPICard
          title="Escavadeiras"
          value={escavadeirasAtivas}
          subtitle={`${caminhoesAtivos} caminhões`}
          icon={Upload}
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
            <p className="text-sm text-muted-foreground">
              {totalRegistros} registros encontrados para hoje
            </p>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="data-table-header">Data</TableHead>
                  <TableHead className="data-table-header">Hora</TableHead>
                  <TableHead className="data-table-header">Escavadeira</TableHead>
                  <TableHead className="data-table-header">Operador</TableHead>
                  <TableHead className="data-table-header">Caminhão</TableHead>
                  <TableHead className="data-table-header">Motorista</TableHead>
                  <TableHead className="data-table-header text-right">Vol. Unit.</TableHead>
                  <TableHead className="data-table-header text-right">Viagens</TableHead>
                  <TableHead className="data-table-header text-right">Vol. Total</TableHead>
                  <TableHead className="data-table-header">Local</TableHead>
                  <TableHead className="data-table-header">Material</TableHead>
                  <TableHead className="data-table-header">Apontador</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cargaData && cargaData.length > 0 ? (
                  cargaData.slice(0, 50).map((row, idx) => (
                    <TableRow key={idx} className="data-table-row">
                      <TableCell className="font-medium">{row.Data}</TableCell>
                      <TableCell>{row.Hora_Carga}</TableCell>
                      <TableCell>
                        <div>
                          <span className="font-medium">{row.Prefixo_Eq}</span>
                          <p className="text-xs text-muted-foreground">{row.Descricao_Eq}</p>
                        </div>
                      </TableCell>
                      <TableCell>{row.Operador}</TableCell>
                      <TableCell>
                        <div>
                          <span className="font-medium">{row.Prefixo_Cb}</span>
                          <p className="text-xs text-muted-foreground">{row.Descricao_Cb}</p>
                        </div>
                      </TableCell>
                      <TableCell>{row.Motorista}</TableCell>
                      <TableCell className="text-right">{row.Volume} m³</TableCell>
                      <TableCell className="text-right">{row.N_Viagens}</TableCell>
                      <TableCell className="text-right font-semibold">{row.Volume_Total} m³</TableCell>
                      <TableCell>
                        <span className="status-badge bg-primary/10 text-primary">{row.Local_da_Obra}</span>
                      </TableCell>
                      <TableCell>
                        <span className="status-badge bg-accent/10 text-accent">{row.Material}</span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{row.Usuario}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={12} className="h-24 text-center text-muted-foreground">
                      Nenhum registro encontrado para hoje
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {cargaData && cargaData.length > 50 && (
            <div className="border-t border-border/50 px-4 py-3 text-center text-sm text-muted-foreground">
              Exibindo 50 de {cargaData.length} registros
            </div>
          )}
        </div>
      )}
    </div>
  );
}
