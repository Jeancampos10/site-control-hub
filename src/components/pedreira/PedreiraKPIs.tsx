import { Activity, Box, Truck } from "lucide-react";

interface PedreiraKPIsProps {
  totalRegistros: number;
  pesoTotal: number;
  veiculosAtivos: number;
}

export const PedreiraKPIs = ({ totalRegistros, pesoTotal, veiculosAtivos }: PedreiraKPIsProps) => {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {/* Carregamentos com destaque especial */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary to-primary/80 p-6 text-primary-foreground shadow-lg animate-fade-in">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-base font-semibold opacity-90">Carregamentos</p>
            <p className="text-4xl font-bold tracking-tight">{totalRegistros}</p>
            <p className="text-sm opacity-80">Hoje</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-foreground/20">
            <Activity className="h-6 w-6" />
          </div>
        </div>
      </div>
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-accent to-accent/80 p-6 text-accent-foreground shadow-lg animate-fade-in">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-base font-semibold opacity-90">Peso Total</p>
            <p className="text-4xl font-bold tracking-tight">{pesoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <p className="text-sm opacity-80">Toneladas transportadas</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent-foreground/20">
            <Box className="h-6 w-6" />
          </div>
        </div>
      </div>
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-muted to-muted/80 p-6 text-foreground shadow-lg animate-fade-in border">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-base font-semibold opacity-90">Veículos Ativos</p>
            <p className="text-4xl font-bold tracking-tight">{veiculosAtivos}</p>
            <p className="text-sm opacity-80">Em carregamento hoje</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-foreground/10">
            <Truck className="h-6 w-6" />
          </div>
        </div>
      </div>
    </div>
  );
};
