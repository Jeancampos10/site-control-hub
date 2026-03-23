import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DateFilter } from "@/components/shared/DateFilter";
import { useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Wrench, AlertTriangle, CheckCircle, Clock, Truck, FileText, Plus,
  MoreHorizontal, Pencil, Trash2, Eye, CalendarClock, Settings2, Filter,
  Gauge, Share2,
} from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useManutencoes, useDeleteOrdemServico, OrdemServico } from "@/hooks/useManutencoes";
import { usePlanosComStatus, useCreatePlano, useDeletePlano, PlanoComStatus } from "@/hooks/usePlanosManutencao";
import { useFrota } from "@/hooks/useFrota";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { NovaOrdemServicoDialog } from "@/components/manutencao/NovaOrdemServicoDialog";
import { EditOrdemServicoDialog } from "@/components/manutencao/EditOrdemServicoDialog";
import { OSDetailDialog } from "@/components/manutencao/OSDetailDialog";
import { ManutencaoKPIs } from "@/components/manutencao/ManutencaoKPIs";
import { ManutencaoExport } from "@/components/manutencao/ManutencaoExport";
import { formatBR } from "@/lib/formatters";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";

/* ─── Badge helpers ─── */
const getStatusBadge = (status: string) => {
  const s = status.toLowerCase();
  if (s.includes("aberta") || s.includes("aberto")) return <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20">Aberta</Badge>;
  if (s.includes("andamento")) return <Badge className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20">Em Andamento</Badge>;
  if (s.includes("aguard") || s.includes("peça")) return <Badge className="bg-orange-500/10 text-orange-500 hover:bg-orange-500/20">Aguard. Peças</Badge>;
  if (s.includes("conclu") || s.includes("finaliz")) return <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">Concluída</Badge>;
  return <Badge variant="outline">{status}</Badge>;
};

const getPrioridadeBadge = (p: string) => {
  const s = p.toLowerCase();
  if (s.includes("baixa")) return <Badge variant="outline" className="border-green-500 text-green-500">Baixa</Badge>;
  if (s.includes("méd") || s === "média" || s === "media") return <Badge variant="outline" className="border-yellow-500 text-yellow-500">Média</Badge>;
  if (s.includes("alta")) return <Badge variant="outline" className="border-orange-500 text-orange-500">Alta</Badge>;
  if (s.includes("urgente") || s.includes("crítica")) return <Badge variant="outline" className="border-red-500 text-red-500">Urgente</Badge>;
  return <Badge variant="outline">{p}</Badge>;
};

const getTipoBadge = (tipo: string) => {
  const t = tipo.toLowerCase();
  if (t.includes("prevent")) return <Badge className="bg-blue-500/10 text-blue-500">Preventiva</Badge>;
  if (t.includes("corret")) return <Badge className="bg-red-500/10 text-red-500">Corretiva</Badge>;
  if (t.includes("predit")) return <Badge className="bg-purple-500/10 text-purple-500">Preditiva</Badge>;
  return <Badge variant="outline">{tipo}</Badge>;
};

const statusConfig = {
  ok: { label: "Em Dia", color: "bg-green-500/10 text-green-600 border-green-200", icon: CheckCircle },
  proximo: { label: "Próxima", color: "bg-yellow-500/10 text-yellow-600 border-yellow-200", icon: Clock },
  vencido: { label: "Vencida", color: "bg-red-500/10 text-red-600 border-red-200", icon: AlertTriangle },
};

const tipoIntervaloLabels: Record<string, string> = {
  horimetro: "Horímetro (h)", km: "KM", dias: "Dias",
};

/* ─── Novo Plano Dialog ─── */
function NovoPlanoDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const createPlano = useCreatePlano();
  const { data: frota } = useFrota();
  const [veiculo, setVeiculo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [tipoIntervalo, setTipoIntervalo] = useState("horimetro");
  const [intervalo, setIntervalo] = useState("");
  const [ultimoValor, setUltimoValor] = useState("0");

  const veiculos = useMemo(() => {
    if (!frota) return [];
    return frota.filter(v => v.codigo && v.status !== 'Desmobilizado').sort((a, b) => a.codigo.localeCompare(b.codigo));
  }, [frota]);

  const handleSave = async () => {
    if (!veiculo || !descricao || !intervalo) return;
    await createPlano.mutateAsync({
      veiculo, descricao_servico: descricao,
      tipo_intervalo: tipoIntervalo as any,
      intervalo_valor: Number(intervalo),
      ultimo_valor_executado: Number(ultimoValor) || 0,
      ultima_execucao_data: format(new Date(), 'yyyy-MM-dd'),
    });
    onOpenChange(false);
    setVeiculo(""); setDescricao(""); setIntervalo(""); setUltimoValor("0");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Settings2 className="h-5 w-5 text-primary" /> Novo Plano Preventivo</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Veículo *</Label>
            <Select value={veiculo} onValueChange={setVeiculo}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {veiculos.map(v => <SelectItem key={v.codigo} value={v.codigo}>{v.codigo} {v.descricao ? `- ${v.descricao}` : ''}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Serviço *</Label>
            <Input value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Ex: Troca de óleo motor" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Intervalo *</Label>
              <Select value={tipoIntervalo} onValueChange={setTipoIntervalo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="horimetro">Horímetro (h)</SelectItem>
                  <SelectItem value="km">KM</SelectItem>
                  <SelectItem value="dias">Dias</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Intervalo *</Label>
              <Input type="number" value={intervalo} onChange={e => setIntervalo(e.target.value)} placeholder="250" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Último valor executado</Label>
            <Input type="number" value={ultimoValor} onChange={e => setUltimoValor(e.target.value)} placeholder="0" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={!veiculo || !descricao || !intervalo || createPlano.isPending}>
            {createPlano.isPending ? "Salvando..." : "Criar Plano"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Main Page ─── */
export default function Manutencao() {
  const [mainTab, setMainTab] = useState("realizadas");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [statusFilter, setStatusFilter] = useState("todas");
  const [novaOSOpen, setNovaOSOpen] = useState(false);
  const [editingOS, setEditingOS] = useState<OrdemServico | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewingOS, setViewingOS] = useState<OrdemServico | null>(null);
  const [deletingOS, setDeletingOS] = useState<OrdemServico | null>(null);
  const [novoPlanoOpen, setNovoPlanoOpen] = useState(false);
  const [planoFilter, setPlanoFilter] = useState("todos");

  const { data: ordens, isLoading } = useManutencoes();
  const deleteMutation = useDeleteOrdemServico();
  const { data: planosStatus, isLoading: planosLoading } = usePlanosComStatus();
  const deletePlano = useDeletePlano();

  const ordensServico = ordens || [];
  const planos = planosStatus || [];

  const countByStatus = (keyword: string) => ordensServico.filter(os => os.status.toLowerCase().includes(keyword)).length;
  const totalAbertas = countByStatus("aberta") + countByStatus("aberto");
  const totalAndamento = countByStatus("andamento");
  const totalAguardando = countByStatus("aguard") + countByStatus("peça");
  const totalConcluidas = countByStatus("conclu") + countByStatus("finaliz");

  const filteredOrdens = useMemo(() => {
    if (statusFilter === "todas") return ordensServico;
    return ordensServico.filter(os => {
      const s = os.status.toLowerCase();
      if (statusFilter === "aberta") return s.includes("aberta") || s.includes("aberto");
      if (statusFilter === "andamento") return s.includes("andamento");
      if (statusFilter === "aguardando") return s.includes("aguard") || s.includes("peça");
      if (statusFilter === "concluida") return s.includes("conclu") || s.includes("finaliz");
      return true;
    });
  }, [ordensServico, statusFilter]);

  const filteredPlanos = useMemo(() => {
    if (planoFilter === "todos") return planos;
    return planos.filter(p => p.status === planoFilter);
  }, [planos, planoFilter]);

  const planosKpis = useMemo(() => ({
    total: planos.length,
    ok: planos.filter(p => p.status === 'ok').length,
    proximo: planos.filter(p => p.status === 'proximo').length,
    vencido: planos.filter(p => p.status === 'vencido').length,
  }), [planos]);

  if (isLoading) {
    return <div className="flex justify-center py-12"><LoadingSpinner /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Wrench className="h-6 w-6 text-primary" /> Manutenção
          </h1>
          <p className="text-muted-foreground">Gestão inteligente de manutenções — {ordensServico.length} OS registradas</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <ManutencaoExport ordens={filteredOrdens} />
          <Button className="gap-2" onClick={() => setNovaOSOpen(true)}>
            <Plus className="h-4 w-4" /> Nova OS
          </Button>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={mainTab} onValueChange={setMainTab}>
        <TabsList className="grid w-full grid-cols-3 h-12">
          <TabsTrigger value="realizadas" className="gap-2 text-xs sm:text-sm">
            <Wrench className="h-4 w-4" /> Realizadas
          </TabsTrigger>
          <TabsTrigger value="programadas" className="gap-2 text-xs sm:text-sm">
            <CalendarClock className="h-4 w-4" /> Programadas
          </TabsTrigger>
          <TabsTrigger value="indicadores" className="gap-2 text-xs sm:text-sm">
            <Gauge className="h-4 w-4" /> Indicadores
          </TabsTrigger>
        </TabsList>

        {/* ═══════ TAB: REALIZADAS ═══════ */}
        <TabsContent value="realizadas" className="space-y-4 mt-4">
          {/* Status KPIs */}
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter(statusFilter === "aberta" ? "todas" : "aberta")}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="rounded-lg bg-blue-500/10 p-2.5"><FileText className="h-5 w-5 text-blue-500" /></div>
                <div>
                  <p className="text-2xl font-bold">{totalAbertas}</p>
                  <p className="text-xs text-muted-foreground">Abertas</p>
                </div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter(statusFilter === "andamento" ? "todas" : "andamento")}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="rounded-lg bg-yellow-500/10 p-2.5"><Wrench className="h-5 w-5 text-yellow-500" /></div>
                <div>
                  <p className="text-2xl font-bold">{totalAndamento}</p>
                  <p className="text-xs text-muted-foreground">Em Andamento</p>
                </div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter(statusFilter === "aguardando" ? "todas" : "aguardando")}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="rounded-lg bg-orange-500/10 p-2.5"><Clock className="h-5 w-5 text-orange-500" /></div>
                <div>
                  <p className="text-2xl font-bold">{totalAguardando}</p>
                  <p className="text-xs text-muted-foreground">Aguard. Peças</p>
                </div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter(statusFilter === "concluida" ? "todas" : "concluida")}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="rounded-lg bg-green-500/10 p-2.5"><CheckCircle className="h-5 w-5 text-green-500" /></div>
                <div>
                  <p className="text-2xl font-bold">{totalConcluidas}</p>
                  <p className="text-xs text-muted-foreground">Concluídas</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filtro ativo */}
          {statusFilter !== "todas" && (
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Badge variant="secondary">Filtrando: {statusFilter}</Badge>
              <Button size="sm" variant="ghost" className="text-xs" onClick={() => setStatusFilter("todas")}>Limpar filtro</Button>
            </div>
          )}

          {/* Tabela OS */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Wrench className="h-4 w-4" /> Ordens de Serviço ({filteredOrdens.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nº OS</TableHead>
                      <TableHead>Veículo</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Prioridade</TableHead>
                      <TableHead>Problema</TableHead>
                      <TableHead>Mecânico</TableHead>
                      <TableHead>Abertura</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[60px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrdens.length > 0 ? filteredOrdens.map((os) => (
                      <TableRow key={os.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setViewingOS(os)}>
                        <TableCell className="font-medium">OS-{os.numero_os}</TableCell>
                        <TableCell>
                          <div>
                            <Badge variant="outline">{os.veiculo}</Badge>
                            {os.descricao_veiculo && <p className="mt-1 text-xs text-muted-foreground">{os.descricao_veiculo}</p>}
                          </div>
                        </TableCell>
                        <TableCell>{getTipoBadge(os.tipo)}</TableCell>
                        <TableCell>{getPrioridadeBadge(os.prioridade)}</TableCell>
                        <TableCell className="max-w-[200px] truncate" title={os.problema_relatado}>{os.problema_relatado}</TableCell>
                        <TableCell>{os.mecanico_responsavel || "—"}</TableCell>
                        <TableCell>{os.data_abertura}</TableCell>
                        <TableCell>{getStatusBadge(os.status)}</TableCell>
                        <TableCell onClick={e => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-popover">
                              <DropdownMenuItem onClick={() => setViewingOS(os)}>
                                <Eye className="h-4 w-4 mr-2" /> Visualizar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { setEditingOS(os); setEditDialogOpen(true); }}>
                                <Pencil className="h-4 w-4 mr-2" /> Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setDeletingOS(os)} className="text-destructive focus:text-destructive">
                                <Trash2 className="h-4 w-4 mr-2" /> Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                          Nenhuma OS encontrada. Clique em "Nova OS" para criar.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════ TAB: PROGRAMADAS ═══════ */}
        <TabsContent value="programadas" className="space-y-4 mt-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Planos preventivos com alertas automáticos</p>
            <Button onClick={() => setNovoPlanoOpen(true)} className="gap-2" size="sm">
              <Plus className="h-4 w-4" /> Novo Plano
            </Button>
          </div>

          {/* Plano KPIs */}
          <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setPlanoFilter("todos")}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2.5"><Settings2 className="h-5 w-5 text-primary" /></div>
                <div>
                  <p className="text-2xl font-bold">{planosKpis.total}</p>
                  <p className="text-xs text-muted-foreground">Total Planos</p>
                </div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setPlanoFilter(planoFilter === "ok" ? "todos" : "ok")}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="rounded-lg bg-green-500/10 p-2.5"><CheckCircle className="h-5 w-5 text-green-500" /></div>
                <div>
                  <p className="text-2xl font-bold">{planosKpis.ok}</p>
                  <p className="text-xs text-muted-foreground">🟢 Em Dia</p>
                </div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setPlanoFilter(planoFilter === "proximo" ? "todos" : "proximo")}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="rounded-lg bg-yellow-500/10 p-2.5"><Clock className="h-5 w-5 text-yellow-500" /></div>
                <div>
                  <p className="text-2xl font-bold">{planosKpis.proximo}</p>
                  <p className="text-xs text-muted-foreground">🟡 Próximas</p>
                </div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setPlanoFilter(planoFilter === "vencido" ? "todos" : "vencido")}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="rounded-lg bg-red-500/10 p-2.5"><AlertTriangle className="h-5 w-5 text-red-500" /></div>
                <div>
                  <p className="text-2xl font-bold">{planosKpis.vencido}</p>
                  <p className="text-xs text-muted-foreground">🔴 Vencidas</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {planoFilter !== "todos" && (
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Badge variant="secondary">Filtrando: {statusConfig[planoFilter as keyof typeof statusConfig]?.label || planoFilter}</Badge>
              <Button size="sm" variant="ghost" className="text-xs" onClick={() => setPlanoFilter("todos")}>Limpar filtro</Button>
            </div>
          )}

          {planosLoading ? (
            <div className="flex justify-center py-8"><LoadingSpinner /></div>
          ) : planos.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Settings2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                <h3 className="font-semibold text-lg mb-2">Nenhum plano cadastrado</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Cadastre planos preventivos para receber alertas automáticos baseados em horímetro, KM ou tempo.
                </p>
                <Button onClick={() => setNovoPlanoOpen(true)} className="gap-2"><Plus className="h-4 w-4" /> Criar Plano</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredPlanos.map(plano => {
                const st = statusConfig[plano.status];
                const StatusIcon = st.icon;
                const unidade = tipoIntervaloLabels[plano.tipo_intervalo] || plano.tipo_intervalo;
                return (
                  <Card key={plano.id} className={`transition-all hover:shadow-md ${plano.status === 'vencido' ? 'border-red-300 dark:border-red-800' : plano.status === 'proximo' ? 'border-yellow-300 dark:border-yellow-800' : ''}`}>
                    <CardContent className="p-5 space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-bold text-base">{plano.veiculo}</p>
                          <p className="text-sm text-muted-foreground">{plano.descricao_servico}</p>
                        </div>
                        <Badge className={`${st.color} gap-1`}><StatusIcon className="h-3 w-3" />{st.label}</Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Uso: {formatBR(plano.valor_atual - plano.ultimo_valor_executado, 0)} {unidade}</span>
                          <span>Intervalo: {formatBR(plano.intervalo_valor, 0)} {unidade}</span>
                        </div>
                        <Progress value={plano.percentual} className={`h-2.5 ${plano.status === 'vencido' ? '[&>div]:bg-red-500' : plano.status === 'proximo' ? '[&>div]:bg-yellow-500' : '[&>div]:bg-green-500'}`} />
                        <p className="text-xs font-medium">
                          {plano.status === 'vencido'
                            ? <span className="text-red-600">⚠ Manutenção vencida!</span>
                            : <span>Faltam: <strong>{formatBR(plano.falta, 0)}</strong> {unidade}</span>
                          }
                        </p>
                      </div>
                      <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-2.5">
                        <Gauge className="h-4 w-4 text-primary" />
                        <span className="text-xs text-muted-foreground">Atual:</span>
                        <span className="text-sm font-bold">{formatBR(plano.valor_atual, 0)} {unidade}</span>
                      </div>
                      {plano.servicos_sugeridos.length > 0 && (
                        <div className="rounded-lg bg-primary/5 border border-primary/20 p-2.5">
                          <p className="text-xs font-semibold text-primary mb-1">💡 Serviços Sugeridos:</p>
                          {plano.servicos_sugeridos.map((s, i) => <p key={i} className="text-xs text-muted-foreground">• {s}</p>)}
                        </div>
                      )}
                      <div className="flex justify-end">
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => deletePlano.mutate(plano.id)}>
                          <Trash2 className="h-3.5 w-3.5 mr-1" /> Remover
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ═══════ TAB: INDICADORES ═══════ */}
        <TabsContent value="indicadores" className="mt-4">
          <ManutencaoKPIs ordens={ordensServico} />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <NovaOrdemServicoDialog open={novaOSOpen} onOpenChange={setNovaOSOpen} />
      <EditOrdemServicoDialog open={editDialogOpen} onOpenChange={setEditDialogOpen} ordem={editingOS} />
      <OSDetailDialog open={!!viewingOS} onOpenChange={() => setViewingOS(null)} ordem={viewingOS} />
      <NovoPlanoDialog open={novoPlanoOpen} onOpenChange={setNovoPlanoOpen} />

      <AlertDialog open={!!deletingOS} onOpenChange={() => setDeletingOS(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive"><Trash2 className="h-5 w-5" /> Excluir OS</AlertDialogTitle>
            <AlertDialogDescription>
              Excluir OS-{deletingOS?.numero_os} do veículo <strong>{deletingOS?.veiculo}</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (deletingOS) deleteMutation.mutate({ id: deletingOS.id, veiculo: deletingOS.veiculo }); setDeletingOS(null); }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
