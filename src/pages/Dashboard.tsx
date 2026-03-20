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
  TrendingUp,
  ArrowDownToLine,
  ArrowUpFromLine,
  BarChart3,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateFilter } from "@/components/shared/DateFilter";
import { useAbastecimentos } from "@/hooks/useAbastecimentos";
import { useHorimetros } from "@/hooks/useHorimetros";

export default function Dashboard() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [searchTerm, setSearchTerm] = useState("");

  const { data: abastecimentos } = useAbastecimentos('Canteiro01');
  const { data: horimetros } = useHorimetros();

  const formattedDate = format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

  // KPIs de combustível (mock - será substituído por dados reais)
  const combustivelKpis = useMemo(() => {
    const totalAbastecimentos = abastecimentos?.length || 0;
    const totalLitros = abastecimentos?.reduce((acc, a) => acc + (a.quantidade_combustivel || 0), 0) || 0;
    return {
      estoqueAnterior: 20440.10,
      entradas: 15000.00,
      saidaEquipamentos: totalLitros || 9535,
      estoqueAtual: 16965.10,
      saidaComboios: 8940,
      estoqueArla: 1754,
      totalRegistros: totalAbastecimentos || 57,
    };
  }, [abastecimentos]);

  // Horímetros KPIs
  const horimetroKpis = useMemo(() => {
    const totalHoras = horimetros?.reduce((acc, h) => acc + (parseFloat(String(h.horas_trabalhadas)) || 0), 0) || 0;
    const equipOperando = horimetros?.length || 0;
    return { totalHoras, equipOperando };
  }, [horimetros]);

  // Mock manutenções em oficina
  const equipamentosOficina = [
    { veiculo: "PC-200 #03", tipo: "Preventiva", cor: "bg-orange-500/10 text-orange-600 border-orange-200" },
    { veiculo: "CB-012", tipo: "Corretiva", cor: "bg-destructive/10 text-destructive border-destructive/20" },
    { veiculo: "CB-045", tipo: "Aguardando peça", cor: "bg-yellow-500/10 text-yellow-600 border-yellow-200" },
  ];

  // Mock próximas revisões
  const proximasRevisoes = [
    { veiculo: "CAM-003", tipo: "Troca de óleo", diasRestantes: 2 },
    { veiculo: "ESC-001", tipo: "Revisão 500h", diasRestantes: 5 },
    { veiculo: "CAM-007", tipo: "Troca de filtros", diasRestantes: 7 },
    { veiculo: "RET-002", tipo: "Revisão geral", diasRestantes: 10 },
  ];

  // Mock tanques
  const tanques = [
    { nome: "Tanque Canteiro 01", capacidade: 10000, nivel: 7500, status: "normal" },
    { nome: "Tanque Canteiro 02", capacidade: 10000, nivel: 3200, status: "alerta" },
    { nome: "Comboio 01", capacidade: 5000, nivel: 4800, status: "normal" },
    { nome: "Comboio 02", capacidade: 5000, nivel: 2100, status: "alerta" },
  ];

  // Top consumidores mock
  const topConsumidores = [
    { equip: "ESC-001", consumo: 850, percentual: 100 },
    { equip: "CAM-012", consumo: 720, percentual: 85 },
    { equip: "CAM-005", consumo: 680, percentual: 80 },
    { equip: "PC-200 #02", consumo: 620, percentual: 73 },
    { equip: "CAM-008", consumo: 580, percentual: 68 },
  ];

  return (
    <div className="space-y-6">
      {/* Header com busca e filtros */}
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
          <Button variant="outline" size="sm" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
          <Badge variant="outline" className="gap-1.5 px-3 py-1.5 bg-green-500/10 text-green-600 border-green-200">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            Sincronizado
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarDays className="h-4 w-4" />
          <span>Data: {formattedDate}</span>
          <span>•</span>
          <span>{combustivelKpis.totalRegistros} registros</span>
        </div>
      </div>

      {/* KPI Cards Coloridos - Combustível */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* Estoque Anterior */}
        <div className="rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 p-5 text-white shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-white/80">Estoque Anterior</p>
              <p className="mt-2 text-2xl font-extrabold">{combustivelKpis.estoqueAnterior.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} L</p>
              <p className="mt-1 text-xs text-white/70">Diesel - Início do período</p>
            </div>
            <div className="rounded-xl bg-white/20 p-2.5">
              <Fuel className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Entradas */}
        <div className="rounded-2xl bg-gradient-to-br from-green-500 to-green-600 p-5 text-white shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-white/80">Entradas</p>
              <p className="mt-2 text-2xl font-extrabold">{combustivelKpis.entradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} L</p>
              <p className="mt-1 text-xs text-white/70">Recebimentos no período</p>
            </div>
            <div className="rounded-xl bg-white/20 p-2.5">
              <ArrowDownToLine className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Saída p/ Equipamentos */}
        <div className="rounded-2xl bg-gradient-to-br from-[hsl(222,60%,22%)] to-[hsl(222,60%,32%)] p-5 text-white shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-white/80">Saída p/ Equipamentos</p>
              <p className="mt-2 text-2xl font-extrabold">{combustivelKpis.saidaEquipamentos.toLocaleString('pt-BR')} L</p>
              <p className="mt-1 text-xs text-white/70">Diesel consumido</p>
            </div>
            <div className="rounded-xl bg-white/20 p-2.5">
              <ArrowUpFromLine className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Estoque Atual */}
        <div className="rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-5 text-white shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-white/80">Estoque Atual</p>
              <p className="mt-2 text-2xl font-extrabold">{combustivelKpis.estoqueAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} L</p>
              <p className="mt-1 text-xs text-white/70">Diesel disponível</p>
            </div>
            <div className="rounded-xl bg-white/20 p-2.5">
              <Droplet className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Segunda linha - Saída Comboios + Estoque Arla */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* Saída p/ Comboios */}
        <div className="rounded-2xl bg-gradient-to-br from-yellow-400 to-yellow-500 p-5 text-white shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-white/80">Saída p/ Comboios</p>
              <p className="mt-2 text-2xl font-extrabold">{combustivelKpis.saidaComboios.toLocaleString('pt-BR')} L</p>
              <p className="mt-1 text-xs text-white/70">Transferências internas</p>
            </div>
            <div className="rounded-xl bg-white/20 p-2.5">
              <Truck className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Estoque Arla */}
        <Card className="rounded-2xl shadow-lg border-2">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Estoque Arla</p>
                <p className="mt-2 text-2xl font-extrabold text-foreground">{combustivelKpis.estoqueArla.toLocaleString('pt-BR')} L</p>
                <p className="mt-1 text-xs text-muted-foreground">Arla disponível</p>
              </div>
              <div className="rounded-xl bg-blue-500/10 p-2.5">
                <Droplet className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Equipamentos em Oficina - Quick */}
        <Card className="rounded-2xl shadow-lg border-2 cursor-pointer hover:border-primary/40 transition-colors" onClick={() => navigate('/controle/manutencao')}>
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Em Oficina</p>
                <p className="mt-1 text-2xl font-extrabold text-foreground">{equipamentosOficina.length}</p>
              </div>
              <div className="rounded-xl bg-orange-500/10 p-2.5">
                <Wrench className="h-5 w-5 text-orange-500" />
              </div>
            </div>
            <div className="space-y-1">
              {equipamentosOficina.slice(0, 2).map((e) => (
                <div key={e.veiculo} className="flex items-center justify-between text-xs">
                  <span className="font-medium">{e.veiculo}</span>
                  <Badge variant="outline" className={`text-[10px] py-0 ${e.cor}`}>{e.tipo}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Alertas Quick */}
        <Card className="rounded-2xl shadow-lg border-2 border-destructive/20 cursor-pointer hover:border-destructive/40 transition-colors" onClick={() => navigate('/alertas')}>
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-destructive">Alertas</p>
                <p className="mt-1 text-2xl font-extrabold text-destructive">7</p>
              </div>
              <div className="rounded-xl bg-destructive/10 p-2.5">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between"><span>Revisões vencidas</span><span className="font-bold text-destructive">3</span></div>
              <div className="flex justify-between"><span>Licenças a vencer</span><span className="font-bold text-yellow-600">2</span></div>
              <div className="flex justify-between"><span>Consumo irregular</span><span className="font-bold text-orange-500">2</span></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grid de Cards detalhados */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Resumo de Estoque / Tanques */}
        <Card className="rounded-2xl shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Fuel className="h-5 w-5 text-blue-500" />
              Resumo de Estoque
            </CardTitle>
            <p className="text-xs text-muted-foreground">{formattedDate}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {tanques.map((tanque) => {
              const pct = Math.round((tanque.nivel / tanque.capacidade) * 100);
              return (
                <div key={tanque.nome} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{tanque.nome}</span>
                    <span className={`text-sm font-semibold ${tanque.status === 'normal' ? 'text-green-600' : 'text-yellow-600'}`}>
                      {tanque.nivel.toLocaleString('pt-BR')}L / {tanque.capacidade.toLocaleString('pt-BR')}L ({pct}%)
                    </span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-muted">
                    <div
                      className={`h-2.5 rounded-full transition-all ${tanque.status === 'normal' ? 'bg-green-500' : 'bg-yellow-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Ranking de Consumo */}
        <Card className="rounded-2xl shadow-md">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-5 w-5 text-primary" />
                Ranking de Consumo
              </CardTitle>
              <div className="flex gap-1">
                <Button size="sm" variant="default" className="h-7 text-xs rounded-full">Total</Button>
                <Button size="sm" variant="outline" className="h-7 text-xs rounded-full">Mês</Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Top 5 equipamentos (exceto comboios)</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {topConsumidores.map((item, idx) => (
              <div key={item.equip} className="flex items-center gap-3">
                <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                  idx === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                  {idx + 1}
                </span>
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
            ))}
          </CardContent>
        </Card>

        {/* Horímetros - Resumo */}
        <Card className="rounded-2xl shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-5 w-5 text-purple-500" />
              Horímetros - Resumo do Dia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 grid-cols-2">
              <div className="rounded-xl bg-purple-500/10 p-4 text-center">
                <p className="text-2xl font-extrabold text-purple-600">{horimetroKpis.totalHoras || 156}h</p>
                <p className="text-xs text-muted-foreground mt-1">Horas Trabalhadas</p>
              </div>
              <div className="rounded-xl bg-green-500/10 p-4 text-center">
                <p className="text-2xl font-extrabold text-green-600">{horimetroKpis.equipOperando || 12}</p>
                <p className="text-xs text-muted-foreground mt-1">Equip. Operando</p>
              </div>
              <div className="rounded-xl bg-blue-500/10 p-4 text-center">
                <p className="text-2xl font-extrabold text-blue-600">8,5h</p>
                <p className="text-xs text-muted-foreground mt-1">Média / Equip.</p>
              </div>
              <div className="rounded-xl bg-orange-500/10 p-4 text-center">
                <p className="text-2xl font-extrabold text-orange-600">3</p>
                <p className="text-xs text-muted-foreground mt-1">Equip. Parados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Próximas Revisões */}
        <Card className="rounded-2xl shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Próximas Revisões Programadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {proximasRevisoes.map((revisao) => (
                <div key={revisao.veiculo} className="flex items-center justify-between rounded-xl bg-muted/50 p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-card">
                      <Truck className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{revisao.veiculo}</p>
                      <p className="text-xs text-muted-foreground">{revisao.tipo}</p>
                    </div>
                  </div>
                  <div className={`rounded-full px-3 py-1 text-xs font-bold ${
                    revisao.diasRestantes <= 3 ? 'bg-destructive/10 text-destructive' :
                    revisao.diasRestantes <= 7 ? 'bg-yellow-500/10 text-yellow-600' :
                    'bg-green-500/10 text-green-600'
                  }`}>
                    {revisao.diasRestantes} dias
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
