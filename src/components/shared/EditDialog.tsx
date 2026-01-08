import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
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
import { toast } from "sonner";

export interface FormField {
  key: string;
  label: string;
  type?: "text" | "number" | "email";
  required?: boolean;
}

interface EditDialogProps {
  title: string;
  open: boolean;
  onClose: () => void;
  data: Record<string, string> | null;
  fields: FormField[];
  onSave: (data: Record<string, string>) => void;
  onDelete?: (data: Record<string, string>) => void;
  isNew?: boolean;
}

export function EditDialog({
  title,
  open,
  onClose,
  data,
  fields,
  onSave,
  onDelete,
  isNew = false,
}: EditDialogProps) {
  const [formData, setFormData] = useState<Record<string, string>>({});

  // Initialize form data when dialog opens
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onClose();
    }
  };

  // Set form data when data prop changes
  if (open && data && Object.keys(formData).length === 0) {
    setFormData({ ...data });
  }

  // Reset form when dialog closes
  if (!open && Object.keys(formData).length > 0) {
    setFormData({});
  }

  const handleSave = () => {
    // Validate required fields
    const missingFields = fields
      .filter(f => f.required && !formData[f.key])
      .map(f => f.label);

    if (missingFields.length > 0) {
      toast.error(`Preencha os campos obrigatórios: ${missingFields.join(', ')}`);
      return;
    }

    onSave(formData);
    toast.success(isNew ? 'Registro criado com sucesso!' : 'Registro atualizado com sucesso!');
    onClose();
  };

  const handleDelete = () => {
    if (data && onDelete) {
      onDelete(data);
      toast.success('Registro removido com sucesso!');
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5" />
            {isNew ? `Novo ${title}` : `Editar ${title}`}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {fields.map((field) => (
            <div key={field.key} className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor={field.key} className="text-right">
                {field.label}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </Label>
              <Input
                id={field.key}
                type={field.type || "text"}
                value={formData[field.key] || ''}
                onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                className="col-span-3"
              />
            </div>
          ))}
        </div>

        <DialogFooter className="flex justify-between">
          <div>
            {!isNew && onDelete && (
              <Button variant="destructive" size="sm" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              {isNew ? 'Criar' : 'Salvar'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
