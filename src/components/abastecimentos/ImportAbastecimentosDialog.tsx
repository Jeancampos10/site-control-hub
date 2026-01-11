import { useState, useMemo } from "react";
import { format, parse } from "date-fns";
import { Download, Loader2, FileSpreadsheet, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useGoogleSheets } from "@/hooks/useGoogleSheets";
import { transformAbastecimentoData, AbastecimentoRecord } from "@/lib/abastech/sheetsDataTransform";
import { useImportAbastecimentos, ImportAbastecimentoInput } from "@/hooks/useAbastecimentos";

interface ImportAbastecimentosDialogProps {
  onSuccess?: () => void;
}

function parseDate(dateStr: string): string {
  if (!dateStr) return format(new Date(), "yyyy-MM-dd");
  
  // Try DD/MM/YYYY format
  try {
    const parsed = parse(dateStr, "dd/MM/yyyy", new Date());
    if (!isNaN(parsed.getTime())) {
      return format(parsed, "yyyy-MM-dd");
    }
  } catch {}
  
  // Try YYYY-MM-DD format
  try {
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      return format(parsed, "yyyy-MM-dd");
    }
  } catch {}
  
  return format(new Date(), "yyyy-MM-dd");
}

export function ImportAbastecimentosDialog({ onSuccess }: ImportAbastecimentosDialogProps) {
  const [open, setOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [imported, setImported] = useState(0);

  const { data: sheetsData, isLoading } = useGoogleSheets<Record<string, string>>('AbastecimentoCanteiro01');
  const importAbastecimentos = useImportAbastecimentos();

  const sheetsRecords = useMemo<AbastecimentoRecord[]>(() => {
    if (!sheetsData || !Array.isArray(sheetsData)) return [];
    return transformAbastecimentoData(sheetsData);
  }, [sheetsData]);

  const handleImport = async () => {
    if (sheetsRecords.length === 0) return;

    setImporting(true);
    setProgress(0);
    setImported(0);

    const batchSize = 50;
    const batches = [];

    for (let i = 0; i < sheetsRecords.length; i += batchSize) {
      batches.push(sheetsRecords.slice(i, i + batchSize));
    }

    let totalImported = 0;

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      
      const records: ImportAbastecimentoInput[] = batch.map(record => ({
        data: parseDate(record.data),
        hora: record.hora || null,
        tipo: record.tipo || null,
        veiculo: record.veiculo,
        potencia: record.potencia || null,
        descricao: record.descricao || null,
        motorista: record.motorista || null,
        empresa: record.empresa || null,
        obra: record.obra || null,
        horimetro_anterior: record.horimetroAnterior || 0,
        horimetro_atual: record.horimetroAtual || 0,
        km_anterior: record.kmAnterior || 0,
        km_atual: record.kmAtual || 0,
        quantidade_combustivel: record.quantidadeCombustivel || 0,
        tipo_combustivel: record.tipoCombustivel || 'Diesel S10',
        local_abastecimento: record.local || null,
        arla: record.arla || false,
        quantidade_arla: record.quantidadeArla || 0,
        fornecedor: record.fornecedor || null,
        nota_fiscal: record.notaFiscal || null,
        valor_unitario: record.valorUnitario || 0,
        valor_total: record.valorTotal || 0,
        localizacao: record.localizacao || null,
        observacao: record.observacao || null,
        fotos: record.fotos || null,
        lubrificacao: record.lubrificacao || false,
        oleo: record.oleo || null,
        filtro: record.filtro || null,
        sincronizado_sheets: true,
      }));

      try {
        const result = await importAbastecimentos.mutateAsync(records);
        totalImported += result?.length || 0;
      } catch (error) {
        console.error('Erro ao importar lote:', error);
      }

      setProgress(Math.round(((i + 1) / batches.length) * 100));
      setImported(totalImported);
    }

    setImporting(false);
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Importar do Sheets
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-green-600" />
            Importar Abastecimentos
          </DialogTitle>
          <DialogDescription>
            Importar registros do Google Sheets para o banco de dados local
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Registros encontrados</h4>
                    <p className="text-sm text-muted-foreground">
                      Planilha: AbastecimentoCanteiro01
                    </p>
                  </div>
                  <div className="text-2xl font-bold text-primary">
                    {sheetsRecords.length}
                  </div>
                </div>
              </div>

              {importing && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Importando...</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} />
                  <p className="text-sm text-muted-foreground text-center">
                    {imported} registros importados
                  </p>
                </div>
              )}

              {!importing && imported > 0 && (
                <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-4 text-green-700">
                  <CheckCircle className="h-5 w-5" />
                  <span>Importação concluída! {imported} registros importados.</span>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            {imported > 0 ? 'Fechar' : 'Cancelar'}
          </Button>
          {!importing && imported === 0 && (
            <Button 
              onClick={handleImport} 
              disabled={isLoading || sheetsRecords.length === 0}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Importar {sheetsRecords.length} Registros
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
