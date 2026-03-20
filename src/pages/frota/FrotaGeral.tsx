import { useMemo, useState } from "react";
import { Car, HardHat, Truck, Search, CheckCircle, AlertTriangle, XCircle, Building2 } from "lucide-react";
import { useGoogleSheets, FrotaGeralRow } from "@/hooks/useGoogleSheets";
import { TableLoader } from "@/components/ui/loading-spinner";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function FrotaGeral() {
  const { data, isLoading, error } = useGoogleSheets<FrotaGeralRow>('Frota Geral');
  const [search, setSearch] = useState("");
  const [filterCategoria, setFilterCategoria] = useState("all");
  const [filterEmpresa, setFilterEmpresa] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const items = data || [];

  const categorias = useMemo(() => [...new Set(items.map(i => i.Categoria).filter(Boolean))].sort(), [items]);
  const empresas = useMemo(() => [...new Set(items.map(i => i.Empresa).filter(Boolean))].sort(), [items]);
  const statuses = useMemo(() => [...new Set(items.map(i => i.Status).filter(Boolean))].sort(), [items]);

  const filtered = useMemo(() => {
    return items.filter(row => {
      const matchSearch = !search || Object.values(row).some(v => v?.toLowerCase().includes(search.toLowerCase()));
      const matchCat = filterCategoria === "all" || row.Categoria === filterCategoria;
      const matchEmp = filterEmpresa === "all" || row.Empresa === filterEmpresa;
      const matchSt = filterStatus === "all" || row.Status === filterStatus;
      return matchSearch && matchCat && matchEmp && matchSt;
    });
  }, [items, search, filterCategoria, filterEmpresa, filterStatus]);

  // KPIs
  const total = items.length;
  const mobilizados = items.filter(i => i.Status?.toLowerCase().includes("mobiliz") || i.Status?.toLowerCase().includes("ativo")).length;
  const manutencao = items.filter(i => i.Status?.toLowerCase().includes("manuten")).length;
  const parados = items.filter(i => i.Status?.toLowerCase().includes("parad") || i.Status?.toLowerCase().includes("inativ")).length;

  // By category
  const byCat = useMemo(() => {
    const map = new Map<string, number>();
    items.forEach(i => {
      const cat = i.Categoria || "Outros";
      map.set(cat, (map.get(cat) || 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [items]);

  // By empresa
  const byEmpresa = useMemo(() => {
    const map = new Map<string, number>();
    items.forEach(i => {
      const emp = i.Empresa || "Não informado";
      map.set(emp, (map.get(emp) || 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [items]);

  function statusBadge(status: string) {
    const s = status?.toLowerCase() || "";
    if (s.includes("mobiliz") || s.includes("ativo")) return <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-200">{status}</Badge>;
    if (s.includes("manuten")) return <Badge className="bg-amber-500/15 text-amber-700 border-amber-200">{status}</Badge>;
    if (s.includes("parad") || s.includes("inativ")) return <Badge className="bg-red-500/15 text-red-700 border-red-200">{status}</Badge>;
    return <Badge variant="outline">{status || "—"}</Badge>;
  }

  if (error) return <div className="p-6"><ErrorState message="Erro ao carregar dados da frota" /></div>;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <Car className="h-6 w-6 text-primary" />
          Frota Geral
        </h1>
        <p className="page-subtitle">Controle consolidado de equipamentos e veículos</p>
      </div>

      {isLoading ? <TableLoader /> : (
        <>
          {/* KPIs */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 p-5 text-white shadow-lg">
              <div className="flex items-start justify-between">
                <div><p className="text-sm opacity-90">Total Frota</p><p className="text-3xl font-bold">{total}</p></div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20"><Car className="h-5 w-5" /></div>
              </div>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-5 text-white shadow-lg">
              <div className="flex items-start justify-between">
                <div><p className="text-sm opacity-90">Mobilizados</p><p className="text-3xl font-bold">{mobilizados}</p></div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20"><CheckCircle className="h-5 w-5" /></div>
              </div>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 p-5 text-white shadow-lg">
              <div className="flex items-start justify-between">
                <div><p className="text-sm opacity-90">Manutenção</p><p className="text-3xl font-bold">{manutencao}</p></div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20"><AlertTriangle className="h-5 w-5" /></div>
              </div>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-red-500 to-red-600 p-5 text-white shadow-lg">
              <div className="flex items-start justify-between">
                <div><p className="text-sm opacity-90">Parados</p><p className="text-3xl font-bold">{parados}</p></div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20"><XCircle className="h-5 w-5" /></div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar equipamento..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={filterCategoria} onValueChange={setFilterCategoria}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Categoria" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {categorias.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterEmpresa} onValueChange={setFilterEmpresa}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Empresa" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {empresas.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {statuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Summary cards */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><HardHat className="h-5 w-5" />Por Categoria</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {byCat.length > 0 ? byCat.map(([cat, qty]) => (
                    <div key={cat} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                      <span className="text-sm font-medium">{cat}</span>
                      <Badge variant="secondary">{qty}</Badge>
                    </div>
                  )) : <p className="text-sm text-muted-foreground text-center py-4">Nenhum dado</p>}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" />Por Empresa</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {byEmpresa.length > 0 ? byEmpresa.map(([emp, qty]) => (
                    <div key={emp} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                      <span className="text-sm font-medium">{emp}</span>
                      <Badge variant="secondary">{qty}</Badge>
                    </div>
                  )) : <p className="text-sm text-muted-foreground text-center py-4">Nenhum dado</p>}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Table */}
          <Card>
            <CardHeader>
              <CardTitle>Equipamentos ({filtered.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Potência</TableHead>
                      <TableHead>Motorista</TableHead>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Obra</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length > 0 ? filtered.map((row, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-mono font-medium">{row.Codigo || "—"}</TableCell>
                        <TableCell>{row.Descricao || "—"}</TableCell>
                        <TableCell>{row.Categoria || "—"}</TableCell>
                        <TableCell>{row.Potencia || "—"}</TableCell>
                        <TableCell>{row.Motorista || "—"}</TableCell>
                        <TableCell>{row.Empresa || "—"}</TableCell>
                        <TableCell>{row.Obra || "—"}</TableCell>
                        <TableCell>{statusBadge(row.Status)}</TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                          {items.length === 0
                            ? "A aba 'Frota Geral' na planilha está vazia. Adicione os equipamentos na planilha para visualizá-los aqui."
                            : "Nenhum resultado para os filtros aplicados."}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
