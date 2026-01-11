import { useMemo, useState } from "react";
import { Fuel, RefreshCw, Search, Edit, Database, FileSpreadsheet } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useGoogleSheets } from "@/hooks/useGoogleSheets";
import { transformAbastecimentoData, type AbastecimentoRecord } from "@/lib/abastech/sheetsDataTransform";
import { useAbastecimentos, AbastecimentoDB } from "@/hooks/useAbastecimentos";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { AbastecimentoFormDialog } from "@/components/abastecimentos/AbastecimentoFormDialog";
import { AbastecimentoEditDialog } from "@/components/abastecimentos/AbastecimentoEditDialog";
import { ImportAbastecimentosDialog } from "@/components/abastecimentos/ImportAbastecimentosDialog";
import { DateFilter } from "@/components/shared/DateFilter";
import { filterByDate } from "@/hooks/useGoogleSheets";

export default function Abastecimento() {
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<"database" | "sheets">("database");
  const [editingRecord, setEditingRecord] = useState<AbastecimentoDB | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Dados do banco de dados local
  const { data: dbAbastecimentos, isLoading: dbLoading, refetch: refetchDb } = useAbastecimentos();

  // Dados do Google Sheets (backup/referência)
  const { data: sheetsData, isLoading: sheetsLoading, refetch: refetchSheets } = useGoogleSheets<Record<string, string>>('AbastecimentoCanteiro01');

  const sheetsAbastecimentos = useMemo<AbastecimentoRecord[]>(() => {
    if (!sheetsData || !Array.isArray(sheetsData)) return [];
    return transformAbastecimentoData(sheetsData);
  }, [sheetsData]);

  // Filter database data
  const filteredDbData = useMemo(() => {
    if (!dbAbastecimentos) return [];
    
    let filtered = dbAbastecimentos;
    
    // Filter by date
    if (dateFilter) {
      const filterDate = format(dateFilter, "yyyy-MM-dd");
      filtered = filtered.filter(item => item.data === filterDate);
    }
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        item.veiculo.toLowerCase().includes(term) ||
        (item.motorista?.toLowerCase() || '').includes(term) ||
        (item.obra?.toLowerCase() || '').includes(term)
      );
    }
    
    return filtered;
  }, [dbAbastecimentos, dateFilter, searchTerm]);

  // Filter sheets data
  const filteredSheetsData = useMemo(() => {
    let filtered = sheetsAbastecimentos;
    
    // Filter by date
    if (dateFilter) {
      filtered = filterByDate(filtered.map(r => ({ ...r, Data: r.data })), dateFilter).map(r => {
        const { Data, ...rest } = r;
        return rest as AbastecimentoRecord;
      });
    }
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        item.veiculo.toLowerCase().includes(term) ||
        item.motorista.toLowerCase().includes(term)
      );
    }
    
    return filtered;
  }, [sheetsAbastecimentos, dateFilter, searchTerm]);

  // Stats based on active tab
  const stats = useMemo(() => {
    const data = activeTab === "database" ? filteredDbData : filteredSheetsData;
    
    if (activeTab === "database") {
      const dbData = data as AbastecimentoDB[];
      return {
        totalLitros: dbData.reduce((sum, item) => sum + Number(item.quantidade_combustivel || 0), 0),
        totalValor: dbData.reduce((sum, item) => sum + Number(item.valor_total || 0), 0),
        registros: dbData.length,
      };
    } else {
      const sheetsData = data as AbastecimentoRecord[];
      return {
        totalLitros: sheetsData.reduce((sum, item) => sum + item.quantidadeCombustivel, 0),
        totalValor: sheetsData.reduce((sum, item) => sum + item.valorTotal, 0),
        registros: sheetsData.length,
      };
    }
  }, [activeTab, filteredDbData, filteredSheetsData]);

  const formatNumber = (num: number) => new Intl.NumberFormat('pt-BR').format(Math.round(num));
  const formatCurrency = (num: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num);

  const isLoading = activeTab === "database" ? dbLoading : sheetsLoading;

  const handleRefetch = () => {
    if (activeTab === "database") {
      refetchDb();
    } else {
      refetchSheets();
    }
  };

  const handleEditRecord = (record: AbastecimentoDB) => {
    setEditingRecord(record);
    setEditDialogOpen(true);
  };

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
        <div className="flex flex-wrap items-center gap-2">
          <AbastecimentoFormDialog onSuccess={() => refetchDb()} />
          <ImportAbastecimentosDialog onSuccess={() => refetchDb()} />
          <Button variant="outline" onClick={handleRefetch} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* KPIs */}
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

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Buscar por veículo, motorista ou obra..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="pl-10" 
              />
            </div>
            <DateFilter date={dateFilter} onDateChange={setDateFilter} />
          </div>
        </CardContent>
      </Card>

      {/* Tabs para alternar entre banco e Sheets */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "database" | "sheets")}>
        <TabsList>
          <TabsTrigger value="database" className="gap-2">
            <Database className="h-4 w-4" />
            Banco de Dados ({dbAbastecimentos?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="sheets" className="gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Google Sheets ({sheetsAbastecimentos.length})
          </TabsTrigger>
        </TabsList>

        {/* Database Tab */}
        <TabsContent value="database">
          <Card>
            <CardHeader>
              <CardTitle>Registros do Banco de Dados ({filteredDbData.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {dbLoading ? (
                <div className="flex justify-center py-12"><LoadingSpinner /></div>
              ) : filteredDbData.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Database className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>Nenhum registro encontrado no banco de dados.</p>
                  <p className="text-sm mt-2">Use "Importar do Sheets" para trazer os dados da planilha.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Veículo</TableHead>
                      <TableHead>Motorista</TableHead>
                      <TableHead>Combustível</TableHead>
                      <TableHead className="text-right">Quantidade</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="text-center">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDbData.slice(0, 100).map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{format(parseISO(item.data), "dd/MM/yyyy")}</TableCell>
                        <TableCell className="font-medium">{item.veiculo}</TableCell>
                        <TableCell>{item.motorista || '-'}</TableCell>
                        <TableCell><Badge variant="outline">{item.tipo_combustivel}</Badge></TableCell>
                        <TableCell className="text-right font-medium">
                          {Number(item.quantidade_combustivel).toLocaleString('pt-BR')} L
                        </TableCell>
                        <TableCell className="text-right">
                          {Number(item.valor_total) > 0 ? formatCurrency(Number(item.valor_total)) : '-'}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEditRecord(item)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              {filteredDbData.length > 100 && (
                <p className="text-center text-sm text-muted-foreground mt-4">
                  Mostrando 100 de {filteredDbData.length} registros
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sheets Tab */}
        <TabsContent value="sheets">
          <Card>
            <CardHeader>
              <CardTitle>Registros do Google Sheets ({filteredSheetsData.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {sheetsLoading ? (
                <div className="flex justify-center py-12"><LoadingSpinner /></div>
              ) : (
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
                    {filteredSheetsData.slice(0, 100).map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.data}</TableCell>
                        <TableCell className="font-medium">{item.veiculo}</TableCell>
                        <TableCell>{item.motorista || '-'}</TableCell>
                        <TableCell><Badge variant="outline">{item.tipoCombustivel}</Badge></TableCell>
                        <TableCell className="text-right font-medium">
                          {item.quantidadeCombustivel.toLocaleString('pt-BR')} L
                        </TableCell>
                        <TableCell className="text-right">
                          {item.valorTotal > 0 ? formatCurrency(item.valorTotal) : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              {filteredSheetsData.length > 100 && (
                <p className="text-center text-sm text-muted-foreground mt-4">
                  Mostrando 100 de {filteredSheetsData.length} registros
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <AbastecimentoEditDialog
        abastecimento={editingRecord}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={() => refetchDb()}
      />
    </div>
  );
}
