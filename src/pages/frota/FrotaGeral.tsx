import { useMemo, useState } from "react";
import { Car, HardHat, Truck, Search, CheckCircle, AlertTriangle, XCircle, Building2, Plus, Pencil, Trash2, Upload, Shovel, Cog, Droplets, LayoutGrid } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { TableLoader } from "@/components/ui/loading-spinner";
import { useFrota, useCreateFrota, useUpdateFrota, useDeleteFrota, FrotaItem } from "@/hooks/useFrota";
import { ExportButtons } from "@/components/shared/ExportButtons";
import { ImportFrotaDialog } from "@/components/frota/ImportFrotaDialog";

const categorias = ["Escavadeira", "Caminhão Basculante", "Caminhão Pipa", "Pá Carregadeira", "Rolo Compactador", "Retroescavadeira", "Motoniveladora", "Trator", "Gerador", "Outros"];
const statusOptions = ["Mobilizado", "Desmobilizado", "Em Manutenção", "Parado"];

export default function FrotaGeral() {
  const { data, isLoading } = useFrota();
  const createMutation = useCreateFrota();
  const updateMutation = useUpdateFrota();
  const deleteMutation = useDeleteFrota();

  const [search, setSearch] = useState("");
  const [filterCategoria, setFilterCategoria] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FrotaItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingCodigo, setDeletingCodigo] = useState<string>("");

  // Form state
  const [form, setForm] = useState({ codigo: "", descricao: "", categoria: "", potencia: "", motorista: "", empresa: "L. Pereira", obra: "", status: "Mobilizado" });

  const items = data || [];

  const filtered = useMemo(() => {
    return items.filter(row => {
      const matchSearch = !search || Object.values(row).some(v => String(v).toLowerCase().includes(search.toLowerCase()));
      const matchCat = filterCategoria === "all" || row.categoria === filterCategoria;
      const matchSt = filterStatus === "all" || row.status === filterStatus;
      return matchSearch && matchCat && matchSt;
    });
  }, [items, search, filterCategoria, filterStatus]);

  const total = items.length;
  const mobilizados = items.filter(i => i.status === "Mobilizado").length;
  const manutencao = items.filter(i => i.status === "Em Manutenção").length;
  const parados = items.filter(i => ["Desmobilizado", "Parado"].includes(i.status)).length;

  function openNew() {
    setEditingItem(null);
    setForm({ codigo: "", descricao: "", categoria: "", potencia: "", motorista: "", empresa: "L. Pereira", obra: "", status: "Mobilizado" });
    setDialogOpen(true);
  }

  function openEdit(item: FrotaItem) {
    setEditingItem(item);
    setForm({ codigo: item.codigo, descricao: item.descricao, categoria: item.categoria, potencia: item.potencia, motorista: item.motorista, empresa: item.empresa, obra: item.obra, status: item.status });
    setDialogOpen(true);
  }

  function handleSave() {
    if (!form.codigo.trim()) return;
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, ...form }, { onSuccess: () => setDialogOpen(false) });
    } else {
      createMutation.mutate(form, { onSuccess: () => setDialogOpen(false) });
    }
  }

  function confirmDelete(id: string, codigo: string) {
    setDeletingId(id);
    setDeletingCodigo(codigo);
    setDeleteDialogOpen(true);
  }

  function handleDelete() {
    if (deletingId && deletingCodigo) {
      deleteMutation.mutate({ id: deletingId, codigo: deletingCodigo }, { onSuccess: () => setDeleteDialogOpen(false) });
    }
  }

  function statusBadge(status: string) {
    if (status === "Mobilizado") return <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-200">{status}</Badge>;
    if (status === "Em Manutenção") return <Badge className="bg-amber-500/15 text-amber-700 border-amber-200">{status}</Badge>;
    if (["Desmobilizado", "Parado"].includes(status)) return <Badge className="bg-red-500/15 text-red-700 border-red-200">{status}</Badge>;
    return <Badge variant="outline">{status || "—"}</Badge>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="page-header mb-0">
          <h1 className="page-title flex items-center gap-2">
            <Car className="h-6 w-6 text-primary" />
            Frota Geral
          </h1>
          <p className="page-subtitle">Controle consolidado de equipamentos e veículos</p>
        </div>
        <div className="flex gap-2">
          <ExportButtons
            data={filtered}
            columns={[
              { key: "codigo", label: "Código" },
              { key: "descricao", label: "Descrição" },
              { key: "categoria", label: "Categoria" },
              { key: "potencia", label: "Potência" },
              { key: "motorista", label: "Motorista" },
              { key: "empresa", label: "Empresa" },
              { key: "obra", label: "Obra" },
              { key: "status", label: "Status" },
            ]}
            title="Relatório de Frota"
            fileName="frota"
          />
          <Button variant="outline" onClick={() => setImportDialogOpen(true)} className="gap-2">
            <Upload className="h-4 w-4" />
            Importar
          </Button>
          <Button onClick={openNew} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo
          </Button>
        </div>
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

          {/* Category visual tabs */}
          {(() => {
            const categoryGroups = [
              { key: "all", label: "Todos", icon: LayoutGrid, color: "from-primary to-primary/80" },
              { key: "Escavadeira", label: "Escavadeiras", icon: Shovel, color: "from-amber-500 to-amber-600" },
              { key: "Caminhão Basculante", label: "Basculantes", icon: Truck, color: "from-blue-500 to-blue-600" },
              { key: "Caminhão Pipa", label: "Pipas", icon: Droplets, color: "from-cyan-500 to-cyan-600" },
              { key: "Pá Carregadeira", label: "Pá Carreg.", icon: HardHat, color: "from-orange-500 to-orange-600" },
              { key: "Retroescavadeira", label: "Retro", icon: Shovel, color: "from-yellow-600 to-yellow-700" },
              { key: "Motoniveladora", label: "Motoniv.", icon: Car, color: "from-indigo-500 to-indigo-600" },
              { key: "Rolo Compactador", label: "Rolos", icon: Cog, color: "from-slate-500 to-slate-600" },
              { key: "Outros", label: "Outros", icon: Cog, color: "from-gray-500 to-gray-600" },
            ];
            // Only show categories that have items (+ "all" always)
            const activeCats = categoryGroups.filter(c => c.key === "all" || items.some(i => i.categoria === c.key));
            return (
              <div className="flex flex-wrap gap-2">
                {activeCats.map(cat => {
                  const count = cat.key === "all" ? items.length : items.filter(i => i.categoria === cat.key).length;
                  const isActive = filterCategoria === cat.key;
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.key}
                      onClick={() => setFilterCategoria(cat.key)}
                      className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? `bg-gradient-to-r ${cat.color} text-white shadow-md scale-[1.02]`
                          : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{cat.label}</span>
                      <span className={`ml-1 text-xs rounded-full px-1.5 py-0.5 ${isActive ? 'bg-white/25' : 'bg-background'}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          })()}

          {/* Search + Status filter */}
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar equipamento..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                {statusOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
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
                      <TableHead className="w-[100px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length > 0 ? filtered.map(row => (
                      <TableRow key={row.id}>
                        <TableCell className="font-mono font-medium">{row.codigo}</TableCell>
                        <TableCell>{row.descricao || "—"}</TableCell>
                        <TableCell>{row.categoria || "—"}</TableCell>
                        <TableCell>{row.potencia || "—"}</TableCell>
                        <TableCell>{row.motorista || "—"}</TableCell>
                        <TableCell>{row.empresa || "—"}</TableCell>
                        <TableCell>{row.obra || "—"}</TableCell>
                        <TableCell>{statusBadge(row.status)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(row)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => confirmDelete(row.id, row.codigo)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                          Nenhum veículo/equipamento cadastrado. Clique em "Novo" para adicionar.
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

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Editar Veículo/Equipamento" : "Novo Veículo/Equipamento"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Código *</Label>
                <Input value={form.codigo} onChange={e => setForm(f => ({ ...f, codigo: e.target.value }))} placeholder="Ex: ESC-001" />
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={form.categoria} onValueChange={v => setForm(f => ({ ...f, categoria: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {categorias.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} placeholder="Ex: Escavadeira Hidráulica CAT 320" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Potência</Label>
                <Input value={form.potencia} onChange={e => setForm(f => ({ ...f, potencia: e.target.value }))} placeholder="Ex: 150 CV" />
              </div>
              <div className="space-y-2">
                <Label>Motorista/Operador</Label>
                <Input value={form.motorista} onChange={e => setForm(f => ({ ...f, motorista: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Empresa</Label>
                <Input value={form.empresa} onChange={e => setForm(f => ({ ...f, empresa: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Obra</Label>
                <Input value={form.obra} onChange={e => setForm(f => ({ ...f, obra: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {statusOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
              {editingItem ? "Salvar" : "Cadastrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>Deseja realmente excluir este veículo/equipamento?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ImportFrotaDialog open={importDialogOpen} onOpenChange={setImportDialogOpen} />
    </div>
  );
}
