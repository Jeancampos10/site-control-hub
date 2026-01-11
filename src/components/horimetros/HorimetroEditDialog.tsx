import { useState } from "react";
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
import { Loader2 } from "lucide-react";
import { Horimetro, HorimetroFormData, useUpdateHorimetro } from "@/hooks/useHorimetros";

interface HorimetroEditDialogProps {
  horimetro: Horimetro | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HorimetroEditDialog({ horimetro, open, onOpenChange }: HorimetroEditDialogProps) {
  const updateMutation = useUpdateHorimetro();
  
  const [formData, setFormData] = useState<HorimetroFormData>({
    id: '',
    data: '',
    categoria: '',
    veiculo: '',
    descricao: '',
    operador: '',
    empresa: '',
    horimetro_anterior: null,
    horimetro_atual: null,
    km_anterior: null,
    km_atual: null,
  });

  // Update form when horimetro changes
  useState(() => {
    if (horimetro) {
      setFormData({
        id: horimetro.id,
        data: horimetro.data,
        categoria: horimetro.categoria,
        veiculo: horimetro.veiculo,
        descricao: horimetro.descricao,
        operador: horimetro.operador,
        empresa: horimetro.empresa,
        horimetro_anterior: horimetro.horimetro_anterior,
        horimetro_atual: horimetro.horimetro_atual,
        km_anterior: horimetro.km_anterior,
        km_atual: horimetro.km_atual,
      });
    }
  });

  // Reset form when dialog opens with new horimetro
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && horimetro) {
      setFormData({
        id: horimetro.id,
        data: horimetro.data,
        categoria: horimetro.categoria,
        veiculo: horimetro.veiculo,
        descricao: horimetro.descricao,
        operador: horimetro.operador,
        empresa: horimetro.empresa,
        horimetro_anterior: horimetro.horimetro_anterior,
        horimetro_atual: horimetro.horimetro_atual,
        km_anterior: horimetro.km_anterior,
        km_atual: horimetro.km_atual,
      });
    }
    onOpenChange(newOpen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await updateMutation.mutateAsync(formData);
    onOpenChange(false);
  };

  const handleNumberChange = (field: keyof HorimetroFormData, value: string) => {
    if (value === '') {
      setFormData(prev => ({ ...prev, [field]: null }));
    } else {
      const num = parseFloat(value.replace(',', '.'));
      if (!isNaN(num)) {
        setFormData(prev => ({ ...prev, [field]: num }));
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Horímetro</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data">Data</Label>
              <Input
                id="data"
                value={formData.data}
                onChange={(e) => setFormData(prev => ({ ...prev, data: e.target.value }))}
                placeholder="DD/MM/AAAA"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="veiculo">Veículo</Label>
              <Input
                id="veiculo"
                value={formData.veiculo}
                onChange={(e) => setFormData(prev => ({ ...prev, veiculo: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Input
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="operador">Operador</Label>
              <Input
                id="operador"
                value={formData.operador}
                onChange={(e) => setFormData(prev => ({ ...prev, operador: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="empresa">Empresa</Label>
              <Input
                id="empresa"
                value={formData.empresa}
                onChange={(e) => setFormData(prev => ({ ...prev, empresa: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="horimetro_anterior">Horímetro Anterior</Label>
              <Input
                id="horimetro_anterior"
                type="text"
                value={formData.horimetro_anterior?.toString().replace('.', ',') || ''}
                onChange={(e) => handleNumberChange('horimetro_anterior', e.target.value)}
                placeholder="0,00"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="horimetro_atual">Horímetro Atual</Label>
              <Input
                id="horimetro_atual"
                type="text"
                value={formData.horimetro_atual?.toString().replace('.', ',') || ''}
                onChange={(e) => handleNumberChange('horimetro_atual', e.target.value)}
                placeholder="0,00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="km_anterior">KM Anterior</Label>
              <Input
                id="km_anterior"
                type="text"
                value={formData.km_anterior?.toString().replace('.', ',') || ''}
                onChange={(e) => handleNumberChange('km_anterior', e.target.value)}
                placeholder="0,00"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="km_atual">KM Atual</Label>
              <Input
                id="km_atual"
                type="text"
                value={formData.km_atual?.toString().replace('.', ',') || ''}
                onChange={(e) => handleNumberChange('km_atual', e.target.value)}
                placeholder="0,00"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Alterações
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
