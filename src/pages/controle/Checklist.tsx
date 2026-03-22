import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ClipboardCheck, Plus, Search, Settings, MoreHorizontal, FileDown, Eye, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { NovoChecklistDialog } from "@/components/checklist/NovoChecklistDialog";
import { ConfigChecklistDialog } from "@/components/checklist/ConfigChecklistDialog";
import { ChecklistViewDialog } from "@/components/checklist/ChecklistViewDialog";
import { exportChecklistPDF } from "@/components/checklist/checklistPdfExport";

export default function Checklist() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [novoOpen, setNovoOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [viewItem, setViewItem] = useState<any>(null);

  const { data: checklists = [], isLoading } = useQuery({
    queryKey: ["checklists"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("checklists" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("checklists" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checklists"] });
      toast.success("Checklist excluído");
    },
  });

  const filtered = useMemo(() => {
    if (!search) return checklists;
    const term = search.toLowerCase();
    return checklists.filter((c: any) =>
      c.veiculo?.toLowerCase().includes(term) ||
      c.motorista?.toLowerCase().includes(term) ||
      c.tipo?.toLowerCase().includes(term)
    );
  }, [checklists, search]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5 text-accent" />
          <h1 className="text-xl font-bold">Checklist de Equipamentos</h1>
          <Badge variant="secondary">{checklists.length}</Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setConfigOpen(true)}>
            <Settings className="h-4 w-4 mr-1" /> Configurar Itens
          </Button>
          <Button size="sm" onClick={() => setNovoOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Novo Checklist
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por veículo, motorista..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Veículo</TableHead>
                  <TableHead>Motorista</TableHead>
                  <TableHead>Obra</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhum checklist encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((c: any) => (
                    <TableRow key={c.id}>
                      <TableCell className="text-sm">{c.data}</TableCell>
                      <TableCell>
                        <Badge variant={c.tipo === "entrada" ? "default" : "secondary"}>
                          {c.tipo === "entrada" ? "Entrada" : "Saída"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{c.veiculo}</TableCell>
                      <TableCell>{c.motorista || "—"}</TableCell>
                      <TableCell>{c.obra || "—"}</TableCell>
                      <TableCell><Badge variant="outline">{c.status}</Badge></TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setViewItem(c)}>
                              <Eye className="h-4 w-4 mr-2" /> Visualizar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => exportChecklistPDF(c)}>
                              <FileDown className="h-4 w-4 mr-2" /> Exportar PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => deleteMutation.mutate(c.id)}>
                              <Trash2 className="h-4 w-4 mr-2" /> Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <NovoChecklistDialog open={novoOpen} onOpenChange={setNovoOpen} />
      <ConfigChecklistDialog open={configOpen} onOpenChange={setConfigOpen} />
      {viewItem && <ChecklistViewDialog item={viewItem} onClose={() => setViewItem(null)} />}
    </div>
  );
}
