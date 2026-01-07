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

const data = [
  { escavadeira: "EX-001", rachao: 45, botafora: 32, argila: 18 },
  { escavadeira: "EX-002", rachao: 38, botafora: 28, argila: 22 },
  { escavadeira: "EX-003", rachao: 52, botafora: 41, argila: 15 },
  { escavadeira: "EX-004", rachao: 29, botafora: 35, argila: 28 },
  { escavadeira: "EX-005", rachao: 41, botafora: 22, argila: 31 },
];

export function ProductionChart() {
  return (
    <div className="chart-container animate-slide-up">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-foreground">Produção por Escavadeira</h3>
        <p className="text-sm text-muted-foreground">Volume movimentado por material (m³)</p>
      </div>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
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
            />
            <Legend
              wrapperStyle={{ fontSize: 12 }}
              iconType="circle"
              iconSize={8}
            />
            <Bar
              dataKey="rachao"
              name="Rachão"
              fill="hsl(var(--chart-1))"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="botafora"
              name="Bota-fora"
              fill="hsl(var(--chart-2))"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="argila"
              name="Argila"
              fill="hsl(var(--chart-3))"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
