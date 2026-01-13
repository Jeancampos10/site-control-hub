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
import { ArrowDownToLine, ArrowUpFromLine, Package } from "lucide-react";

interface CalMovimentacaoTableProps {
  data: MovCalRow[];
}

// Parse Brazilian number format: 1.234,56 -> 1234.56
const parseNumber = (value: string | undefined): number => {
  if (!value || value.trim() === '') return 0;
  const cleaned = value.replace(/\./g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
};

export function CalMovimentacaoTable({ data }: CalMovimentacaoTableProps) {
  if (!data || data.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <Package className="h-12 w-12 opacity-50" />
            <p className="text-lg font-medium">Nenhuma movimentação encontrada</p>
            <p className="text-sm">Selecione outra data ou verifique os filtros</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getTipoBadge = (tipo: string) => {
    const tipoLower = tipo?.toLowerCase().trim();
    const isEntrada = tipoLower === 'entrada' || tipoLower === 'compra';
    
    return (
      <Badge 
        variant="default" 
        className={`gap-1 font-medium ${
          isEntrada 
            ? 'bg-success/15 text-success border-success/30 hover:bg-success/20' 
            : 'bg-destructive/15 text-destructive border-destructive/30 hover:bg-destructive/20'
        }`}
      >
        {isEntrada ? (
          <ArrowDownToLine className="h-3 w-3" />
        ) : (
          <ArrowUpFromLine className="h-3 w-3" />
        )}
        {tipo || (isEntrada ? 'Entrada' : 'Saída')}
      </Badge>
    );
  };

  const formatCurrency = (value: string) => {
    const num = parseNumber(value);
    if (num === 0) return '-';
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatNumber = (value: string) => {
    const num = parseNumber(value);
    if (num === 0) return '-';
    return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <Card className="border-0 shadow-sm overflow-hidden">
      <CardHeader className="bg-muted/30 border-b pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Movimentações de CAL</CardTitle>
            <CardDescription>
              {data.length} registro{data.length !== 1 ? 's' : ''} encontrado{data.length !== 1 ? 's' : ''}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/20 hover:bg-muted/20">
                <TableHead className="font-semibold text-foreground w-[100px]">Data</TableHead>
                <TableHead className="font-semibold text-foreground w-[70px]">Hora</TableHead>
                <TableHead className="font-semibold text-foreground w-[110px]">Tipo</TableHead>
                <TableHead className="font-semibold text-foreground min-w-[150px]">Fornecedor</TableHead>
                <TableHead className="font-semibold text-foreground text-right w-[120px]">Quantidade</TableHead>
                <TableHead className="font-semibold text-foreground w-[80px]">NF</TableHead>
                <TableHead className="font-semibold text-foreground text-right w-[120px]">Valor</TableHead>
                <TableHead className="font-semibold text-foreground text-right w-[120px]">Frete</TableHead>
                <TableHead className="font-semibold text-foreground min-w-[120px]">Local</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, index) => {
                const tipoLower = row.Tipo?.toLowerCase().trim();
                const isEntrada = tipoLower === 'entrada' || tipoLower === 'compra';
                
                return (
                  <TableRow 
                    key={index} 
                    className={`transition-colors ${
                      isEntrada 
                        ? 'hover:bg-success/5' 
                        : 'hover:bg-destructive/5'
                    }`}
                  >
                    <TableCell className="font-medium text-foreground">{row.Data || '-'}</TableCell>
                    <TableCell className="text-muted-foreground">{row.Hora || '-'}</TableCell>
                    <TableCell>{getTipoBadge(row.Tipo)}</TableCell>
                    <TableCell className="font-medium">{row.Fornecedor || '-'}</TableCell>
                    <TableCell className="text-right">
                      <span className={`font-mono font-semibold ${
                        isEntrada ? 'text-success' : 'text-destructive'
                      }`}>
                        {formatNumber(row.Qtd)} {row.Und || 'ton'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {row.NF ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-muted text-xs font-medium">
                          {row.NF}
                        </span>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">
                      {formatCurrency(row.Valor)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">
                      {formatCurrency(row.Frete)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{row.Local || '-'}</TableCell>
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
