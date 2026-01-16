import { useState, useMemo } from "react";
import { Mountain, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DateFilter } from "@/components/shared/DateFilter";
import { useGoogleSheets, filterByDate } from "@/hooks/useGoogleSheets";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function RelatorioPedreira() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  
  const { data: pedreiraData, isLoading } = useGoogleSheets('apontamento_pedreira');

  const filteredData = useMemo(() => filterByDate(pedreiraData, selectedDate), [pedreiraData, selectedDate]);

  const totalPesoLiquido = filteredData?.reduce((acc, row) => acc + (parseFloat(row.Peso_Liquido) || 0), 0) || 0;
  const totalCarregamentos = filteredData?.length || 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="page-header">
          <h1 className="page-title flex items-center gap-2">
            <Mountain className="h-6 w-6 text-warning" />
            Relatório de Pedreira
          </h1>
          <p className="page-subtitle">Carregamentos de material</p>
        </div>
        <DateFilter date={selectedDate} onDateChange={setSelectedDate} placeholder="Filtrar por data" />
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <Card className="kpi-card-accent">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Carregamentos</p>
            <p className="text-2xl font-bold">{totalCarregamentos}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Peso Total (kg)</p>
            <p className="text-2xl font-bold">{totalPesoLiquido.toLocaleString('pt-BR')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Peso Total (ton)</p>
            <p className="text-2xl font-bold">{(totalPesoLiquido / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}</p>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><LoadingSpinner /></div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Carregamentos do Dia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hora</TableHead>
                    <TableHead>Caminhão</TableHead>
                    <TableHead>Material</TableHead>
                    <TableHead className="text-right">Peso Líquido</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData?.map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{row.Hora}</TableCell>
                      <TableCell className="font-medium">{row.Prefixo_Eq}</TableCell>
                      <TableCell>{row.Material}</TableCell>
                      <TableCell className="text-right">{parseFloat(row.Peso_Liquido || '0').toLocaleString('pt-BR')} kg</TableCell>
                    </TableRow>
                  ))}
                  {(!filteredData || filteredData.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        Nenhum carregamento encontrado
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
