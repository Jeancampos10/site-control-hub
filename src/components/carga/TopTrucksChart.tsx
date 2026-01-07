import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { CargaRow } from "@/hooks/useGoogleSheets";

interface TopTrucksChartProps {
  cargaData: CargaRow[];
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--accent))',
  'hsl(var(--success))',
  'hsl(var(--warning))',
  'hsl(var(--info))',
  'hsl(var(--primary) / 0.7)',
  'hsl(var(--accent) / 0.7)',
  'hsl(var(--success) / 0.7)',
  'hsl(var(--warning) / 0.7)',
  'hsl(var(--info) / 0.7)',
];

export function TopTrucksChart({ cargaData }: TopTrucksChartProps) {
  const chartData = useMemo(() => {
    const truckViagens = new Map<string, { prefixo: string; viagens: number }>();

    cargaData.forEach(row => {
      const prefixo = row.Prefixo_Cb || 'Sem Prefixo';
      const viagens = parseInt(row.N_Viagens) || 0;

      if (!truckViagens.has(prefixo)) {
        truckViagens.set(prefixo, { prefixo, viagens: 0 });
      }
      truckViagens.get(prefixo)!.viagens += viagens;
    });

    return Array.from(truckViagens.values())
      .sort((a, b) => b.viagens - a.viagens)
      .slice(0, 10);
  }, [cargaData]);

  if (chartData.length === 0) {
    return (
      <div className="chart-container">
        <h3 className="mb-4 font-semibold">Top 10 Caminhões</h3>
        <div className="flex h-[300px] items-center justify-center text-muted-foreground">
          Nenhum dado disponível
        </div>
      </div>
    );
  }

  return (
    <div className="chart-container">
      <h3 className="mb-4 font-semibold">Top 10 Caminhões com Mais Viagens</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 60, right: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
          <YAxis 
            dataKey="prefixo" 
            type="category" 
            stroke="hsl(var(--muted-foreground))" 
            fontSize={11}
            width={55}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
            labelStyle={{ color: 'hsl(var(--foreground))' }}
            formatter={(value: number) => [`${value} viagens`, 'Total']}
          />
          <Bar dataKey="viagens" radius={[0, 4, 4, 0]}>
            {chartData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
