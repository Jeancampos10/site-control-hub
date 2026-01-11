import { useMemo } from "react";
import { Package, RefreshCw, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useGoogleSheets } from "@/hooks/useGoogleSheets";
import { transformGeralData, type GeralRecord } from "@/lib/abastech/sheetsDataTransform";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function Estoques() {
  const { data: geralData, isLoading, refetch } = useGoogleSheets('Geral');

  const geral = useMemo<GeralRecord[]>(() => {
    if (!geralData) return [];
    return transformGeralData(geralData);
  }, [geralData]);

  const chartData = useMemo(() => geral.slice(-10).map(item => ({ data: item.data, estoque: item.estoqueAtual })), [geral]);

  const stats = useMemo(() => {
    const ultimo = geral[geral.length - 1];
    const penultimo = geral.length > 1 ? geral[geral.length - 2] : null;
    const estoqueAtual = ultimo?.estoqueAtual || 0;
    const estoqueAnterior = penultimo?.estoqueAtual || estoqueAtual;
    const variacao = estoqueAnterior > 0 ? ((estoqueAtual - estoqueAnterior) / estoqueAnterior) * 100 : 0;
    return { estoqueAtual, variacao };
  }, [geral]);

  const formatNumber = (num: number) => new Intl.NumberFormat('pt-BR').format(Math.round(num));

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Package className="h-6 w-6 text-blue-500" />
            Estoques
          </h1>
          <p className="text-muted-foreground">Controle de níveis de combustível</p>
        </div>
        <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Estoque Atual</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <LoadingSpinner size="sm" /> : (
            <>
              <div className="text-2xl font-bold">{formatNumber(stats.estoqueAtual)} L</div>
              <div className="flex items-center text-xs text-muted-foreground">
                {stats.variacao >= 0 ? <TrendingUp className="mr-1 h-3 w-3 text-green-500" /> : <TrendingDown className="mr-1 h-3 w-3 text-red-500" />}
                <span className={stats.variacao >= 0 ? 'text-green-600' : 'text-red-600'}>{stats.variacao >= 0 ? '+' : ''}{stats.variacao.toFixed(1)}%</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Evolução do Estoque</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <div className="flex justify-center py-12"><LoadingSpinner /></div> : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="data" fontSize={12} />
                <YAxis fontSize={12} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => [`${formatNumber(v)} L`, 'Estoque']} />
                <Line type="monotone" dataKey="estoque" stroke="hsl(var(--primary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Movimentações Recentes</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <div className="flex justify-center py-12"><LoadingSpinner /></div> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Estoque Anterior</TableHead>
                  <TableHead className="text-right">Entrada</TableHead>
                  <TableHead className="text-right">Saída</TableHead>
                  <TableHead className="text-right">Estoque Atual</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {geral.slice(-10).reverse().map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.data}</TableCell>
                    <TableCell className="text-right">{formatNumber(item.estoqueAnterior)} L</TableCell>
                    <TableCell className="text-right text-green-600">{item.entrada > 0 ? `+${formatNumber(item.entrada)} L` : '-'}</TableCell>
                    <TableCell className="text-right text-orange-600">{item.saida > 0 ? `-${formatNumber(item.saida)} L` : '-'}</TableCell>
                    <TableCell className="text-right font-medium">{formatNumber(item.estoqueAtual)} L</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
