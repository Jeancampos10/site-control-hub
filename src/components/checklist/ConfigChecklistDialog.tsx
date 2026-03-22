import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Settings, Plus, MoreHorizontal, Pencil, Trash2, ToggleLeft, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CATEGORIAS = ["Motor", "Cabine", "Pneus", "Chassi", "Sistema Elétrico", "Freios", "Documentação", "EPI", "Geral"];

export function ConfigChecklistDialog({ open, onOpenChange }: Props) {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState("Geral");
  const [ordem, setOrdem] = useState("0");

  const { data: itens = [], isLoading } = useQuery({
    queryKey: ["checklist_itens"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("checklist_itens" as any)
        .select("*")
        .order("ordem", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { descricao, categoria, ordem: parseInt(ordem) || 0 };
      if (editItem) {
        const { error } = await supabase.from("checklist_itens" as any).update(payload).eq("id", editItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("checklist_itens" as any).insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checklist_itens"] });
      toast.success(editItem ? "Item atualizado" : "Item adicionado");
      setFormOpen(false);
      setEditItem(null);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase.from("checklist_itens" as any).update({ ativo }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checklist_itens"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("checklist_itens" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checklist_itens"] });
      toast.success("Item excluído");
    },
  });

  const openNew = () => {
    setEditItem(null);
    setDescricao("");
    setCategoria("Geral");
    setOrdem("0");
    setFormOpen(true);
  };

  const openEdit = (item: any) => {
    setEditItem(item);
    setDescricao(item.descricao);
    setCategoria(item.categoria);
    setOrdem(String(item.ordem));
    setFormOpen(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-accent" />
            Configurar Itens do Checklist
          </DialogTitle>
        </DialogHeader>

        <div className="flex justify-end">
          <Button size="sm" onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Novo Item</Button>
        </div>

        {formOpen && (
          <div className="rounded-lg border p-4 space-y-3 bg-muted/30">
            <div className="space-y-1.5">
              <Label className="text-xs">Descrição *</Label>
              <Input value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex: Nível de óleo do motor" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Categoria</Label>
                <Select value={categoria} onValueChange={setCategoria}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Ordem</Label>
                <Input type="number" value={ordem} onChange={(e) => setOrdem(e.target.value)} />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setFormOpen(false)}>Cancelar</Button>
              <Button size="sm" onClick={() => { if (!descricao.trim()) { toast.error("Descrição obrigatória"); return; } saveMutation.mutate(); }} disabled={saveMutation.isPending}>
                {saveMutation.isPending && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                Salvar
              </Button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ordem</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {itens.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell className="text-sm">{item.ordem}</TableCell>
                  <TableCell className="text-sm">{item.descricao}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{item.categoria}</Badge></TableCell>
                  <TableCell><Badge variant={item.ativo ? "default" : "secondary"}>{item.ativo ? "Ativo" : "Inativo"}</Badge></TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(item)}><Pencil className="h-4 w-4 mr-2" /> Editar</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toggleMutation.mutate({ id: item.id, ativo: !item.ativo })}>
                          <ToggleLeft className="h-4 w-4 mr-2" /> {item.ativo ? "Desativar" : "Ativar"}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => deleteMutation.mutate(item.id)}>
                          <Trash2 className="h-4 w-4 mr-2" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {itens.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">Nenhum item cadastrado</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
}
