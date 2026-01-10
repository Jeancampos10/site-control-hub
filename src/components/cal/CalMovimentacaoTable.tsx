import { MovCalRow } from "@/hooks/useGoogleSheets";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";

interface CalMovimentacaoTableProps {
  data: MovCalRow[];
}

export function CalMovimentacaoTable({ data }: CalMovimentacaoTableProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Movimentações de CAL</CardTitle>
          <CardDescription>Registro de entradas e saídas</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            Nenhuma movimentação encontrada
          </p>
        </CardContent>
      </Card>
    );
  }

  const getTipoBadge = (tipo: string) => {
    const tipoLower = tipo?.toLowerCase().trim();
    if (tipoLower === 'entrada' || tipoLower === 'compra') {
      return (
        <Badge variant="default" className="bg-success/10 text-success border-success/20">
          <ArrowDownToLine className="h-3 w-3 mr-1" />
          {tipo}
        </Badge>
      );
    }
    return (
      <Badge variant="default" className="bg-accent/10 text-accent border-accent/20">
        <ArrowUpFromLine className="h-3 w-3 mr-1" />
        {tipo}
      </Badge>
    );
  };

  const formatCurrency = (value: string) => {
    const num = parseFloat(value?.replace(',', '.') || '0');
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatNumber = (value: string) => {
    const num = parseFloat(value?.replace(',', '.') || '0');
    return num.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Movimentações de CAL</CardTitle>
        <CardDescription>
          {data.length} registro{data.length !== 1 ? 's' : ''} encontrado{data.length !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Hora</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Prefixo</TableHead>
                <TableHead>Und</TableHead>
                <TableHead className="text-right">Qtd</TableHead>
                <TableHead>NF</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-right">Frete</TableHead>
                <TableHead>Local</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{row.Data}</TableCell>
                  <TableCell>{row.Hora || '-'}</TableCell>
                  <TableCell>{getTipoBadge(row.Tipo)}</TableCell>
                  <TableCell>{row.Fornecedor || '-'}</TableCell>
                  <TableCell>{row.Prefixo_Eq || '-'}</TableCell>
                  <TableCell>{row.Und || '-'}</TableCell>
                  <TableCell className="text-right font-mono">
                    {formatNumber(row.Qtd)}
                  </TableCell>
                  <TableCell>{row.NF || '-'}</TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(row.Valor)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(row.Frete)}
                  </TableCell>
                  <TableCell>{row.Local || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
