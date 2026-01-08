import { useMemo } from "react";
import { Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { CargaRow } from "@/hooks/useGoogleSheets";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ExcavatorSummary {
  prefixo: string;
  descricao: string;
  operador: string;
  empresa: string;
  totalViagens: number;
  materialBreakdown: Record<string, number>;
  records: CargaRow[];
}

interface ExcavatorDetailDialogProps {
  excavator: ExcavatorSummary | null;
  onClose: () => void;
}

interface TruckMaterialSummary {
  prefixo: string;
  descricao: string;
  motorista: string;
  material: string;
  viagens: number;
  volume: number;
  locais: Set<string>;
}

export function ExcavatorDetailDialog({ excavator, onClose }: ExcavatorDetailDialogProps) {
  // Group records by truck AND material (separate counts per material)
  const truckMaterialSummaries = useMemo(() => {
    if (!excavator) return [];

    const grouped = new Map<string, TruckMaterialSummary>();

    excavator.records.forEach(row => {
      const prefixo = row.Prefixo_Cb || 'Sem Prefixo';
      const material = row.Material || 'Outros';
      const key = `${prefixo}__${material}`;

      if (!grouped.has(key)) {
        grouped.set(key, {
          prefixo,
          descricao: row.Descricao_Cb || '',
          motorista: row.Motorista || '',
          material,
          viagens: 0,
          volume: 0,
          locais: new Set(),
        });
      }

      const summary = grouped.get(key)!;
      summary.viagens += parseInt(row.N_Viagens) || 0;
      summary.volume += parseFloat(row.Volume_Total) || 0;
      if (row.Local_da_Obra) summary.locais.add(row.Local_da_Obra);
    });

    return Array.from(grouped.values()).sort((a, b) => {
      // Sort by truck prefixo first, then by material
      if (a.prefixo !== b.prefixo) {
        return a.prefixo.localeCompare(b.prefixo);
      }
      return b.viagens - a.viagens;
    });
  }, [excavator]);

  const exportToPDF = () => {
    if (!excavator) return;

    const doc = new jsPDF();
    const date = new Date().toLocaleDateString('pt-BR');

    // Header
    doc.setFontSize(18);
    doc.text(`Relatório de Produção - ${excavator.prefixo}`, 14, 22);
    doc.setFontSize(11);
    doc.text(`${excavator.descricao}`, 14, 30);
    doc.text(`Operador: ${excavator.operador}`, 14, 36);
    doc.text(`Data: ${date}`, 14, 42);
    doc.text(`Total de Viagens: ${excavator.totalViagens}`, 14, 48);

    // Material breakdown
    doc.setFontSize(14);
    doc.text('Resumo por Material', 14, 60);
    
    const materialData = Object.entries(excavator.materialBreakdown).map(([material, viagens]) => [
      material,
      viagens.toString(),
    ]);
    
    autoTable(doc, {
      head: [['Material', 'Viagens']],
      body: materialData,
      startY: 65,
      theme: 'striped',
    });

    // Truck details with material breakdown
    const finalY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || 80;
    doc.setFontSize(14);
    doc.text('Detalhamento por Caminhão e Material', 14, finalY + 15);

    const truckData = truckMaterialSummaries.map(truck => [
      truck.prefixo,
      truck.motorista,
      truck.material,
      truck.viagens.toString(),
      `${truck.volume.toFixed(0)} m³`,
      Array.from(truck.locais).join(', '),
    ]);

    autoTable(doc, {
      head: [['Caminhão', 'Motorista', 'Material', 'Viagens', 'Volume', 'Locais']],
      body: truckData,
      startY: finalY + 20,
      theme: 'striped',
      styles: { fontSize: 8 },
      columnStyles: {
        5: { cellWidth: 35 },
      },
    });

    doc.save(`relatorio-${excavator.prefixo}-${date.replace(/\//g, '-')}.pdf`);
  };

  return (
    <Dialog open={!!excavator} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl">
                {excavator?.prefixo} - {excavator?.descricao}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Operador: {excavator?.operador} • {excavator?.totalViagens} viagens
              </p>
            </div>
            <Button variant="outline" size="sm" className="gap-2" onClick={exportToPDF}>
              <Download className="h-4 w-4" />
              Exportar PDF
            </Button>
          </div>
        </DialogHeader>

        {/* Material Summary */}
        <div className="flex flex-wrap gap-2 py-3 border-b">
          {excavator && Object.entries(excavator.materialBreakdown).map(([material, viagens]) => (
            <div key={material} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent/10">
              <span className="text-sm font-medium text-accent">{material}</span>
              <span className="text-sm text-muted-foreground">{viagens} viagens</span>
            </div>
          ))}
        </div>

        {/* Truck Table with Material Breakdown */}
        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="data-table-header">Caminhão</TableHead>
                <TableHead className="data-table-header">Motorista</TableHead>
                <TableHead className="data-table-header">Material</TableHead>
                <TableHead className="data-table-header text-right">Viagens</TableHead>
                <TableHead className="data-table-header text-right">Volume</TableHead>
                <TableHead className="data-table-header">Locais</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {truckMaterialSummaries.map((truck, idx) => (
                <TableRow key={`${truck.prefixo}-${truck.material}-${idx}`} className="data-table-row">
                  <TableCell>
                    <div>
                      <span className="font-semibold">{truck.prefixo}</span>
                      <p className="text-xs text-muted-foreground">{truck.descricao}</p>
                    </div>
                  </TableCell>
                  <TableCell>{truck.motorista}</TableCell>
                  <TableCell>
                    <span className="status-badge bg-accent/10 text-accent">
                      {truck.material}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-semibold">{truck.viagens}</TableCell>
                  <TableCell className="text-right">{truck.volume.toFixed(0)} m³</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {Array.from(truck.locais).slice(0, 2).map(local => (
                        <span key={local} className="status-badge bg-primary/10 text-primary text-xs">
                          {local}
                        </span>
                      ))}
                      {truck.locais.size > 2 && (
                        <span className="text-xs text-muted-foreground">+{truck.locais.size - 2}</span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
