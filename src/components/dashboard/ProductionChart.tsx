import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { CargaRow } from "@/hooks/useGoogleSheets";
import { useMemo } from "react";

interface ProductionChartProps {
  cargaData: CargaRow[];
}

export function ProductionChart({ cargaData }: ProductionChartProps) {
  // Summary chart: total trips per excavator
  const chartData = useMemo(() => {
    const grouped: Record<string, number> = {};

    cargaData.forEach(row => {
      const escavadeira = row.Prefixo_Eq;
      const viagens = parseInt(row.N_Viagens) || 1;

      if (!escavadeira) return;

      grouped[escavadeira] = (grouped[escavadeira] || 0) + viagens;
    });

    return Object.entries(grouped)
      .slice(0, 8)
      .map(([escavadeira, viagens]) => ({
        escavadeira,
        viagens,
      }))
      .sort((a, b) => b.viagens - a.viagens);
  }, [cargaData]);

  return (
    <div className="chart-container animate-slide-up">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-foreground">Produção por Escavadeira</h3>
        <p className="text-sm text-muted-foreground">Total de viagens do dia</p>
      </div>
      <div className="h-[300px]">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="escavadeira"
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
                width={60}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  boxShadow: "var(--shadow-lg)",
                }}
                labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
                formatter={(value: number) => [`${value} viagens`]}
              />
              <Bar
                dataKey="viagens"
                name="Viagens"
                fill="hsl(var(--chart-1))"
                radius={[0, 4, 4, 0]}
                label={{
                  position: 'right',
                  fill: 'hsl(var(--foreground))',
                  fontSize: 12,
                  fontWeight: 600,
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            Carregando dados...
          </div>
        )}
      </div>
    </div>
  );
}
