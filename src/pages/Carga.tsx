import { useState, useMemo } from "react";
import { Upload, Download, Edit, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KPICard } from "@/components/dashboard/KPICard";
import { Box, Truck, Activity, Calculator } from "lucide-react";
import { useGoogleSheets, CargaRow, filterByDate } from "@/hooks/useGoogleSheets";
import { useGoogleSheetsUpdate } from "@/hooks/useGoogleSheetsUpdate";
import { TableLoader } from "@/components/ui/loading-spinner";
import { ErrorState } from "@/components/ui/error-state";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ExcavatorProductionTable } from "@/components/carga/ExcavatorProductionTable";
import { TopTrucksChart } from "@/components/carga/TopTrucksChart";
import { TruckProductionTable } from "@/components/carga/TruckProductionTable";
import { DateFilter } from "@/components/shared/DateFilter";
import { BulkEditDialog, FilterOption, EditableField } from "@/components/shared/BulkEditDialog";
import { BulkEditHistoryDialog } from "@/components/shared/BulkEditHistoryDialog";

export default function Carga() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [highlightedLogId, setHighlightedLogId] = useState<string | null>(null);
  const { data: allCargaData, isLoading, error, refetch } = useGoogleSheets<CargaRow>('carga');
  const { mutateAsync: updateSheet } = useGoogleSheetsUpdate<CargaRow>();

  // Helper to get field value
  const getFieldValue = (row: CargaRow, field: string): string => {
    return (row as unknown as Record<string, string>)[field] || "";
  };

  // Filter options for bulk edit
  const filterOptions: FilterOption[] = useMemo(() => [
    { key: "Prefixo_Cb", label: "Caminhão", values: [] },
    { key: "Prefixo_Eq", label: "Escavadeira", values: [] },
    { key: "Material", label: "Material", values: [] },
    { key: "Local_da_Obra", label: "Local", values: [] },
    { key: "Empresa_Cb", label: "Empresa Caminhão", values: [] },
  ], []);

  // Editable fields for bulk edit
  const editableFields: EditableField[] = useMemo(() => [
    { key: "Motorista", label: "Motorista", type: "text" },
    { key: "Operador", label: "Operador", type: "text" },
    { key: "Material", label: "Material", type: "select" },
    { key: "Local_da_Obra", label: "Local da Obra", type: "select" },
    { key: "Estaca", label: "Estaca", type: "text" },
    { key: "Observacao", label: "Observação", type: "text" },
  ], []);

  const handleBulkSave = async (
    filters: Record<string, string>,
    updates: Record<string, string>,
    affectedRows: CargaRow[]
  ) => {
    const result = await updateSheet({
      sheetName: "carga",
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
  const cargaData = useMemo(() => {
    return filterByDate(allCargaData, selectedDate);
  }, [allCargaData, selectedDate]);

  // Calculate KPIs from filtered data
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
  
  const mediaViagensPorCaminhao = caminhoesAtivos > 0 ? totalViagens / caminhoesAtivos : 0;

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
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Viagens"
          value={totalViagens}
          subtitle="Hoje"
          icon={Activity}
          variant="accent"
        />
        <KPICard
          title="Volume Transportado"
          value={`${volumeTotal.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} m³`}
          subtitle="Total"
          icon={Box}
          variant="success"
        />
        <KPICard
          title="Escavadeiras"
          value={escavadeirasAtivas}
          subtitle="Ativas"
          icon={Truck}
          variant="primary"
        />
        <KPICard
          title="Média por Caminhão"
          value={mediaViagensPorCaminhao.toFixed(1)}
          subtitle={`${caminhoesAtivos} caminhões`}
          icon={Calculator}
          variant="default"
        />
      </div>

      {/* Data Section */}
      {isLoading ? (
        <TableLoader />
      ) : error ? (
        <ErrorState 
          message="Não foi possível buscar os dados da planilha."
          onRetry={() => refetch()} 
        />
      ) : (
        <div className="space-y-6">
          {/* Top 10 Trucks Chart */}
          <TopTrucksChart cargaData={cargaData || []} />

          {/* Excavator Production Table */}
          <ExcavatorProductionTable cargaData={cargaData || []} />

          {/* Truck Production Table */}
          <TruckProductionTable cargaData={cargaData || []} />
        </div>
      )}

      {/* Bulk Edit Dialog */}
      <BulkEditDialog<CargaRow>
        open={bulkEditOpen}
        onOpenChange={setBulkEditOpen}
        title="Edição em Lote - Carga"
        description="Altere dados de múltiplos registros de uma só vez"
        data={allCargaData || []}
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
        sheetName="carga"
        title="Histórico de Alterações - Carga"
        highlightedLogId={highlightedLogId}
        onHighlightClear={() => setHighlightedLogId(null)}
      />
    </div>
  );
}
