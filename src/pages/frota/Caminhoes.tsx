import { useState } from "react";
import { Truck, Plus, Filter, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useGoogleSheets, CaminhaoRow } from "@/hooks/useGoogleSheets";
import { TableLoader } from "@/components/ui/loading-spinner";
import { ErrorState } from "@/components/ui/error-state";
import { EditDialog, FormField } from "@/components/shared/EditDialog";

const caminhaoFields: FormField[] = [
  { key: 'Prefixo_Cb', label: 'Prefixo', required: true },
  { key: 'Descricao_Cb', label: 'Descrição', required: true },
  { key: 'Motorista', label: 'Motorista' },
  { key: 'Marca', label: 'Marca' },
  { key: 'Potencia', label: 'Potência' },
  { key: 'Volume', label: 'Volume' },
  { key: 'Empresa_Cb', label: 'Empresa' },
];

export default function Caminhoes() {
  const { data: caminhoesData, isLoading, error, refetch } = useGoogleSheets<CaminhaoRow>('caminhao');
  const [editingItem, setEditingItem] = useState<Record<string, string> | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isNew, setIsNew] = useState(false);

  const totalCaminhoes = caminhoesData?.length || 0;

  const handleEdit = (item: CaminhaoRow) => {
    setEditingItem(item as unknown as Record<string, string>);
    setIsNew(false);
    setIsDialogOpen(true);
  };

  const handleNew = () => {
    setEditingItem({});
    setIsNew(true);
    setIsDialogOpen(true);
  };

  const handleSave = (data: Record<string, string>) => {
    console.log('Saving:', data);
    setIsDialogOpen(false);
  };

  const handleDelete = (data: Record<string, string>) => {
    console.log('Deleting:', data);
    setIsDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="page-header mb-0">
          <h1 className="page-title flex items-center gap-2">
            <Truck className="h-6 w-6 text-accent" />
            Caminhões Basculantes
          </h1>
          <p className="page-subtitle">
            Cadastro e gestão de caminhões basculantes
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
            Novo Caminhão
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2">
          <div className="h-2 w-2 rounded-full bg-success" />
          <span className="text-sm font-medium">{totalCaminhoes} Cadastrados</span>
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
                  <TableHead className="data-table-header">Motorista</TableHead>
                  <TableHead className="data-table-header">Marca</TableHead>
                  <TableHead className="data-table-header">Potência</TableHead>
                  <TableHead className="data-table-header">Volume</TableHead>
                  <TableHead className="data-table-header">Empresa</TableHead>
                  <TableHead className="data-table-header w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {caminhoesData && caminhoesData.length > 0 ? (
                  caminhoesData.map((row, idx) => (
                    <TableRow key={idx} className="data-table-row">
                      <TableCell className="font-semibold text-primary">{row.Prefixo_Cb}</TableCell>
                      <TableCell>{row.Descricao_Cb}</TableCell>
                      <TableCell>{row.Motorista || '-'}</TableCell>
                      <TableCell>{row.Marca}</TableCell>
                      <TableCell>{row.Potencia}</TableCell>
                      <TableCell>{row.Volume}</TableCell>
                      <TableCell>{row.Empresa_Cb}</TableCell>
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
                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                      Nenhum caminhão encontrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <EditDialog
        title="Caminhão"
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        data={editingItem}
        fields={caminhaoFields}
        onSave={handleSave}
        onDelete={handleDelete}
        isNew={isNew}
      />
    </div>
  );
}
