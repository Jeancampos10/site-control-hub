import { Upload, Download, Truck, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const activities = [
  {
    id: 1,
    type: "carga",
    icon: Upload,
    description: "Carregamento EX-003 → CB-012",
    detail: "Rachão • 12m³",
    time: "há 5 min",
    user: "Carlos Silva",
  },
  {
    id: 2,
    type: "descarga",
    icon: Download,
    description: "Descarga CB-008 no Aterro Central",
    detail: "Argila • 8m³",
    time: "há 12 min",
    user: "Maria Santos",
  },
  {
    id: 3,
    type: "carga",
    icon: Upload,
    description: "Carregamento EX-001 → CB-015",
    detail: "Bota-fora • 15m³",
    time: "há 18 min",
    user: "João Pedro",
  },
  {
    id: 4,
    type: "frota",
    icon: Truck,
    description: "CB-020 iniciou operação",
    detail: "Trecho Norte",
    time: "há 25 min",
    user: "Sistema",
  },
  {
    id: 5,
    type: "descarga",
    icon: Download,
    description: "Descarga CB-012 na Estaca 145",
    detail: "Rachão • 12m³",
    time: "há 32 min",
    user: "Carlos Silva",
  },
];

export function RecentActivity() {
  return (
    <div className="chart-container animate-slide-up">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-foreground">Atividade Recente</h3>
          <p className="text-sm text-muted-foreground">Últimos apontamentos registrados</p>
        </div>
        <button className="text-sm font-medium text-accent hover:underline">
          Ver todos
        </button>
      </div>
      <div className="space-y-3">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-start gap-3 rounded-lg border border-border/50 bg-muted/30 p-3 transition-colors hover:bg-muted/50"
          >
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                activity.type === "carga" && "bg-success/10 text-success",
                activity.type === "descarga" && "bg-info/10 text-info",
                activity.type === "frota" && "bg-accent/10 text-accent"
              )}
            >
              <activity.icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {activity.description}
              </p>
              <p className="text-xs text-muted-foreground">{activity.detail}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {activity.time}
              </p>
              <p className="text-xs text-muted-foreground">{activity.user}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
