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
import { Switch } from "@/components/ui/switch";
import { Fuel, Save, X, Loader2, Search, Clock, AlertTriangle } from "lucide-react";
import { useSyncAbastecimento } from "@/hooks/useAbastecimentos";

import { useGoogleSheets, FrotaGeralRow } from "@/hooks/useGoogleSheets";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";
import { parseBR, formatBR, formatOnBlur, calcConsumo } from "@/lib/formatters";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SOURCES = [
  { key: 'tanque01', label: 'Tanque Canteiro 01' },
  { key: 'tanque02', label: 'Tanque Canteiro 02' },
  { key: 'comboio01', label: 'Comboio 01' },
  { key: 'comboio02', label: 'Comboio 02' },
  { key: 'comboio03', label: 'Comboio 03' },
];

export function NovoAbastecimentoDialog({ open, onOpenChange }: Props) {
  const syncMutation = useSyncAbastecimento();
  
  const { data: frota } = useGoogleSheets<FrotaGeralRow>('Frota');

  const [veiculo, setVeiculo] = useState("");
  const [data, setData] = useState("");
  const [hora, setHora] = useState("");
  const [tipo, setTipo] = useState("Saida");
  const [source, setSource] = useState("comboio01");
  const [tipoCombustivel, setTipoCombustivel] = useState("Diesel S10");
  const [quantidade, setQuantidade] = useState("");
  const [horimetroAnterior, setHorimetroAnterior] = useState("");
  const [horimetroAtual, setHorimetroAtual] = useState("");
  const [kmAnterior, setKmAnterior] = useState("");
  const [kmAtual, setKmAtual] = useState("");
  const [motorista, setMotorista] = useState("");
  const [arla, setArla] = useState(false);
  const [quantidadeArla, setQuantidadeArla] = useState("");
  const [lubrificacao, setLubrificacao] = useState(false);
  const [oleo, setOleo] = useState("");
  const [filtro, setFiltro] = useState("");
  const [fornecedor, setFornecedor] = useState("");
  const [notaFiscal, setNotaFiscal] = useState("");
  const [valorUnitario, setValorUnitario] = useState("");
  const [valorTotal, setValorTotal] = useState("");
  const [observacao, setObservacao] = useState("");
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

  // Auto-fill last horimetro/km
  useEffect(() => {
    if (!veiculo) return;
    const fetchLast = async () => {
      const { data: hRows } = await supabase
        .from('horimetros')
        .select('horimetro_atual')
        .eq('veiculo', veiculo)
        .order('data', { ascending: false })
        .limit(1);
      if (hRows?.[0]?.horimetro_atual) {
        setHorimetroAnterior(hRows[0].horimetro_atual.toString());
      }
      const { data: abRows } = await supabase
        .from('abastecimentos')
        .select('km_atual')
        .eq('veiculo', veiculo)
        .not('km_atual', 'is', null)
        .order('data', { ascending: false })
        .limit(1);
      if (abRows?.[0]?.km_atual) {
        setKmAnterior(abRows[0].km_atual.toString());
      }
    };
    fetchLast();
  }, [veiculo]);

  useEffect(() => {
    if (open) {
      setVeiculo(""); setData(format(new Date(), "dd/MM/yyyy"));
      setHora(format(new Date(), "HH:mm")); setTipo("Saida");
      setSource("comboio01"); setTipoCombustivel("Diesel S10");
      setQuantidade(""); setHorimetroAnterior(""); setHorimetroAtual("");
      setKmAnterior(""); setKmAtual(""); setMotorista("");
      setArla(false); setQuantidadeArla(""); setLubrificacao(false);
      setOleo(""); setFiltro(""); setFornecedor(""); setNotaFiscal("");
      setValorUnitario(""); setValorTotal(""); setObservacao(""); setSearchTerm("");
    }
  }, [open]);

  const parseNum = (v: string): number | null => parseBR(v);

  const handleBlurFormat = (value: string, setter: (v: string) => void) => {
    const formatted = formatOnBlur(value);
    if (formatted !== value) setter(formatted);
  };

  const parseDateToISO = (d: string): string => {
    const parts = d.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
    if (!parts) return format(new Date(), 'yyyy-MM-dd');
    const year = parts[3].length === 2 ? `20${parts[3]}` : parts[3];
    return `${year}-${parts[2].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
  };

  const handleSave = async () => {
    if (!veiculo) { toast.error("Selecione um veículo"); return; }
    if (!quantidade) { toast.error("Informe a quantidade"); return; }

    // Validações
    const hAnt = parseNum(horimetroAnterior);
    const hAtual = parseNum(horimetroAtual);
    const kAnt = parseNum(kmAnterior);
    const kAtual = parseNum(kmAtual);

    if (hAtual != null && hAnt != null && hAtual < hAnt) {
      toast.error(`Horímetro atual (${formatBR(hAtual)}) não pode ser menor que o anterior (${formatBR(hAnt)})`);
      return;
    }
    if (kAtual != null && kAnt != null && kAtual < kAnt) {
      toast.error(`KM atual (${formatBR(kAtual)}) não pode ser menor que o anterior (${formatBR(kAnt)})`);
      return;
    }

    const veiculoInfo = veiculos.find(v => v.Codigo === veiculo);
    const isoData = parseDateToISO(data);

    // Verificar duplicidade no mesmo dia + mesmo local
    const { data: existing } = await supabase
      .from('abastecimentos')
      .select('id')
      .eq('veiculo', veiculo)
      .eq('data', isoData)
      .eq('local_abastecimento', source)
      .eq('hora', hora)
      .limit(1);

    if (existing && existing.length > 0) {
      toast.error(`Já existe um abastecimento para ${veiculo} nesta data/hora/fonte`);
      return;
    }

    setIsSyncing(true);
    try {
      // 1. Save to Supabase
      await syncMutation.mutateAsync({
        action: 'append',
        source,
        data: {
          data: isoData,
          hora,
          tipo,
          veiculo,
          descricao: veiculoInfo?.Descricao || '',
          motorista,
          empresa: veiculoInfo?.Empresa || '',
          obra: veiculoInfo?.Obra || '',
          potencia: veiculoInfo?.Potencia || '',
          horimetro_anterior: parseNum(horimetroAnterior),
          horimetro_atual: parseNum(horimetroAtual),
          km_anterior: parseNum(kmAnterior),
          km_atual: parseNum(kmAtual),
          quantidade: parseNum(quantidade) || 0,
          tipo_combustivel: tipoCombustivel,
          local_abastecimento: source,
          arla,
          quantidade_arla: parseNum(quantidadeArla),
          fornecedor,
          nota_fiscal: notaFiscal,
          valor_unitario: parseNum(valorUnitario),
          valor_total: parseNum(valorTotal),
          observacao,
          lubrificacao,
          oleo,
          filtro,
        },
      });

      // Google Sheets sync removed - Supabase is the primary backend
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao salvar');
    } finally {
      setIsSyncing(false);
    }
  };

  const isPending = syncMutation.isPending || isSyncing;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[620px] max-h-[90vh] overflow-y-auto p-0 rounded-2xl">
        <DialogHeader className="px-6 pt-5 pb-3 border-b sticky top-0 bg-background z-10">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Fuel className="h-5 w-5 text-primary" />
            Novo Abastecimento
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-4 space-y-4">
          {/* Veículo + Data */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Veículo *</Label>
              <Select value={veiculo} onValueChange={setVeiculo}>
                <SelectTrigger className="h-10"><SelectValue placeholder="Pesquisar..." /></SelectTrigger>
                <SelectContent>
                  <div className="px-2 pb-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="h-8 pl-7 text-xs" />
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
              <Label className="text-xs font-medium">Data *</Label>
              <Input value={data} onChange={(e) => setData(e.target.value)} placeholder="dd/mm/aaaa" className="h-10" />
            </div>
          </div>

          {/* Hora + Tipo + Fonte */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-primary" /> Hora</Label>
              <Input value={hora} onChange={(e) => setHora(e.target.value)} placeholder="HH:mm" className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Tipo</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Saida">Saída</SelectItem>
                  <SelectItem value="Entrada">Entrada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Fonte</Label>
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SOURCES.map(s => (
                    <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Último registro info */}
          {veiculo && (horimetroAnterior || kmAnterior) && (
            <div className="rounded-lg bg-muted/60 p-3">
              <p className="text-xs text-muted-foreground">Último registro:</p>
              <p className="text-sm font-medium">
                {horimetroAnterior && `Horímetro: ${horimetroAnterior}`}
                {horimetroAnterior && kmAnterior && ' | '}
                {kmAnterior && `KM: ${kmAnterior}`}
              </p>
            </div>
          )}

          {/* Combustível */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Combustível</Label>
              <Select value={tipoCombustivel} onValueChange={setTipoCombustivel}>
                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Diesel S10">Diesel S10</SelectItem>
                  <SelectItem value="Diesel S500">Diesel S500</SelectItem>
                  <SelectItem value="Gasolina">Gasolina</SelectItem>
                  <SelectItem value="Etanol">Etanol</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Quantidade (L) *</Label>
              <Input value={quantidade} onChange={(e) => setQuantidade(e.target.value)} onBlur={() => handleBlurFormat(quantidade, setQuantidade)} placeholder="0,00" className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Motorista</Label>
              <Input value={motorista} onChange={(e) => setMotorista(e.target.value)} placeholder="Nome" className="h-10" />
            </div>
          </div>

          {/* Horímetro/KM */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Horímetro Atual</Label>
              <Input value={horimetroAtual} onChange={(e) => setHorimetroAtual(e.target.value)} onBlur={() => handleBlurFormat(horimetroAtual, setHorimetroAtual)} placeholder="0,00" className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">KM Atual</Label>
              <Input value={kmAtual} onChange={(e) => setKmAtual(e.target.value)} onBlur={() => handleBlurFormat(kmAtual, setKmAtual)} placeholder="0,00" className="h-10" />
            </div>
          </div>

          {/* Cálculo de consumo automático */}
          {(() => {
            const litros = parseNum(quantidade);
            const hAnt = parseNum(horimetroAnterior);
            const hAt = parseNum(horimetroAtual);
            const kAnt = parseNum(kmAnterior);
            const kAt = parseNum(kmAtual);
            const veiculoInfo = veiculos.find(v => v.Codigo === veiculo);
            const isEquip = veiculoInfo?.Categoria?.toLowerCase()?.includes('escavadeira') || veiculoInfo?.Categoria?.toLowerCase()?.includes('equipamento');
            
            let consumo: number | null = null;
            let label = '';
            
            if (kAt != null && kAnt != null && litros && litros > 0) {
              consumo = calcConsumo('veiculo', kAt - kAnt, litros);
              label = 'KM/L';
            } else if (hAt != null && hAnt != null && litros && litros > 0) {
              consumo = calcConsumo('equipamento', hAt - hAnt, litros);
              label = 'L/h';
            }
            
            if (consumo != null) {
              const isAnomaly = (label === 'KM/L' && (consumo < 1 || consumo > 20)) || (label === 'L/h' && (consumo < 1 || consumo > 50));
              return (
                <div className={`rounded-lg p-3 text-sm flex items-center gap-2 ${isAnomaly ? 'bg-destructive/10 border border-destructive/30' : 'bg-primary/10 border border-primary/20'}`}>
                  {isAnomaly && <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />}
                  <span>Consumo calculado: <strong>{formatBR(consumo)} {label}</strong></span>
                  {isAnomaly && <span className="text-destructive text-xs">(valor fora do padrão)</span>}
                </div>
              );
            }
            return null;
          })()}

          {/* ARLA + Lubrificação */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label className="text-xs font-medium">ARLA</Label>
              <Switch checked={arla} onCheckedChange={setArla} />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label className="text-xs font-medium">Lubrificação</Label>
              <Switch checked={lubrificacao} onCheckedChange={setLubrificacao} />
            </div>
          </div>

          {arla && (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Quantidade ARLA (L)</Label>
              <Input value={quantidadeArla} onChange={(e) => setQuantidadeArla(e.target.value)} placeholder="0" className="h-10" />
            </div>
          )}

          {lubrificacao && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Óleo</Label>
                <Input value={oleo} onChange={(e) => setOleo(e.target.value)} placeholder="Tipo de óleo" className="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Filtro</Label>
                <Input value={filtro} onChange={(e) => setFiltro(e.target.value)} placeholder="Tipo de filtro" className="h-10" />
              </div>
            </div>
          )}

          {/* Fornecedor + NF + Valores */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Fornecedor</Label>
              <Input value={fornecedor} onChange={(e) => setFornecedor(e.target.value)} placeholder="Nome" className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Nota Fiscal</Label>
              <Input value={notaFiscal} onChange={(e) => setNotaFiscal(e.target.value)} placeholder="Nº NF" className="h-10" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Valor Unitário (R$)</Label>
              <Input value={valorUnitario} onChange={(e) => setValorUnitario(e.target.value)} placeholder="0,00" className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Valor Total (R$)</Label>
              <Input value={valorTotal} onChange={(e) => setValorTotal(e.target.value)} placeholder="0,00" className="h-10" />
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Observações</Label>
            <Textarea value={observacao} onChange={(e) => setObservacao(e.target.value)} placeholder="Observações adicionais..." className="min-h-[60px]" />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-6 pb-5 sticky bottom-0 bg-background pt-3 border-t">
          <Button onClick={handleSave} disabled={isPending || !veiculo || !quantidade} className="flex-1 h-11 gap-2 rounded-xl">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar Abastecimento
          </Button>
          <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
