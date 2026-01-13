import { useEffect, useMemo, useState } from "react";
import { Droplets, Download, MoreHorizontal, Pencil, Trash2, RefreshCw, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { KPICard } from "@/components/dashboard/KPICard";
import { Truck, Activity } from "lucide-react";
import { useGoogleSheets, CaminhaoPipaRow } from "@/hooks/useGoogleSheets";
import { useApontamentosPipa, useCreateApontamentoPipa, useSyncPendingApontamentos } from "@/hooks/useApontamentosPipa";
import { TableLoader } from "@/components/ui/loading-spinner";
import { ErrorState } from "@/components/ui/error-state";
import { DateFilter } from "@/components/shared/DateFilter";
import { NovoApontamentoDialog } from "@/components/pipas/NovoApontamentoDialog";
import { ApontamentoEditDialog } from "@/components/pipas/ApontamentoEditDialog";
import { ApontamentoDeleteDialog } from "@/components/pipas/ApontamentoDeleteDialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { parsePtBrNumber } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Pipas() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [importAttempted, setImportAttempted] = useState(false);
  
  // Fetch from database
  const { data: dbData, isLoading: isLoadingDb, error: errorDb, refetch } = useApontamentosPipa();
  const { data: pipasData, isLoading: isLoadingPipas } = useGoogleSheets<CaminhaoPipaRow>('caminhao_pipa');
  
  const createMutation = useCreateApontamentoPipa();
  const syncMutation = useSyncPendingApontamentos();

  // Filter data by selected date
  const filteredData = useMemo(() => {
    if (!dbData) return [];
    const selectedDateStr = format(selectedDate, "yyyy-MM-dd");
    return dbData.filter(row => row.data === selectedDateStr);
  }, [dbData, selectedDate]);

  // Count pending sync
  const pendingSyncCount = useMemo(() => {
    if (!dbData) return 0;
    return dbData.filter(row => !row.sincronizado_sheets).length;
  }, [dbData]);

  // Calculate KPIs from filtered data
  const pipasAtivas = new Set(filteredData?.map(row => row.prefixo).filter(Boolean)).size;
  const totalViagens = filteredData?.reduce((acc, row) => acc + (row.n_viagens || 0), 0) || 0;
  const volumeAgua = filteredData?.reduce((acc, row) => {
    const capacidade = parsePtBrNumber(row.capacidade?.replace(/\D/g, '') || '0');
    return acc + (capacidade * (row.n_viagens || 0));
  }, 0) || 0;

  const formattedDate = format(selectedDate, "dd 'de' MMMM", { locale: ptBR });

  const isLoading = isLoadingDb || isLoadingPipas;
  const error = errorDb;

  // Importa da planilha automaticamente na primeira vez (caso o banco esteja vazio)
  useEffect(() => {
    if (importAttempted) return;
    if (isLoadingDb) return;
    if (!dbData) return;
    if (dbData.length > 0) return;

    setImportAttempted(true);

    supabase.functions
      .invoke('sync-apontamento-pipa', { body: { action: 'import' } })
      .then(({ data, error }) => {
        if (error) {
          console.error('Import error:', error);
          return;
        }

        if (data?.imported > 0) {
          toast.success(`${data.imported} registros importados da planilha.`);
        }
      })
      .finally(() => {
        refetch();
      });
  }, [importAttempted, isLoadingDb, dbData, refetch]);

  // Handler to save new apontamento
  const handleSaveApontamento = async (dados: { Data: string; Prefixo: string; N_Viagens: string }) => {
    const pipaInfo = pipasData?.find(p => p.Prefixo === dados.Prefixo);
    
    // Parse date from DD/MM/YYYY to YYYY-MM-DD
    const [day, month, year] = dados.Data.split('/');
    const isoDate = `${year}-${month}-${day}`;
    
    await createMutation.mutateAsync({
      data: isoDate,
      prefixo: dados.Prefixo,
      descricao: pipaInfo?.Descricao,
      empresa: pipaInfo?.Empresa,
      motorista: pipaInfo?.Motorista,
      capacidade: pipaInfo?.Capacidade,
      n_viagens: parseInt(dados.N_Viagens) || 1,
    });
  };

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
        <div className="flex gap-2 flex-wrap">
          <DateFilter date={selectedDate} onDateChange={setSelectedDate} />
          
          {pendingSyncCount > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2 border-warning text-warning hover:bg-warning/10"
                    onClick={() => syncMutation.mutate()}
                    disabled={syncMutation.isPending}
                  >
                    <RefreshCw className={`h-4 w-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
                    Sincronizar ({pendingSyncCount})
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{pendingSyncCount} registro(s) pendente(s) de sincronização com a planilha</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
          <NovoApontamentoDialog 
            pipas={pipasData || []} 
            onSave={handleSaveApontamento}
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Total Viagens com destaque especial */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary to-primary/80 p-5 text-primary-foreground shadow-lg animate-fade-in">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium opacity-90">Total Viagens</p>
              <p className="text-3xl font-bold tracking-tight">{totalViagens}</p>
              <p className="text-xs opacity-80">Hoje</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-foreground/20">
              <Activity className="h-5 w-5" />
            </div>
          </div>
        </div>
        <KPICard
          title="Pipas"
          value={pipasAtivas}
          subtitle="Utilizadas hoje"
          icon={Truck}
          variant="accent"
        />
        <KPICard
          title="Volume Água"
          value={`${volumeAgua.toLocaleString('pt-BR')} L`}
          subtitle="Estimado"
          icon={Droplets}
          variant="success"
        />
      </div>

      {/* Data Table */}
      {isLoading ? (
        <TableLoader />
      ) : error ? (
        <ErrorState 
          message="Não foi possível buscar os dados."
          onRetry={() => refetch()} 
        />
      ) : (
        <div className="chart-container overflow-hidden">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold">Carregamentos do Dia</h3>
            <p className="text-sm text-muted-foreground">{filteredData?.length || 0} registros</p>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="data-table-header w-[40px]">Sync</TableHead>
                  <TableHead className="data-table-header">Data</TableHead>
                  <TableHead className="data-table-header">Prefixo</TableHead>
                  <TableHead className="data-table-header">Descrição</TableHead>
                  <TableHead className="data-table-header">Empresa</TableHead>
                  <TableHead className="data-table-header">Motorista</TableHead>
                  <TableHead className="data-table-header">Capacidade</TableHead>
                  <TableHead className="data-table-header text-right">Viagens</TableHead>
                  <TableHead className="data-table-header w-[70px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData && filteredData.length > 0 ? (
                  filteredData.map((row) => (
                    <TableRow key={row.id} className="data-table-row">
                      <TableCell>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              {row.sincronizado_sheets ? (
                                <CheckCircle2 className="h-4 w-4 text-success" />
                              ) : (
                                <Clock className="h-4 w-4 text-warning" />
                              )}
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{row.sincronizado_sheets ? 'Sincronizado com a planilha' : 'Pendente de sincronização'}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell className="font-medium">
                        {format(new Date(row.data), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-info/20 text-info font-bold text-lg">
                          {row.prefixo}
                        </span>
                      </TableCell>
                      <TableCell>{row.descricao || "-"}</TableCell>
                      <TableCell>{row.empresa || "-"}</TableCell>
                      <TableCell>{row.motorista || "-"}</TableCell>
                      <TableCell>
                        {row.capacidade ? (
                          <span className="status-badge bg-info/10 text-info">{row.capacidade}</span>
                        ) : "-"}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-lg">{row.n_viagens}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-popover">
                            <DropdownMenuItem asChild>
                              <ApontamentoEditDialog 
                                apontamento={row} 
                                pipas={pipasData || []}
                                trigger={
                                  <button className="flex w-full items-center gap-2 px-2 py-1.5 text-sm cursor-pointer">
                                    <Pencil className="h-4 w-4" />
                                    Editar
                                  </button>
                                }
                              />
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <ApontamentoDeleteDialog 
                                apontamento={row}
                                trigger={
                                  <button className="flex w-full items-center gap-2 px-2 py-1.5 text-sm text-destructive cursor-pointer">
                                    <Trash2 className="h-4 w-4" />
                                    Excluir
                                  </button>
                                }
                              />
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                      Nenhum registro encontrado para esta data
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {filteredData && filteredData.length > 50 && (
            <div className="border-t border-border/50 px-4 py-3 text-center text-sm text-muted-foreground">
              Exibindo 50 de {filteredData.length} registros
            </div>
          )}
        </div>
      )}
    </div>
  );
}
