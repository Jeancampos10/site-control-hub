import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ApontamentoPipa, useDeleteApontamentoPipa } from "@/hooks/useApontamentosPipa";
import { format } from "date-fns";

interface ApontamentoDeleteDialogProps {
  apontamento: ApontamentoPipa;
  trigger?: React.ReactNode;
}

export function ApontamentoDeleteDialog({ apontamento, trigger }: ApontamentoDeleteDialogProps) {
  const [open, setOpen] = useState(false);
  const deleteMutation = useDeleteApontamentoPipa();

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(apontamento.id);
    setOpen(false);
  };

  const formattedDate = format(new Date(apontamento.data), "dd/MM/yyyy");

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="gap-2 text-destructive hover:text-destructive">
            <Trash2 className="h-4 w-4" />
            Excluir
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir o apontamento do pipa{" "}
            <strong>{apontamento.prefixo}</strong> do dia{" "}
            <strong>{formattedDate}</strong> com{" "}
            <strong>{apontamento.n_viagens} viagem(ns)</strong>?
            <br />
            <br />
            Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMutation.isPending}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
