import { Building2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MaterialSummary } from "./PedreiraSummaryCard";

interface CompanySummary {
  empresa: string;
  caminhoes: number;
  viagens: number;
}

interface PedreiraDayTablesProps {
  materialSummaryDia: MaterialSummary[];
  companySummary: CompanySummary[];
}

export const PedreiraDayTables = ({ materialSummaryDia, companySummary }: PedreiraDayTablesProps) => {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Material Summary (Day) */}
      <div className="chart-container">
        <h3 className="mb-4 font-semibold">Resumo por Material (Dia)</h3>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="data-table-header">Material</TableHead>
                <TableHead className="data-table-header text-right">Viagens</TableHead>
                <TableHead className="data-table-header text-right">Toneladas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {materialSummaryDia.length > 0 ? (
                materialSummaryDia.map((row) => (
                  <TableRow key={row.material} className="data-table-row">
                    <TableCell>
                      <span className="status-badge bg-accent/10 text-accent">{row.material}</span>
                    </TableCell>
                    <TableCell className="text-right font-medium">{row.viagens}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {row.toneladas.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} t
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="h-16 text-center text-muted-foreground">
                    Nenhum registro encontrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Company Summary */}
      <div className="chart-container">
        <h3 className="mb-4 font-semibold flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Resumo por Empresa
        </h3>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="data-table-header">Empresa</TableHead>
                <TableHead className="data-table-header text-right">Caminhões</TableHead>
                <TableHead className="data-table-header text-right">Viagens</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companySummary.length > 0 ? (
                companySummary.map((row) => (
                  <TableRow key={row.empresa} className="data-table-row">
                    <TableCell>
                      <span className="font-medium">{row.empresa}</span>
                    </TableCell>
                    <TableCell className="text-right">{row.caminhoes}</TableCell>
                    <TableCell className="text-right font-semibold">{row.viagens}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="h-16 text-center text-muted-foreground">
                    Nenhum registro encontrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};
