import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Save, X, Loader2, Search, Clock } from "lucide-react";
import { useCreateOrdemServico } from "@/hooks/useManutencoes";
import { useGoogleSheets, FrotaGeralRow } from "@/hooks/useGoogleSheets";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";

interface NovaOrdemServicoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NovaOrdemServicoDialog({ open, onOpenChange }: NovaOrdemServicoDialogProps) {
  const createMutation = useCreateOrdemServico();
  const { data: frota } = useGoogleSheets<FrotaGeralRow>('Frota Geral');

  const [veiculo, setVeiculo] = useState("");
  const [tipo, setTipo] = useState("Corretiva");
  const [dataEntrada, setDataEntrada] = useState("");
  const [horaEntrada, setHoraEntrada] = useState("");
  const [dataSaida, setDataSaida] = useState("");
  const [horaSaida, setHoraSaida] = useState("");
  const [prioridade, setPrioridade] = useState("Média");
  const [status, setStatus] = useState("Aberta");
  const [horimetroAtual, setHorimetroAtual] = useState("");
  const [kmAtual, setKmAtual] = useState("");
  const [mecanico, setMecanico] = useState("");
  const [problemaRelatado, setProblemaRelatado] = useState("");
  const [tipoProblema, setTipoProblema] = useState("");
  const [solucao, setSolucao] = useState("");
  const [horasEstimadas, setHorasEstimadas] = useState("");
  const [horasRealizadas, setHorasRealizadas] = useState("");
  const [custoEstimado, setCustoEstimado] = useState("");
  const [custoReal, setCustoReal] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);

  const veiculos = useMemo(() => {
    if (!frota) return [];
    return frota
      .filter(v => v.Codigo && v.Status?.toLowerCase() !== 'desmobilizado')
      .sort((a, b) => a.Codigo.localeCompare(b.Codigo));
  }, [frota]);

  const filteredVeiculos = useMemo(() => {
    if (!searchTerm) return veiculos;
    const term = searchTerm.toLowerCase();
    return veiculos.filter(v =>
      v.Codigo.toLowerCase().includes(term) ||
      v.Descricao?.toLowerCase().includes(term)
    );
  }, [veiculos, searchTerm]);

  // Fetch last horimetro/km when vehicle changes
  useEffect(() => {
    if (!veiculo) return;
    const fetchLast = async () => {
      const { data: rows } = await supabase
        .from('horimetros')
        .select('horimetro_atual')
        .eq('veiculo', veiculo)
        .order('data', { ascending: false })
        .limit(1);
      if (rows?.[0]?.horimetro_atual) {
        setHorimetroAtual(rows[0].horimetro_atual.toString());
      }
      const { data: abRows } = await supabase
        .from('abastecimentos')
        .select('km_atual')
        .eq('veiculo', veiculo)
        .not('km_atual', 'is', null)
        .order('data', { ascending: false })
        .limit(1);
      if (abRows?.[0]?.km_atual) {
        setKmAtual(abRows[0].km_atual.toString());
      }
    };
    fetchLast();
  }, [veiculo]);

  // Reset on open
  useEffect(() => {
    if (open) {
      setVeiculo("");
      setTipo("Corretiva");
      setDataEntrada(format(new Date(), "dd/MM/yyyy"));
      setHoraEntrada(format(new Date(), "HH:mm"));
      setDataSaida("");
      setHoraSaida("");
      setPrioridade("Média");
      setStatus("Aberta");
      setHorimetroAtual("");
      setKmAtual("");
      setMecanico("");
      setProblemaRelatado("");
      setTipoProblema("");
      setSolucao("");
      setHorasEstimadas("");
      setHorasRealizadas("");
      setCustoEstimado("");
      setCustoReal("");
      setObservacoes("");
      setSearchTerm("");
    }
  }, [open]);

  const parseNumber = (val: string): number | null => {
    if (!val) return null;
    const num = parseFloat(val.replace(',', '.'));
    return isNaN(num) ? null : num;
  };

  const parseDateToISO = (d: string): string => {
    const parts = d.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
    if (!parts) return format(new Date(), 'yyyy-MM-dd');
    const year = parts[3].length === 2 ? `20${parts[3]}` : parts[3];
    return `${year}-${parts[2].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
  };

  const handleSave = async () => {
    if (!veiculo) { toast.error("Selecione um veículo"); return; }
    if (!problemaRelatado) { toast.error("Descreva o problema"); return; }

    const veiculoInfo = veiculos.find(v => v.Codigo === veiculo);
    const isoDataAbertura = parseDateToISO(dataEntrada);
    const isoDataFechamento = dataSaida ? parseDateToISO(dataSaida) : null;

    setIsSyncing(true);
    try {
      // 1. Save to Supabase
      await createMutation.mutateAsync({
        veiculo,
        descricao_veiculo: veiculoInfo?.Descricao || '',
        tipo,
        prioridade,
        status,
        data_abertura: isoDataAbertura,
        data_fechamento: isoDataFechamento,
        problema_relatado: problemaRelatado,
        diagnostico: tipoProblema,
        solucao_aplicada: solucao || undefined,
        mecanico_responsavel: mecanico || undefined,
        motorista_operador: veiculoInfo?.Motorista || undefined,
        horimetro_km: parseNumber(horimetroAtual) || parseNumber(kmAtual),
        tempo_estimado_horas: parseNumber(horasEstimadas),
        tempo_real_horas: parseNumber(horasRealizadas),
        custo_estimado: parseNumber(custoEstimado),
        custo_real: parseNumber(custoReal),
        observacoes: observacoes || undefined,
      });

      // 2. Sync to Google Sheets
      try {
        await supabase.functions.invoke('sync-manutencoes', {
          body: {
            action: 'append',
            data: {
              data_entrada: dataEntrada,
              hora_entrada: horaEntrada,
              data_saida: dataSaida,
              hora_saida: horaSaida,
              veiculo,
              descricao: veiculoInfo?.Descricao || '',
              categoria: veiculoInfo?.Categoria || '',
              empresa: veiculoInfo?.Empresa || '',
              tipo,
              prioridade,
              status,
              problema: problemaRelatado,
              tipo_problema: tipoProblema,
              solucao,
              mecanico,
              horimetro_km: horimetroAtual || kmAtual,
              horas_estimadas: horasEstimadas,
              horas_realizadas: horasRealizadas,
              custo_estimado: custoEstimado,
              custo_real: custoReal,
              observacoes,
            },
          },
        });
      } catch (sheetErr) {
        console.error('Erro ao sincronizar planilha:', sheetErr);
        toast.warning('Salvo no banco, mas falhou ao sincronizar com a planilha');
      }

      onOpenChange(false);
    } catch {
      // Error handled by mutation
    } finally {
      setIsSyncing(false);
    }
  };

  const isPending = createMutation.isPending || isSyncing;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-0 rounded-2xl">
        <DialogHeader className="px-6 pt-5 pb-3 border-b sticky top-0 bg-background z-10">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5 text-primary" />
            Nova Ordem de Serviço
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-4 space-y-4">
          {/* Veículo + Tipo */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Veículo *</Label>
              <Select value={veiculo} onValueChange={setVeiculo}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Pesquisar veículo..." />
                </SelectTrigger>
                <SelectContent>
                  <div className="px-2 pb-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        placeholder="Buscar..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="h-8 pl-7 text-xs"
                      />
                    </div>
                  </div>
                  {filteredVeiculos.map((v) => (
                    <SelectItem key={v.Codigo} value={v.Codigo}>
                      <span className="font-medium">{v.Codigo}</span>
                      {v.Descricao && <span className="text-muted-foreground ml-1">- {v.Descricao}</span>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Tipo de Manutenção</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Corretiva">Corretiva</SelectItem>
                  <SelectItem value="Preventiva">Preventiva</SelectItem>
                  <SelectItem value="Preditiva">Preditiva</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Data/Hora Entrada */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <span className="text-primary">📅</span> Data de Entrada
              </Label>
              <Input value={dataEntrada} onChange={(e) => setDataEntrada(e.target.value)} placeholder="dd/mm/aaaa" className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-primary" /> Hora de Entrada
              </Label>
              <Input value={horaEntrada} onChange={(e) => setHoraEntrada(e.target.value)} placeholder="HH:mm" className="h-10" />
            </div>
          </div>

          {/* Data/Hora Saída */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <span className="text-green-600">📅</span> Data de Saída
              </Label>
              <Input value={dataSaida} onChange={(e) => setDataSaida(e.target.value)} placeholder="dd/mm/aaaa" className="h-10 border-primary/30" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" /> Hora de Saída
              </Label>
              <Input value={horaSaida} onChange={(e) => setHoraSaida(e.target.value)} placeholder="--:--" className="h-10 border-primary/30" />
            </div>
          </div>

          {/* Prioridade + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Prioridade</Label>
              <Select value={prioridade} onValueChange={setPrioridade}>
                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Baixa">Baixa</SelectItem>
                  <SelectItem value="Média">Média</SelectItem>
                  <SelectItem value="Alta">Alta</SelectItem>
                  <SelectItem value="Urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Aberta">Aberta</SelectItem>
                  <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                  <SelectItem value="Aguardando Peças">Aguardando Peças</SelectItem>
                  <SelectItem value="Concluída">Concluída</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Horímetro + KM */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-primary" /> Horímetro Atual
              </Label>
              <Input value={horimetroAtual} onChange={(e) => setHorimetroAtual(e.target.value)} placeholder="Ex: 4500,50" className="h-10 border-primary/30" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <span className="text-muted-foreground">⤴</span> KM Atual
              </Label>
              <Input value={kmAtual} onChange={(e) => setKmAtual(e.target.value)} placeholder="Ex: 120000" className="h-10" />
            </div>
          </div>

          {/* Mecânico */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Mecânico Responsável</Label>
            <Input value={mecanico} onChange={(e) => setMecanico(e.target.value)} placeholder="Nome do mecânico" className="h-10" />
          </div>

          {/* Descrição do Problema */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Descrição do Problema *</Label>
            <Textarea
              value={problemaRelatado}
              onChange={(e) => setProblemaRelatado(e.target.value)}
              placeholder="Descreva o problema detalhadamente..."
              className="min-h-[80px]"
            />
          </div>

          {/* Tipo do Problema (tags) */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium flex items-center gap-1.5">
              <span>🏷</span> Tipo do Problema (Resumo)
            </Label>
            <Input value={tipoProblema} onChange={(e) => setTipoProblema(e.target.value)} placeholder="Ex: Pneu, Ar condicionado..." className="h-10" />
            <p className="text-[10px] text-muted-foreground">Tags resumidas para medição. Separe por vírgula.</p>
          </div>

          {/* Solução */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Solução / Serviço Realizado</Label>
            <Textarea
              value={solucao}
              onChange={(e) => setSolucao(e.target.value)}
              placeholder="Descreva a solução ou serviço realizado..."
              className="min-h-[60px]"
            />
          </div>

          {/* Horas */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Horas Estimadas</Label>
              <Input value={horasEstimadas} onChange={(e) => setHorasEstimadas(e.target.value)} placeholder="0" className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Horas Realizadas</Label>
              <Input value={horasRealizadas} onChange={(e) => setHorasRealizadas(e.target.value)} placeholder="0" className="h-10" />
            </div>
          </div>

          {/* Custos */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Custo Estimado (R$)</Label>
              <Input value={custoEstimado} onChange={(e) => setCustoEstimado(e.target.value)} placeholder="0,00" className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Custo Real (R$)</Label>
              <Input value={custoReal} onChange={(e) => setCustoReal(e.target.value)} placeholder="0,00" className="h-10" />
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Observações</Label>
            <Input value={observacoes} onChange={(e) => setObservacoes(e.target.value)} placeholder="Observações adicionais" className="h-10" />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-6 pb-5 sticky bottom-0 bg-background pt-3 border-t">
          <Button
            onClick={handleSave}
            disabled={isPending || !veiculo || !problemaRelatado}
            className="flex-1 h-11 gap-2 rounded-xl"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar Ordem de Serviço
          </Button>
          <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
