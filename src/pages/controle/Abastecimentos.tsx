import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DateFilter } from "@/components/shared/DateFilter";
import { useState, useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Fuel, 
  Droplet,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Loader2,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAbastecimentos, Abastecimento } from "@/hooks/useAbastecimentos";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { AbastecimentoEditDialog } from "@/components/abastecimentos/AbastecimentoEditDialog";
import { AbastecimentoDeleteDialog } from "@/components/abastecimentos/AbastecimentoDeleteDialog";

interface SourceConfig {
  key: string;
  label: string;
  nome: string;
  capacidade: number;
}

const SOURCES: SourceConfig[] = [
  { key: 'tanque01', label: 'Tanque 01', nome: 'Tanque Canteiro 01', capacidade: 10000 },
  { key: 'tanque02', label: 'Tanque 02', nome: 'Tanque Canteiro 02', capacidade: 10000 },
  { key: 'comboio01', label: 'Comboio 01', nome: 'Comboio 01', capacidade: 5000 },
  { key: 'comboio02', label: 'Comboio 02', nome: 'Comboio 02', capacidade: 5000 },
  { key: 'comboio03', label: 'Comboio 03', nome: 'Comboio 03', capacidade: 5000 },
];

function SourceTab({ source, selectedDate }: { source: SourceConfig; selectedDate: Date | null }) {
  const { data: abastecimentos, isLoading, error, refetch, isFetching } = useAbastecimentos(source.key);
  
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAbastecimento, setSelectedAbastecimento] = useState<Abastecimento | null>(null);

  // Filter by selected date
  const filteredData = useMemo(() => {
    if (!abastecimentos) return [];
    if (!selectedDate) return abastecimentos;

    const targetDate = format(selectedDate, 'dd/MM/yyyy');
    return abastecimentos.filter(ab => {
      const abDate = ab.data;
      if (!abDate) return false;
      
      const match = abDate.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      if (match) {
        const day = match[1].padStart(2, '0');
        const month = match[2].padStart(2, '0');
        const year = match[3];
        return `${day}/${month}/${year}` === targetDate;
      }
      return false;
    });
  }, [abastecimentos, selectedDate]);

  const totalAbastecido = filteredData.reduce((acc, ab) => acc + (ab.quantidade || 0), 0);
  const totalRegistros = filteredData.length;

  const nivelEstimado = source.capacidade * 0.65;
  const percentualNivel = (nivelEstimado / source.capacidade) * 100;

  const getStatusColor = (percentual: number) => {
    if (percentual > 50) return "text-green-500";
    if (percentual > 25) return "text-yellow-500";
    return "text-red-500";
  };

  const getStatusBg = (percentual: number) => {
    if (percentual > 50) return "bg-green-500";
    if (percentual > 25) return "bg-yellow-500";
    return "bg-red-500";
  };

  const handleEdit = (abastecimento: Abastecimento) => {
    setSelectedAbastecimento(abastecimento);
    setEditDialogOpen(true);
  };

  const handleDelete = (abastecimento: Abastecimento) => {
    setSelectedAbastecimento(abastecimento);
    setDeleteDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center">
        <p className="text-red-500 mb-4">Erro ao carregar dados: {error.message}</p>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Nível Estimado</p>
                <p className="text-3xl font-bold">{nivelEstimado.toLocaleString('pt-BR')}L</p>
                <p className="text-xs text-muted-foreground">de {source.capacidade.toLocaleString('pt-BR')}L</p>
              </div>
              <div className="rounded-lg bg-blue-500/10 p-3">
                <Droplet className="h-6 w-6 text-blue-500" />
              </div>
            </div>
            <div className="mt-4">
              <div className="h-2 w-full rounded-full bg-muted">
                <div 
                  className={`h-2 rounded-full transition-all ${getStatusBg(percentualNivel)}`}
                  style={{ width: `${percentualNivel}%` }}
                />
              </div>
              <p className={`mt-1 text-sm font-medium ${getStatusColor(percentualNivel)}`}>
                {percentualNivel.toFixed(1)}% cheio
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Abastecimentos</p>
                <p className="text-3xl font-bold">{totalRegistros}</p>
                <p className="text-xs text-muted-foreground">
                  {selectedDate ? 'no dia selecionado' : 'total na base'}
                </p>
              </div>
              <div className="rounded-lg bg-green-500/10 p-3">
                <Fuel className="h-6 w-6 text-green-500" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1">
              {isFetching ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : (
                <TrendingUp className="h-4 w-4 text-green-500" />
              )}
              <span className="text-sm font-medium text-green-500">Ativo</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Total Abastecido</p>
                <p className="text-3xl font-bold">{totalAbastecido.toLocaleString('pt-BR')}L</p>
                <p className="text-xs text-muted-foreground">
                  {selectedDate ? 'no dia' : 'total'}
                </p>
              </div>
              <div className="rounded-lg bg-orange-500/10 p-3">
                <ArrowUpRight className="h-6 w-6 text-orange-500" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1">
              <ArrowDownRight className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium text-muted-foreground">Saída</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Média por Abast.</p>
                <p className="text-3xl font-bold">
                  {totalRegistros > 0 
                    ? Math.round(totalAbastecido / totalRegistros).toLocaleString('pt-BR')
                    : 0}L
                </p>
                <p className="text-xs text-muted-foreground">litros/operação</p>
              </div>
              <div className="rounded-lg bg-purple-500/10 p-3">
                <TrendingUp className="h-6 w-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Abastecimentos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Fuel className="h-5 w-5" />
            {source.nome} - Movimentações
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Hora</TableHead>
                  <TableHead>Veículo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Motorista/Operador</TableHead>
                  <TableHead className="text-right">Litros</TableHead>
                  <TableHead className="text-right">Hor. Atual</TableHead>
                  <TableHead>Lubrificação</TableHead>
                  <TableHead className="w-[50px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      {selectedDate 
                        ? 'Nenhum abastecimento encontrado para esta data'
                        : 'Nenhum abastecimento encontrado'
                      }
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.slice(0, 50).map((abastecimento) => (
                    <TableRow key={abastecimento.id}>
                      <TableCell className="font-medium">{abastecimento.data}</TableCell>
                      <TableCell>{abastecimento.hora}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{abastecimento.veiculo}</Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate" title={abastecimento.descricao}>
                        {abastecimento.descricao}
                      </TableCell>
                      <TableCell>{abastecimento.motorista}</TableCell>
                      <TableCell className="text-right font-semibold text-green-600">
                        {abastecimento.quantidade?.toLocaleString('pt-BR')}L
                      </TableCell>
                      <TableCell className="text-right">
                        {abastecimento.horimetro_atual 
                          ? abastecimento.horimetro_atual.toLocaleString('pt-BR')
                          : abastecimento.km_atual 
                            ? `${abastecimento.km_atual.toLocaleString('pt-BR')} km`
                            : '-'
                        }
                      </TableCell>
                      <TableCell>
                        {abastecimento.lubrificar ? (
                          <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
                            {abastecimento.lubrificante || 'Sim'}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            Não
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Ações</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-popover">
                            <DropdownMenuItem onClick={() => handleEdit(abastecimento)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(abastecimento)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            {filteredData.length > 50 && (
              <p className="text-center text-sm text-muted-foreground mt-4">
                Mostrando 50 de {filteredData.length} registros
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <AbastecimentoEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        abastecimento={selectedAbastecimento}
        source={source.key}
      />
      <AbastecimentoDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        abastecimento={selectedAbastecimento}
        source={source.key}
      />
    </div>
  );
}

export default function Abastecimentos() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTab, setSelectedTab] = useState("tanque01");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Abastecimentos</h1>
          <p className="text-muted-foreground">
            Movimentações de combustível
            {selectedDate && ` - ${format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`}
          </p>
        </div>
        <DateFilter 
          date={selectedDate} 
          onDateChange={setSelectedDate}
          placeholder="Filtrar por data"
          showClear={true}
        />
      </div>

      {/* Tabs para cada fonte */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          {SOURCES.map((source) => (
            <TabsTrigger key={source.key} value={source.key} className="text-xs sm:text-sm">
              {source.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {SOURCES.map((source) => (
          <TabsContent key={source.key} value={source.key}>
            <SourceTab source={source} selectedDate={selectedDate} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
