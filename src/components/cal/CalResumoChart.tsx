import { useMemo } from "react";
import { MovCalRow } from "@/hooks/useGoogleSheets";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { parsePtBrNumber } from "@/lib/utils";
import { ArrowDownToLine, ArrowUpFromLine, TrendingDown, TrendingUp, DollarSign, Truck } from "lucide-react";

interface CalResumoChartProps {
  data: MovCalRow[];
}

export function CalResumoChart({ data }: CalResumoChartProps) {
  const resumoData = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        totalEntradas: 0,
        totalSaidas: 0,
        totalValor: 0,
        totalFrete: 0,
      };
    }

    let totalEntradas = 0;
    let totalSaidas = 0;
    let totalValor = 0;
    let totalFrete = 0;

    data.forEach(mov => {
      const quantidade = parsePtBrNumber(mov.Qtd);
      const valor = parsePtBrNumber(mov.Valor);
      const frete = parsePtBrNumber(mov.Frete);
      const tipo = mov.Tipo?.trim().toLowerCase();

      // Verifica se contém "entrada" no tipo
      if (tipo?.includes('entrada')) {
        totalEntradas += quantidade;
      } 
      // Verifica se contém "saída" ou "saida" no tipo
      else if (tipo?.includes('saída') || tipo?.includes('saida')) {
        totalSaidas += quantidade;
      }

      totalValor += valor;
      totalFrete += frete;
    });

    return {
      totalEntradas,
      totalSaidas,
      totalValor,
      totalFrete,
    };
  }, [data]);

  if (!data || data.length === 0) {
    return null;
  }

  const diferenca = resumoData.totalEntradas - resumoData.totalSaidas;
  const valorTotal = resumoData.totalValor + resumoData.totalFrete;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumo Total do Período (toneladas)</CardTitle>
        <CardDescription>Distribuição de entradas, saídas, valores e frete de todo o período</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {/* Total Entradas */}
          <div className="rounded-xl bg-success p-4 text-success-foreground shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <ArrowDownToLine className="h-4 w-4" />
              <p className="text-sm font-medium opacity-90">Total Entradas</p>
            </div>
            <p className="text-2xl font-bold">
              {resumoData.totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs font-medium opacity-80">toneladas</p>
          </div>

          {/* Total Saídas */}
          <div className="rounded-xl bg-destructive p-4 text-destructive-foreground shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <ArrowUpFromLine className="h-4 w-4" />
              <p className="text-sm font-medium opacity-90">Total Saídas</p>
            </div>
            <p className="text-2xl font-bold">
              {resumoData.totalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs font-medium opacity-80">toneladas</p>
          </div>

          {/* Diferença */}
          <div className={`rounded-xl p-4 shadow-lg ${
            diferenca >= 0 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-warning text-warning-foreground'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {diferenca >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              <p className="text-sm font-medium opacity-90">Diferença</p>
            </div>
            <p className="text-2xl font-bold">
              {diferenca.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs font-medium opacity-80">toneladas</p>
          </div>

          {/* Valor */}
          <div className="rounded-xl bg-accent p-4 text-accent-foreground shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4" />
              <p className="text-sm font-medium opacity-90">Valor Total</p>
            </div>
            <p className="text-2xl font-bold">
              R$ {resumoData.totalValor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs font-medium opacity-80">materiais</p>
          </div>

          {/* Frete */}
          <div className="rounded-xl bg-info p-4 text-info-foreground shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <Truck className="h-4 w-4" />
              <p className="text-sm font-medium opacity-90">Total Frete</p>
            </div>
            <p className="text-2xl font-bold">
              R$ {resumoData.totalFrete.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs font-medium opacity-80">transporte</p>
          </div>

          {/* Valor + Frete */}
          <div className="rounded-xl bg-gradient-to-br from-primary to-accent p-4 text-primary-foreground shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4" />
              <p className="text-sm font-medium opacity-90">Valor + Frete</p>
            </div>
            <p className="text-2xl font-bold">
              R$ {valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs font-medium opacity-80">total geral</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
