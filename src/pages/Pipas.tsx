import { useState, useMemo } from "react";
import { Droplets, Download } from "lucide-react";
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
import { Truck, Activity } from "lucide-react";
import { useGoogleSheets, ApontamentoPipaRow, CaminhaoPipaRow, filterByDate } from "@/hooks/useGoogleSheets";
import { TableLoader } from "@/components/ui/loading-spinner";
import { ErrorState } from "@/components/ui/error-state";
import { DateFilter } from "@/components/shared/DateFilter";
import { NovoApontamentoDialog } from "@/components/pipas/NovoApontamentoDialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { parsePtBrNumber } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function Pipas() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const queryClient = useQueryClient();
  const { data: allData, isLoading, error, refetch } = useGoogleSheets<ApontamentoPipaRow>('apontamento_pipa');
  const { data: pipasData, isLoading: isLoadingPipas } = useGoogleSheets<CaminhaoPipaRow>('caminhao_pipa');

  // Filter data by selected date
  const filteredData = useMemo(() => {
    return filterByDate(allData, selectedDate);
  }, [allData, selectedDate]);

  // Calculate KPIs from filtered data
  const pipasAtivas = new Set(filteredData?.map(row => row.Prefixo).filter(Boolean)).size;
  const totalViagens = filteredData?.reduce((acc, row) => {
    const viagens = parsePtBrNumber(row.N_Viagens);
    return acc + viagens;
  }, 0) || 0;
  const volumeAgua = filteredData?.reduce((acc, row) => {
    const capacidade = parsePtBrNumber(row.Capacidade?.replace(/\D/g, ''));
    const viagens = parsePtBrNumber(row.N_Viagens);
    return acc + (capacidade * viagens);
  }, 0) || 0;

  const formattedDate = format(selectedDate, "dd 'de' MMMM", { locale: ptBR });

  // Mutation to save new apontamento to database
  const saveApontamentoMutation = useMutation({
    mutationFn: async (dados: { Data: string; Prefixo: string; N_Viagens: string }) => {
      const pipaInfo = pipasData?.find(p => p.Prefixo === dados.Prefixo);
      
      // Parse date from DD/MM/YYYY to YYYY-MM-DD
      const [day, month, year] = dados.Data.split('/');
      const isoDate = `${year}-${month}-${day}`;
      
      const { data, error } = await supabase
        .from('apontamentos_pipa')
        .insert({
          data: isoDate,
          prefixo: dados.Prefixo,
          descricao: pipaInfo?.Descricao || null,
          empresa: pipaInfo?.Empresa || null,
          motorista: pipaInfo?.Motorista || null,
          capacidade: pipaInfo?.Capacidade || null,
          n_viagens: parseInt(dados.N_Viagens) || 1,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['google-sheets', 'apontamento_pipa'] });
      refetch();
    },
  });

  // Handler to save new apontamento
  const handleSaveApontamento = async (dados: { Data: string; Prefixo: string; N_Viagens: string }) => {
    await saveApontamentoMutation.mutateAsync(dados);
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
        <div className="flex gap-2">
          <DateFilter date={selectedDate} onDateChange={setSelectedDate} />
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
      {isLoading || isLoadingPipas ? (
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
            <p className="text-sm text-muted-foreground">{filteredData?.length || 0} registros</p>
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
                  <TableHead className="data-table-header text-right">Viagens</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData && filteredData.length > 0 ? (
                  filteredData.map((row, idx) => (
                    <TableRow key={idx} className="data-table-row">
                      <TableCell className="font-medium">{row.Data}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-info/20 text-info font-bold text-lg">
                          {row.Prefixo}
                        </span>
                      </TableCell>
                      <TableCell>{row.Descricao}</TableCell>
                      <TableCell>{row.Empresa}</TableCell>
                      <TableCell>{row.Motorista}</TableCell>
                      <TableCell>
                        <span className="status-badge bg-info/10 text-info">{row.Capacidade}</span>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-lg">{row.N_Viagens}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
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
