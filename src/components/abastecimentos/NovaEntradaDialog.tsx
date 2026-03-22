import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NumericInput } from "@/components/shared/NumericInput";
import { useState } from "react";
import { useInsertEntrada } from "@/hooks/useEstoqueCombustivel";
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

export function NovaEntradaDialog({ open, onOpenChange }: Props) {
  const insert = useInsertEntrada();
  const [local, setLocal] = useState("tanque01");
  const [tipo, setTipo] = useState("Diesel S10");
  const [data, setData] = useState(new Date().toISOString().split("T")[0]);
  const [qtd, setQtd] = useState("");
  const [fornecedor, setFornecedor] = useState("");
  const [nf, setNf] = useState("");
  const [valorTotal, setValorTotal] = useState("");
  const [obs, setObs] = useState("");

  const handleSave = () => {
    const quantidade = parseBR(qtd) ?? 0;
    if (quantidade <= 0) return;
    const vt = parseBR(valorTotal) ?? 0;
    const vu = quantidade > 0 ? vt / quantidade : 0;

    insert.mutate({
      data,
      local_estoque: local,
      tipo_combustivel: tipo,
      quantidade,
      fornecedor: fornecedor || null,
      nota_fiscal: nf || null,
      valor_total: vt || null,
      valor_unitario: vu || null,
      observacao: obs || null,
    }, {
      onSuccess: () => {
        onOpenChange(false);
        setQtd(""); setFornecedor(""); setNf(""); setValorTotal(""); setObs("");
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova Entrada de Combustível</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Data</Label>
            <Input type="date" value={data} onChange={e => setData(e.target.value)} />
          </div>
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
            <Label>Quantidade (litros)</Label>
            <NumericInput value={qtd} onChange={setQtd} decimals={2} placeholder="0" />
          </div>
          <div>
            <Label>Fornecedor</Label>
            <Input value={fornecedor} onChange={e => setFornecedor(e.target.value)} />
          </div>
          <div>
            <Label>Nota Fiscal</Label>
            <Input value={nf} onChange={e => setNf(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Label>Valor Total (R$)</Label>
            <NumericInput value={valorTotal} onChange={setValorTotal} decimals={2} placeholder="0" />
          </div>
          <div className="sm:col-span-2">
            <Label>Observação</Label>
            <Textarea value={obs} onChange={e => setObs(e.target.value)} rows={2} />
          </div>
          <div className="sm:col-span-2">
            <Button onClick={handleSave} disabled={insert.isPending} className="w-full">
              Registrar Entrada
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
