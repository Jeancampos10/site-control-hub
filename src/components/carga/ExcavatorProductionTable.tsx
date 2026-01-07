import { useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CargaRow } from "@/hooks/useGoogleSheets";
import { ExcavatorDetailDialog } from "./ExcavatorDetailDialog";

interface ExcavatorProductionTableProps {
  cargaData: CargaRow[];
}

interface ExcavatorSummary {
  prefixo: string;
  descricao: string;
  operador: string;
  empresa: string;
  totalViagens: number;
  materialBreakdown: Record<string, number>;
  records: CargaRow[];
}

export function ExcavatorProductionTable({ cargaData }: ExcavatorProductionTableProps) {
  const [selectedExcavator, setSelectedExcavator] = useState<ExcavatorSummary | null>(null);

  // Get unique materials for columns
  const materials = useMemo(() => {
    const materialSet = new Set<string>();
    cargaData.forEach(row => {
      if (row.Material) materialSet.add(row.Material);
    });
    return Array.from(materialSet).sort();
  }, [cargaData]);

  // Group by excavator
  const excavatorSummaries = useMemo(() => {
    const grouped = new Map<string, ExcavatorSummary>();

    cargaData.forEach(row => {
      const prefixo = row.Prefixo_Eq || 'Sem Prefixo';
      
      if (!grouped.has(prefixo)) {
        grouped.set(prefixo, {
          prefixo,
          descricao: row.Descricao_Eq || '',
          operador: row.Operador || '',
          empresa: row.Empresa_Eq || '',
          totalViagens: 0,
          materialBreakdown: {},
          records: [],
        });
      }

      const summary = grouped.get(prefixo)!;
      const viagens = parseInt(row.N_Viagens) || 0;
      summary.totalViagens += viagens;
      summary.records.push(row);

      const material = row.Material || 'Outros';
      summary.materialBreakdown[material] = (summary.materialBreakdown[material] || 0) + viagens;
    });

    return Array.from(grouped.values()).sort((a, b) => b.totalViagens - a.totalViagens);
  }, [cargaData]);

  const grandTotal = excavatorSummaries.reduce((acc, s) => acc + s.totalViagens, 0);

  return (
    <>
      <div className="chart-container overflow-hidden">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold">Produção por Escavadeira</h3>
          <p className="text-sm text-muted-foreground">
            {excavatorSummaries.length} escavadeiras • {grandTotal} viagens
          </p>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="data-table-header">Escavadeira</TableHead>
                <TableHead className="data-table-header">Operador</TableHead>
                {materials.map(material => (
                  <TableHead key={material} className="data-table-header text-right">
                    {material}
                  </TableHead>
                ))}
                <TableHead className="data-table-header text-right font-bold">Total</TableHead>
                <TableHead className="data-table-header w-[40px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {excavatorSummaries.map((summary) => (
                <TableRow 
                  key={summary.prefixo} 
                  className="data-table-row cursor-pointer hover:bg-accent/5"
                  onClick={() => setSelectedExcavator(summary)}
                >
                  <TableCell>
                    <div>
                      <span className="font-semibold text-primary">{summary.prefixo}</span>
                      <p className="text-xs text-muted-foreground">{summary.descricao}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{summary.operador}</TableCell>
                  {materials.map(material => (
                    <TableCell key={material} className="text-right">
                      {summary.materialBreakdown[material] || '-'}
                    </TableCell>
                  ))}
                  <TableCell className="text-right font-bold text-primary">
                    {summary.totalViagens}
                  </TableCell>
                  <TableCell>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ))}
              {excavatorSummaries.length === 0 && (
                <TableRow>
                  <TableCell colSpan={materials.length + 4} className="h-24 text-center text-muted-foreground">
                    Nenhum registro encontrado para hoje
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <ExcavatorDetailDialog
        excavator={selectedExcavator}
        onClose={() => setSelectedExcavator(null)}
      />
    </>
  );
}
