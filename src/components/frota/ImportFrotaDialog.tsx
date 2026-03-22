import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, FileSpreadsheet, Loader2, AlertTriangle, CheckCircle, Download } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface ImportItem {
  codigo: string;
  descricao: string;
  categoria: string;
  potencia: string;
  motorista: string;
  empresa: string;
  obra: string;
  status: string;
}

// Map common column header variations
const columnMap: Record<string, keyof ImportItem> = {
  codigo: "codigo", código: "codigo", prefixo: "codigo", "cod": "codigo",
  descricao: "descricao", descrição: "descricao", "desc": "descricao", nome: "descricao",
  categoria: "categoria", tipo: "categoria",
  potencia: "potencia", potência: "potencia",
  motorista: "motorista", operador: "motorista",
  empresa: "empresa",
  obra: "obra",
  status: "status",
};

function mapRow(raw: Record<string, any>): ImportItem | null {
  const item: Partial<ImportItem> = { status: "Mobilizado" };
  for (const [key, val] of Object.entries(raw)) {
    const normalized = key.trim().toLowerCase().replace(/[_\s]+/g, '');
    for (const [pattern, field] of Object.entries(columnMap)) {
      if (normalized === pattern || normalized.includes(pattern)) {
        (item as any)[field] = String(val ?? '').trim();
        break;
      }
    }
  }
  if (!item.codigo) return null;
  return {
    codigo: item.codigo || '',
    descricao: item.descricao || '',
    categoria: item.categoria || '',
    potencia: item.potencia || '',
    motorista: item.motorista || '',
    empresa: item.empresa || '',
    obra: item.obra || '',
    status: item.status || 'Mobilizado',
  };
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportFrotaDialog({ open, onOpenChange }: Props) {
  const [preview, setPreview] = useState<ImportItem[]>([]);
  const [importing, setImporting] = useState(false);
  const [fileName, setFileName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(ws);
        const mapped = rows.map(mapRow).filter(Boolean) as ImportItem[];
        if (mapped.length === 0) {
          toast.error("Nenhum registro válido encontrado. Verifique se há coluna 'Código' ou 'Prefixo'.");
          return;
        }
        setPreview(mapped);
      } catch {
        toast.error("Erro ao ler o arquivo");
      }
    };
    reader.readAsArrayBuffer(file);
  }

  async function handleImport() {
    if (preview.length === 0) return;
    setImporting(true);
    try {
      const { error } = await supabase.from("frota" as any).insert(preview as any);
      if (error) throw error;
      toast.success(`${preview.length} veículos importados com sucesso!`);
      qc.invalidateQueries({ queryKey: ["frota"] });
      setPreview([]);
      setFileName("");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Erro ao importar");
    } finally {
      setImporting(false);
    }
  }

  function handleClose() {
    setPreview([]);
    setFileName("");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Importar Veículos/Equipamentos
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Upload area */}
          {preview.length === 0 ? (
            <div className="space-y-4">
              <div
                className="border-2 border-dashed border-muted-foreground/30 rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileRef.current?.click()}
              >
                <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm font-medium">Clique para selecionar um arquivo CSV ou XLSX</p>
                <p className="text-xs text-muted-foreground mt-1">
                  O arquivo deve ter colunas como: Código, Descrição, Categoria, Potência, Motorista, Empresa, Obra, Status
                </p>
              </div>
              <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleFile} className="hidden" />
              
              <div className="rounded-lg bg-muted/50 p-4 text-xs space-y-1">
                <p className="font-medium flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> Dicas:</p>
                <ul className="list-disc pl-4 space-y-0.5 text-muted-foreground">
                  <li>A primeira linha deve conter os cabeçalhos</li>
                  <li>Coluna obrigatória: <strong>Código</strong> (ou Prefixo)</li>
                  <li>Outras colunas são mapeadas automaticamente</li>
                  <li>Formatos aceitos: .csv, .xlsx, .xls</li>
                </ul>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                <span><strong>{preview.length}</strong> registros encontrados em <strong>{fileName}</strong></span>
              </div>
              <div className="flex-1 overflow-auto border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Código</TableHead>
                      <TableHead className="text-xs">Descrição</TableHead>
                      <TableHead className="text-xs">Categoria</TableHead>
                      <TableHead className="text-xs">Potência</TableHead>
                      <TableHead className="text-xs">Motorista</TableHead>
                      <TableHead className="text-xs">Empresa</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.slice(0, 50).map((row, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-xs font-mono">{row.codigo}</TableCell>
                        <TableCell className="text-xs">{row.descricao}</TableCell>
                        <TableCell className="text-xs">{row.categoria}</TableCell>
                        <TableCell className="text-xs">{row.potencia}</TableCell>
                        <TableCell className="text-xs">{row.motorista}</TableCell>
                        <TableCell className="text-xs">{row.empresa}</TableCell>
                        <TableCell className="text-xs">{row.status}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {preview.length > 50 && (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    Mostrando 50 de {preview.length} registros
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        <DialogFooter className="gap-2">
          {preview.length > 0 && (
            <Button variant="outline" onClick={() => { setPreview([]); setFileName(""); }}>
              Trocar arquivo
            </Button>
          )}
          <Button variant="outline" onClick={handleClose}>Cancelar</Button>
          {preview.length > 0 && (
            <Button onClick={handleImport} disabled={importing} className="gap-2">
              {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Importar {preview.length} registros
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
