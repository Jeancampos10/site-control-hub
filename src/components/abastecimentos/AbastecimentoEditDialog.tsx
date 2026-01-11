import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useSyncAbastecimento, Abastecimento } from "@/hooks/useAbastecimentos";
import { Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AbastecimentoEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  abastecimento: Abastecimento | null;
  source: string;
}

export function AbastecimentoEditDialog({
  open,
  onOpenChange,
  abastecimento,
  source,
}: AbastecimentoEditDialogProps) {
  const syncMutation = useSyncAbastecimento();
  
  const [formData, setFormData] = useState({
    data: "",
    hora: "",
    veiculo: "",
    descricao: "",
    motorista: "",
    empresa: "",
    obra: "",
    horimetro_anterior: "",
    horimetro_atual: "",
    km_anterior: "",
    km_atual: "",
    quantidade: "",
    tipo_combustivel: "",
    local: "",
    arla: false,
    quantidade_arla: "",
    fornecedor: "",
    nota_fiscal: "",
    valor_unitario: "",
    valor_total: "",
    observacao: "",
    lubrificar: false,
    lubrificante: "",
    completar_oleo: false,
    tipo_oleo: "",
    qtd_oleo: "",
    sopra_filtro: false,
  });

  useEffect(() => {
    if (abastecimento) {
      setFormData({
        data: abastecimento.data || "",
        hora: abastecimento.hora || "",
        veiculo: abastecimento.veiculo || "",
        descricao: abastecimento.descricao || "",
        motorista: abastecimento.motorista || "",
        empresa: abastecimento.empresa || "",
        obra: abastecimento.obra || "",
        horimetro_anterior: abastecimento.horimetro_anterior?.toString() || "",
        horimetro_atual: abastecimento.horimetro_atual?.toString() || "",
        km_anterior: abastecimento.km_anterior?.toString() || "",
        km_atual: abastecimento.km_atual?.toString() || "",
        quantidade: abastecimento.quantidade?.toString() || "",
        tipo_combustivel: abastecimento.tipo_combustivel || "",
        local: abastecimento.local || "",
        arla: abastecimento.arla || false,
        quantidade_arla: abastecimento.quantidade_arla?.toString() || "",
        fornecedor: abastecimento.fornecedor || "",
        nota_fiscal: abastecimento.nota_fiscal || "",
        valor_unitario: abastecimento.valor_unitario?.toString() || "",
        valor_total: abastecimento.valor_total?.toString() || "",
        observacao: abastecimento.observacao || "",
        lubrificar: abastecimento.lubrificar || false,
        lubrificante: abastecimento.lubrificante || "",
        completar_oleo: abastecimento.completar_oleo || false,
        tipo_oleo: abastecimento.tipo_oleo || "",
        qtd_oleo: abastecimento.qtd_oleo?.toString() || "",
        sopra_filtro: abastecimento.sopra_filtro || false,
      });
    }
  }, [abastecimento]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!abastecimento) return;

    const parseNumber = (val: string): number | undefined => {
      const cleaned = val.replace(/\./g, '').replace(',', '.');
      const num = parseFloat(cleaned);
      return isNaN(num) ? undefined : num;
    };

    const updatedData = {
      id: abastecimento.id,
      data: formData.data,
      hora: formData.hora,
      veiculo: formData.veiculo,
      descricao: formData.descricao,
      motorista: formData.motorista,
      empresa: formData.empresa,
      obra: formData.obra,
      horimetro_anterior: parseNumber(formData.horimetro_anterior),
      horimetro_atual: parseNumber(formData.horimetro_atual),
      km_anterior: parseNumber(formData.km_anterior),
      km_atual: parseNumber(formData.km_atual),
      quantidade: parseNumber(formData.quantidade),
      tipo_combustivel: formData.tipo_combustivel,
      local: formData.local,
      arla: formData.arla,
      quantidade_arla: parseNumber(formData.quantidade_arla),
      fornecedor: formData.fornecedor,
      nota_fiscal: formData.nota_fiscal,
      valor_unitario: parseNumber(formData.valor_unitario),
      valor_total: parseNumber(formData.valor_total),
      observacao: formData.observacao,
      lubrificar: formData.lubrificar,
      lubrificante: formData.lubrificante,
      completar_oleo: formData.completar_oleo,
      tipo_oleo: formData.tipo_oleo,
      qtd_oleo: parseNumber(formData.qtd_oleo),
      sopra_filtro: formData.sopra_filtro,
    };

    await syncMutation.mutateAsync({
      action: 'update',
      source,
      data: updatedData,
      rowId: abastecimento.id,
    });

    onOpenChange(false);
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Editar Abastecimento</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <ScrollArea className="h-[60vh] pr-4">
            <div className="grid gap-4 py-4">
              {/* Data e Hora */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="data">Data</Label>
                  <Input
                    id="data"
                    value={formData.data}
                    onChange={(e) => handleChange("data", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hora">Hora</Label>
                  <Input
                    id="hora"
                    value={formData.hora}
                    onChange={(e) => handleChange("hora", e.target.value)}
                  />
                </div>
              </div>

              {/* Veículo e Descrição */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="veiculo">Veículo</Label>
                  <Input
                    id="veiculo"
                    value={formData.veiculo}
                    onChange={(e) => handleChange("veiculo", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descricao">Descrição</Label>
                  <Input
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => handleChange("descricao", e.target.value)}
                  />
                </div>
              </div>

              {/* Motorista e Empresa */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="motorista">Motorista/Operador</Label>
                  <Input
                    id="motorista"
                    value={formData.motorista}
                    onChange={(e) => handleChange("motorista", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="empresa">Empresa</Label>
                  <Input
                    id="empresa"
                    value={formData.empresa}
                    onChange={(e) => handleChange("empresa", e.target.value)}
                  />
                </div>
              </div>

              {/* Obra e Local */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="obra">Obra</Label>
                  <Input
                    id="obra"
                    value={formData.obra}
                    onChange={(e) => handleChange("obra", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="local">Local</Label>
                  <Input
                    id="local"
                    value={formData.local}
                    onChange={(e) => handleChange("local", e.target.value)}
                  />
                </div>
              </div>

              {/* Horímetros */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="horimetro_anterior">Horímetro Anterior</Label>
                  <Input
                    id="horimetro_anterior"
                    value={formData.horimetro_anterior}
                    onChange={(e) => handleChange("horimetro_anterior", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="horimetro_atual">Horímetro Atual</Label>
                  <Input
                    id="horimetro_atual"
                    value={formData.horimetro_atual}
                    onChange={(e) => handleChange("horimetro_atual", e.target.value)}
                  />
                </div>
              </div>

              {/* KM */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="km_anterior">KM Anterior</Label>
                  <Input
                    id="km_anterior"
                    value={formData.km_anterior}
                    onChange={(e) => handleChange("km_anterior", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="km_atual">KM Atual</Label>
                  <Input
                    id="km_atual"
                    value={formData.km_atual}
                    onChange={(e) => handleChange("km_atual", e.target.value)}
                  />
                </div>
              </div>

              {/* Quantidade e Combustível */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantidade">Quantidade (L)</Label>
                  <Input
                    id="quantidade"
                    value={formData.quantidade}
                    onChange={(e) => handleChange("quantidade", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tipo_combustivel">Tipo Combustível</Label>
                  <Input
                    id="tipo_combustivel"
                    value={formData.tipo_combustivel}
                    onChange={(e) => handleChange("tipo_combustivel", e.target.value)}
                  />
                </div>
              </div>

              {/* Arla */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="arla"
                    checked={formData.arla}
                    onCheckedChange={(checked) => handleChange("arla", !!checked)}
                  />
                  <Label htmlFor="arla">Arla</Label>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantidade_arla">Quantidade Arla (L)</Label>
                  <Input
                    id="quantidade_arla"
                    value={formData.quantidade_arla}
                    onChange={(e) => handleChange("quantidade_arla", e.target.value)}
                    disabled={!formData.arla}
                  />
                </div>
              </div>

              {/* Fornecedor e NF */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fornecedor">Fornecedor</Label>
                  <Input
                    id="fornecedor"
                    value={formData.fornecedor}
                    onChange={(e) => handleChange("fornecedor", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nota_fiscal">Nota Fiscal</Label>
                  <Input
                    id="nota_fiscal"
                    value={formData.nota_fiscal}
                    onChange={(e) => handleChange("nota_fiscal", e.target.value)}
                  />
                </div>
              </div>

              {/* Valores */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="valor_unitario">Valor Unitário (R$)</Label>
                  <Input
                    id="valor_unitario"
                    value={formData.valor_unitario}
                    onChange={(e) => handleChange("valor_unitario", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="valor_total">Valor Total (R$)</Label>
                  <Input
                    id="valor_total"
                    value={formData.valor_total}
                    onChange={(e) => handleChange("valor_total", e.target.value)}
                  />
                </div>
              </div>

              {/* Observação */}
              <div className="space-y-2">
                <Label htmlFor="observacao">Observação</Label>
                <Input
                  id="observacao"
                  value={formData.observacao}
                  onChange={(e) => handleChange("observacao", e.target.value)}
                />
              </div>

              {/* Lubrificação */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="lubrificar"
                    checked={formData.lubrificar}
                    onCheckedChange={(checked) => handleChange("lubrificar", !!checked)}
                  />
                  <Label htmlFor="lubrificar">Lubrificar</Label>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lubrificante">Lubrificante</Label>
                  <Input
                    id="lubrificante"
                    value={formData.lubrificante}
                    onChange={(e) => handleChange("lubrificante", e.target.value)}
                    disabled={!formData.lubrificar}
                  />
                </div>
              </div>

              {/* Óleo */}
              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="completar_oleo"
                    checked={formData.completar_oleo}
                    onCheckedChange={(checked) => handleChange("completar_oleo", !!checked)}
                  />
                  <Label htmlFor="completar_oleo">Completar Óleo</Label>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tipo_oleo">Tipo Óleo</Label>
                  <Input
                    id="tipo_oleo"
                    value={formData.tipo_oleo}
                    onChange={(e) => handleChange("tipo_oleo", e.target.value)}
                    disabled={!formData.completar_oleo}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="qtd_oleo">Qtd Óleo (L)</Label>
                  <Input
                    id="qtd_oleo"
                    value={formData.qtd_oleo}
                    onChange={(e) => handleChange("qtd_oleo", e.target.value)}
                    disabled={!formData.completar_oleo}
                  />
                </div>
              </div>

              {/* Sopra Filtro */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sopra_filtro"
                  checked={formData.sopra_filtro}
                  onCheckedChange={(checked) => handleChange("sopra_filtro", !!checked)}
                />
                <Label htmlFor="sopra_filtro">Sopra Filtro</Label>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={syncMutation.isPending}>
              {syncMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
