import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NumericInput } from "@/components/shared/NumericInput";
import { useState } from "react";
import { useSaveEstoqueConfig, useEstoqueConfigs } from "@/hooks/useEstoqueCombustivel";
import { parseBR } from "@/lib/formatters";

const LOCAIS = [
  { key: "tanque01", label: "Tanque 01" },
  { key: "tanque02", label: "Tanque 02" },
  { key: "comboio01", label: "CC-01" },
  { key: "comboio02", label: "CC-02" },
  { key: "comboio03", label: "CC-03" },
];

const COMBUSTIVEIS = ["Diesel S10", "Diesel S500", "Gasolina", "Etanol"];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function ConfigEstoqueDialog({ open, onOpenChange }: Props) {
  const { data: configs } = useEstoqueConfigs();
  const save = useSaveEstoqueConfig();
  const [local, setLocal] = useState("tanque01");
  const [tipo, setTipo] = useState("Diesel S10");
  const [qtd, setQtd] = useState("");
  const [capacidade, setCapacidade] = useState("");
  const [dataRef, setDataRef] = useState(new Date().toISOString().split("T")[0]);

  const existing = configs?.find(c => c.local_estoque === local && c.tipo_combustivel === tipo);

  const handleSave = () => {
    const qty = parseBR(qtd) ?? 0;
    const cap = parseBR(capacidade) ?? 10000;
    save.mutate({
      id: existing?.id,
      local_estoque: local,
      tipo_combustivel: tipo,
      quantidade_inicial: qty,
      capacidade: cap,
      data_referencia: dataRef,
    }, { onSuccess: () => onOpenChange(false) });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Configurar Estoque Inicial</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Local</Label>
            <Select value={local} onValueChange={setLocal}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {LOCAIS.map(l => <SelectItem key={l.key} value={l.key}>{l.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Tipo de Combustível</Label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {COMBUSTIVEIS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Quantidade Inicial (litros)</Label>
            <NumericInput value={qtd} onChange={setQtd} decimals={2} placeholder="0" />
          </div>
          <div>
            <Label>Capacidade do Tanque (litros)</Label>
            <NumericInput value={capacidade} onChange={setCapacidade} decimals={0} placeholder="10000" />
          </div>
          <div>
            <Label>Data de Referência</Label>
            <Input type="date" value={dataRef} onChange={e => setDataRef(e.target.value)} />
          </div>
          <Button onClick={handleSave} disabled={save.isPending} className="w-full">
            {existing ? "Atualizar" : "Salvar"} Configuração
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
