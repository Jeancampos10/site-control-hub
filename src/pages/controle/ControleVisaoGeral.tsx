import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DateFilter } from "@/components/shared/DateFilter";
import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Fuel, 
  Gauge, 
  Wrench, 
  AlertTriangle,
  TrendingUp,
  Truck,
  Clock,
  CheckCircle
} from "lucide-react";

export default function ControleVisaoGeral() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const kpis = [
    {
      title: "Abastecimentos Hoje",
      value: "12",
      description: "Total de abastecimentos realizados",
      icon: Fuel,
      trend: "+8%",
      trendUp: true,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Litros Abastecidos",
      value: "3.450",
      description: "Volume total do dia",
      icon: Gauge,
      trend: "+12%",
      trendUp: true,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Ordens de Serviço",
      value: "5",
      description: "Manutenções em andamento",
      icon: Wrench,
      trend: "-2",
      trendUp: false,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
    {
      title: "Alertas Ativos",
      value: "3",
      description: "Revisões pendentes",
      icon: AlertTriangle,
      trend: "Urgente",
      trendUp: false,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
    },
  ];

  const tanques = [
    { nome: "Tanque Canteiro 01", capacidade: 10000, nivel: 7500, status: "normal" },
    { nome: "Tanque Canteiro 02", capacidade: 10000, nivel: 3200, status: "alerta" },
    { nome: "Comboio 01", capacidade: 5000, nivel: 4800, status: "normal" },
    { nome: "Comboio 02", capacidade: 5000, nivel: 2100, status: "alerta" },
    { nome: "Comboio 03", capacidade: 5000, nivel: 4200, status: "normal" },
  ];

  const ultimasManutencoes = [
    { veiculo: "CAM-001", tipo: "Preventiva", status: "Concluída", data: "10/01/2026" },
    { veiculo: "ESC-002", tipo: "Corretiva", status: "Em andamento", data: "11/01/2026" },
    { veiculo: "CAM-005", tipo: "Preventiva", status: "Agendada", data: "12/01/2026" },
    { veiculo: "RET-001", tipo: "Corretiva", status: "Em andamento", data: "11/01/2026" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "normal": return "text-green-500";
      case "alerta": return "text-yellow-500";
      case "critico": return "text-red-500";
      default: return "text-muted-foreground";
    }
  };

  const getMaintenanceStatusColor = (status: string) => {
    switch (status) {
      case "Concluída": return "bg-green-500/10 text-green-500";
      case "Em andamento": return "bg-yellow-500/10 text-yellow-500";
      case "Agendada": return "bg-blue-500/10 text-blue-500";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Visão Geral - Controle e Manutenção</h1>
          <p className="text-muted-foreground">
            Dashboard de controle de combustível e manutenção - {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
        <DateFilter date={selectedDate} onDateChange={(d) => d && setSelectedDate(d)} />
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.title} className="relative overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">{kpi.title}</p>
                  <p className="text-3xl font-bold">{kpi.value}</p>
                  <p className="text-xs text-muted-foreground">{kpi.description}</p>
                </div>
                <div className={`rounded-lg p-3 ${kpi.bgColor}`}>
                  <kpi.icon className={`h-6 w-6 ${kpi.color}`} />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1">
                <TrendingUp className={`h-4 w-4 ${kpi.trendUp ? 'text-green-500' : 'text-red-500'}`} />
                <span className={`text-sm font-medium ${kpi.trendUp ? 'text-green-500' : 'text-red-500'}`}>
                  {kpi.trend}
                </span>
                <span className="text-xs text-muted-foreground">vs ontem</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Grid de Cards */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Níveis dos Tanques */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Fuel className="h-5 w-5 text-blue-500" />
              Níveis dos Tanques e Comboios
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {tanques.map((tanque) => (
              <div key={tanque.nome} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{tanque.nome}</span>
                  <span className={`text-sm font-semibold ${getStatusColor(tanque.status)}`}>
                    {tanque.nivel.toLocaleString()}L / {tanque.capacidade.toLocaleString()}L
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div 
                    className={`h-2 rounded-full transition-all ${
                      tanque.status === 'normal' ? 'bg-green-500' : 
                      tanque.status === 'alerta' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${(tanque.nivel / tanque.capacidade) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Últimas Manutenções */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-orange-500" />
              Últimas Manutenções
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {ultimasManutencoes.map((manutencao, index) => (
                <div key={index} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <Truck className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{manutencao.veiculo}</p>
                      <p className="text-sm text-muted-foreground">{manutencao.tipo}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getMaintenanceStatusColor(manutencao.status)}`}>
                      {manutencao.status}
                    </span>
                    <p className="mt-1 text-xs text-muted-foreground">{manutencao.data}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Resumo de Horímetros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-purple-500" />
              Horímetros - Resumo do Dia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border p-4 text-center">
                <p className="text-3xl font-bold text-purple-500">156h</p>
                <p className="text-sm text-muted-foreground">Total de Horas Trabalhadas</p>
              </div>
              <div className="rounded-lg border p-4 text-center">
                <p className="text-3xl font-bold text-green-500">12</p>
                <p className="text-sm text-muted-foreground">Equipamentos Operando</p>
              </div>
              <div className="rounded-lg border p-4 text-center">
                <p className="text-3xl font-bold text-blue-500">8,5h</p>
                <p className="text-sm text-muted-foreground">Média por Equipamento</p>
              </div>
              <div className="rounded-lg border p-4 text-center">
                <p className="text-3xl font-bold text-orange-500">3</p>
                <p className="text-sm text-muted-foreground">Equipamentos Parados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Próximas Revisões */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Próximas Revisões Programadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { veiculo: "CAM-003", tipo: "Troca de óleo", diasRestantes: 2 },
                { veiculo: "ESC-001", tipo: "Revisão 500h", diasRestantes: 5 },
                { veiculo: "CAM-007", tipo: "Troca de filtros", diasRestantes: 7 },
                { veiculo: "RET-002", tipo: "Revisão geral", diasRestantes: 10 },
              ].map((revisao, index) => (
                <div key={index} className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                  <div>
                    <p className="font-medium">{revisao.veiculo}</p>
                    <p className="text-sm text-muted-foreground">{revisao.tipo}</p>
                  </div>
                  <div className={`rounded-full px-3 py-1 text-xs font-medium ${
                    revisao.diasRestantes <= 3 ? 'bg-red-500/10 text-red-500' :
                    revisao.diasRestantes <= 7 ? 'bg-yellow-500/10 text-yellow-500' :
                    'bg-green-500/10 text-green-500'
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
