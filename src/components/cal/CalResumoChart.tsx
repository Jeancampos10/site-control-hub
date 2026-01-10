import { useMemo } from "react";
import { MovCalRow } from "@/hooks/useGoogleSheets";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from "recharts";

interface CalResumoChartProps {
  data: MovCalRow[];
}

export function CalResumoChart({ data }: CalResumoChartProps) {
  const resumoData = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        porFornecedor: [],
        porTipo: [],
        totalEntradas: 0,
        totalSaidas: 0,
      };
    }

    // Agrupar por fornecedor
    const fornecedorMap = new Map<string, { entradas: number; saidas: number; valor: number }>();
    let totalEntradas = 0;
    let totalSaidas = 0;

    data.forEach(mov => {
      const fornecedor = mov.Fornecedor?.trim() || 'Não informado';
      const quantidade = parseFloat(mov.Qtd?.replace(',', '.') || '0');
      const valor = parseFloat(mov.Valor?.replace(',', '.') || '0');
      const tipo = mov.Tipo?.toLowerCase().trim();

      if (!fornecedorMap.has(fornecedor)) {
        fornecedorMap.set(fornecedor, { entradas: 0, saidas: 0, valor: 0 });
      }

      const current = fornecedorMap.get(fornecedor)!;
      current.valor += valor;

      if (tipo === 'entrada' || tipo === 'compra') {
        current.entradas += quantidade;
        totalEntradas += quantidade;
      } else if (tipo === 'saída' || tipo === 'saida' || tipo === 'consumo') {
        current.saidas += quantidade;
        totalSaidas += quantidade;
      }
    });

    const porFornecedor = Array.from(fornecedorMap.entries())
      .map(([nome, dados]) => ({
        nome: nome.length > 15 ? nome.substring(0, 15) + '...' : nome,
        nomeCompleto: nome,
        entradas: dados.entradas,
        saidas: dados.saidas,
        valor: dados.valor,
      }))
      .sort((a, b) => (b.entradas + b.saidas) - (a.entradas + a.saidas))
      .slice(0, 10);

    const porTipo = [
      { name: 'Entradas', value: totalEntradas, color: 'hsl(var(--success))' },
      { name: 'Saídas', value: totalSaidas, color: 'hsl(var(--destructive))' },
    ];

    return {
      porFornecedor,
      porTipo,
      totalEntradas,
      totalSaidas,
    };
  }, [data]);

  if (!data || data.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Resumo Total do Período */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo Total do Período</CardTitle>
          <CardDescription>Distribuição de entradas e saídas de todo o período</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={resumoData.porTipo}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
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
                  formatter={(value: number) => [value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), '']}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 text-center">
            <div className="rounded-lg bg-success/10 p-3">
              <p className="text-sm text-muted-foreground">Total Entradas</p>
              <p className="text-2xl font-bold text-success">
                {resumoData.totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="rounded-lg bg-destructive/10 p-3">
              <p className="text-sm text-muted-foreground">Total Saídas</p>
              <p className="text-2xl font-bold text-destructive">
                {resumoData.totalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Por Fornecedor */}
      <Card>
        <CardHeader>
          <CardTitle>Movimentação por Fornecedor</CardTitle>
          <CardDescription>Top 10 fornecedores com mais movimentações</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={resumoData.porFornecedor} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                <YAxis 
                  type="category" 
                  dataKey="nome" 
                  tick={{ fontSize: 11 }} 
                  width={100}
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
                    value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                    name === 'entradas' ? 'Entradas' : 'Saídas'
                  ]}
                  labelFormatter={(label, payload) => {
                    if (payload && payload[0]) {
                      return payload[0].payload.nomeCompleto;
                    }
                    return label;
                  }}
                />
                <Legend formatter={(value) => value === 'entradas' ? 'Entradas' : 'Saídas'} />
                <Bar dataKey="entradas" fill="hsl(var(--success))" radius={[0, 4, 4, 0]} />
                <Bar dataKey="saidas" fill="hsl(var(--destructive))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
