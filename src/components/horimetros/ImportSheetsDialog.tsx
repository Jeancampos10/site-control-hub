import { useState, useMemo } from "react";
import { format } from "date-fns";
import { FileDown, Loader2, CheckCircle, AlertCircle, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { useGoogleSheets } from "@/hooks/useGoogleSheets";
import { useHorimetros, useImportHorimetros } from "@/hooks/useHorimetros";
import { transformHorimetrosData, HorimetroRecord } from "@/lib/sheetsDataTransform";

interface ImportSheetsDialogProps {
  onSuccess?: () => void;
}

// Parse date from dd/MM/yyyy to yyyy-MM-dd
const parseSheetDate = (dateStr: string): string | null => {
  if (!dateStr) return null;
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2];
    return `${year}-${month}-${day}`;
  }
  return null;
};

interface ProcessedRecord extends HorimetroRecord {
  id: string;
  parsedDate: string | null;
  isDuplicate: boolean;
}

export function ImportSheetsDialog({ onSuccess }: ImportSheetsDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filterVeiculo, setFilterVeiculo] = useState("");
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const { data: sheetsResponse, isLoading: isLoadingSheets } = useGoogleSheets('Horimetros');
  const { data: existingHorimetros = [] } = useHorimetros();
  const importHorimetros = useImportHorimetros();

  const sheetsData = useMemo(() => {
    if (!sheetsResponse) return [];
    const rawData = Array.isArray(sheetsResponse) ? sheetsResponse : (sheetsResponse as { data?: Record<string, string>[] }).data;
    if (!rawData) return [];
    return transformHorimetrosData(rawData);
  }, [sheetsResponse]);

  // Create a set of existing records to check for duplicates
  const existingRecords = useMemo(() => {
    const set = new Set<string>();
    existingHorimetros.forEach(h => {
      const key = `${h.data}_${h.veiculo.toLowerCase()}`;
      set.add(key);
    });
    return set;
  }, [existingHorimetros]);

  // Filter and mark records
  const processedRecords: ProcessedRecord[] = useMemo(() => {
    return sheetsData
      .filter(record => {
        if (!filterVeiculo) return true;
        return record.veiculo.toLowerCase().includes(filterVeiculo.toLowerCase());
      })
      .map((record, index) => {
        const parsedDate = parseSheetDate(record.data);
        const key = parsedDate ? `${parsedDate}_${record.veiculo.toLowerCase()}` : null;
        const isDuplicate = key ? existingRecords.has(key) : false;
        // Create unique ID using index to avoid duplicates
        const id = `${record.data}_${record.veiculo}_${record.atual}_${index}`;
        
        return {
          ...record,
          id,
          parsedDate,
          isDuplicate,
        };
      });
  }, [sheetsData, filterVeiculo, existingRecords]);

  const newRecords = processedRecords.filter(r => !r.isDuplicate);
  const duplicateCount = processedRecords.filter(r => r.isDuplicate).length;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const newIds = new Set(newRecords.map(r => r.id));
      setSelectedIds(newIds);
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSet = new Set(selectedIds);
    if (checked) {
      newSet.add(id);
    } else {
      newSet.delete(id);
    }
    setSelectedIds(newSet);
  };

  const handleImport = async () => {
    const recordsToImport = newRecords.filter(r => selectedIds.has(r.id));
    
    if (recordsToImport.length === 0) {
      toast.error("Selecione pelo menos um registro para importar");
      return;
    }

    setImporting(true);
    setProgress(0);

    try {
      const dataToImport = recordsToImport.map(record => ({
        data: record.parsedDate!,
        veiculo: record.veiculo,
        descricao_veiculo: null,
        horimetro_anterior: record.anterior,
        horimetro_atual: record.atual,
        operador: record.operador || null,
        obra: record.obra || null,
        observacao: null,
        sincronizado_sheets: true, // Already in sheets
      }));

      // Import in batches of 50
      const batchSize = 50;
      const batches = [];
      for (let i = 0; i < dataToImport.length; i += batchSize) {
        batches.push(dataToImport.slice(i, i + batchSize));
      }

      let imported = 0;
      for (const batch of batches) {
        await importHorimetros.mutateAsync(batch);
        imported += batch.length;
        setProgress((imported / dataToImport.length) * 100);
      }

      toast.success(`${dataToImport.length} registros importados com sucesso!`);
      setSelectedIds(new Set());
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error("Erro ao importar:", error);
      toast.error("Erro ao importar registros");
    } finally {
      setImporting(false);
      setProgress(0);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <FileDown className="h-4 w-4" />
          Importar do Sheets
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Importar Horímetros do Google Sheets</DialogTitle>
          <DialogDescription>
            Selecione os registros que deseja importar para o sistema.
            Registros já existentes são marcados automaticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Filter */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-1">
              <Label htmlFor="filter-veiculo" className="sr-only">Filtrar por veículo</Label>
              <div className="relative flex-1 max-w-xs">
                <Filter className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="filter-veiculo"
                  placeholder="Filtrar por veículo..."
                  className="pl-8"
                  value={filterVeiculo}
                  onChange={(e) => setFilterVeiculo(e.target.value)}
                />
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              {newRecords.length} novos • 
              {duplicateCount} duplicados
            </div>
          </div>

          {/* Selection summary */}
          <div className="flex items-center justify-between py-2 px-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedIds.size === newRecords.length && newRecords.length > 0}
                onCheckedChange={handleSelectAll}
                disabled={newRecords.length === 0}
              />
              <span className="text-sm">
                Selecionar todos os novos ({newRecords.length})
              </span>
            </div>
            <div className="text-sm font-medium">
              {selectedIds.size} selecionados
            </div>
          </div>

          {/* Loading */}
          {isLoadingSheets && (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              Carregando dados do Sheets...
            </div>
          )}

          {/* Table */}
          {!isLoadingSheets && (
            <ScrollArea className="h-[400px] rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Veículo</TableHead>
                    <TableHead className="text-right">Anterior</TableHead>
                    <TableHead className="text-right">Atual</TableHead>
                    <TableHead className="text-right">Trabalhadas</TableHead>
                    <TableHead>Operador</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processedRecords.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        Nenhum registro encontrado
                      </TableCell>
                    </TableRow>
                  )}
                  {processedRecords.map((record) => (
                    <TableRow key={record.id} className={record.isDuplicate ? "opacity-50" : ""}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(record.id)}
                          onCheckedChange={(checked) => handleSelectOne(record.id, checked as boolean)}
                          disabled={record.isDuplicate || !record.parsedDate}
                        />
                      </TableCell>
                      <TableCell>{record.data}</TableCell>
                      <TableCell className="font-medium">
                        {record.veiculo}
                      </TableCell>
                      <TableCell className="text-right">{record.anterior.toFixed(1)}</TableCell>
                      <TableCell className="text-right">{record.atual.toFixed(1)}</TableCell>
                      <TableCell className="text-right">
                        <span className="text-primary font-medium">
                          {record.trabalhadas.toFixed(1)} h
                        </span>
                      </TableCell>
                      <TableCell>{record.operador || "-"}</TableCell>
                      <TableCell>
                        {record.isDuplicate ? (
                          <div className="flex items-center gap-1 text-muted-foreground text-xs">
                            <CheckCircle className="h-3 w-3" />
                            Duplicado
                          </div>
                        ) : !record.parsedDate ? (
                          <div className="flex items-center gap-1 text-destructive text-xs">
                            <AlertCircle className="h-3 w-3" />
                            Data inválida
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-green-600 text-xs">
                            <CheckCircle className="h-3 w-3" />
                            Novo
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}

          {/* Progress */}
          {importing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Importando registros...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={importing}>
            Cancelar
          </Button>
          <Button onClick={handleImport} disabled={importing || selectedIds.size === 0}>
            {importing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importando...
              </>
            ) : (
              <>
                <FileDown className="mr-2 h-4 w-4" />
                Importar {selectedIds.size} Registros
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
