import { useState } from "react";
import { useGoogleSheets, filterByDate, MovCalRow, EstoqueCalRow } from "@/hooks/useGoogleSheets";
import { DateFilter } from "@/components/shared/DateFilter";
import { KPICard } from "@/components/dashboard/KPICard";
import { CalMovimentacaoTable } from "@/components/cal/CalMovimentacaoTable";
import { CalEstoqueTable } from "@/components/cal/CalEstoqueTable";
import { CalEstoqueChart } from "@/components/cal/CalEstoqueChart";
import { 
  Package, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  Warehouse,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ErrorState } from "@/components/ui/error-state";

export default function Cal() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  const { data: movimentacoes, isLoading: loadingMov, error: errorMov } = useGoogleSheets<MovCalRow>('mov_cal');
  const { data: estoque, isLoading: loadingEstoque, error: errorEstoque } = useGoogleSheets<EstoqueCalRow>('estoque_cal');

  const isLoading = loadingMov || loadingEstoque;
  const hasError = errorMov || errorEstoque;

  // Filtrar movimentações por data
  const filteredMovimentacoes = filterByDate(movimentacoes, selectedDate);

  // Calcular KPIs
  const calcularKPIs = () => {
    if (!filteredMovimentacoes || filteredMovimentacoes.length === 0) {
      return {
        totalEntradas: 0,
        totalSaidas: 0,
        saldoMovimentacao: 0,
        quantidadeOperacoes: 0,
      };
    }

    let totalEntradas = 0;
    let totalSaidas = 0;

    filteredMovimentacoes.forEach(mov => {
      const quantidade = parseFloat(mov.Quantidade?.replace(',', '.') || '0');
      const tipo = mov.Tipo?.toLowerCase().trim();
      
      if (tipo === 'entrada') {
        totalEntradas += quantidade;
      } else if (tipo === 'saída' || tipo === 'saida') {
        totalSaidas += quantidade;
      }
    });

    return {
      totalEntradas,
      totalSaidas,
      saldoMovimentacao: totalEntradas - totalSaidas,
      quantidadeOperacoes: filteredMovimentacoes.length,
    };
  };

  const calcularEstoque = () => {
    if (!estoque || estoque.length === 0) {
      return {
        estoqueAtual: 0,
        estoqueAnterior: 0,
        ultimaAtualizacao: '-',
      };
    }

    // Pegar o último registro de estoque
    const ultimoEstoque = estoque[estoque.length - 1];
    const estoqueAtual = parseFloat(ultimoEstoque?.Estoque_Atual?.replace(',', '.') || '0');
    const estoqueAnterior = parseFloat(ultimoEstoque?.Estoque_Anterior?.replace(',', '.') || '0');

    return {
      estoqueAtual,
      estoqueAnterior,
      ultimaAtualizacao: ultimoEstoque?.Data || '-',
    };
  };

  const kpis = calcularKPIs();
  const estoqueInfo = calcularEstoque();

  if (hasError) {
    return (
      <div className="p-6">
        <ErrorState message="Erro ao carregar dados do CAL" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Controle de CAL</h1>
          <p className="text-sm text-muted-foreground">
            Gestão de estoque e movimentações de CAL
          </p>
        </div>
        <DateFilter date={selectedDate} onDateChange={setSelectedDate} />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KPICard
              title="Estoque Atual"
              value={estoqueInfo.estoqueAtual.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
              subtitle={`Atualizado em ${estoqueInfo.ultimaAtualizacao}`}
              icon={Warehouse}
              variant="primary"
            />
            <KPICard
              title="Estoque Anterior"
              value={estoqueInfo.estoqueAnterior.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
              subtitle="Período anterior"
              icon={Package}
              variant="default"
            />
            <KPICard
              title="Total Entradas"
              value={kpis.totalEntradas.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
              subtitle={`${selectedDate ? 'No dia selecionado' : 'Todas as entradas'}`}
              icon={ArrowDownToLine}
              variant="success"
            />
            <KPICard
              title="Total Saídas"
              value={kpis.totalSaidas.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
              subtitle={`${selectedDate ? 'No dia selecionado' : 'Todas as saídas'}`}
              icon={ArrowUpFromLine}
              variant="accent"
            />
          </div>

          {/* Saldo e Operações */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  {kpis.saldoMovimentacao >= 0 ? (
                    <TrendingUp className="h-5 w-5 text-success" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-destructive" />
                  )}
                  Saldo de Movimentação
                </CardTitle>
                <CardDescription>
                  Diferença entre entradas e saídas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className={`text-3xl font-bold ${kpis.saldoMovimentacao >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {kpis.saldoMovimentacao >= 0 ? '+' : ''}{kpis.saldoMovimentacao.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Quantidade de Operações</CardTitle>
                <CardDescription>
                  Total de movimentações registradas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-foreground">
                  {kpis.quantidadeOperacoes}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico de Estoque */}
          <CalEstoqueChart data={estoque || []} />

          {/* Tabs com Tabelas */}
          <Tabs defaultValue="movimentacoes" className="space-y-4">
            <TabsList>
              <TabsTrigger value="movimentacoes">Movimentações</TabsTrigger>
              <TabsTrigger value="estoque">Histórico de Estoque</TabsTrigger>
            </TabsList>
            <TabsContent value="movimentacoes">
              <CalMovimentacaoTable data={filteredMovimentacoes} />
            </TabsContent>
            <TabsContent value="estoque">
              <CalEstoqueTable data={estoque || []} />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
