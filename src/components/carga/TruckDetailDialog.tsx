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
import { TruckSummary } from "./TruckProductionTable";

interface TruckDetailDialogProps {
  truck: TruckSummary | null;
  onClose: () => void;
}

interface ExcavatorLoad {
  prefixo: string;
  descricao: string;
  operador: string;
  materialBreakdown: Record<string, number>;
  totalViagens: number;
  volume: number;
  locais: Set<string>;
}

export function TruckDetailDialog({ truck, onClose }: TruckDetailDialogProps) {
  // Group records by excavator with material breakdown
  const excavatorLoads = useMemo(() => {
    if (!truck) return [];

    const grouped = new Map<string, ExcavatorLoad>();

    truck.records.forEach(row => {
      const prefixo = row.Prefixo_Eq || 'Sem Prefixo';

      if (!grouped.has(prefixo)) {
        grouped.set(prefixo, {
          prefixo,
          descricao: row.Descricao_Eq || '',
          operador: row.Operador || '',
          materialBreakdown: {},
          totalViagens: 0,
          volume: 0,
          locais: new Set(),
        });
      }

      const summary = grouped.get(prefixo)!;
      const viagens = parseInt(row.N_Viagens) || 0;
      summary.totalViagens += viagens;
      summary.volume += parseFloat(row.Volume_Total) || 0;
      if (row.Local_da_Obra) summary.locais.add(row.Local_da_Obra);
      
      const material = row.Material || 'Outros';
      summary.materialBreakdown[material] = (summary.materialBreakdown[material] || 0) + viagens;
    });

    return Array.from(grouped.values()).sort((a, b) => b.totalViagens - a.totalViagens);
  }, [truck]);

  const exportToPDF = () => {
    if (!truck) return;

    const doc = new jsPDF();
    const date = new Date().toLocaleDateString('pt-BR');

    // Header
    doc.setFontSize(18);
    doc.text(`Relatório de Produção - ${truck.prefixo}`, 14, 22);
    doc.setFontSize(11);
    doc.text(`${truck.descricao}`, 14, 30);
    doc.text(`Motorista: ${truck.motorista}`, 14, 36);
    doc.text(`Empresa: ${truck.empresa}`, 14, 42);
    doc.text(`Data: ${date}`, 14, 48);
    doc.text(`Total de Viagens: ${truck.totalViagens}`, 14, 54);

    // Material breakdown
    doc.setFontSize(14);
    doc.text('Resumo por Material', 14, 66);
    
    const materialData = Object.entries(truck.materialBreakdown).map(([material, viagens]) => [
      material,
      viagens.toString(),
    ]);
    
    autoTable(doc, {
      head: [['Material', 'Viagens']],
      body: materialData,
      startY: 71,
      theme: 'striped',
    });

    // Excavator details
    const finalY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || 80;
    doc.setFontSize(14);
    doc.text('Detalhamento por Escavadeira', 14, finalY + 15);

    const excavatorData = excavatorLoads.map(exc => [
      exc.prefixo,
      exc.operador,
      exc.totalViagens.toString(),
      `${exc.volume.toFixed(0)} m³`,
      Array.from(exc.locais).join(', '),
      Object.entries(exc.materialBreakdown).map(([m, v]) => `${m}: ${v}`).join(', '),
    ]);

    autoTable(doc, {
      head: [['Escavadeira', 'Operador', 'Viagens', 'Volume', 'Locais', 'Materiais']],
      body: excavatorData,
      startY: finalY + 20,
      theme: 'striped',
      styles: { fontSize: 8 },
      columnStyles: {
        4: { cellWidth: 30 },
        5: { cellWidth: 40 },
      },
    });

    doc.save(`relatorio-caminhao-${truck.prefixo}-${date.replace(/\//g, '-')}.pdf`);
  };

  return (
    <Dialog open={!!truck} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl">
                {truck?.prefixo} - {truck?.descricao}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Motorista: {truck?.motorista} • {truck?.totalViagens} viagens
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
          {truck && Object.entries(truck.materialBreakdown).map(([material, viagens]) => (
            <div key={material} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent/10">
              <span className="text-sm font-medium text-accent">{material}</span>
              <span className="text-sm text-muted-foreground">{viagens} viagens</span>
            </div>
          ))}
        </div>

        {/* Excavator Table */}
        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="data-table-header">Escavadeira</TableHead>
                <TableHead className="data-table-header">Operador</TableHead>
                <TableHead className="data-table-header">Materiais</TableHead>
                <TableHead className="data-table-header text-right">Viagens</TableHead>
                <TableHead className="data-table-header text-right">Volume</TableHead>
                <TableHead className="data-table-header">Locais</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {excavatorLoads.map((exc) => (
                <TableRow key={exc.prefixo} className="data-table-row">
                  <TableCell>
                    <div>
                      <span className="font-semibold">{exc.prefixo}</span>
                      <p className="text-xs text-muted-foreground">{exc.descricao}</p>
                    </div>
                  </TableCell>
                  <TableCell>{exc.operador}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(exc.materialBreakdown).map(([mat, viagens]) => (
                        <span key={mat} className="status-badge bg-accent/10 text-accent text-xs">
                          {mat}: {viagens}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-semibold">{exc.totalViagens}</TableCell>
                  <TableCell className="text-right">{exc.volume.toFixed(0)} m³</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {Array.from(exc.locais).slice(0, 2).map(local => (
                        <span key={local} className="status-badge bg-primary/10 text-primary text-xs">
                          {local}
                        </span>
                      ))}
                      {exc.locais.size > 2 && (
                        <span className="text-xs text-muted-foreground">+{exc.locais.size - 2}</span>
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
