import { useMemo } from "react";
import { MovCalRow } from "@/hooks/useGoogleSheets";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Tooltip, ResponsiveContainer, Cell, Legend } from "recharts";

interface CalResumoChartProps {
  data: MovCalRow[];
}

export function CalResumoChart({ data }: CalResumoChartProps) {
  const resumoData = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        porTipo: [],
        totalEntradas: 0,
        totalSaidas: 0,
      };
    }

    let totalEntradas = 0;
    let totalSaidas = 0;

    const parseNumber = (value: string | undefined): number => {
      if (!value || value.trim() === "") return 0;
      const cleaned = value
        .replace(/[^0-9,.-]/g, "")
        .trim();

      const normalized = cleaned.includes(",")
        ? cleaned.replace(/\./g, "").replace(",", ".")
        : cleaned;

      const num = parseFloat(normalized);
      return Number.isFinite(num) ? num : 0;
    };

    data.forEach(mov => {
      const quantidade = parseNumber(mov.Qtd);
      const tipo = mov.Tipo?.toLowerCase().trim();

      if (tipo === 'entrada' || tipo === 'compra') {
        totalEntradas += quantidade;
      } else if (tipo === 'saída' || tipo === 'saida' || tipo === 'consumo') {
        totalSaidas += quantidade;
      }
    });

    const porTipo = [
      { name: 'Entradas', value: totalEntradas, color: 'hsl(var(--success))' },
      { name: 'Saídas', value: totalSaidas, color: 'hsl(var(--destructive))' },
    ];

    return {
      porTipo,
      totalEntradas,
      totalSaidas,
    };
  }, [data]);

  if (!data || data.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumo Total do Período (toneladas)</CardTitle>
        <CardDescription>Distribuição de entradas e saídas de todo o período em toneladas</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Gráfico */}
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={resumoData.porTipo}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} t`}
                >
                  {resumoData.porTipo.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [`${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} t`, '']}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Totais com destaque */}
          <div className="flex flex-col justify-center gap-6">
            <div className="rounded-xl bg-success p-6 text-success-foreground shadow-lg">
              <p className="text-lg font-medium opacity-90">Total Entradas</p>
              <p className="text-4xl font-bold">
                {resumoData.totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-lg font-medium opacity-90">toneladas</p>
            </div>
            <div className="rounded-xl bg-destructive p-6 text-destructive-foreground shadow-lg">
              <p className="text-lg font-medium opacity-90">Total Saídas</p>
              <p className="text-4xl font-bold">
                {resumoData.totalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-lg font-medium opacity-90">toneladas</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
