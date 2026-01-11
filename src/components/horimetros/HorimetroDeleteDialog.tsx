import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";
import { Horimetro, useDeleteHorimetro } from "@/hooks/useHorimetros";

interface HorimetroDeleteDialogProps {
  horimetro: Horimetro | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HorimetroDeleteDialog({ horimetro, open, onOpenChange }: HorimetroDeleteDialogProps) {
  const deleteMutation = useDeleteHorimetro();

  const handleDelete = async () => {
    if (!horimetro) return;
    
    await deleteMutation.mutateAsync(horimetro.id);
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir este registro de horímetro?
            {horimetro && (
              <div className="mt-3 p-3 bg-muted rounded-lg text-sm">
                <p><strong>Veículo:</strong> {horimetro.veiculo}</p>
                <p><strong>Data:</strong> {horimetro.data}</p>
                <p><strong>Operador:</strong> {horimetro.operador}</p>
                <p><strong>Horímetro:</strong> {horimetro.horimetro_atual?.toLocaleString('pt-BR')}</p>
              </div>
            )}
            <p className="mt-3 text-destructive font-medium">
              Esta ação não pode ser desfeita e o registro será removido da planilha.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMutation.isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
