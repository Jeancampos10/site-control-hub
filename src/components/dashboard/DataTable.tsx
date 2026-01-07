import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Column {
  key: string;
  label: string;
  className?: string;
}

interface DataTableProps {
  title: string;
  subtitle?: string;
  columns: Column[];
  data: Record<string, string | number>[];
}

export function DataTable({ title, subtitle, columns, data }: DataTableProps) {
  return (
    <div className="chart-container animate-slide-up overflow-hidden">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className={`data-table-header ${col.className || ""}`}
                >
                  {col.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, idx) => (
              <TableRow key={idx} className="data-table-row">
                {columns.map((col) => (
                  <TableCell key={col.key} className={col.className}>
                    {row[col.key]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
