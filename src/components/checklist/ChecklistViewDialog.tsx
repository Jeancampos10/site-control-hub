import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClipboardCheck, FileDown } from "lucide-react";
import { exportChecklistPDF } from "./checklistPdfExport";

interface Props {
  item: any;
  onClose: () => void;
}

export function ChecklistViewDialog({ item, onClose }: Props) {
  let respostas: any[] = [];
  try {
    respostas = typeof item.respostas === "string" ? JSON.parse(item.respostas) : item.respostas || [];
  } catch { respostas = []; }

  // Group by category
  const categorias: Record<string, any[]> = {};
  respostas.forEach((r: any) => {
    const cat = r.categoria || "Geral";
    if (!categorias[cat]) categorias[cat] = [];
    categorias[cat].push(r);
  });

  return (
    <Dialog open={!!item} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-accent" />
            Checklist — {item.tipo === "entrada" ? "Entrada" : "Saída"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><span className="text-muted-foreground">Veículo:</span> <strong>{item.veiculo}</strong></div>
            <div><span className="text-muted-foreground">Data:</span> <strong>{item.data}</strong></div>
            <div><span className="text-muted-foreground">Motorista:</span> <strong>{item.motorista || "—"}</strong></div>
            <div><span className="text-muted-foreground">Obra:</span> <strong>{item.obra || "—"}</strong></div>
            {item.km_horimetro && <div><span className="text-muted-foreground">KM/Hor:</span> <strong>{item.km_horimetro}</strong></div>}
          </div>

          {Object.entries(categorias).map(([cat, items]) => (
            <div key={cat}>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">{cat}</p>
              <div className="space-y-1">
                {items.map((r: any, i: number) => (
                  <div key={i} className="flex items-center justify-between rounded border px-3 py-1.5 text-sm">
                    <span>{r.descricao}</span>
                    {r.conforme === true && <Badge className="bg-green-600">OK</Badge>}
                    {r.conforme === false && <Badge variant="destructive">NOK</Badge>}
                    {r.conforme == null && <Badge variant="secondary">N/A</Badge>}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {item.observacoes && (
            <div className="text-sm">
              <span className="text-muted-foreground">Observações:</span>
              <p className="mt-1">{item.observacoes}</p>
            </div>
          )}

          <Button onClick={() => exportChecklistPDF(item)} className="w-full gap-2">
            <FileDown className="h-4 w-4" /> Exportar PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
