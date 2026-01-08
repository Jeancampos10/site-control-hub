import { useMemo } from "react";
import { Bell, AlertTriangle, CheckCircle, Clock, Filter, MapPin, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useGoogleSheets, CargaRow, filterByDate } from "@/hooks/useGoogleSheets";

interface AlertItem {
  id: number;
  tipo: "warning" | "error" | "info" | "success";
  titulo: string;
  descricao: string;
  local: string;
  horario: string;
  status: "pendente" | "resolvido";
  prefixo?: string;
}

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
  const { data: allCargaData } = useGoogleSheets<CargaRow>('carga');

  // Filter today's data
  const todayData = useMemo(() => {
    return filterByDate(allCargaData, new Date());
  }, [allCargaData]);

  // Generate alerts based on data anomalies
  const generatedAlerts = useMemo((): AlertItem[] => {
    if (!todayData || todayData.length === 0) return [];

    const alerts: AlertItem[] = [];
    let alertId = 100;

    // 1. Check for trucks operating at different locations than their daily history
    const truckLocations = new Map<string, Set<string>>();
    const truckLocationCounts = new Map<string, Map<string, number>>();
    
    todayData.forEach(row => {
      const truck = row.Prefixo_Cb;
      const local = row.Local_da_Obra;
      
      if (!truck || !local) return;
      
      if (!truckLocations.has(truck)) {
        truckLocations.set(truck, new Set());
        truckLocationCounts.set(truck, new Map());
      }
      
      truckLocations.get(truck)!.add(local);
      const counts = truckLocationCounts.get(truck)!;
      counts.set(local, (counts.get(local) || 0) + 1);
    });

    // Find trucks with multiple locations (possible typing errors)
    truckLocations.forEach((locations, truck) => {
      if (locations.size > 1) {
        const counts = truckLocationCounts.get(truck)!;
        const sortedLocations = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
        const mainLocation = sortedLocations[0][0];
        const mainCount = sortedLocations[0][1];
        
        // Alert for locations with fewer occurrences (likely errors)
        sortedLocations.slice(1).forEach(([location, count]) => {
          if (count <= 2 && mainCount >= 3) {
            alerts.push({
              id: alertId++,
              tipo: "warning",
              titulo: "Caminhão em local diferente",
              descricao: `${truck} registrou ${count} viagem(ns) em "${location}" enquanto a maioria (${mainCount}) foi em "${mainLocation}". Possível erro de digitação.`,
              local: location,
              horario: "hoje",
              status: "pendente",
              prefixo: truck,
            });
          }
        });
      }
    });

    // 2. Check for excavators loading at different locations than their daily pattern
    const excavatorLocations = new Map<string, Set<string>>();
    const excavatorLocationCounts = new Map<string, Map<string, number>>();
    
    todayData.forEach(row => {
      const excavator = row.Prefixo_Eq;
      const local = row.Local_da_Obra;
      
      if (!excavator || !local) return;
      
      if (!excavatorLocations.has(excavator)) {
        excavatorLocations.set(excavator, new Set());
        excavatorLocationCounts.set(excavator, new Map());
      }
      
      excavatorLocations.get(excavator)!.add(local);
      const counts = excavatorLocationCounts.get(excavator)!;
      counts.set(local, (counts.get(local) || 0) + 1);
    });

    // Find excavators with multiple locations (possible errors)
    excavatorLocations.forEach((locations, excavator) => {
      if (locations.size > 1) {
        const counts = excavatorLocationCounts.get(excavator)!;
        const sortedLocations = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
        const mainLocation = sortedLocations[0][0];
        const mainCount = sortedLocations[0][1];
        
        sortedLocations.slice(1).forEach(([location, count]) => {
          if (count <= 2 && mainCount >= 3) {
            alerts.push({
              id: alertId++,
              tipo: "error",
              titulo: "Escavadeira em local diferente",
              descricao: `${excavator} registrou carregamento em "${location}" (${count}x) diferente do padrão "${mainLocation}" (${mainCount}x). Verificar se é erro.`,
              local: location,
              horario: "hoje",
              status: "pendente",
              prefixo: excavator,
            });
          }
        });
      }
    });

    return alerts;
  }, [todayData]);

  // Static sample alerts for demo
  const staticAlerts: AlertItem[] = [
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

  // Combine generated and static alerts
  const alertas = [...generatedAlerts, ...staticAlerts];

  const pendentes = alertas.filter((a) => a.status === "pendente").length;
  const criticos = alertas.filter((a) => a.tipo === "error" && a.status === "pendente").length;
  const atencao = alertas.filter((a) => a.tipo === "warning" && a.status === "pendente").length;
  const resolvidos = alertas.filter((a) => a.status === "resolvido").length;

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
        {criticos > 0 && (
          <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2">
            <div className="h-2 w-2 rounded-full bg-destructive" />
            <span className="text-sm font-medium">{criticos} Crítico{criticos > 1 ? 's' : ''}</span>
          </div>
        )}
        {atencao > 0 && (
          <div className="flex items-center gap-2 rounded-lg bg-warning/10 px-3 py-2">
            <div className="h-2 w-2 rounded-full bg-warning" />
            <span className="text-sm font-medium">{atencao} Atenção</span>
          </div>
        )}
        <div className="flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2">
          <div className="h-2 w-2 rounded-full bg-success" />
          <span className="text-sm font-medium">{resolvidos} Resolvido{resolvidos > 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Generated Alerts Info */}
      {generatedAlerts.length > 0 && (
        <div className="rounded-lg border border-warning/30 bg-warning/5 p-4">
          <div className="flex items-center gap-2 text-warning">
            <MapPin className="h-5 w-5" />
            <span className="font-semibold">Alertas Automáticos Detectados</span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {generatedAlerts.length} alerta(s) gerado(s) automaticamente ao identificar inconsistências nos locais de operação.
          </p>
        </div>
      )}

      {/* Alerts List */}
      <div className="space-y-3">
        {alertas.map((alerta) => {
          const config = tipoConfig[alerta.tipo];
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
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                      {alerta.titulo}
                      {alerta.prefixo && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                          <Truck className="h-3 w-3" />
                          {alerta.prefixo}
                        </span>
                      )}
                    </h3>
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

        {alertas.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl bg-card p-12 text-center">
            <CheckCircle className="h-12 w-12 text-success mb-4" />
            <h3 className="text-lg font-semibold">Tudo em ordem!</h3>
            <p className="text-sm text-muted-foreground">Não há alertas pendentes no momento.</p>
          </div>
        )}
      </div>
    </div>
  );
}
