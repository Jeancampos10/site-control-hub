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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Clock, Save, X, Loader2, Search } from "lucide-react";
import { useUpdateHorimetro } from "@/hooks/useHorimetros";
import { useGoogleSheets, FrotaGeralRow } from "@/hooks/useGoogleSheets";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";

interface NovoHorimetroDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NovoHorimetroDialog({ open, onOpenChange }: NovoHorimetroDialogProps) {
  const updateMutation = useUpdateHorimetro();
  const { data: frota } = useGoogleSheets<FrotaGeralRow>('Frota');

  const [veiculo, setVeiculo] = useState("");
  const [data, setData] = useState(format(new Date(), "dd/MM/yy"));
  const [horimetro, setHorimetro] = useState("");
  const [km, setKm] = useState("");
  const [operador, setOperador] = useState("");
  const [observacao, setObservacao] = useState("");
  const [lastData, setLastData] = useState("");
  const [lastHorimetro, setLastHorimetro] = useState("");
  const [lastKm, setLastKm] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Vehicle list from Frota Geral
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

  // Fetch last record when vehicle changes
  useEffect(() => {
    if (!veiculo) {
      setLastData("");
      setLastHorimetro("");
      setLastKm("");
      return;
    }

    const fetchLast = async () => {
      const { data: rows } = await supabase
        .from('horimetros')
        .select('data, horimetro_atual')
        .eq('veiculo', veiculo)
        .order('data', { ascending: false })
        .limit(1);

      if (rows && rows.length > 0) {
        const row = rows[0];
        setLastData(row.data || '');
        setLastHorimetro(row.horimetro_atual?.toString() || '');
      } else {
        setLastData("—");
        setLastHorimetro("0");
      }

      // Also check abastecimentos for km
      const { data: abRows } = await supabase
        .from('abastecimentos')
        .select('km_atual')
        .eq('veiculo', veiculo)
        .not('km_atual', 'is', null)
        .order('data', { ascending: false })
        .limit(1);

      if (abRows && abRows.length > 0 && abRows[0].km_atual) {
        setLastKm(abRows[0].km_atual.toString());
      } else {
        setLastKm("0");
      }
    };

    fetchLast();
  }, [veiculo]);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setVeiculo("");
      setData(format(new Date(), "dd/MM/yy"));
      setHorimetro("");
      setKm("");
      setOperador("");
      setObservacao("");
      setLastData("");
      setLastHorimetro("");
      setLastKm("");
      setSearchTerm("");
    }
  }, [open]);

  const parseNumber = (val: string): number | null => {
    if (!val) return null;
    const num = parseFloat(val.replace(',', '.'));
    return isNaN(num) ? null : num;
  };

  const handleSave = async () => {
    if (!veiculo) {
      toast.error("Selecione um veículo");
      return;
    }

    // Parse date from dd/MM/yy to yyyy-MM-dd
    const dateParts = data.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
    let isoDate = format(new Date(), 'yyyy-MM-dd');
    if (dateParts) {
      const year = dateParts[3].length === 2 ? `20${dateParts[3]}` : dateParts[3];
      isoDate = `${year}-${dateParts[2].padStart(2, '0')}-${dateParts[1].padStart(2, '0')}`;
    }

    const horimetroAtual = parseNumber(horimetro);
    const horimetroAnterior = parseNumber(lastHorimetro);

    setIsSyncing(true);

    try {
      // 1. Save to Supabase
      await updateMutation.mutateAsync({
        data: isoDate,
        veiculo,
        horimetro_anterior: horimetroAnterior,
        horimetro_atual: horimetroAtual,
        operador,
        observacao,
      });

      // 2. Sync to Google Sheets (non-blocking)
      const veiculoInfo = veiculos.find(v => v.Codigo === veiculo);
      sheetSync.mutate({
        sheetName: 'Horímetros',
        rowData: [
          data, veiculo, veiculoInfo?.Descricao || '', veiculoInfo?.Categoria || '',
          veiculoInfo?.Empresa || '', operador,
          lastHorimetro || '0', horimetro || '0', '',
          lastKm || '', '', observacao || '',
        ],
      });

      onOpenChange(false);
    } catch (err) {
      // Error already handled by mutation
    } finally {
      setIsSyncing(false);
    }
  };

  const isPending = updateMutation.isPending || isSyncing;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px] p-0 overflow-hidden rounded-2xl">
        <DialogHeader className="px-6 pt-5 pb-3 border-b">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5 text-primary" />
            Lançamento de Horímetro
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-4 space-y-4">
          {/* Veículo + Data */}
          <div className="grid grid-cols-5 gap-3">
            <div className="col-span-3 space-y-1.5">
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
                  {filteredVeiculos.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-3">Nenhum veículo encontrado</p>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs font-medium">Data *</Label>
              <Input
                value={data}
                onChange={(e) => setData(e.target.value)}
                placeholder="DD/MM/AA"
                className="h-10"
              />
            </div>
          </div>

          {/* Info do último registro */}
          {veiculo && lastHorimetro && (
            <div className="rounded-lg bg-muted/50 border p-3 text-xs space-y-1">
              <p className="font-medium text-muted-foreground">Último registro:</p>
              <div className="flex gap-4">
                <span>Data: <strong>{lastData}</strong></span>
                <span>Horímetro: <strong>{lastHorimetro}</strong></span>
                {lastKm !== "0" && <span>KM: <strong>{lastKm}</strong></span>}
              </div>
            </div>
          )}

          {/* Horímetro + KM */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-primary" />
                Horímetro (h)
              </Label>
              <Input
                value={horimetro}
                onChange={(e) => setHorimetro(e.target.value)}
                placeholder="0,0"
                className="h-10 border-primary/30 focus:border-primary"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <span className="text-muted-foreground">⤴</span>
                KM
              </Label>
              <Input
                value={km}
                onChange={(e) => setKm(e.target.value)}
                placeholder="0,0"
                className="h-10"
              />
            </div>
          </div>

          {/* Operador + Observações */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Operador</Label>
              <Input
                value={operador}
                onChange={(e) => setOperador(e.target.value)}
                placeholder="Operador"
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Observações</Label>
              <Input
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Observações"
                className="h-10"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-6 pb-5">
          <Button
            onClick={handleSave}
            disabled={isPending || !veiculo}
            className="flex-1 h-11 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Salvar
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-11 w-11 rounded-xl"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
