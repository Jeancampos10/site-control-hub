import { Bell, AlertTriangle, CheckCircle, Clock, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const alertas = [
  {
    id: 1,
    tipo: "warning",
    titulo: "Produção abaixo da meta",
    descricao: "EX-004 está 35% abaixo da meta diária de produção",
    local: "Aterro Central",
    horario: "há 15 min",
    status: "pendente",
  },
  {
    id: 2,
    tipo: "error",
    titulo: "Equipamento inativo",
    descricao: "EX-006 sem registros há mais de 4 horas",
    local: "Trecho Norte",
    horario: "há 45 min",
    status: "pendente",
  },
  {
    id: 3,
    tipo: "warning",
    titulo: "Material com baixa movimentação",
    descricao: "Argila com apenas 12 viagens hoje (média: 35)",
    local: "Estaca 120-150",
    horario: "há 1 hora",
    status: "pendente",
  },
  {
    id: 4,
    tipo: "info",
    titulo: "Caminhão retornou à operação",
    descricao: "CB-022 voltou a operar após manutenção",
    local: "Trecho Norte",
    horario: "há 2 horas",
    status: "resolvido",
  },
  {
    id: 5,
    tipo: "success",
    titulo: "Meta diária atingida",
    descricao: "EX-003 atingiu 100% da meta de produção",
    local: "Aterro Central",
    horario: "há 3 horas",
    status: "resolvido",
  },
];

const tipoConfig = {
  warning: {
    icon: AlertTriangle,
    bgClass: "bg-warning/10",
    iconClass: "text-warning",
    borderClass: "border-l-warning",
  },
  error: {
    icon: AlertTriangle,
    bgClass: "bg-destructive/10",
    iconClass: "text-destructive",
    borderClass: "border-l-destructive",
  },
  info: {
    icon: Bell,
    bgClass: "bg-info/10",
    iconClass: "text-info",
    borderClass: "border-l-info",
  },
  success: {
    icon: CheckCircle,
    bgClass: "bg-success/10",
    iconClass: "text-success",
    borderClass: "border-l-success",
  },
};

export default function Alertas() {
  const pendentes = alertas.filter((a) => a.status === "pendente").length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="page-header mb-0">
          <h1 className="page-title flex items-center gap-2">
            <Bell className="h-6 w-6 text-accent" />
            Central de Alertas
            {pendentes > 0 && (
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground">
                {pendentes}
              </span>
            )}
          </h1>
          <p className="page-subtitle">
            Notificações e alertas operacionais em tempo real
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            Filtrar
          </Button>
          <Button variant="outline" size="sm">
            Marcar todos como lidos
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2">
          <div className="h-2 w-2 rounded-full bg-destructive" />
          <span className="text-sm font-medium">1 Crítico</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-warning/10 px-3 py-2">
          <div className="h-2 w-2 rounded-full bg-warning" />
          <span className="text-sm font-medium">2 Atenção</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2">
          <div className="h-2 w-2 rounded-full bg-success" />
          <span className="text-sm font-medium">2 Resolvidos</span>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {alertas.map((alerta) => {
          const config = tipoConfig[alerta.tipo as keyof typeof tipoConfig];
          const Icon = config.icon;

          return (
            <div
              key={alerta.id}
              className={cn(
                "flex items-start gap-4 rounded-xl border-l-4 bg-card p-4 shadow-card transition-all hover:shadow-card-hover",
                config.borderClass,
                alerta.status === "resolvido" && "opacity-60"
              )}
            >
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                  config.bgClass
                )}
              >
                <Icon className={cn("h-5 w-5", config.iconClass)} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-foreground">{alerta.titulo}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {alerta.descricao}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 text-xs font-medium",
                      alerta.status === "pendente"
                        ? "status-warning"
                        : "status-active"
                    )}
                  >
                    {alerta.status === "pendente" ? "Pendente" : "Resolvido"}
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="status-badge bg-primary/10 text-primary">
                    {alerta.local}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {alerta.horario}
                  </span>
                </div>
              </div>

              {alerta.status === "pendente" && (
                <Button variant="outline" size="sm" className="shrink-0">
                  Resolver
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
