import { useMemo, useState } from "react";
import { Wrench, RefreshCw, Plus, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useOrdensServico, type OrdemServicoDB } from "@/hooks/useOrdensServico";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Manutencao() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [prioridadeFilter, setPrioridadeFilter] = useState<string>("all");

  const { data: ordensServico, isLoading, refetch } = useOrdensServico();

  // Filter data
  const filteredData = useMemo(() => {
    if (!ordensServico) return [];
    
    return ordensServico.filter(os => {
      const matchesSearch = 
        os.veiculo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        os.problema_relatado.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (os.mecanico_responsavel?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        String(os.numero_os).includes(searchTerm);
      
      const matchesStatus = statusFilter === "all" || os.status === statusFilter;
      const matchesPrioridade = prioridadeFilter === "all" || os.prioridade === prioridadeFilter;

      return matchesSearch && matchesStatus && matchesPrioridade;
    });
  }, [ordensServico, searchTerm, statusFilter, prioridadeFilter]);

  // Calculate stats
  const stats = useMemo(() => {
    if (!ordensServico) return { total: 0, abertas: 0, aguardando: 0, finalizadas: 0, urgentes: 0 };
    
    return {
      total: ordensServico.length,
      abertas: ordensServico.filter(os => os.status === 'Em Andamento').length,
      aguardando: ordensServico.filter(os => os.status === 'Aguardando Peças').length,
      finalizadas: ordensServico.filter(os => os.status === 'Finalizada').length,
      urgentes: ordensServico.filter(os => os.prioridade === 'Alta' || os.prioridade === 'Urgente').length,
    };
  }, [ordensServico]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', label: string }> = {
      'Em Andamento': { variant: 'default', label: 'Em Andamento' },
      'Aguardando Peças': { variant: 'secondary', label: 'Aguardando Peças' },
      'Finalizada': { variant: 'outline', label: 'Finalizada' },
      'Cancelada': { variant: 'destructive', label: 'Cancelada' },
    };
    const config = variants[status] || { variant: 'outline', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPrioridadeBadge = (prioridade: string) => {
    const colors: Record<string, string> = {
      'Baixa': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      'Média': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      'Alta': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
      'Urgente': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    };
    return <span className={`rounded-full px-2 py-1 text-xs font-medium ${colors[prioridade] || colors['Média']}`}>{prioridade}</span>;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    try {
      return format(new Date(dateStr), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Wrench className="h-6 w-6 text-yellow-500" />
            Manutenção
          </h1>
          <p className="text-muted-foreground">
            Ordens de serviço e controle de manutenção
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">OS Abertas</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <LoadingSpinner size="sm" /> : (
              <div className="text-2xl font-bold text-yellow-600">{stats.abertas}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Aguardando Peças</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <LoadingSpinner size="sm" /> : (
              <div className="text-2xl font-bold text-orange-600">{stats.aguardando}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Finalizadas</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <LoadingSpinner size="sm" /> : (
              <div className="text-2xl font-bold text-green-600">{stats.finalizadas}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Urgentes</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <LoadingSpinner size="sm" /> : (
              <div className="text-2xl font-bold text-red-600">{stats.urgentes}</div>
            )}
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
                placeholder="Buscar por OS, veículo, problema ou mecânico..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Status</SelectItem>
                  <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                  <SelectItem value="Aguardando Peças">Aguardando Peças</SelectItem>
                  <SelectItem value="Finalizada">Finalizada</SelectItem>
                  <SelectItem value="Cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
              <Select value={prioridadeFilter} onValueChange={setPrioridadeFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Prioridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="Baixa">Baixa</SelectItem>
                  <SelectItem value="Média">Média</SelectItem>
                  <SelectItem value="Alta">Alta</SelectItem>
                  <SelectItem value="Urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Ordens de Serviço
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({filteredData.length} de {ordensServico?.length || 0})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : filteredData.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              {(ordensServico?.length || 0) === 0 
                ? "Nenhuma ordem de serviço encontrada."
                : "Nenhuma OS corresponde aos filtros selecionados."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nº OS</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Veículo</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Problema</TableHead>
                    <TableHead>Mecânico</TableHead>
                    <TableHead>Prioridade</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((os) => (
                    <TableRow key={os.id}>
                      <TableCell className="font-medium">#{os.numero_os}</TableCell>
                      <TableCell>{formatDate(os.data_abertura)}</TableCell>
                      <TableCell>{os.veiculo}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{os.tipo}</Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate" title={os.problema_relatado}>
                        {os.problema_relatado}
                      </TableCell>
                      <TableCell>{os.mecanico_responsavel || '-'}</TableCell>
                      <TableCell>{getPrioridadeBadge(os.prioridade)}</TableCell>
                      <TableCell>{getStatusBadge(os.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
