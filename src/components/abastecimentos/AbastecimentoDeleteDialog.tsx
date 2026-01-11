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
import { useSyncAbastecimento, Abastecimento } from "@/hooks/useAbastecimentos";
import { Loader2 } from "lucide-react";

interface AbastecimentoDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  abastecimento: Abastecimento | null;
  source: string;
}

export function AbastecimentoDeleteDialog({
  open,
  onOpenChange,
  abastecimento,
  source,
}: AbastecimentoDeleteDialogProps) {
  const syncMutation = useSyncAbastecimento();

  const handleDelete = async () => {
    if (!abastecimento) return;

    await syncMutation.mutateAsync({
      action: 'delete',
      source,
      rowId: abastecimento.id,
    });

    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir o abastecimento do veículo{" "}
            <strong>{abastecimento?.veiculo}</strong> do dia{" "}
            <strong>{abastecimento?.data}</strong> às <strong>{abastecimento?.hora}</strong>?
            <br />
            <br />
            Quantidade: <strong>{abastecimento?.quantidade}L</strong>
            <br />
            <br />
            Esta ação não pode ser desfeita e os dados serão removidos da planilha.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={syncMutation.isPending}
          >
            {syncMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
