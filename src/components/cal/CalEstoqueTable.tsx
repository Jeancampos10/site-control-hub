import { EstoqueCalRow } from "@/hooks/useGoogleSheets";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface CalEstoqueTableProps {
  data: EstoqueCalRow[];
}

export function CalEstoqueTable({ data }: CalEstoqueTableProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Estoque</CardTitle>
          <CardDescription>Registro diário do estoque de CAL</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            Nenhum registro de estoque encontrado
          </p>
        </CardContent>
      </Card>
    );
  }

  // Ordenar do mais recente para o mais antigo
  const sortedData = [...data].reverse();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de Estoque</CardTitle>
        <CardDescription>
          {data.length} registro{data.length !== 1 ? 's' : ''} de estoque
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Estoque Anterior</TableHead>
                <TableHead className="text-right">Entradas</TableHead>
                <TableHead className="text-right">Saídas</TableHead>
                <TableHead className="text-right">Estoque Atual</TableHead>
                <TableHead>Observação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((row, index) => {
                const estoqueAnterior = parseFloat(row.Estoque_Anterior?.replace(',', '.') || '0');
                const entradas = parseFloat(row.Entradas?.replace(',', '.') || '0');
                const saidas = parseFloat(row.Saidas?.replace(',', '.') || '0');
                const estoqueAtual = parseFloat(row.Estoque_Atual?.replace(',', '.') || '0');
                
                return (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{row.Data}</TableCell>
                    <TableCell className="text-right font-mono">
                      {estoqueAnterior.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right font-mono text-success">
                      +{entradas.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right font-mono text-destructive">
                      -{saidas.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold">
                      {estoqueAtual.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {row.Observacao || '-'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
