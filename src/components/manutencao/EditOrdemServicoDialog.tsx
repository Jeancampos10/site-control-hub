import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wrench, Save, X, Loader2 } from "lucide-react";
import { useUpdateOrdemServico, OrdemServico } from "@/hooks/useManutencoes";
import { NumericInput } from "@/components/shared/NumericInput";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ordem: OrdemServico | null;
}

const statusOptions = ["Em Andamento", "Aberta", "Aguardando Peças", "Concluída"];
const prioridadeOptions = ["Baixa", "Média", "Alta", "Urgente"];
const tipoOptions = ["Corretiva", "Preventiva"];

export function EditOrdemServicoDialog({ open, onOpenChange, ordem }: Props) {
  const updateMutation = useUpdateOrdemServico();

  const [status, setStatus] = useState("");
  const [prioridade, setPrioridade] = useState("");
  const [tipo, setTipo] = useState("");
  const [problema, setProblema] = useState("");
  const [diagnostico, setDiagnostico] = useState("");
  const [solucao, setSolucao] = useState("");
  const [pecas, setPecas] = useState("");
  const [mecanico, setMecanico] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [tempoReal, setTempoReal] = useState("");
  const [custoReal, setCustoReal] = useState("");
  const [dataFechamento, setDataFechamento] = useState("");

  useEffect(() => {
    if (ordem && open) {
      setStatus(ordem.status);
      setPrioridade(ordem.prioridade);
      setTipo(ordem.tipo);
      setProblema(ordem.problema_relatado);
      setDiagnostico(ordem.diagnostico || "");
      setSolucao(ordem.solucao_aplicada || "");
      setPecas(ordem.pecas_utilizadas || "");
      setMecanico(ordem.mecanico_responsavel || "");
      setObservacoes(ordem.observacoes || "");
      setTempoReal(ordem.tempo_real_horas?.toString() || "");
      setCustoReal(ordem.custo_real?.toString() || "");
      setDataFechamento(ordem.data_fechamento || "");
    }
  }, [ordem, open]);

  const handleSave = () => {
    if (!ordem) return;
    updateMutation.mutate({
      id: ordem.id,
      data: {
        ...ordem,
        status,
        prioridade,
        tipo,
        problema_relatado: problema,
        diagnostico,
        solucao_aplicada: solucao,
        pecas_utilizadas: pecas,
        mecanico_responsavel: mecanico,
        observacoes,
        tempo_real_horas: tempoReal ? parseFloat(tempoReal.replace(",", ".")) : null,
        custo_real: custoReal ? parseFloat(custoReal.replace(",", ".")) : null,
        data_fechamento: dataFechamento || null,
      },
    }, { onSuccess: () => onOpenChange(false) });
  };

  if (!ordem) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[580px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-primary" />
            Editar OS-{ordem.numero_os}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-lg bg-muted/60 p-3 text-sm">
            <strong>{ordem.veiculo}</strong> {ordem.descricao_veiculo && `— ${ordem.descricao_veiculo}`}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {statusOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Prioridade</Label>
              <Select value={prioridade} onValueChange={setPrioridade}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {prioridadeOptions.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Tipo</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {tipoOptions.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Problema Relatado</Label>
            <Textarea value={problema} onChange={e => setProblema(e.target.value)} className="min-h-[60px]" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Diagnóstico</Label>
            <Textarea value={diagnostico} onChange={e => setDiagnostico(e.target.value)} className="min-h-[60px]" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Solução Aplicada</Label>
            <Textarea value={solucao} onChange={e => setSolucao(e.target.value)} className="min-h-[60px]" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Mecânico Responsável</Label>
              <Input value={mecanico} onChange={e => setMecanico(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Peças Utilizadas</Label>
              <Input value={pecas} onChange={e => setPecas(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Tempo Real (h)</Label>
              <NumericInput value={tempoReal} onChange={setTempoReal} placeholder="0,00" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Custo Real (R$)</Label>
              <NumericInput value={custoReal} onChange={setCustoReal} placeholder="0,00" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Data Fechamento</Label>
              <Input type="date" value={dataFechamento} onChange={e => setDataFechamento(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Observações</Label>
            <Textarea value={observacoes} onChange={e => setObservacoes(e.target.value)} className="min-h-[60px]" />
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}><X className="h-4 w-4 mr-1" /> Cancelar</Button>
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
