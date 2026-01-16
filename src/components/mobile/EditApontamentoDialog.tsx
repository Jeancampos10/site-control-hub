import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Save, Loader2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useEditNotification } from "@/hooks/useEditNotification";

interface ApontamentoItem {
  id: string;
  type: 'carga' | 'pedreira' | 'pipa' | 'cal';
  date: string;
  time: string;
  description: string;
  details: string;
  rawData: Record<string, unknown>;
}

interface EditApontamentoDialogProps {
  item: ApontamentoItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}

export function EditApontamentoDialog({ item, open, onOpenChange, onSave }: EditApontamentoDialogProps) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [originalData, setOriginalData] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();
  const { mutateAsync: sendEditNotification } = useEditNotification();

  // Get editable fields based on type
  const getEditableFields = () => {
    switch (item.type) {
      case 'carga':
        return ['Local', 'Estaca', 'Material', 'N_Viagens', 'Observacao'];
      case 'pedreira':
        return ['Material', 'Peso_Liquido', 'N_Pedido', 'Observacao'];
      case 'pipa':
        return ['N_Viagens', 'Hora_Chegada', 'Hora_Saida'];
      case 'cal':
        return ['Quantidade', 'Nota_Fiscal', 'Valor', 'Observacao'];
      default:
        return [];
    }
  };

  const getFieldLabel = (field: string) => {
    const labels: Record<string, string> = {
      Local: 'Local',
      Estaca: 'Estaca',
      Material: 'Material',
      N_Viagens: 'Nº de Viagens',
      Observacao: 'Observação',
      Peso_Liquido: 'Peso Líquido (kg)',
      N_Pedido: 'Nº do Pedido',
      Hora_Chegada: 'Hora Chegada',
      Hora_Saida: 'Hora Saída',
      Quantidade: 'Quantidade',
      Nota_Fiscal: 'Nota Fiscal',
      Valor: 'Valor',
    };
    return labels[field] || field;
  };

  useEffect(() => {
    if (open && item) {
      const editableFields = getEditableFields();
      const data: Record<string, string> = {};
      
      editableFields.forEach(field => {
        data[field] = String(item.rawData[field] || '');
      });
      
      setFormData(data);
      setOriginalData(data);
    }
  }, [open, item]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      // Detect changes
      const changes: Record<string, { old: string; new: string }> = {};
      Object.keys(formData).forEach(key => {
        if (formData[key] !== originalData[key]) {
          changes[key] = { old: String(originalData[key]), new: String(formData[key]) };
        }
      });

      if (Object.keys(changes).length === 0) {
        toast.info("Nenhuma alteração detectada");
        onOpenChange(false);
        return;
      }

      // Prepare update data for Google Sheets
      const sheetNames: Record<string, string> = {
        carga: 'Carga',
        pedreira: 'Apontamento_Pedreira',
        pipa: 'Apontamento_Pipa',
        cal: 'Mov_Cal',
      };

      // Call edge function to update
      const { error } = await supabase.functions.invoke('google-sheets-append', {
        body: {
          action: 'update',
          sheetName: sheetNames[item.type],
          rowId: item.id,
          updates: formData,
        },
      });

      if (error) throw error;

      // Send notification to admins
      await sendEditNotification({
        sheetType: getTypeLabel(item.type),
        recordId: item.id,
        changes,
        description: `${item.description} - ${Object.keys(changes).join(', ')}`,
      });

      // Invalidate queries
      const queryKeys: Record<string, string> = {
        carga: 'carga',
        pedreira: 'apontamento_pedreira',
        pipa: 'apontamento_pipa',
        cal: 'mov_cal',
      };
      queryClient.invalidateQueries({ queryKey: ['sheets', queryKeys[item.type]] });

      if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100]);
      }

      toast.success("Apontamento atualizado!", {
        description: "O administrador será notificado"
      });
      
      onSave();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving:', error);
      toast.error("Erro ao salvar alterações");
    } finally {
      setIsSaving(false);
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      carga: 'Carga',
      pedreira: 'Pedreira',
      pipa: 'Pipa',
      cal: 'Cal',
    };
    return labels[type] || type;
  };

  const editableFields = getEditableFields();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Editar {getTypeLabel(item.type)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-sm font-medium">{item.description}</p>
            <p className="text-xs text-muted-foreground">{item.date} - {item.time}</p>
          </div>

          {editableFields.map(field => (
            <div key={field} className="space-y-2">
              <Label htmlFor={field}>{getFieldLabel(field)}</Label>
              {field === 'Observacao' ? (
                <Textarea
                  id={field}
                  value={formData[field] || ''}
                  onChange={(e) => handleChange(field, e.target.value)}
                  className="min-h-[80px]"
                />
              ) : (
                <Input
                  id={field}
                  type={['N_Viagens', 'Peso_Liquido', 'Quantidade', 'Valor'].includes(field) ? 'number' : 'text'}
                  value={formData[field] || ''}
                  onChange={(e) => handleChange(field, e.target.value)}
                />
              )}
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
