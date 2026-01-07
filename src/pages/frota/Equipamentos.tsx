import { useState } from "react";
import { HardHat, Plus, Filter, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useGoogleSheets, EquipamentoRow } from "@/hooks/useGoogleSheets";
import { TableLoader } from "@/components/ui/loading-spinner";
import { ErrorState } from "@/components/ui/error-state";
import { EditDialog, FormField } from "@/components/shared/EditDialog";

const equipamentoFields: FormField[] = [
  { key: 'Prefixo_Eq', label: 'Prefixo', required: true },
  { key: 'Descricao_Eq', label: 'Descrição', required: true },
  { key: 'Operador', label: 'Operador' },
  { key: 'Marca', label: 'Marca' },
  { key: 'Potencia', label: 'Potência' },
  { key: 'Empresa_Eq', label: 'Empresa' },
];

export default function Equipamentos() {
  const { data: equipamentosData, isLoading, error, refetch } = useGoogleSheets<EquipamentoRow>('equipamentos');
  const [editingItem, setEditingItem] = useState<EquipamentoRow | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isNew, setIsNew] = useState(false);

  const totalEquipamentos = equipamentosData?.length || 0;

  const handleEdit = (item: EquipamentoRow) => {
    setEditingItem(item);
    setIsNew(false);
    setIsDialogOpen(true);
  };

  const handleNew = () => {
    setEditingItem({} as EquipamentoRow);
    setIsNew(true);
    setIsDialogOpen(true);
  };

  const handleSave = (data: EquipamentoRow) => {
    // In a real app, this would update the Google Sheet
    console.log('Saving:', data);
    // For now, just close the dialog
    setIsDialogOpen(false);
  };

  const handleDelete = (data: EquipamentoRow) => {
    // In a real app, this would delete from the Google Sheet
    console.log('Deleting:', data);
    setIsDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="page-header mb-0">
          <h1 className="page-title flex items-center gap-2">
            <HardHat className="h-6 w-6 text-accent" />
            Equipamentos (Escavadeiras)
          </h1>
          <p className="page-subtitle">
            Cadastro e gestão de escavadeiras e equipamentos de carga
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            Filtros
          </Button>
          <Button 
            size="sm" 
            className="gap-2 bg-gradient-accent text-accent-foreground hover:opacity-90"
            onClick={handleNew}
          >
            <Plus className="h-4 w-4" />
            Novo Equipamento
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2">
          <div className="h-2 w-2 rounded-full bg-success" />
          <span className="text-sm font-medium">{totalEquipamentos} Cadastrados</span>
        </div>
      </div>

      {/* Data Table */}
      {isLoading ? (
        <TableLoader />
      ) : error ? (
        <ErrorState 
          message="Não foi possível buscar os dados da planilha."
          onRetry={() => refetch()} 
        />
      ) : (
        <div className="chart-container overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="data-table-header">Prefixo</TableHead>
                  <TableHead className="data-table-header">Descrição</TableHead>
                  <TableHead className="data-table-header">Operador</TableHead>
                  <TableHead className="data-table-header">Marca</TableHead>
                  <TableHead className="data-table-header">Potência</TableHead>
                  <TableHead className="data-table-header">Empresa</TableHead>
                  <TableHead className="data-table-header w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {equipamentosData && equipamentosData.length > 0 ? (
                  equipamentosData.map((row, idx) => (
                    <TableRow key={idx} className="data-table-row">
                      <TableCell className="font-semibold text-primary">{row.Prefixo_Eq}</TableCell>
                      <TableCell>{row.Descricao_Eq}</TableCell>
                      <TableCell>{row.Operador || '-'}</TableCell>
                      <TableCell>{row.Marca}</TableCell>
                      <TableCell>{row.Potencia}</TableCell>
                      <TableCell>{row.Empresa_Eq}</TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => handleEdit(row)}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      Nenhum equipamento encontrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <EditDialog
        title="Equipamento"
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        data={editingItem}
        fields={equipamentoFields}
        onSave={handleSave}
        onDelete={handleDelete}
        isNew={isNew}
      />
    </div>
  );
}
