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
  const chartData = useMemo(() => {
    const grouped: Record<string, Record<string, number>> = {};

    cargaData.forEach(row => {
      const escavadeira = row.Prefixo_Eq;
      const material = row.Material || 'Outros';
      const volume = parseFloat(row.Volume_Total) || 0;

      if (!escavadeira) return;

      if (!grouped[escavadeira]) {
        grouped[escavadeira] = {};
      }
      grouped[escavadeira][material] = (grouped[escavadeira][material] || 0) + volume;
    });

    return Object.entries(grouped).slice(0, 6).map(([escavadeira, materiais]) => ({
      escavadeira,
      ...materiais,
    }));
  }, [cargaData]);

  // Get unique materials for bars
  const materials = useMemo(() => {
    const mats = new Set<string>();
    chartData.forEach(d => {
      Object.keys(d).forEach(k => {
        if (k !== 'escavadeira') mats.add(k);
      });
    });
    return Array.from(mats).slice(0, 4);
  }, [chartData]);

  const colors = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
  ];

  return (
    <div className="chart-container animate-slide-up">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-foreground">Produção por Escavadeira</h3>
        <p className="text-sm text-muted-foreground">Volume movimentado por material (m³)</p>
      </div>
      <div className="h-[300px]">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="escavadeira"
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  boxShadow: "var(--shadow-lg)",
                }}
                labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
                formatter={(value: number) => [`${value.toFixed(0)} m³`]}
              />
              <Legend
                wrapperStyle={{ fontSize: 12 }}
                iconType="circle"
                iconSize={8}
              />
              {materials.map((material, idx) => (
                <Bar
                  key={material}
                  dataKey={material}
                  name={material}
                  fill={colors[idx % colors.length]}
                  radius={[4, 4, 0, 0]}
                />
              ))}
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
