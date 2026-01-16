import { useState, useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FileText, Download, Upload, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DateFilter } from "@/components/shared/DateFilter";
import { useGoogleSheets, filterByDate } from "@/hooks/useGoogleSheets";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function RelatorioApropriacao() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  
  const { data: cargaData, isLoading: loadingCarga } = useGoogleSheets('carga');
  const { data: descargaData, isLoading: loadingDescarga } = useGoogleSheets('descarga');

  const filteredCarga = useMemo(() => filterByDate(cargaData, selectedDate), [cargaData, selectedDate]);
  const filteredDescarga = useMemo(() => filterByDate(descargaData, selectedDate), [descargaData, selectedDate]);

  // Totais
  const totalViagensC = filteredCarga?.reduce((acc, row) => acc + (parseInt(row.N_Viagens) || 0), 0) || 0;
  const totalVolumeC = filteredCarga?.reduce((acc, row) => acc + (parseFloat(row.Volume_Total) || 0), 0) || 0;
  const totalViagensD = filteredDescarga?.reduce((acc, row) => acc + (parseInt(row.N_Viagens) || 0), 0) || 0;
  const totalVolumeD = filteredDescarga?.reduce((acc, row) => acc + (parseFloat(row.Volume_Total) || 0), 0) || 0;

  const isLoading = loadingCarga || loadingDescarga;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="page-header">
          <h1 className="page-title flex items-center gap-2">
            <FileText className="h-6 w-6 text-accent" />
            Relatório de Apropriação
          </h1>
          <p className="page-subtitle">Cargas e Lançamentos</p>
        </div>
        <div className="flex items-center gap-2">
          <DateFilter
            date={selectedDate}
            onDateChange={setSelectedDate}
            placeholder="Filtrar por data"
          />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="kpi-card-primary">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Upload className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Cargas</p>
                <p className="text-xl font-bold">{filteredCarga?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="kpi-card-accent">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Download className="h-5 w-5 text-accent" />
              <div>
                <p className="text-sm text-muted-foreground">Lançamentos</p>
                <p className="text-xl font-bold">{filteredDescarga?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Viagens (C)</p>
            <p className="text-xl font-bold">{totalViagensC}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Volume Total (m³)</p>
            <p className="text-xl font-bold">{(totalVolumeC + totalVolumeD).toLocaleString('pt-BR')}</p>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Tabela de Cargas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                Cargas ({filteredCarga?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-[400px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Hora</TableHead>
                      <TableHead>Escavadeira</TableHead>
                      <TableHead>Caminhão</TableHead>
                      <TableHead>Material</TableHead>
                      <TableHead className="text-right">Viagens</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCarga?.slice(0, 20).map((row, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="text-sm">{row.Hora_Carga}</TableCell>
                        <TableCell className="text-sm font-medium">{row.Prefixo_Eq}</TableCell>
                        <TableCell className="text-sm">{row.Prefixo_Cb}</TableCell>
                        <TableCell className="text-sm">{row.Material}</TableCell>
                        <TableCell className="text-right text-sm">{row.N_Viagens}</TableCell>
                      </TableRow>
                    ))}
                    {(!filteredCarga || filteredCarga.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          Nenhuma carga encontrada
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Tabela de Descargas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Download className="h-5 w-5 text-accent" />
                Lançamentos ({filteredDescarga?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-[400px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Hora</TableHead>
                      <TableHead>Caminhão</TableHead>
                      <TableHead>Local</TableHead>
                      <TableHead>Material</TableHead>
                      <TableHead className="text-right">Viagens</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDescarga?.slice(0, 20).map((row, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="text-sm">{row.Hora}</TableCell>
                        <TableCell className="text-sm font-medium">{row.Prefixo_Cb}</TableCell>
                        <TableCell className="text-sm">{row.Local_da_Obra}</TableCell>
                        <TableCell className="text-sm">{row.Material}</TableCell>
                        <TableCell className="text-right text-sm">{row.N_Viagens}</TableCell>
                      </TableRow>
                    ))}
                    {(!filteredDescarga || filteredDescarga.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          Nenhum lançamento encontrado
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
