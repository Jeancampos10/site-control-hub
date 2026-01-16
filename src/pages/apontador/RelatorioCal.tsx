import { useState, useMemo } from "react";
import { FlaskConical, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DateFilter } from "@/components/shared/DateFilter";
import { useGoogleSheets, filterByDate } from "@/hooks/useGoogleSheets";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function RelatorioCal() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  
  const { data: movCalData, isLoading: loadingMov } = useGoogleSheets('mov_cal');
  const { data: estoqueCalData, isLoading: loadingEstoque } = useGoogleSheets('estoque_cal');

  const filteredData = useMemo(() => filterByDate(movCalData, selectedDate), [movCalData, selectedDate]);

  const totalEntradas = filteredData?.filter(r => r.Tipo === 'Entrada').reduce((acc, r) => acc + (parseFloat(r.Qtd) || 0), 0) || 0;
  const totalSaidas = filteredData?.filter(r => r.Tipo === 'Saída').reduce((acc, r) => acc + (parseFloat(r.Qtd) || 0), 0) || 0;
  const estoqueAtual = estoqueCalData?.[0]?.EstoqueAtual || '0';

  const isLoading = loadingMov || loadingEstoque;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="page-header">
          <h1 className="page-title flex items-center gap-2">
            <FlaskConical className="h-6 w-6 text-success" />
            Relatório de CAL
          </h1>
          <p className="page-subtitle">Movimentação de estoque</p>
        </div>
        <DateFilter date={selectedDate} onDateChange={setSelectedDate} placeholder="Filtrar por data" />
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="kpi-card-success">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-success" />
              <div>
                <p className="text-sm text-muted-foreground">Entradas</p>
                <p className="text-xl font-bold">{totalEntradas.toLocaleString('pt-BR')} kg</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="kpi-card-accent">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-accent" />
              <div>
                <p className="text-sm text-muted-foreground">Saídas</p>
                <p className="text-xl font-bold">{totalSaidas.toLocaleString('pt-BR')} kg</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Saldo</p>
            <p className="text-xl font-bold">{(totalEntradas - totalSaidas).toLocaleString('pt-BR')} kg</p>
          </CardContent>
        </Card>
        <Card className="kpi-card-primary">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Estoque Atual</p>
            <p className="text-xl font-bold">{parseFloat(estoqueAtual).toLocaleString('pt-BR')} kg</p>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><LoadingSpinner /></div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Movimentações do Dia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hora</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead className="text-right">Quantidade</TableHead>
                    <TableHead>NF</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData?.map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{row.Hora}</TableCell>
                      <TableCell>
                        <Badge variant={row.Tipo === 'Entrada' ? 'default' : 'secondary'}>
                          {row.Tipo}
                        </Badge>
                      </TableCell>
                      <TableCell>{row.Fornecedor || '-'}</TableCell>
                      <TableCell className="text-right font-medium">
                        {parseFloat(row.Qtd || '0').toLocaleString('pt-BR')} kg
                      </TableCell>
                      <TableCell>{row.NF || '-'}</TableCell>
                    </TableRow>
                  ))}
                  {(!filteredData || filteredData.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        Nenhuma movimentação encontrada
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
