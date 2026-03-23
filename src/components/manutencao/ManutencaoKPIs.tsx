import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrdemServico } from "@/hooks/useManutencoes";
import { formatBRL, formatBR } from "@/lib/formatters";
import { Wrench, DollarSign, TrendingUp, Truck, BarChart3, AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface Props {
  ordens: OrdemServico[];
}

const COLORS = ["#3b82f6", "#ef4444", "#f59e0b", "#22c55e", "#8b5cf6", "#ec4899"];

export function ManutencaoKPIs({ ordens }: Props) {
  const stats = useMemo(() => {
    const custoTotal = ordens.reduce((sum, os) => sum + (os.custo_real || 0), 0);
    const totalOS = ordens.length;
    const preventivas = ordens.filter(os => os.tipo.toLowerCase().includes("prevent")).length;
    const corretivas = ordens.filter(os => os.tipo.toLowerCase().includes("corret")).length;

    // Top equipamentos por quantidade de OS
    const porEquip: Record<string, { count: number; custo: number }> = {};
    for (const os of ordens) {
      if (!porEquip[os.veiculo]) porEquip[os.veiculo] = { count: 0, custo: 0 };
      porEquip[os.veiculo].count++;
      porEquip[os.veiculo].custo += os.custo_real || 0;
    }

    const topEquip = Object.entries(porEquip)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 6)
      .map(([veiculo, data]) => ({ veiculo, ...data }));

    const topCusto = Object.entries(porEquip)
      .sort((a, b) => b[1].custo - a[1].custo)
      .slice(0, 6)
      .map(([veiculo, data]) => ({ veiculo, ...data }));

    return { custoTotal, totalOS, preventivas, corretivas, topEquip, topCusto };
  }, [ordens]);

  if (ordens.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* KPI cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2.5"><Wrench className="h-5 w-5 text-primary" /></div>
            <div>
              <p className="text-2xl font-bold">{stats.totalOS}</p>
              <p className="text-xs text-muted-foreground">Total de OS</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/10 p-2.5"><TrendingUp className="h-5 w-5 text-blue-500" /></div>
            <div>
              <p className="text-2xl font-bold">{stats.preventivas}</p>
              <p className="text-xs text-muted-foreground">Preventivas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-lg bg-red-500/10 p-2.5"><AlertTriangle className="h-5 w-5 text-red-500" /></div>
            <div>
              <p className="text-2xl font-bold">{stats.corretivas}</p>
              <p className="text-xs text-muted-foreground">Corretivas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-lg bg-emerald-500/10 p-2.5"><DollarSign className="h-5 w-5 text-emerald-500" /></div>
            <div>
              <p className="text-2xl font-bold">{formatBRL(stats.custoTotal)}</p>
              <p className="text-xs text-muted-foreground">Custo Total</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {stats.topEquip.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Truck className="h-4 w-4" /> Equipamentos com Mais Manutenções
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stats.topEquip} layout="vertical" margin={{ left: 0, right: 12 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="veiculo" type="category" width={80} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => [`${v} OS`, "Quantidade"]} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {stats.topEquip.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {stats.topCusto.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="h-4 w-4" /> Custo por Equipamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stats.topCusto} layout="vertical" margin={{ left: 0, right: 12 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="veiculo" type="category" width={80} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => [formatBRL(v), "Custo"]} />
                  <Bar dataKey="custo" radius={[0, 4, 4, 0]}>
                    {stats.topCusto.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
