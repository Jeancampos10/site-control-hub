import { Upload, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { CargaRow } from "@/hooks/useGoogleSheets";
import { useMemo } from "react";

interface RecentActivityProps {
  cargaData: CargaRow[];
}

export function RecentActivity({ cargaData }: RecentActivityProps) {
  const activities = useMemo(() => {
    if (!cargaData || cargaData.length === 0) return [];

    // Get the last 5 entries
    return cargaData
      .slice(-10)
      .reverse()
      .slice(0, 5)
      .map((row, idx) => ({
        id: idx,
        type: "carga" as const,
        icon: Upload,
        description: `Carregamento ${row.Prefixo_Eq} → ${row.Prefixo_Cb}`,
        detail: `${row.Material} • ${row.Volume_Total} m³`,
        time: `${row.Data} ${row.Hora_Carga}`,
        user: row.Usuario || 'Sistema',
      }));
  }, [cargaData]);

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
        {activities.length > 0 ? (
          activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-3 rounded-lg border border-border/50 bg-muted/30 p-3 transition-colors hover:bg-muted/50"
            >
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                  "bg-success/10 text-success"
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
          ))
        ) : (
          <div className="flex h-24 items-center justify-center text-muted-foreground">
            Carregando atividades...
          </div>
        )}
      </div>
    </div>
  );
}
