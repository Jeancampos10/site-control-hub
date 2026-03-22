import { useState, useEffect, useMemo } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Fuel, Save, X, Loader2, Search, Clock, AlertTriangle, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { useSyncAbastecimento } from "@/hooks/useAbastecimentos";
import { useFrota } from "@/hooks/useFrota";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";
import { formatBR, calcConsumo } from "@/lib/formatters";
import { NumericInput, parseNumericInput } from "@/components/shared/NumericInput";
import { useQuery } from "@tanstack/react-query";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SOURCES = [
  { key: 'tanque01', label: 'Tanque Canteiro 01' },
  { key: 'tanque02', label: 'Tanque Canteiro 02' },
  { key: 'comboio01', label: 'Comboio 01 (CC-01)' },
  { key: 'comboio02', label: 'Comboio 02 (CC-02)' },
  { key: 'comboio03', label: 'Comboio 03 (CC-03)' },
];

export function NovoAbastecimentoDialog({ open, onOpenChange }: Props) {
  const syncMutation = useSyncAbastecimento();
  const { data: frota } = useFrota();

  // Fetch fornecedores from DB
  const { data: fornecedores = [] } = useQuery({
    queryKey: ["cad_fornecedores"],
    queryFn: async () => {
      const { data, error } = await supabase.from("cad_fornecedores" as any).select("*").eq("ativo", true).order("nome");
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch tanques from DB
  const { data: tanques = [] } = useQuery({
    queryKey: ["cad_tanques"],
    queryFn: async () => {
      const { data, error } = await supabase.from("cad_tanques" as any).select("*").eq("ativo", true).order("nome");
      if (error) throw error;
      return data || [];
    },
  });

  const [tipo, setTipo] = useState<"Entrada" | "Saida">("Saida");
  const [veiculo, setVeiculo] = useState("");
  const [data, setData] = useState("");
  const [hora, setHora] = useState("");
  const [destino, setDestino] = useState(""); // for saida: tanque/comboio source
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

  const isEntrada = tipo === "Entrada";

  const veiculos = useMemo(() => {
    if (!frota) return [];
    return frota.filter(v => v.codigo && v.status !== 'Desmobilizado').sort((a, b) => a.codigo.localeCompare(b.codigo));
  }, [frota]);

  const filteredVeiculos = useMemo(() => {
    if (!searchTerm) return veiculos;
    const term = searchTerm.toLowerCase();
    return veiculos.filter(v => v.codigo.toLowerCase().includes(term) || v.descricao?.toLowerCase().includes(term));
  }, [veiculos, searchTerm]);

  // Build dynamic source list from tanques DB + fallback
  const sourceOptions = useMemo(() => {
    if (tanques.length > 0) {
      return tanques.map((t: any) => ({ key: t.nome, label: `${t.nome}${t.tipo ? ` (${t.tipo})` : ''}` }));
    }
    return SOURCES;
  }, [tanques]);

  // Auto-fill vehicle info
  useEffect(() => {
    if (!veiculo || isEntrada) return;
    const vi = frota?.find(v => v.codigo === veiculo);
    if (vi?.motorista) setMotorista(vi.motorista);

    const fetchLast = async () => {
      const { data: hRows } = await supabase.from('horimetros').select('horimetro_atual').eq('veiculo', veiculo).order('data', { ascending: false }).limit(1);
      if (hRows?.[0]?.horimetro_atual) setHorimetroAnterior(hRows[0].horimetro_atual.toString());
      const { data: abRows } = await supabase.from('abastecimentos').select('km_atual').eq('veiculo', veiculo).not('km_atual', 'is', null).order('data', { ascending: false }).limit(1);
      if (abRows?.[0]?.km_atual) setKmAnterior(abRows[0].km_atual.toString());
    };
    fetchLast();
  }, [veiculo, frota, isEntrada]);

  useEffect(() => {
    if (open) {
      setTipo("Saida"); setVeiculo(""); setData(format(new Date(), "dd/MM/yyyy"));
      setHora(format(new Date(), "HH:mm")); setDestino("");
      setTipoCombustivel("Diesel S10"); setQuantidade("");
      setHorimetroAnterior(""); setHorimetroAtual(""); setKmAnterior(""); setKmAtual("");
      setMotorista(""); setArla(false); setQuantidadeArla("");
      setLubrificacao(false); setOleo(""); setFiltro("");
      setFornecedor(""); setNotaFiscal(""); setValorUnitario(""); setValorTotal("");
      setObservacao(""); setSearchTerm("");
    }
  }, [open]);

  const parseNum = (v: string): number | null => parseNumericInput(v);

  const parseDateToISO = (d: string): string => {
    const parts = d.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
    if (!parts) return format(new Date(), 'yyyy-MM-dd');
    const year = parts[3].length === 2 ? `20${parts[3]}` : parts[3];
    return `${year}-${parts[2].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
  };

  const handleSave = async () => {
    if (!quantidade) { toast.error("Informe a quantidade"); return; }

    if (!isEntrada && !veiculo) { toast.error("Selecione um veículo/destino"); return; }

    const hAnt = parseNum(horimetroAnterior);
    const hAtual = parseNum(horimetroAtual);
    const kAnt = parseNum(kmAnterior);
    const kAtual = parseNum(kmAtual);

    if (!isEntrada) {
      if (hAtual != null && hAnt != null && hAtual < hAnt) {
        toast.error(`Horímetro atual não pode ser menor que o anterior`);
        return;
      }
      if (kAtual != null && kAnt != null && kAtual < kAnt) {
        toast.error(`KM atual não pode ser menor que o anterior`);
        return;
      }
    }

    const veiculoInfo = veiculos.find(v => v.codigo === veiculo);
    const isoData = parseDateToISO(data);

    setIsSyncing(true);
    try {
      await syncMutation.mutateAsync({
        action: 'append',
        source: destino || 'manual',
        data: {
          data: isoData,
          hora,
          tipo,
          veiculo: isEntrada ? (destino || 'ESTOQUE') : veiculo,
          descricao: isEntrada ? 'Entrada de combustível' : (veiculoInfo?.descricao || ''),
          motorista: isEntrada ? '' : motorista,
          empresa: veiculoInfo?.empresa || 'L. Pereira',
          obra: veiculoInfo?.obra || '',
          potencia: veiculoInfo?.potencia || '',
          horimetro_anterior: isEntrada ? null : hAnt,
          horimetro_atual: isEntrada ? null : hAtual,
          km_anterior: isEntrada ? null : kAnt,
          km_atual: isEntrada ? null : kAtual,
          quantidade: parseNum(quantidade) || 0,
          tipo_combustivel: tipoCombustivel,
          local_abastecimento: destino,
          arla: isEntrada ? false : arla,
          quantidade_arla: isEntrada ? null : parseNum(quantidadeArla),
          fornecedor,
          nota_fiscal: notaFiscal,
          valor_unitario: parseNum(valorUnitario),
          valor_total: parseNum(valorTotal),
          observacao,
          lubrificacao: isEntrada ? false : lubrificacao,
          oleo: isEntrada ? '' : oleo,
          filtro: isEntrada ? '' : filtro,
        },
      });
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
            <Fuel className="h-5 w-5 text-accent" />
            Novo Abastecimento
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-4 space-y-4">
          {/* Tipo selector - prominent */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              className={`h-12 gap-2 text-sm font-semibold transition-all ${
                tipo === "Saida"
                  ? "bg-destructive text-destructive-foreground border-destructive hover:bg-destructive/90 shadow-md"
                  : "hover:border-destructive/50 hover:text-destructive"
              }`}
              onClick={() => setTipo("Saida")}
            >
              <ArrowUpFromLine className="h-4 w-4" />
              SAÍDA (Abastecimento)
            </Button>
            <Button
              type="button"
              variant="outline"
              className={`h-12 gap-2 text-sm font-semibold transition-all ${
                tipo === "Entrada"
                  ? "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 shadow-md"
                  : "hover:border-emerald-500/50 hover:text-emerald-600"
              }`}
              onClick={() => setTipo("Entrada")}
            >
              <ArrowDownToLine className="h-4 w-4" />
              ENTRADA (Compra)
            </Button>
          </div>

          {/* ===== SAÍDA FIELDS ===== */}
          {!isEntrada && (
            <>
              {/* Veículo + Data */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Veículo / Equipamento *</Label>
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
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Data *</Label>
                  <Input value={data} onChange={(e) => setData(e.target.value)} placeholder="dd/mm/aaaa" className="h-10" />
                </div>
              </div>

              {/* Hora + Fonte */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-accent" /> Hora</Label>
                  <Input value={hora} onChange={(e) => setHora(e.target.value)} placeholder="HH:mm" className="h-10" />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-xs font-medium">Fonte (Tanque/Comboio)</Label>
                  <Select value={destino} onValueChange={setDestino}>
                    <SelectTrigger className="h-10"><SelectValue placeholder="Selecionar fonte..." /></SelectTrigger>
                    <SelectContent>
                      {sourceOptions.map((s: any) => (
                        <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Vehicle info */}
              {veiculo && (
                <div className="rounded-lg bg-muted/60 p-3 space-y-1">
                  {(() => {
                    const vi = frota?.find(v => v.codigo === veiculo);
                    return vi ? (
                      <div className="flex flex-wrap gap-x-4 text-xs text-muted-foreground">
                        {vi.descricao && <span>Desc: <strong className="text-foreground">{vi.descricao}</strong></span>}
                        {vi.motorista && <span>Motorista: <strong className="text-foreground">{vi.motorista}</strong></span>}
                        {vi.empresa && <span>Empresa: <strong className="text-foreground">{vi.empresa}</strong></span>}
                        {vi.obra && <span>Obra: <strong className="text-foreground">{vi.obra}</strong></span>}
                      </div>
                    ) : null;
                  })()}
                  {(horimetroAnterior || kmAnterior) && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Último: {horimetroAnterior && `Hor: ${horimetroAnterior}`} {kmAnterior && `KM: ${kmAnterior}`}
                    </p>
                  )}
                </div>
              )}

              {/* Combustível + Quantidade + Motorista */}
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
                  <NumericInput value={quantidade} onChange={setQuantidade} placeholder="0,00" />
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
                  <NumericInput value={horimetroAtual} onChange={setHorimetroAtual} placeholder="0,00" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">KM Atual</Label>
                  <NumericInput value={kmAtual} onChange={setKmAtual} placeholder="0,00" />
                </div>
              </div>

              {/* Consumo calculado */}
              {(() => {
                const litros = parseNum(quantidade);
                const hAnt = parseNum(horimetroAnterior);
                const hAt = parseNum(horimetroAtual);
                const kAnt = parseNum(kmAnterior);
                const kAt = parseNum(kmAtual);
                let consumo: number | null = null;
                let label = '';
                if (kAt != null && kAnt != null && litros && litros > 0) { consumo = calcConsumo('veiculo', kAt - kAnt, litros); label = 'KM/L'; }
                else if (hAt != null && hAnt != null && litros && litros > 0) { consumo = calcConsumo('equipamento', hAt - hAnt, litros); label = 'L/h'; }
                if (consumo != null) {
                  const isAnomaly = (label === 'KM/L' && (consumo < 1 || consumo > 20)) || (label === 'L/h' && (consumo < 1 || consumo > 50));
                  return (
                    <div className={`rounded-lg p-3 text-sm flex items-center gap-2 ${isAnomaly ? 'bg-destructive/10 border border-destructive/30' : 'bg-accent/10 border border-accent/20'}`}>
                      {isAnomaly && <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />}
                      <span>Consumo: <strong>{formatBR(consumo)} {label}</strong></span>
                      {isAnomaly && <span className="text-destructive text-xs">(fora do padrão)</span>}
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
                  <NumericInput value={quantidadeArla} onChange={setQuantidadeArla} placeholder="0,00" />
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
            </>
          )}

          {/* ===== ENTRADA FIELDS ===== */}
          {isEntrada && (
            <>
              {/* Data + Hora */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Data *</Label>
                  <Input value={data} onChange={(e) => setData(e.target.value)} placeholder="dd/mm/aaaa" className="h-10" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Hora</Label>
                  <Input value={hora} onChange={(e) => setHora(e.target.value)} placeholder="HH:mm" className="h-10" />
                </div>
              </div>

              {/* Destino (tanque/comboio) */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Destino (Tanque / Comboio) *</Label>
                <Select value={destino} onValueChange={setDestino}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="Onde será armazenado..." /></SelectTrigger>
                  <SelectContent>
                    {sourceOptions.map((s: any) => (
                      <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Fornecedor */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Fornecedor *</Label>
                <Select value={fornecedor} onValueChange={setFornecedor}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="Selecionar fornecedor..." /></SelectTrigger>
                  <SelectContent>
                    {fornecedores.map((f: any) => (
                      <SelectItem key={f.id} value={f.nome}>{f.nome}</SelectItem>
                    ))}
                    {fornecedores.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-2">Cadastre fornecedores em Cadastros</p>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Combustível + Quantidade */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Tipo Combustível</Label>
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
                  <NumericInput value={quantidade} onChange={setQuantidade} placeholder="0,00" />
                </div>
              </div>

              {/* Nota Fiscal */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Nota Fiscal</Label>
                <Input value={notaFiscal} onChange={(e) => setNotaFiscal(e.target.value)} placeholder="Nº da Nota Fiscal" className="h-10" />
              </div>

              {/* Valores */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Valor Unitário (R$)</Label>
                  <NumericInput value={valorUnitario} onChange={setValorUnitario} placeholder="0,00" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Valor Total (R$)</Label>
                  <NumericInput value={valorTotal} onChange={setValorTotal} placeholder="0,00" />
                </div>
              </div>
            </>
          )}

          {/* Observações - both types */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Observações</Label>
            <Textarea value={observacao} onChange={(e) => setObservacao(e.target.value)} placeholder="Observações adicionais..." className="min-h-[60px]" />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-6 pb-5 sticky bottom-0 bg-background pt-3 border-t">
          <Button onClick={handleSave} disabled={isPending || !quantidade} className="flex-1 h-11 gap-2 rounded-xl">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isEntrada ? "Registrar Entrada" : "Registrar Saída"}
          </Button>
          <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
