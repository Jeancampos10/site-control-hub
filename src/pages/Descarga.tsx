import { useState, useMemo } from "react";
import { Download, Plus, FileDown, Edit, History } from "lucide-react";
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
import { useGoogleSheets, DescargaRow, filterByDate } from "@/hooks/useGoogleSheets";
import { useGoogleSheetsUpdate } from "@/hooks/useGoogleSheetsUpdate";
import { TableLoader } from "@/components/ui/loading-spinner";
import { ErrorState } from "@/components/ui/error-state";
import { DateFilter } from "@/components/shared/DateFilter";
import { BulkEditDialog, FilterOption, EditableField } from "@/components/shared/BulkEditDialog";
import { BulkEditHistoryDialog } from "@/components/shared/BulkEditHistoryDialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Descarga() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [highlightedLogId, setHighlightedLogId] = useState<string | null>(null);
  const { data: allDescargaData, isLoading, error, refetch } = useGoogleSheets<DescargaRow>('descarga');
  const { mutateAsync: updateSheet } = useGoogleSheetsUpdate<DescargaRow>();

  // Helper to get field value
  const getFieldValue = (row: DescargaRow, field: string): string => {
    return (row as unknown as Record<string, string>)[field] || "";
  };

  // Filter options for bulk edit
  const filterOptions: FilterOption[] = useMemo(() => [
    { key: "Prefixo_Cb", label: "Caminhão", values: [] },
    { key: "Material", label: "Material", values: [] },
    { key: "Local_da_Obra", label: "Local", values: [] },
    { key: "Empresa_Cb", label: "Empresa", values: [] },
  ], []);

  // Editable fields for bulk edit
  const editableFields: EditableField[] = useMemo(() => [
    { key: "Motorista", label: "Motorista", type: "text" },
    { key: "Material", label: "Material", type: "select" },
    { key: "Local_da_Obra", label: "Local da Obra", type: "select" },
    { key: "Estaca", label: "Estaca", type: "text" },
    { key: "Observacao", label: "Observação", type: "text" },
  ], []);

  const handleBulkSave = async (
    filters: Record<string, string>,
    updates: Record<string, string>,
    affectedRows: DescargaRow[]
  ) => {
    const result = await updateSheet({
      sheetName: "descarga",
      filters,
      updates,
      affectedRows,
    });
    return result;
  };

  const handleBulkSaveComplete = (logId: string) => {
    setHighlightedLogId(logId);
    setHistoryOpen(true);
  };

  // Filter data by selected date
  const descargaData = useMemo(() => {
    return filterByDate(allDescargaData, selectedDate);
  }, [allDescargaData, selectedDate]);

  // Calculate KPIs from filtered data
  const totalRegistros = descargaData?.length || 0;
  const totalViagens = descargaData?.reduce((acc, row) => {
    const viagens = parseInt(row.N_Viagens) || 0;
    return acc + viagens;
  }, 0) || 0;
  const volumeTotal = descargaData?.reduce((acc, row) => {
    const vol = parseFloat(row.Volume_Total) || 0;
    return acc + vol;
  }, 0) || 0;
  const locaisAtivos = new Set(descargaData?.map(row => row.Local_da_Obra).filter(Boolean)).size;
  const caminhoesAtivos = new Set(descargaData?.map(row => row.Prefixo_Cb).filter(Boolean)).size;

  const formattedDate = format(selectedDate, "dd 'de' MMMM", { locale: ptBR });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="page-header mb-0">
          <h1 className="page-title flex items-center gap-2">
            <Download className="h-6 w-6 text-info" />
            Registro de Descarga
          </h1>
          <p className="page-subtitle">
            Acompanhamento de descargas • {formattedDate}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <DateFilter date={selectedDate} onDateChange={setSelectedDate} />
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2"
            onClick={() => setBulkEditOpen(true)}
          >
            <Edit className="h-4 w-4" />
            Editar Lote
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2"
            onClick={() => setHistoryOpen(true)}
          >
            <History className="h-4 w-4" />
            Histórico
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <FileDown className="h-4 w-4" />
            Exportar
          </Button>
          <Button size="sm" className="gap-2 bg-gradient-accent text-accent-foreground hover:opacity-90">
            <Plus className="h-4 w-4" />
            Nova Descarga
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Viagens com destaque especial */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary to-primary/80 p-5 text-primary-foreground shadow-lg animate-fade-in">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium opacity-90">Total Viagens</p>
              <p className="text-3xl font-bold tracking-tight">{totalViagens}</p>
              <p className="text-xs opacity-80">Hoje</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-foreground/20">
              <Truck className="h-5 w-5" />
            </div>
          </div>
        </div>
        <KPICard
          title="Descargas Hoje"
          value={totalRegistros}
          subtitle="Registros"
          icon={Activity}
          variant="accent"
        />
        <KPICard
          title="Volume Total"
          value={`${volumeTotal.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} m³`}
          subtitle="Descarregado"
          icon={Box}
          variant="success"
        />
        <KPICard
          title="Locais Ativos"
          value={locaisAtivos}
          subtitle={`${caminhoesAtivos} caminhões`}
          icon={Download}
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
              {totalRegistros} registros encontrados
            </p>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="data-table-header">Data</TableHead>
                  <TableHead className="data-table-header">Hora</TableHead>
                  <TableHead className="data-table-header">Caminhão</TableHead>
                  <TableHead className="data-table-header">Empresa</TableHead>
                  <TableHead className="data-table-header">Motorista</TableHead>
                  <TableHead className="data-table-header text-right">Vol. Unit.</TableHead>
                  <TableHead className="data-table-header text-right">Viagens</TableHead>
                  <TableHead className="data-table-header text-right">Vol. Total</TableHead>
                  <TableHead className="data-table-header">Local</TableHead>
                  <TableHead className="data-table-header">Estaca</TableHead>
                  <TableHead className="data-table-header">Material</TableHead>
                  <TableHead className="data-table-header">Apontador</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {descargaData && descargaData.length > 0 ? (
                  descargaData.slice(0, 50).map((row, idx) => (
                    <TableRow key={idx} className="data-table-row">
                      <TableCell className="font-medium">{row.Data}</TableCell>
                      <TableCell>{row.Hora}</TableCell>
                      <TableCell className="font-medium">{row.Prefixo_Cb}</TableCell>
                      <TableCell>{row.Empresa_Cb}</TableCell>
                      <TableCell>{row.Motorista}</TableCell>
                      <TableCell className="text-right">{row.Volume} m³</TableCell>
                      <TableCell className="text-right">{row.N_Viagens}</TableCell>
                      <TableCell className="text-right font-semibold">{row.Volume_Total} m³</TableCell>
                      <TableCell>
                        <span className="status-badge bg-primary/10 text-primary">{row.Local_da_Obra}</span>
                      </TableCell>
                      <TableCell>{row.Estaca}</TableCell>
                      <TableCell>
                        <span className="status-badge bg-accent/10 text-accent">{row.Material}</span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{row.Usuario}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={12} className="h-24 text-center text-muted-foreground">
                      Nenhum registro encontrado para esta data
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {descargaData && descargaData.length > 50 && (
            <div className="border-t border-border/50 px-4 py-3 text-center text-sm text-muted-foreground">
              Exibindo 50 de {descargaData.length} registros
            </div>
          )}
        </div>
      )}

      {/* Bulk Edit Dialog */}
      <BulkEditDialog<DescargaRow>
        open={bulkEditOpen}
        onOpenChange={setBulkEditOpen}
        title="Edição em Lote - Descarga"
        description="Altere dados de múltiplos registros de uma só vez"
        data={allDescargaData || []}
        filterOptions={filterOptions}
        editableFields={editableFields}
        onSave={handleBulkSave}
        onSaveComplete={handleBulkSaveComplete}
        dateField="Data"
        getFieldValue={getFieldValue}
      />

      {/* Bulk Edit History Dialog */}
      <BulkEditHistoryDialog
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        sheetName="descarga"
        title="Histórico de Alterações - Descarga"
        highlightedLogId={highlightedLogId}
        onHighlightClear={() => setHighlightedLogId(null)}
      />
    </div>
  );
}
