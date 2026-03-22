import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { ClipboardCheck, Save, Loader2, Search } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useFrota } from "@/hooks/useFrota";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ChecklistItemResponse {
  id: string;
  descricao: string;
  categoria: string;
  conforme: boolean | null; // true=OK, false=NOK, null=N/A
  observacao: string;
}

export function NovoChecklistDialog({ open, onOpenChange }: Props) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: frota } = useFrota();

  const [tipo, setTipo] = useState<"entrada" | "saida">("entrada");
  const [veiculo, setVeiculo] = useState("");
  const [data, setData] = useState(format(new Date(), "dd/MM/yyyy"));
  const [hora, setHora] = useState(format(new Date(), "HH:mm"));
  const [motorista, setMotorista] = useState("");
  const [obra, setObra] = useState("");
  const [kmHorimetro, setKmHorimetro] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [respostas, setRespostas] = useState<ChecklistItemResponse[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch checklist template items
  const { data: itensTemplate = [] } = useQuery({
    queryKey: ["checklist_itens"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("checklist_itens" as any)
        .select("*")
        .eq("ativo", true)
        .order("ordem", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const veiculos = useMemo(() => {
    if (!frota) return [];
    return frota.filter(v => v.codigo && v.status !== 'Desmobilizado').sort((a, b) => a.codigo.localeCompare(b.codigo));
  }, [frota]);

  const filteredVeiculos = useMemo(() => {
    if (!searchTerm) return veiculos;
    const term = searchTerm.toLowerCase();
    return veiculos.filter(v => v.codigo.toLowerCase().includes(term) || v.descricao?.toLowerCase().includes(term));
  }, [veiculos, searchTerm]);

  // Reset form
  useEffect(() => {
    if (open) {
      setTipo("entrada");
      setVeiculo("");
      setData(format(new Date(), "dd/MM/yyyy"));
      setHora(format(new Date(), "HH:mm"));
      setMotorista("");
      setObra("");
      setKmHorimetro("");
      setObservacoes("");
      setSearchTerm("");
    }
  }, [open]);

  // Build respostas from template when items or dialog opens
  useEffect(() => {
    if (open && itensTemplate.length > 0) {
      setRespostas(
        itensTemplate.map((item: any) => ({
          id: item.id,
          descricao: item.descricao,
          categoria: item.categoria,
          conforme: null,
          observacao: "",
        }))
      );
    }
  }, [open, itensTemplate]);

  // Auto-fill vehicle data
  useEffect(() => {
    if (!veiculo) return;
    const vi = frota?.find(v => v.codigo === veiculo);
    if (vi) {
      if (vi.motorista) setMotorista(vi.motorista);
      if (vi.obra) setObra(vi.obra);
    }
  }, [veiculo, frota]);

  const updateResposta = (index: number, field: keyof ChecklistItemResponse, value: any) => {
    setRespostas(prev => prev.map((r, i) => i === index ? { ...r, [field]: value } : r));
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const veiculoInfo = frota?.find(v => v.codigo === veiculo);
      const dateParts = data.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
      let isoDate = format(new Date(), "yyyy-MM-dd");
      if (dateParts) {
        const year = dateParts[3].length === 2 ? `20${dateParts[3]}` : dateParts[3];
        isoDate = `${year}-${dateParts[2].padStart(2, "0")}-${dateParts[1].padStart(2, "0")}`;
      }

      const { error } = await supabase.from("checklists" as any).insert({
        veiculo,
        descricao_veiculo: veiculoInfo?.descricao || "",
        tipo,
        data: isoDate,
        hora,
        motorista,
        operador: user?.email || "",
        obra,
        km_horimetro: kmHorimetro,
        respostas: JSON.stringify(respostas),
        observacoes,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checklists"] });
      toast.success("Checklist salvo com sucesso!");
      onOpenChange(false);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const handleSave = () => {
    if (!veiculo) { toast.error("Selecione um veículo"); return; }
    saveMutation.mutate();
  };

  // Group items by category
  const categorias = useMemo(() => {
    const map: Record<string, ChecklistItemResponse[]> = {};
    respostas.forEach((r, i) => {
      const cat = r.categoria || "Geral";
      if (!map[cat]) map[cat] = [];
      map[cat].push({ ...r, id: String(i) }); // use index as temp id for mapping
    });
    return map;
  }, [respostas]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-5 pb-3 border-b">
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-accent" />
            Novo Checklist — {tipo === "entrada" ? "Entrada" : "Saída"}
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-4 space-y-4">
          {/* Tipo + Veículo */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Tipo *</Label>
              <Select value={tipo} onValueChange={(v: any) => setTipo(v)}>
                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="saida">Saída</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs font-medium">Veículo *</Label>
              <Select value={veiculo} onValueChange={setVeiculo}>
                <SelectTrigger className="h-10"><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                <SelectContent>
                  <div className="px-2 pb-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="h-8 pl-7 text-xs" />
                    </div>
                  </div>
                  {filteredVeiculos.map((v) => (
                    <SelectItem key={v.codigo} value={v.codigo}>
                      <span className="font-medium">{v.codigo}</span>
                      {v.descricao && <span className="text-muted-foreground ml-1">- {v.descricao}</span>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Info do veículo */}
          {veiculo && (() => {
            const vi = frota?.find(v => v.codigo === veiculo);
            return vi ? (
              <div className="rounded-lg bg-muted/50 border p-2 text-xs flex flex-wrap gap-x-4 text-muted-foreground">
                {vi.descricao && <span>Desc: <strong className="text-foreground">{vi.descricao}</strong></span>}
                {vi.empresa && <span>Empresa: <strong className="text-foreground">{vi.empresa}</strong></span>}
              </div>
            ) : null;
          })()}

          {/* Data, Hora, Motorista, KM */}
          <div className="grid grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Data</Label>
              <Input value={data} onChange={(e) => setData(e.target.value)} className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Hora</Label>
              <Input value={hora} onChange={(e) => setHora(e.target.value)} className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Motorista</Label>
              <Input value={motorista} onChange={(e) => setMotorista(e.target.value)} className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">KM/Horímetro</Label>
              <Input value={kmHorimetro} onChange={(e) => setKmHorimetro(e.target.value)} className="h-10" />
            </div>
          </div>

          {/* Checklist items */}
          {respostas.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              Nenhum item de checklist configurado. Vá em "Configurar Itens" para adicionar.
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(categorias).map(([cat, items]) => (
                <div key={cat}>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">{cat}</p>
                  <div className="space-y-1">
                    {items.map((item) => {
                      const idx = parseInt(item.id);
                      const r = respostas[idx];
                      return (
                        <div key={idx} className="flex items-center gap-3 rounded-lg border px-3 py-2">
                          <span className="flex-1 text-sm">{r.descricao}</span>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant={r.conforme === true ? "default" : "outline"}
                              className="h-7 px-2 text-xs"
                              onClick={() => updateResposta(idx, "conforme", r.conforme === true ? null : true)}
                            >
                              OK
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant={r.conforme === false ? "destructive" : "outline"}
                              className="h-7 px-2 text-xs"
                              onClick={() => updateResposta(idx, "conforme", r.conforme === false ? null : false)}
                            >
                              NOK
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Observações */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Observações</Label>
            <Textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} placeholder="Observações gerais..." rows={2} />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-6 pb-5 pt-2 border-t">
          <Button onClick={handleSave} disabled={saveMutation.isPending || !veiculo} className="flex-1 h-11 gap-2 rounded-xl">
            {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar Checklist
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
