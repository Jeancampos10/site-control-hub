import { useState, useMemo } from "react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, isToday, startOfWeek, endOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import {
  CalendarClock, ChevronLeft, ChevronRight, Plus, Wrench, Clock,
  AlertTriangle, CheckCircle, Filter, Trash2, Settings2, Gauge,
} from "lucide-react";
import { usePlanosComStatus, useCreatePlano, useDeletePlano, PlanoComStatus } from "@/hooks/usePlanosManutencao";
import { useFrota } from "@/hooks/useFrota";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { formatBR } from "@/lib/formatters";

const tipoIntervaloLabels: Record<string, string> = {
  horimetro: "Horímetro (h)",
  km: "KM",
  dias: "Dias",
};

const statusConfig = {
  ok: { label: "OK", color: "bg-green-500/10 text-green-600 border-green-200", icon: CheckCircle },
  proximo: { label: "Próxima", color: "bg-yellow-500/10 text-yellow-600 border-yellow-200", icon: Clock },
  vencido: { label: "Vencida", color: "bg-red-500/10 text-red-600 border-red-200", icon: AlertTriangle },
};

/* ─── Novo Plano Dialog ─── */
function NovoPlanoDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const createPlano = useCreatePlano();
  const { data: frota } = useFrota();
  const [veiculo, setVeiculo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [tipoIntervalo, setTipoIntervalo] = useState<string>("horimetro");
  const [intervalo, setIntervalo] = useState("");
  const [ultimoValor, setUltimoValor] = useState("0");

  const veiculos = useMemo(() => {
    if (!frota) return [];
    return frota.filter(v => v.codigo && v.status !== 'Desmobilizado').sort((a, b) => a.codigo.localeCompare(b.codigo));
  }, [frota]);

  const handleSave = async () => {
    if (!veiculo || !descricao || !intervalo) return;
    await createPlano.mutateAsync({
      veiculo,
      descricao_servico: descricao,
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
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-primary" />
            Novo Plano de Manutenção
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Veículo/Equipamento *</Label>
            <Select value={veiculo} onValueChange={setVeiculo}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {veiculos.map(v => (
                  <SelectItem key={v.Codigo} value={v.Codigo}>
                    {v.Codigo} {v.Descricao ? `- ${v.Descricao}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Descrição do Serviço *</Label>
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
              <Label>Intervalo (valor) *</Label>
              <Input type="number" value={intervalo} onChange={e => setIntervalo(e.target.value)} placeholder="Ex: 250" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Último valor executado</Label>
            <Input type="number" value={ultimoValor} onChange={e => setUltimoValor(e.target.value)} placeholder="0" />
            <p className="text-xs text-muted-foreground">Horímetro/KM da última manutenção realizada</p>
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
export default function Programacao() {
  const { data: planosStatus, isLoading } = usePlanosComStatus();
  const deletePlano = useDeletePlano();
  const [novoPlanoOpen, setNovoPlanoOpen] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");

  const planos = planosStatus || [];

  const filtered = useMemo(() => {
    if (filtroStatus === "todos") return planos;
    return planos.filter(p => p.status === filtroStatus);
  }, [planos, filtroStatus]);

  const kpis = useMemo(() => ({
    total: planos.length,
    ok: planos.filter(p => p.status === 'ok').length,
    proximo: planos.filter(p => p.status === 'proximo').length,
    vencido: planos.filter(p => p.status === 'vencido').length,
  }), [planos]);

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><LoadingSpinner /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Manutenção Programada</h1>
          <p className="text-muted-foreground">Planos preventivos com alertas automáticos</p>
        </div>
        <Button onClick={() => setNovoPlanoOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Plano
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2.5"><Settings2 className="h-5 w-5 text-primary" /></div>
            <div>
              <p className="text-2xl font-bold">{kpis.total}</p>
              <p className="text-xs text-muted-foreground">Total Planos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-lg bg-green-500/10 p-2.5"><CheckCircle className="h-5 w-5 text-green-500" /></div>
            <div>
              <p className="text-2xl font-bold">{kpis.ok}</p>
              <p className="text-xs text-muted-foreground">Em Dia</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-lg bg-yellow-500/10 p-2.5"><Clock className="h-5 w-5 text-yellow-500" /></div>
            <div>
              <p className="text-2xl font-bold">{kpis.proximo}</p>
              <p className="text-xs text-muted-foreground">Próximas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-lg bg-red-500/10 p-2.5"><AlertTriangle className="h-5 w-5 text-red-500" /></div>
            <div>
              <p className="text-2xl font-bold">{kpis.vencido}</p>
              <p className="text-xs text-muted-foreground">Vencidas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        {["todos", "ok", "proximo", "vencido"].map(s => (
          <Button
            key={s}
            size="sm"
            variant={filtroStatus === s ? "default" : "outline"}
            className="rounded-full text-xs"
            onClick={() => setFiltroStatus(s)}
          >
            {s === "todos" ? "Todos" : statusConfig[s as keyof typeof statusConfig]?.label}
          </Button>
        ))}
      </div>

      {/* Empty state */}
      {planos.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Settings2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="font-semibold text-lg mb-2">Nenhum plano cadastrado</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Cadastre planos de manutenção preventiva para receber alertas automáticos.
            </p>
            <Button onClick={() => setNovoPlanoOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Criar Primeiro Plano
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Plans cards */}
      {filtered.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map(plano => {
            const st = statusConfig[plano.status];
            const StatusIcon = st.icon;
            const unidade = tipoIntervaloLabels[plano.tipo_intervalo] || plano.tipo_intervalo;

            return (
              <Card key={plano.id} className={`transition-all hover:shadow-md ${plano.status === 'vencido' ? 'border-red-300 dark:border-red-800' : plano.status === 'proximo' ? 'border-yellow-300 dark:border-yellow-800' : ''}`}>
                <CardContent className="p-5 space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-base">{plano.veiculo}</p>
                      <p className="text-sm text-muted-foreground">{plano.descricao_servico}</p>
                    </div>
                    <Badge className={`${st.color} gap-1`}>
                      <StatusIcon className="h-3 w-3" />
                      {st.label}
                    </Badge>
                  </div>

                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Uso: {formatBR(plano.valor_atual - plano.ultimo_valor_executado, 0)} {unidade}</span>
                      <span>Intervalo: {formatBR(plano.intervalo_valor, 0)} {unidade}</span>
                    </div>
                    <Progress
                      value={plano.percentual}
                      className={`h-2.5 ${plano.status === 'vencido' ? '[&>div]:bg-red-500' : plano.status === 'proximo' ? '[&>div]:bg-yellow-500' : '[&>div]:bg-green-500'}`}
                    />
                    <p className="text-xs font-medium">
                      {plano.status === 'vencido'
                        ? <span className="text-red-600">⚠ Manutenção vencida!</span>
                        : <span>Faltam: <strong>{formatBR(plano.falta, 0)}</strong> {unidade}</span>
                      }
                    </p>
                  </div>

                  {/* Valor atual */}
                  <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-2.5">
                    <Gauge className="h-4 w-4 text-primary" />
                    <span className="text-xs text-muted-foreground">Atual:</span>
                    <span className="text-sm font-bold">{formatBR(plano.valor_atual, 0)} {unidade}</span>
                  </div>

                  {/* Sugestões automáticas */}
                  {plano.servicos_sugeridos.length > 0 && (
                    <div className="rounded-lg bg-primary/5 border border-primary/20 p-2.5">
                      <p className="text-xs font-semibold text-primary mb-1">💡 Serviços Sugeridos:</p>
                      {plano.servicos_sugeridos.map((s, i) => (
                        <p key={i} className="text-xs text-muted-foreground">• {s}</p>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => deletePlano.mutate(plano.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      Remover
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Summary table */}
      {filtered.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              Resumo de Manutenções
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Veículo</TableHead>
                    <TableHead>Serviço</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Intervalo</TableHead>
                    <TableHead className="text-right">Valor Atual</TableHead>
                    <TableHead className="text-right">Falta</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(p => {
                    const st = statusConfig[p.status];
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="font-semibold">{p.veiculo}</TableCell>
                        <TableCell>{p.descricao_servico}</TableCell>
                        <TableCell>{tipoIntervaloLabels[p.tipo_intervalo]}</TableCell>
                        <TableCell className="text-right font-mono">{formatBR(p.intervalo_valor, 0)}</TableCell>
                        <TableCell className="text-right font-mono">{formatBR(p.valor_atual, 0)}</TableCell>
                        <TableCell className="text-right font-mono">{formatBR(p.falta, 0)}</TableCell>
                        <TableCell>
                          <Badge className={st.color}>{st.label}</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <NovoPlanoDialog open={novoPlanoOpen} onOpenChange={setNovoPlanoOpen} />
    </div>
  );
}
