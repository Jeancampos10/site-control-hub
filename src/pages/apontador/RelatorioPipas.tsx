import { useState, useMemo } from "react";
import { Droplets } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DateFilter } from "@/components/shared/DateFilter";
import { useGoogleSheets, filterByDate } from "@/hooks/useGoogleSheets";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function RelatorioPipas() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  
  const { data: pipaData, isLoading } = useGoogleSheets('apontamento_pipa');

  const filteredData = useMemo(() => filterByDate(pipaData, selectedDate), [pipaData, selectedDate]);

  const totalViagens = filteredData?.reduce((acc, row) => acc + (parseInt(row.N_Viagens) || 0), 0) || 0;
  const veiculosAtivos = new Set(filteredData?.map(r => r.Prefixo)).size;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="page-header">
          <h1 className="page-title flex items-center gap-2">
            <Droplets className="h-6 w-6 text-info" />
            Relatório de Pipas
          </h1>
          <p className="page-subtitle">Viagens de caminhões pipa</p>
        </div>
        <DateFilter date={selectedDate} onDateChange={setSelectedDate} placeholder="Filtrar por data" />
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <Card className="kpi-card-accent">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Viagens</p>
            <p className="text-2xl font-bold">{totalViagens}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Veículos Ativos</p>
            <p className="text-2xl font-bold">{veiculosAtivos}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Registros</p>
            <p className="text-2xl font-bold">{filteredData?.length || 0}</p>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><LoadingSpinner /></div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Viagens do Dia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Veículo</TableHead>
                    <TableHead>Motorista</TableHead>
                    <TableHead>Chegada</TableHead>
                    <TableHead>Saída</TableHead>
                    <TableHead className="text-right">Viagens</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData?.map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{row.Prefixo}</TableCell>
                      <TableCell>{row.Motorista}</TableCell>
                      <TableCell>{row.Hora_Chegada}</TableCell>
                      <TableCell>{row.Hora_Saida}</TableCell>
                      <TableCell className="text-right">{row.N_Viagens}</TableCell>
                    </TableRow>
                  ))}
                  {(!filteredData || filteredData.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        Nenhuma viagem encontrada
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
