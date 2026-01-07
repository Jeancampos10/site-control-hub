import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { CargaRow } from "@/hooks/useGoogleSheets";
import { useMemo } from "react";

interface LocalChartProps {
  cargaData: CargaRow[];
}

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export function LocalChart({ cargaData }: LocalChartProps) {
  const chartData = useMemo(() => {
    const grouped: Record<string, number> = {};

    cargaData.forEach(row => {
      const local = row.Local_da_Obra || 'Outros';
      const volume = parseFloat(row.Volume_Total) || 0;

      grouped[local] = (grouped[local] || 0) + volume;
    });

    const total = Object.values(grouped).reduce((a, b) => a + b, 0);

    return Object.entries(grouped)
      .map(([name, value]) => ({
        name,
        value: Math.round(value),
        percentage: total > 0 ? Math.round((value / total) * 100) : 0,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [cargaData]);

  return (
    <div className="chart-container animate-slide-up">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-foreground">Produção por Local</h3>
        <p className="text-sm text-muted-foreground">Distribuição de volume por área (m³)</p>
      </div>
      <div className="h-[300px]">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={3}
                dataKey="value"
              >
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  boxShadow: "var(--shadow-lg)",
                }}
                formatter={(value: number) => [`${value.toLocaleString('pt-BR')} m³`, "Volume"]}
              />
              <Legend
                layout="vertical"
                verticalAlign="middle"
                align="right"
                wrapperStyle={{ fontSize: 12 }}
                iconType="circle"
                iconSize={8}
              />
            </PieChart>
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
