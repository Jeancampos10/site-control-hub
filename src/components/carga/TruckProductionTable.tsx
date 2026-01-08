import { useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronRight } from "lucide-react";
import { CargaRow } from "@/hooks/useGoogleSheets";
import { TruckDetailDialog } from "./TruckDetailDialog";

interface TruckProductionTableProps {
  cargaData: CargaRow[];
}

export interface TruckSummary {
  prefixo: string;
  descricao: string;
  motorista: string;
  empresa: string;
  totalViagens: number;
  materialBreakdown: Record<string, number>;
  records: CargaRow[];
}

export function TruckProductionTable({ cargaData }: TruckProductionTableProps) {
  const [selectedTruck, setSelectedTruck] = useState<TruckSummary | null>(null);

  // Get unique materials for dynamic columns
  const materials = useMemo(() => {
    const uniqueMaterials = new Set<string>();
    cargaData.forEach(row => {
      if (row.Material) uniqueMaterials.add(row.Material);
    });
    return Array.from(uniqueMaterials).sort();
  }, [cargaData]);

  // Group data by truck
  const truckSummaries = useMemo((): TruckSummary[] => {
    const grouped = new Map<string, TruckSummary>();

    cargaData.forEach(row => {
      const prefixo = row.Prefixo_Cb || 'Sem Prefixo';

      if (!grouped.has(prefixo)) {
        grouped.set(prefixo, {
          prefixo,
          descricao: row.Descricao_Cb || '',
          motorista: row.Motorista || '',
          empresa: row.Empresa_Cb || '',
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

  if (truckSummaries.length === 0) {
    return null;
  }

  return (
    <>
      <div className="chart-container overflow-hidden">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold">Produção por Caminhão</h3>
          <p className="text-sm text-muted-foreground">{truckSummaries.length} caminhões</p>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="data-table-header">Caminhão</TableHead>
                <TableHead className="data-table-header">Motorista</TableHead>
                {materials.map(mat => (
                  <TableHead key={mat} className="data-table-header text-right">{mat}</TableHead>
                ))}
                <TableHead className="data-table-header text-right">Total</TableHead>
                <TableHead className="data-table-header w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {truckSummaries.map((truck) => (
                <TableRow 
                  key={truck.prefixo} 
                  className="data-table-row cursor-pointer hover:bg-accent/5"
                  onClick={() => setSelectedTruck(truck)}
                >
                  <TableCell>
                    <div>
                      <span className="font-semibold text-primary">{truck.prefixo}</span>
                      <p className="text-xs text-muted-foreground">{truck.descricao}</p>
                    </div>
                  </TableCell>
                  <TableCell>{truck.motorista}</TableCell>
                  {materials.map(mat => (
                    <TableCell key={mat} className="text-right">
                      {truck.materialBreakdown[mat] || '-'}
                    </TableCell>
                  ))}
                  <TableCell className="text-right font-bold text-lg">{truck.totalViagens}</TableCell>
                  <TableCell>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <TruckDetailDialog
        truck={selectedTruck}
        onClose={() => setSelectedTruck(null)}
      />
    </>
  );
}
