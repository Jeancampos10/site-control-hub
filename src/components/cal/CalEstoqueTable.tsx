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

  const formatNumber = (value: string) => {
    const num = parseFloat(value?.replace(',', '.') || '0');
    return num.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
  };

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
                <TableHead>Descrição</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Estoque Anterior</TableHead>
                <TableHead className="text-right">Saída</TableHead>
                <TableHead className="text-right">Entrada</TableHead>
                <TableHead className="text-right">Estoque Atual</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((row, index) => {
                const estoqueAnterior = parseFloat(row.Estoque_Anterior?.replace(',', '.') || '0');
                const entrada = parseFloat(row.Entrada?.replace(',', '.') || '0');
                const saida = parseFloat(row.Saida?.replace(',', '.') || '0');
                const estoqueAtual = parseFloat(row.Estoque_Atual?.replace(',', '.') || '0');
                
                return (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{row.Descricao || '-'}</TableCell>
                    <TableCell>{row.Data}</TableCell>
                    <TableCell className="text-right font-mono">
                      {formatNumber(row.Estoque_Anterior)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-destructive">
                      {saida > 0 ? `-${formatNumber(row.Saida)}` : '-'}
                    </TableCell>
                    <TableCell className="text-right font-mono text-success">
                      {entrada > 0 ? `+${formatNumber(row.Entrada)}` : '-'}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold">
                      {formatNumber(row.Estoque_Atual)}
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
