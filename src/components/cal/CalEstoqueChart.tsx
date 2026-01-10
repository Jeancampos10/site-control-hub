import { EstoqueCalRow } from "@/hooks/useGoogleSheets";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";

interface CalEstoqueChartProps {
  data: EstoqueCalRow[];
}

export function CalEstoqueChart({ data }: CalEstoqueChartProps) {
  if (!data || data.length === 0) {
    return null;
  }

  // Preparar dados para o gráfico
  const chartData = data.map(row => ({
    data: row.Data,
    estoqueAtual: parseFloat(row.Estoque_Atual?.replace(',', '.') || '0'),
    entrada: parseFloat(row.Entrada?.replace(',', '.') || '0'),
    saida: parseFloat(row.Saida?.replace(',', '.') || '0'),
  }));

  // Limitar a últimas 30 entradas para melhor visualização
  const limitedData = chartData.slice(-30);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Gráfico de Evolução do Estoque */}
      <Card>
        <CardHeader>
          <CardTitle>Evolução do Estoque</CardTitle>
          <CardDescription>Variação do estoque ao longo do tempo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={limitedData}>
                <defs>
                  <linearGradient id="colorEstoque" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="data" 
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  formatter={(value: number) => [value.toLocaleString('pt-BR', { maximumFractionDigits: 2 }), 'Estoque']}
                />
                <Area
                  type="monotone"
                  dataKey="estoqueAtual"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorEstoque)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico de Entradas vs Saídas */}
      <Card>
        <CardHeader>
          <CardTitle>Entradas vs Saídas</CardTitle>
          <CardDescription>Comparativo de movimentações</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={limitedData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="data" 
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  formatter={(value: number, name: string) => [
                    value.toLocaleString('pt-BR', { maximumFractionDigits: 2 }),
                    name === 'entrada' ? 'Entrada' : 'Saída'
                  ]}
                />
                <Legend 
                  formatter={(value) => value === 'entrada' ? 'Entrada' : 'Saída'}
                />
                <Bar 
                  dataKey="entrada" 
                  fill="hsl(var(--success))" 
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="saida" 
                  fill="hsl(var(--destructive))" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
