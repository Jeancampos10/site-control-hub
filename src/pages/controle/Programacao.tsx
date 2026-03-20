import { useState, useMemo } from "react";
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, isToday, startOfWeek, endOfWeek, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Plus,
  Wrench,
  Clock,
  AlertTriangle,
  CheckCircle,
  Truck,
  Filter,
} from "lucide-react";

// Types
interface ServicoAgendado {
  id: string;
  equipamento: string;
  tipo: "preventiva" | "corretiva" | "inspecao" | "troca_oleo" | "troca_filtro" | "revisao_geral";
  descricao: string;
  data: Date;
  horario: string;
  responsavel: string;
  status: "agendado" | "em_andamento" | "concluido" | "atrasado" | "cancelado";
  prioridade: "baixa" | "media" | "alta" | "urgente";
  observacoes?: string;
}

// Mock data
const MOCK_SERVICOS: ServicoAgendado[] = [
  { id: "1", equipamento: "PC-200 #01", tipo: "troca_oleo", descricao: "Troca de óleo e filtro", data: new Date(), horario: "08:00", responsavel: "João Silva", status: "agendado", prioridade: "media" },
  { id: "2", equipamento: "CB-012", tipo: "preventiva", descricao: "Revisão 500h", data: new Date(), horario: "14:00", responsavel: "Carlos Souza", status: "em_andamento", prioridade: "alta" },
  { id: "3", equipamento: "PC-350 #02", tipo: "inspecao", descricao: "Inspeção visual e teste", data: addDays(new Date(), 1), horario: "07:00", responsavel: "Pedro Lima", status: "agendado", prioridade: "baixa" },
  { id: "4", equipamento: "CB-045", tipo: "revisao_geral", descricao: "Revisão geral 2000h", data: addDays(new Date(), 2), horario: "08:00", responsavel: "João Silva", status: "agendado", prioridade: "urgente" },
  { id: "5", equipamento: "CC-01", tipo: "troca_filtro", descricao: "Troca filtro de ar e combustível", data: addDays(new Date(), 3), horario: "10:00", responsavel: "Carlos Souza", status: "agendado", prioridade: "media" },
  { id: "6", equipamento: "PC-200 #03", tipo: "corretiva", descricao: "Reparo no sistema hidráulico", data: addDays(new Date(), -1), horario: "09:00", responsavel: "Pedro Lima", status: "concluido", prioridade: "alta" },
  { id: "7", equipamento: "CB-023", tipo: "preventiva", descricao: "Lubrificação geral", data: addDays(new Date(), -2), horario: "11:00", responsavel: "João Silva", status: "atrasado", prioridade: "media" },
  { id: "8", equipamento: "PIPA-01", tipo: "inspecao", descricao: "Inspeção tanque e bomba", data: addDays(new Date(), 5), horario: "08:00", responsavel: "Carlos Souza", status: "agendado", prioridade: "baixa" },
];

const tipoLabels: Record<string, string> = {
  preventiva: "Preventiva",
  corretiva: "Corretiva",
  inspecao: "Inspeção",
  troca_oleo: "Troca de Óleo",
  troca_filtro: "Troca de Filtro",
  revisao_geral: "Revisão Geral",
};

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  agendado: { label: "Agendado", color: "bg-blue-500/10 text-blue-600 border-blue-200", icon: CalendarClock },
  em_andamento: { label: "Em Andamento", color: "bg-yellow-500/10 text-yellow-600 border-yellow-200", icon: Clock },
  concluido: { label: "Concluído", color: "bg-green-500/10 text-green-600 border-green-200", icon: CheckCircle },
  atrasado: { label: "Atrasado", color: "bg-red-500/10 text-red-600 border-red-200", icon: AlertTriangle },
  cancelado: { label: "Cancelado", color: "bg-muted text-muted-foreground border-border", icon: AlertTriangle },
};

const prioridadeConfig: Record<string, { label: string; color: string }> = {
  baixa: { label: "Baixa", color: "bg-slate-100 text-slate-600 border-slate-200" },
  media: { label: "Média", color: "bg-blue-100 text-blue-600 border-blue-200" },
  alta: { label: "Alta", color: "bg-orange-100 text-orange-600 border-orange-200" },
  urgente: { label: "Urgente", color: "bg-red-100 text-red-600 border-red-200" },
};

/* ─── Calendar Component ─── */
function CalendarioManutencao({
  currentMonth,
  servicos,
  onDayClick,
  selectedDay,
}: {
  currentMonth: Date;
  servicos: ServicoAgendado[];
  onDayClick: (day: Date) => void;
  selectedDay: Date | null;
}) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { locale: ptBR });
  const calendarEnd = endOfWeek(monthEnd, { locale: ptBR });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  const getServicosForDay = (day: Date) => servicos.filter(s => isSameDay(s.data, day));

  return (
    <div>
      {/* Week header */}
      <div className="grid grid-cols-7 mb-2">
        {weekDays.map(d => (
          <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-2">{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
        {days.map((day) => {
          const dayServicos = getServicosForDay(day);
          const inMonth = isSameMonth(day, currentMonth);
          const today = isToday(day);
          const selected = selectedDay && isSameDay(day, selectedDay);
          const hasUrgent = dayServicos.some(s => s.prioridade === "urgente" || s.status === "atrasado");

          return (
            <button
              key={day.toISOString()}
              onClick={() => onDayClick(day)}
              className={`
                min-h-[80px] p-1.5 text-left transition-colors bg-card
                ${!inMonth ? "opacity-40" : ""}
                ${today ? "ring-2 ring-primary ring-inset" : ""}
                ${selected ? "bg-primary/5" : "hover:bg-muted/50"}
              `}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-medium ${today ? "text-primary font-bold" : ""}`}>
                  {format(day, "d")}
                </span>
                {dayServicos.length > 0 && (
                  <span className={`text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center ${hasUrgent ? "bg-red-500 text-white" : "bg-primary/20 text-primary"}`}>
                    {dayServicos.length}
                  </span>
                )}
              </div>
              <div className="space-y-0.5">
                {dayServicos.slice(0, 2).map(s => (
                  <div key={s.id} className={`text-[10px] leading-tight truncate rounded px-1 py-0.5 ${statusConfig[s.status].color}`}>
                    {s.equipamento}
                  </div>
                ))}
                {dayServicos.length > 2 && (
                  <span className="text-[10px] text-muted-foreground">+{dayServicos.length - 2} mais</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── New Service Dialog ─── */
function NovoServicoDialog({ open, onOpenChange, defaultDate }: { open: boolean; onOpenChange: (o: boolean) => void; defaultDate?: Date }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Agendar Serviço
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Equipamento</Label>
              <Select>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pc200-01">PC-200 #01</SelectItem>
                  <SelectItem value="pc200-03">PC-200 #03</SelectItem>
                  <SelectItem value="pc350-02">PC-350 #02</SelectItem>
                  <SelectItem value="cb012">CB-012</SelectItem>
                  <SelectItem value="cb023">CB-023</SelectItem>
                  <SelectItem value="cb045">CB-045</SelectItem>
                  <SelectItem value="cc01">CC-01</SelectItem>
                  <SelectItem value="pipa01">PIPA-01</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo de Serviço</Label>
              <Select>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {Object.entries(tipoLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Input placeholder="Descreva o serviço a ser realizado" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Data</Label>
              <Input type="date" defaultValue={defaultDate ? format(defaultDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd")} />
            </div>
            <div className="space-y-2">
              <Label>Horário</Label>
              <Input type="time" defaultValue="08:00" />
            </div>
            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Select>
                <SelectTrigger><SelectValue placeholder="Média" /></SelectTrigger>
                <SelectContent>
                  {Object.entries(prioridadeConfig).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Responsável</Label>
            <Input placeholder="Nome do mecânico/responsável" />
          </div>
          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea placeholder="Observações adicionais (opcional)" className="resize-none" rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => onOpenChange(false)}>Agendar Serviço</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Main Page ─── */
export default function Programacao() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(new Date());
  const [novoServicoOpen, setNovoServicoOpen] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");

  const servicos = MOCK_SERVICOS;

  // Filter servicos
  const filteredServicos = useMemo(() => {
    if (filtroStatus === "todos") return servicos;
    return servicos.filter(s => s.status === filtroStatus);
  }, [servicos, filtroStatus]);

  // Day detail
  const servicosDoDia = useMemo(() => {
    if (!selectedDay) return [];
    return filteredServicos.filter(s => isSameDay(s.data, selectedDay));
  }, [filteredServicos, selectedDay]);

  // KPIs
  const kpis = useMemo(() => {
    const agendados = servicos.filter(s => s.status === "agendado").length;
    const emAndamento = servicos.filter(s => s.status === "em_andamento").length;
    const atrasados = servicos.filter(s => s.status === "atrasado").length;
    const concluidos = servicos.filter(s => s.status === "concluido").length;
    return { agendados, emAndamento, atrasados, concluidos };
  }, [servicos]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Programação de Manutenção</h1>
          <p className="text-muted-foreground">Calendário de serviços preventivos e corretivos</p>
        </div>
        <Button onClick={() => setNovoServicoOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Agendar Serviço
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/10 p-2.5">
              <CalendarClock className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{kpis.agendados}</p>
              <p className="text-xs text-muted-foreground">Agendados</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-lg bg-yellow-500/10 p-2.5">
              <Clock className="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{kpis.emAndamento}</p>
              <p className="text-xs text-muted-foreground">Em Andamento</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-lg bg-red-500/10 p-2.5">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{kpis.atrasados}</p>
              <p className="text-xs text-muted-foreground">Atrasados</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-lg bg-green-500/10 p-2.5">
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{kpis.concluidos}</p>
              <p className="text-xs text-muted-foreground">Concluídos</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendar */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <CardTitle className="text-base capitalize">
                  {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
                </CardTitle>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <Filter className="h-3 w-3 mr-1" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="agendado">Agendados</SelectItem>
                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                  <SelectItem value="atrasado">Atrasados</SelectItem>
                  <SelectItem value="concluido">Concluídos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <CalendarioManutencao
              currentMonth={currentMonth}
              servicos={filteredServicos}
              onDayClick={setSelectedDay}
              selectedDay={selectedDay}
            />
          </CardContent>
        </Card>

        {/* Day Detail Panel */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              {selectedDay ? format(selectedDay, "dd 'de' MMMM", { locale: ptBR }) : "Selecione um dia"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {servicosDoDia.length === 0 ? (
              <div className="text-center py-8">
                <CalendarClock className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">Nenhum serviço agendado</p>
                <Button variant="outline" size="sm" className="mt-3 gap-1" onClick={() => setNovoServicoOpen(true)}>
                  <Plus className="h-3 w-3" />
                  Agendar
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {servicosDoDia.map(servico => {
                  const st = statusConfig[servico.status];
                  const pr = prioridadeConfig[servico.prioridade];
                  const StatusIcon = st.icon;
                  return (
                    <div key={servico.id} className="rounded-lg border p-3 space-y-2 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold text-sm">{servico.equipamento}</span>
                        </div>
                        <Badge variant="outline" className={`text-[10px] ${pr.color}`}>{pr.label}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{servico.descricao}</p>
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {servico.horario}
                        </div>
                        <Badge variant="outline" className={`text-[10px] gap-1 ${st.color}`}>
                          <StatusIcon className="h-3 w-3" />
                          {st.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium">{tipoLabels[servico.tipo]}</span> • {servico.responsavel}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Próximos Serviços */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarClock className="h-4 w-4" />
            Próximos Serviços
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {servicos
              .filter(s => s.status === "agendado" && s.data >= new Date())
              .sort((a, b) => a.data.getTime() - b.data.getTime())
              .slice(0, 5)
              .map(s => {
                const pr = prioridadeConfig[s.prioridade];
                return (
                  <div key={s.id} className="flex items-center justify-between rounded-lg bg-muted/40 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="text-center min-w-[45px]">
                        <p className="text-lg font-bold leading-tight">{format(s.data, "dd")}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">{format(s.data, "MMM", { locale: ptBR })}</p>
                      </div>
                      <div>
                        <p className="font-medium text-sm">{s.equipamento} — {s.descricao}</p>
                        <p className="text-xs text-muted-foreground">{s.horario} • {s.responsavel} • {tipoLabels[s.tipo]}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={`text-xs ${pr.color}`}>{pr.label}</Badge>
                  </div>
                );
              })}
            {servicos.filter(s => s.status === "agendado" && s.data >= new Date()).length === 0 && (
              <p className="text-center py-4 text-sm text-muted-foreground">Nenhum serviço agendado nos próximos dias</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog */}
      <NovoServicoDialog open={novoServicoOpen} onOpenChange={setNovoServicoOpen} defaultDate={selectedDay || undefined} />
    </div>
  );
}
