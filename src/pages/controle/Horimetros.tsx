import { Card, CardContent } from "@/components/ui/card";
import { useState, useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Clock,
  RefreshCw,
  Loader2,
  Pencil,
  Trash2,
  MoreHorizontal,
  Search,
  Plus,
  Wifi,
  List,
  AlertTriangle,
  FileText,
  CalendarDays,
  X,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useHorimetros, useHorimetrosSummary, Horimetro } from "@/hooks/useHorimetros";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { HorimetroEditDialog } from "@/components/horimetros/HorimetroEditDialog";
import { HorimetroDeleteDialog } from "@/components/horimetros/HorimetroDeleteDialog";
import { NovoHorimetroDialog } from "@/components/horimetros/NovoHorimetroDialog";
import { DateFilter } from "@/components/shared/DateFilter";

type DateQuickFilter = "ultimo" | "hoje" | "ontem" | "data" | "range";
type TabType = "registros" | "pendencias" | "relatorios";

export default function Horimetros() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editingHorimetro, setEditingHorimetro] = useState<Horimetro | null>(null);
  const [deletingHorimetro, setDeletingHorimetro] = useState<Horimetro | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [novoDialogOpen, setNovoDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("registros");
  const [dateFilter, setDateFilter] = useState<DateQuickFilter>("ultimo");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("todas");
  const [empresaFilter, setEmpresaFilter] = useState("todas");
  const [veiculoFilter, setVeiculoFilter] = useState("todos");

  const { data: horimetros, isLoading, error, refetch, isFetching } = useHorimetros();

  const selectedDateStr = selectedDate ? format(selectedDate, 'dd/MM/yyyy') : null;

  const {
    filteredData: dateFilteredData,
    totalHoras,
    equipamentosAtivos,
    mediaHoras,
  } = useHorimetrosSummary(horimetros || [], selectedDateStr);

  // Get unique values for filters
  const uniqueCategories = useMemo(() => {
    const cats = new Set(horimetros?.map(h => h.categoria).filter(Boolean) || []);
    return Array.from(cats).sort();
  }, [horimetros]);

  const uniqueEmpresas = useMemo(() => {
    const emps = new Set(horimetros?.map(h => h.empresa).filter(Boolean) || []);
    return Array.from(emps).sort();
  }, [horimetros]);

  const uniqueVeiculos = useMemo(() => {
    const veics = new Set(horimetros?.map(h => h.veiculo).filter(Boolean) || []);
    return Array.from(veics).sort();
  }, [horimetros]);

  // Apply all filters
  const filteredData = useMemo(() => {
    let data = dateFilteredData;
    if (categoryFilter !== "todas") {
      data = data.filter(h => h.categoria === categoryFilter);
    }
    if (empresaFilter !== "todas") {
      data = data.filter(h => h.empresa === empresaFilter);
    }
    if (veiculoFilter !== "todos") {
      data = data.filter(h => h.veiculo === veiculoFilter);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      data = data.filter(h =>
        h.veiculo?.toLowerCase().includes(term) ||
        h.operador?.toLowerCase().includes(term) ||
        h.descricao?.toLowerCase().includes(term)
      );
    }
    return data;
  }, [dateFilteredData, categoryFilter, empresaFilter, veiculoFilter, searchTerm]);

  // Counts
  const totalRegistros = horimetros?.length || 0;
  const mobilizados = uniqueVeiculos.length;
  const lancados = filteredData.length;
  const faltantes = Math.max(0, mobilizados - lancados);

  const handleEdit = (horimetro: Horimetro) => {
    setEditingHorimetro(horimetro);
    setEditDialogOpen(true);
  };

  const handleDelete = (horimetro: Horimetro) => {
    setDeletingHorimetro(horimetro);
    setDeleteDialogOpen(true);
  };

  const clearFilters = () => {
    setSelectedDate(null);
    setDateFilter("ultimo");
    setCategoryFilter("todas");
    setEmpresaFilter("todas");
    setVeiculoFilter("todos");
    setSearchTerm("");
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
        <p className="text-destructive mb-4">Erro ao carregar dados: {error.message}</p>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="rounded-2xl bg-primary/10 p-3">
            <Clock className="h-8 w-8 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">
                Horímetros ({lancados})
              </h1>
              <Badge variant="outline" className="gap-1.5 bg-green-500/10 text-green-600 border-green-200">
                <Wifi className="h-3 w-3" />
                Conectado
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm">Controle de horas trabalhadas</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => setNovoDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Novo Registro
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* KPI Cards Coloridos */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border-2 border-orange-300 bg-orange-50 dark:bg-orange-500/10 p-5 cursor-pointer hover:shadow-md transition-shadow">
          <p className="text-xs font-bold uppercase tracking-wider text-orange-600">Total Registros</p>
          <p className="mt-2 text-3xl font-extrabold text-orange-700 dark:text-orange-500">{totalRegistros}</p>
          <p className="mt-1 text-xs text-orange-600/70">Clique p/ detalhes</p>
        </div>

        <div className="rounded-2xl border-2 border-blue-200 bg-blue-50 dark:bg-blue-500/10 p-5 cursor-pointer hover:shadow-md transition-shadow">
          <p className="text-xs font-bold uppercase tracking-wider text-blue-600">Mobilizados</p>
          <p className="mt-2 text-3xl font-extrabold text-blue-700 dark:text-blue-500">{mobilizados}</p>
          <p className="mt-1 text-xs text-blue-600/70">Clique p/ detalhes</p>
        </div>

        <div className="rounded-2xl border-2 border-green-200 bg-green-50 dark:bg-green-500/10 p-5 cursor-pointer hover:shadow-md transition-shadow">
          <p className="text-xs font-bold uppercase tracking-wider text-green-600">Lançados</p>
          <p className="mt-2 text-3xl font-extrabold text-green-700 dark:text-green-500">{lancados}</p>
          <p className="mt-1 text-xs text-green-600/70">Clique p/ detalhes</p>
        </div>

        <div className="rounded-2xl border-2 border-red-200 bg-red-50 dark:bg-red-500/10 p-5 cursor-pointer hover:shadow-md transition-shadow">
          <p className="text-xs font-bold uppercase tracking-wider text-destructive">Faltantes</p>
          <p className="mt-2 text-3xl font-extrabold text-red-700 dark:text-destructive">{faltantes}</p>
          <p className="mt-1 text-xs text-destructive/70">Clique p/ detalhes</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <Button
          variant={activeTab === "registros" ? "default" : "outline"}
          size="sm"
          className="gap-2 rounded-full"
          onClick={() => setActiveTab("registros")}
        >
          <List className="h-4 w-4" />
          Registros
        </Button>
        <Button
          variant={activeTab === "pendencias" ? "default" : "outline"}
          size="sm"
          className="gap-2 rounded-full"
          onClick={() => setActiveTab("pendencias")}
        >
          <AlertTriangle className="h-4 w-4" />
          Pendências
        </Button>
        <Button
          variant={activeTab === "relatorios" ? "default" : "outline"}
          size="sm"
          className="gap-2 rounded-full"
          onClick={() => setActiveTab("relatorios")}
        >
          <FileText className="h-4 w-4" />
          Relatórios
        </Button>
      </div>

      {activeTab === "registros" && (
        <>
          {/* Filtros de Data Rápidos */}
          <Card className="rounded-2xl">
            <CardContent className="p-4 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Data:</span>
                {[
                  { key: "ultimo" as const, label: `Último (${format(new Date(), 'dd/MM')})` },
                  { key: "hoje" as const, label: "Hoje" },
                  { key: "ontem" as const, label: "Ontem" },
                ].map((opt) => (
                  <Button
                    key={opt.key}
                    size="sm"
                    variant={dateFilter === opt.key ? "default" : "outline"}
                    className="h-8 rounded-full text-xs"
                    onClick={() => {
                      setDateFilter(opt.key);
                      if (opt.key === "hoje") setSelectedDate(new Date());
                      else if (opt.key === "ontem") {
                        const d = new Date();
                        d.setDate(d.getDate() - 1);
                        setSelectedDate(d);
                      } else {
                        setSelectedDate(null);
                      }
                    }}
                  >
                    {opt.label}
                  </Button>
                ))}
                <DateFilter
                  date={selectedDate}
                  onDateChange={(d) => {
                    setSelectedDate(d);
                    setDateFilter("data");
                  }}
                  placeholder="Data"
                  showClear={false}
                />
                <Button size="sm" variant="ghost" className="h-8" onClick={clearFilters}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Filtros de dropdown */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Categoria:</span>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="h-8 w-[130px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">Todas</SelectItem>
                      {uniqueCategories.map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Empresa:</span>
                  <Select value={empresaFilter} onValueChange={setEmpresaFilter}>
                    <SelectTrigger className="h-8 w-[130px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">Todas</SelectItem>
                      {uniqueEmpresas.map(e => (
                        <SelectItem key={e} value={e}>{e}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Veículo:</span>
                  <Select value={veiculoFilter} onValueChange={setVeiculoFilter}>
                    <SelectTrigger className="h-8 w-[130px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      {uniqueVeiculos.map(v => (
                        <SelectItem key={v} value={v}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Busca */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por veículo, operador..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
            </CardContent>
          </Card>

          {/* Tabela */}
          <Card className="rounded-2xl">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-[60px]">Item</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Veículo</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Operador</TableHead>
                      <TableHead className="text-right">Hor. Ant.</TableHead>
                      <TableHead className="text-right">Hor. Atual</TableHead>
                      <TableHead className="text-right">Interv. H</TableHead>
                      <TableHead className="text-right">Km Ant.</TableHead>
                      <TableHead className="text-right">Km Atual</TableHead>
                      <TableHead className="w-[50px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={12} className="text-center py-8 text-muted-foreground">
                          {selectedDate
                            ? 'Nenhum registro encontrado para esta data'
                            : 'Nenhum registro encontrado'
                          }
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredData.slice(0, 100).map((registro, idx) => (
                        <TableRow key={registro.id} className="hover:bg-muted/30">
                          <TableCell className="text-muted-foreground text-center">{idx + 1}</TableCell>
                          <TableCell className="font-medium whitespace-nowrap">{registro.data}</TableCell>
                          <TableCell>
                            <span className="font-semibold text-accent">{registro.veiculo}</span>
                          </TableCell>
                          <TableCell className="max-w-[150px] truncate" title={registro.descricao}>
                            {registro.descricao}
                          </TableCell>
                          <TableCell>{registro.empresa}</TableCell>
                          <TableCell className="max-w-[130px] truncate" title={registro.operador}>
                            {registro.operador}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {registro.horimetro_anterior !== null ? registro.horimetro_anterior.toLocaleString('pt-BR') : '-'}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {registro.horimetro_atual !== null ? registro.horimetro_atual.toLocaleString('pt-BR') : '-'}
                          </TableCell>
                          <TableCell className="text-right font-mono font-semibold text-accent">
                            {registro.horas_trabalhadas.toFixed(0)}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {registro.km_anterior !== null ? registro.km_anterior.toLocaleString('pt-BR') : '-'}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {registro.km_atual !== null ? registro.km_atual.toLocaleString('pt-BR') : '-'}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-popover">
                                <DropdownMenuItem onClick={() => handleEdit(registro)}>
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDelete(registro)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
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
                {filteredData.length > 100 && (
                  <p className="text-center text-sm text-muted-foreground py-4">
                    Mostrando 100 de {filteredData.length} registros
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {activeTab === "pendencias" && (
        <Card className="rounded-2xl">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Pendências</h3>
            <p className="text-muted-foreground">
              {faltantes > 0
                ? `${faltantes} veículos mobilizados ainda não tiveram horímetro lançado.`
                : "Nenhuma pendência encontrada."}
            </p>
          </CardContent>
        </Card>
      )}

      {activeTab === "relatorios" && (
        <Card className="rounded-2xl">
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Relatórios</h3>
            <p className="text-muted-foreground">
              Relatórios de horímetros em desenvolvimento.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <HorimetroEditDialog
        horimetro={editingHorimetro}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />
      <HorimetroDeleteDialog
        horimetro={deletingHorimetro}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      />
      <NovoHorimetroDialog
        open={novoDialogOpen}
        onOpenChange={setNovoDialogOpen}
      />
    </div>
  );
}
