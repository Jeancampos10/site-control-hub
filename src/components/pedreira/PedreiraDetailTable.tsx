import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ApontamentoPedreiraRow } from "@/hooks/useGoogleSheets";

interface PedreiraDetailTableProps {
  data: ApontamentoPedreiraRow[];
}

export const PedreiraDetailTable = ({ data }: PedreiraDetailTableProps) => {
  return (
    <div className="chart-container">
      <h3 className="mb-4 font-semibold">Registros Detalhados</h3>
      <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="data-table-header">Hora</TableHead>
              <TableHead className="data-table-header">Prefixo</TableHead>
              <TableHead className="data-table-header">Empresa</TableHead>
              <TableHead className="data-table-header">Material</TableHead>
              <TableHead className="data-table-header text-right">Toneladas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length > 0 ? (
              data.map((row, index) => (
                <TableRow key={`${row.Prefixo_Eq}-${row.Hora}-${index}`} className="data-table-row">
                  <TableCell className="font-medium">{row.Hora || '-'}</TableCell>
                  <TableCell>
                    <span className="status-badge bg-primary/10 text-primary">{row.Prefixo_Eq || '-'}</span>
                  </TableCell>
                  <TableCell>{row.Empresa_Eq || row.Fornecedor || '-'}</TableCell>
                  <TableCell>{row.Material || '-'}</TableCell>
                  <TableCell className="text-right font-semibold">{row.Tonelada || '-'}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  Nenhum registro encontrado para esta data
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
