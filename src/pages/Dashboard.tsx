import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Fuel,
  Droplet,
  Wrench,
  AlertTriangle,
  Truck,
  Clock,
  CheckCircle,
  Search,
  CalendarDays,
  RefreshCw,
  ArrowDownToLine,
  ArrowUpFromLine,
  BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateFilter } from "@/components/shared/DateFilter";
import { useAllAbastecimentos } from "@/hooks/useAbastecimentos";
import { useHorimetros } from "@/hooks/useHorimetros";
import { useManutencoes } from "@/hooks/useManutencoes";
import { useQueryClient } from "@tanstack/react-query";

export default function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [searchTerm, setSearchTerm] = useState("");

  const { data: abastecimentos } = useAllAbastecimentos();
  const { data: horimetros } = useHorimetros();
  const { data: ordens } = useManutencoes();

  const formattedDate = format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

  // KPIs de combustível - dados reais
  const combustivelKpis = useMemo(() => {
    const all = abastecimentos || [];
    const totalLitros = all.reduce((acc, a) => acc + (a.quantidade || 0), 0);
    const totalArla = all.reduce((acc, a) => acc + (a.quantidade_arla || 0), 0);
    const totalValor = all.reduce((acc, a) => acc + (a.valor_total || 0), 0);
    return {
      totalRegistros: all.length,
      totalLitros,
      totalArla,
      totalValor,
    };
  }, [abastecimentos]);

  // Horímetros KPIs
  const horimetroKpis = useMemo(() => {
    const all = horimetros || [];
    const totalHoras = all.reduce((acc, h) => acc + (h.horas_trabalhadas || 0), 0);
    const mediaHoras = all.length > 0 ? totalHoras / all.length : 0;
    return { totalHoras: Math.round(totalHoras), equipOperando: all.length, mediaHoras: mediaHoras.toFixed(1) };
  }, [horimetros]);

  // Manutenção KPIs
  const manutencaoKpis = useMemo(() => {
    const all = ordens || [];
    const emAndamento = all.filter(o => o.status.toLowerCase().includes("andamento")).length;
    const aguardando = all.filter(o => o.status.toLowerCase().includes("aguard")).length;
    const abertas = all.filter(o => o.status.toLowerCase().includes("aberta") || o.status.toLowerCase().includes("aberto")).length;
    const concluidas = all.filter(o => o.status.toLowerCase().includes("conclu")).length;
    return { total: all.length, emAndamento, aguardando, abertas, concluidas, emOficina: emAndamento + aguardando };
  }, [ordens]);

  // Top consumidores - dados reais
  const topConsumidores = useMemo(() => {
    const all = abastecimentos || [];
    const byVeiculo = new Map<string, number>();
    all.forEach(a => {
      const key = a.veiculo || 'Desconhecido';
      byVeiculo.set(key, (byVeiculo.get(key) || 0) + a.quantidade);
    });
    const sorted = Array.from(byVeiculo.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const max = sorted[0]?.[1] || 1;
    return sorted.map(([equip, consumo]) => ({
      equip,
      consumo: Math.round(consumo),
      percentual: Math.round((consumo / max) * 100),
    }));
  }, [abastecimentos]);

  // Últimas OS em andamento
  const ordensEmOficina = useMemo(() => {
    return (ordens || [])
      .filter(o => !o.status.toLowerCase().includes("conclu") && !o.status.toLowerCase().includes("finaliz"))
      .slice(0, 3);
  }, [ordens]);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['abastecimentos'] });
    queryClient.invalidateQueries({ queryKey: ['horimetros'] });
    queryClient.invalidateQueries({ queryKey: ['ordens_servico'] });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar veículos, locais, motoristas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-card"
            />
          </div>
          <DateFilter date={selectedDate} onDateChange={(d) => d && setSelectedDate(d)} />
          <Button variant="outline" size="sm" className="gap-2" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
          <Badge variant="outline" className="gap-1.5 px-3 py-1.5 bg-green-500/10 text-green-600 border-green-200">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            Online
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarDays className="h-4 w-4" />
          <span>{formattedDate}</span>
          <span>•</span>
          <span>{combustivelKpis.totalRegistros} abastecimentos</span>
          <span>•</span>
          <span>{horimetroKpis.equipOperando} horímetros</span>
          <span>•</span>
          <span>{manutencaoKpis.total} OS</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 p-5 text-white shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-white/80">Abastecimentos</p>
              <p className="mt-2 text-2xl font-extrabold">{combustivelKpis.totalRegistros}</p>
              <p className="mt-1 text-xs text-white/70">Registros totais</p>
            </div>
            <div className="rounded-xl bg-white/20 p-2.5"><Fuel className="h-5 w-5" /></div>
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-green-500 to-green-600 p-5 text-white shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-white/80">Diesel Consumido</p>
              <p className="mt-2 text-2xl font-extrabold">{combustivelKpis.totalLitros.toLocaleString('pt-BR')} L</p>
              <p className="mt-1 text-xs text-white/70">Total acumulado</p>
            </div>
            <div className="rounded-xl bg-white/20 p-2.5"><ArrowUpFromLine className="h-5 w-5" /></div>
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-[hsl(222,60%,22%)] to-[hsl(222,60%,32%)] p-5 text-white shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-white/80">Valor Total</p>
              <p className="mt-2 text-2xl font-extrabold">R$ {combustivelKpis.totalValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              <p className="mt-1 text-xs text-white/70">Investido em combustível</p>
            </div>
            <div className="rounded-xl bg-white/20 p-2.5"><ArrowDownToLine className="h-5 w-5" /></div>
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-5 text-white shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-white/80">Arla Consumido</p>
              <p className="mt-2 text-2xl font-extrabold">{combustivelKpis.totalArla.toLocaleString('pt-BR')} L</p>
              <p className="mt-1 text-xs text-white/70">Total acumulado</p>
            </div>
            <div className="rounded-xl bg-white/20 p-2.5"><Droplet className="h-5 w-5" /></div>
          </div>
        </div>
      </div>

      {/* Second row KPIs */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl shadow-lg border-2 cursor-pointer hover:border-primary/40 transition-colors" onClick={() => navigate('/controle/horimetros')}>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Horímetros</p>
                <p className="mt-1 text-2xl font-extrabold text-foreground">{horimetroKpis.totalHoras}h</p>
                <p className="text-xs text-muted-foreground">{horimetroKpis.equipOperando} registros • Média {horimetroKpis.mediaHoras}h</p>
              </div>
              <div className="rounded-xl bg-purple-500/10 p-2.5"><Clock className="h-5 w-5 text-purple-500" /></div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-lg border-2 cursor-pointer hover:border-primary/40 transition-colors" onClick={() => navigate('/controle/manutencao')}>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Em Oficina</p>
                <p className="mt-1 text-2xl font-extrabold text-foreground">{manutencaoKpis.emOficina}</p>
                <p className="text-xs text-muted-foreground">{manutencaoKpis.emAndamento} em andamento • {manutencaoKpis.aguardando} aguardando</p>
              </div>
              <div className="rounded-xl bg-orange-500/10 p-2.5"><Wrench className="h-5 w-5 text-orange-500" /></div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-lg border-2 cursor-pointer hover:border-primary/40 transition-colors" onClick={() => navigate('/controle/manutencao')}>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">OS Concluídas</p>
                <p className="mt-1 text-2xl font-extrabold text-green-600">{manutencaoKpis.concluidas}</p>
                <p className="text-xs text-muted-foreground">de {manutencaoKpis.total} total</p>
              </div>
              <div className="rounded-xl bg-green-500/10 p-2.5"><CheckCircle className="h-5 w-5 text-green-500" /></div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-lg border-2 border-destructive/20 cursor-pointer hover:border-destructive/40 transition-colors" onClick={() => navigate('/controle/manutencao')}>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-destructive">OS Abertas</p>
                <p className="mt-1 text-2xl font-extrabold text-destructive">{manutencaoKpis.abertas}</p>
                <p className="text-xs text-muted-foreground">aguardando início</p>
              </div>
              <div className="rounded-xl bg-destructive/10 p-2.5"><AlertTriangle className="h-5 w-5 text-destructive" /></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detail Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Ranking de Consumo */}
        <Card className="rounded-2xl shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-5 w-5 text-primary" />
              Top Consumidores
            </CardTitle>
            <p className="text-xs text-muted-foreground">Top 5 veículos por litros consumidos</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {topConsumidores.length > 0 ? topConsumidores.map((item, idx) => (
              <div key={item.equip} className="flex items-center gap-3">
                <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                  idx === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>{idx + 1}</span>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">{item.equip}</span>
                    <span className="text-sm font-bold">{item.consumo.toLocaleString('pt-BR')} L</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div className="h-2 rounded-full bg-primary/70 transition-all" style={{ width: `${item.percentual}%` }} />
                  </div>
                </div>
              </div>
            )) : (
              <p className="text-sm text-muted-foreground text-center py-6">Nenhum abastecimento registrado ainda</p>
            )}
          </CardContent>
        </Card>

        {/* Ordens em andamento */}
        <Card className="rounded-2xl shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Wrench className="h-5 w-5 text-orange-500" />
              Equipamentos em Oficina
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {ordensEmOficina.length > 0 ? ordensEmOficina.map((os) => (
                <div key={os.id} className="flex items-center justify-between rounded-xl bg-muted/50 p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-card">
                      <Truck className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{os.veiculo}</p>
                      <p className="text-xs text-muted-foreground">{os.problema_relatado}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">{os.status}</Badge>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground text-center py-6">Nenhum equipamento em manutenção</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
