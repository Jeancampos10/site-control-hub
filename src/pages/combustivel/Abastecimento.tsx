import { useMemo, useState } from "react";
import { Fuel, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useGoogleSheets } from "@/hooks/useGoogleSheets";
import { transformAbastecimentoData, type AbastecimentoRecord } from "@/lib/abastech/sheetsDataTransform";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function Abastecimento() {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: abastecimentoData, isLoading, refetch } = useGoogleSheets<Record<string, string>>('AbastecimentoCanteiro01');

  const abastecimentos = useMemo<AbastecimentoRecord[]>(() => {
    if (!abastecimentoData || !Array.isArray(abastecimentoData)) return [];
    return transformAbastecimentoData(abastecimentoData);
  }, [abastecimentoData]);

  const filteredData = useMemo(() => {
    return abastecimentos.filter(item => 
      item.veiculo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.motorista.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [abastecimentos, searchTerm]);

  const stats = useMemo(() => ({
    totalLitros: filteredData.reduce((sum, item) => sum + item.quantidadeCombustivel, 0),
    totalValor: filteredData.reduce((sum, item) => sum + item.valorTotal, 0),
    registros: filteredData.length,
  }), [filteredData]);

  const formatNumber = (num: number) => new Intl.NumberFormat('pt-BR').format(Math.round(num));
  const formatCurrency = (num: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Fuel className="h-6 w-6 text-orange-500" />
            Abastecimento
          </h1>
          <p className="text-muted-foreground">Registros de abastecimento de combustível</p>
        </div>
        <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Diesel</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <LoadingSpinner size="sm" /> : <div className="text-2xl font-bold text-orange-600">{formatNumber(stats.totalLitros)} L</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Valor Total</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <LoadingSpinner size="sm" /> : <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalValor)}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Registros</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <LoadingSpinner size="sm" /> : <div className="text-2xl font-bold">{stats.registros}</div>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar por veículo ou motorista..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Registros ({filteredData.length})</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <div className="flex justify-center py-12"><LoadingSpinner /></div> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Veículo</TableHead>
                  <TableHead>Motorista</TableHead>
                  <TableHead>Combustível</TableHead>
                  <TableHead className="text-right">Quantidade</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.slice(0, 50).map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.data}</TableCell>
                    <TableCell className="font-medium">{item.veiculo}</TableCell>
                    <TableCell>{item.motorista || '-'}</TableCell>
                    <TableCell><Badge variant="outline">{item.tipoCombustivel}</Badge></TableCell>
                    <TableCell className="text-right font-medium">{item.quantidadeCombustivel.toLocaleString('pt-BR')} L</TableCell>
                    <TableCell className="text-right">{item.valorTotal > 0 ? formatCurrency(item.valorTotal) : '-'}</TableCell>
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
