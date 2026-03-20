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
  BarChart3,
  FileText,
  Package,
  ChevronRight,
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
import { Progress } from "@/components/ui/progress";

interface SourceConfig {
  key: string;
  label: string;
  nome: string;
  capacidade: number;
}

const SOURCES: SourceConfig[] = [
  { key: 'tanque01', label: 'Tanque 01', nome: 'Tanque Canteiro 01', capacidade: 10000 },
  { key: 'tanque02', label: 'Tanque 02', nome: 'Tanque Canteiro 02', capacidade: 10000 },
  { key: 'comboio01', label: 'CC-01', nome: 'Comboio 01', capacidade: 5000 },
  { key: 'comboio02', label: 'CC-02', nome: 'Comboio 02', capacidade: 5000 },
  { key: 'comboio03', label: 'CC-03', nome: 'Comboio 03', capacidade: 5000 },
];

/* ─── Painel de Estoque ─── */
function EstoquePanel({ selectedDate }: { selectedDate: Date | null }) {
  const [expandedSource, setExpandedSource] = useState<string | null>(null);

  // Load all sources
  const t1 = useAbastecimentos('tanque01');
  const t2 = useAbastecimentos('tanque02');
  const c1 = useAbastecimentos('comboio01');
  const c2 = useAbastecimentos('comboio02');
  const c3 = useAbastecimentos('comboio03');

  const allSources = [
    { config: SOURCES[0], ...t1 },
    { config: SOURCES[1], ...t2 },
    { config: SOURCES[2], ...c1 },
    { config: SOURCES[3], ...c2 },
    { config: SOURCES[4], ...c3 },
  ];

  const isLoading = allSources.some(s => s.isLoading);

  // Calculate stock estimates per source
  const stockData = allSources.map(s => {
    const data = s.data || [];
    const todayData = selectedDate ? data.filter(ab => {
      const match = ab.data?.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      if (!match) return false;
      const d = `${match[1].padStart(2,'0')}/${match[2].padStart(2,'0')}/${match[3]}`;
      return d === format(selectedDate, 'dd/MM/yyyy');
    }) : data;

    const saidaDia = todayData.reduce((acc, ab) => acc + (ab.quantidade || 0), 0);
    const nivelEstimado = s.config.capacidade * 0.65; // mock
    const percentual = (nivelEstimado / s.config.capacidade) * 100;

    return {
      ...s.config,
      nivelEstimado,
      percentual,
      saidaDia,
      registrosDia: todayData.length,
      ultimaEntrada: data.length > 0 ? data[0].data : '-',
    };
  });

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><LoadingSpinner /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Source Cards Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {stockData.map((source) => {
          const isExpanded = expandedSource === source.key;
          const statusColor = source.percentual > 50 ? 'text-green-600' : source.percentual > 25 ? 'text-yellow-600' : 'text-red-600';
          const barColor = source.percentual > 50 ? 'bg-green-500' : source.percentual > 25 ? 'bg-yellow-500' : 'bg-red-500';

          return (
            <Card 
              key={source.key} 
              className={`cursor-pointer transition-all hover:shadow-md ${isExpanded ? 'ring-2 ring-primary col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-5' : ''}`}
              onClick={() => setExpandedSource(isExpanded ? null : source.key)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Droplet className="h-4 w-4 text-blue-500" />
                    <span className="font-semibold text-sm">{source.label}</span>
                  </div>
                  <span className={`text-sm font-bold ${statusColor}`}>{source.percentual.toFixed(0)}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div className={`h-2 rounded-full transition-all ${barColor}`} style={{ width: `${source.percentual}%` }} />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {source.nivelEstimado.toLocaleString('pt-BR')}L / {source.capacidade.toLocaleString('pt-BR')}L
                </p>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t space-y-3">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="rounded-lg bg-muted/60 p-3">
                        <p className="text-xs text-muted-foreground">Estoque Atual</p>
                        <p className="text-lg font-bold">{source.nivelEstimado.toLocaleString('pt-BR')}L</p>
                      </div>
                      <div className="rounded-lg bg-muted/60 p-3">
                        <p className="text-xs text-muted-foreground">Última Entrada</p>
                        <p className="text-lg font-bold">{source.ultimaEntrada}</p>
                      </div>
                      <div className="rounded-lg bg-muted/60 p-3">
                        <p className="text-xs text-muted-foreground">Saída do Dia</p>
                        <p className="text-lg font-bold text-orange-600">{source.saidaDia.toLocaleString('pt-BR')}L</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {source.registrosDia} abastecimentos registrados {selectedDate ? 'no dia' : 'total'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Chart placeholder - Entrada x Saída */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4" />
              Entrada × Saída
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="text-xs h-7">Semanal</Button>
              <Button variant="default" size="sm" className="text-xs h-7">Mensal</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-center justify-center rounded-lg bg-muted/30 border border-dashed">
            <div className="text-center text-muted-foreground">
              <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Gráfico de Entrada × Saída</p>
              <p className="text-xs">Dados sendo consolidados</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo Saídas por Equipamento */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="h-4 w-4" />
            Resumo de Abastecimento — Saídas por Equipamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Equipamento</TableHead>
                  <TableHead>Fonte</TableHead>
                  <TableHead className="text-right">Litros</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6 text-muted-foreground text-sm">
                    Selecione uma data para visualizar saídas por equipamento
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ─── Tab de Lançamento ─── */
function LancamentoTab({ selectedDate }: { selectedDate: Date | null }) {
  const [selectedTab, setSelectedTab] = useState("tanque01");
  const { data: abastecimentos, isLoading, error, refetch, isFetching } = useAbastecimentos(selectedTab);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAbastecimento, setSelectedAbastecimento] = useState<Abastecimento | null>(null);

  const filteredData = useMemo(() => {
    if (!abastecimentos) return [];
    if (!selectedDate) return abastecimentos;
    const targetDate = format(selectedDate, 'dd/MM/yyyy');
    return abastecimentos.filter(ab => {
      const match = ab.data?.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      if (!match) return false;
      return `${match[1].padStart(2,'0')}/${match[2].padStart(2,'0')}/${match[3]}` === targetDate;
    });
  }, [abastecimentos, selectedDate]);

  if (isLoading) return <div className="flex items-center justify-center py-12"><LoadingSpinner /></div>;
  if (error) return <div className="py-12 text-center"><p className="text-red-500 mb-4">Erro: {error.message}</p><Button onClick={() => refetch()} variant="outline"><RefreshCw className="h-4 w-4 mr-2" />Tentar novamente</Button></div>;

  return (
    <div className="space-y-4">
      {/* Source selector */}
      <div className="flex flex-wrap gap-2">
        {SOURCES.map((source) => (
          <Button
            key={source.key}
            variant={selectedTab === source.key ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedTab(source.key)}
          >
            {source.label}
          </Button>
        ))}
      </div>

      {/* Detalhamento Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-3">
          <CardTitle className="text-sm font-semibold">Detalhamento de Abastecimentos</CardTitle>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Saída</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Veículo</TableHead>
                  <TableHead>Mot/Operador</TableHead>
                  <TableHead>PTD</TableHead>
                  <TableHead className="text-right">Hor/Km Ant.</TableHead>
                  <TableHead className="text-right">Hor/Km Atual</TableHead>
                  <TableHead className="text-right">Litros</TableHead>
                  <TableHead className="w-[50px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      {selectedDate ? 'Nenhum registro para esta data' : 'Nenhum registro encontrado'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.slice(0, 50).map((ab) => (
                    <TableRow key={ab.id}>
                      <TableCell><Badge variant="outline">{ab.hora || '-'}</Badge></TableCell>
                      <TableCell className="font-medium">{ab.data}</TableCell>
                      <TableCell><Badge variant="secondary">{ab.veiculo}</Badge></TableCell>
                      <TableCell>{ab.motorista || '-'}</TableCell>
                      <TableCell>{ab.descricao || '-'}</TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {ab.horimetro_anterior || ab.km_anterior || '-'}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {ab.horimetro_atual || ab.km_atual || '-'}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-green-600">
                        {ab.quantidade?.toLocaleString('pt-BR')}L
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-popover">
                            <DropdownMenuItem onClick={() => { setSelectedAbastecimento(ab); setEditDialogOpen(true); }}>
                              <Pencil className="mr-2 h-4 w-4" />Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setSelectedAbastecimento(ab); setDeleteDialogOpen(true); }} className="text-destructive focus:text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />Excluir
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
              <p className="text-center text-sm text-muted-foreground mt-4">Mostrando 50 de {filteredData.length} registros</p>
            )}
          </div>
        </CardContent>
      </Card>

      <AbastecimentoEditDialog open={editDialogOpen} onOpenChange={setEditDialogOpen} abastecimento={selectedAbastecimento} source={selectedTab} />
      <AbastecimentoDeleteDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} abastecimento={selectedAbastecimento} source={selectedTab} />
    </div>
  );
}

/* ─── Consumo Tab ─── */
function ConsumoTab() {
  return (
    <Card>
      <CardContent className="p-8 text-center">
        <TrendingUp className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
        <h3 className="font-semibold text-lg mb-1">Análise de Consumo</h3>
        <p className="text-sm text-muted-foreground">Relatórios de consumo por veículo, período e tipo de combustível em desenvolvimento.</p>
      </CardContent>
    </Card>
  );
}

/* ─── Entradas Tab ─── */
function EntradasTab() {
  return (
    <Card>
      <CardContent className="p-8 text-center">
        <ArrowUpRight className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
        <h3 className="font-semibold text-lg mb-1">Entradas de Combustível</h3>
        <p className="text-sm text-muted-foreground">Registro de carregamentos e entradas nos tanques/comboios em desenvolvimento.</p>
      </CardContent>
    </Card>
  );
}

/* ─── Main Component ─── */
export default function Abastecimentos() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [mainTab, setMainTab] = useState("estoque");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Abastecimentos</h1>
          <p className="text-muted-foreground">
            Controle de combustível e estoque
            {selectedDate && ` — ${format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`}
          </p>
        </div>
        <DateFilter 
          date={selectedDate} 
          onDateChange={setSelectedDate}
          placeholder="Filtrar por data"
          showClear={true}
        />
      </div>

      {/* Main Tabs */}
      <Tabs value={mainTab} onValueChange={setMainTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="estoque" className="gap-2">
            <Droplet className="h-4 w-4" />
            <span className="hidden sm:inline">Estoque</span>
          </TabsTrigger>
          <TabsTrigger value="lancamento" className="gap-2">
            <Fuel className="h-4 w-4" />
            <span className="hidden sm:inline">Lançamento</span>
          </TabsTrigger>
          <TabsTrigger value="consumo" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Consumo</span>
          </TabsTrigger>
          <TabsTrigger value="entradas" className="gap-2">
            <ArrowUpRight className="h-4 w-4" />
            <span className="hidden sm:inline">Entradas</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="estoque">
          <EstoquePanel selectedDate={selectedDate} />
        </TabsContent>

        <TabsContent value="lancamento">
          <LancamentoTab selectedDate={selectedDate} />
        </TabsContent>

        <TabsContent value="consumo">
          <ConsumoTab />
        </TabsContent>

        <TabsContent value="entradas">
          <EntradasTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
