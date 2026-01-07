import { Droplets, Plus, Filter, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const pipaData = [
  {
    prefixo: "PP-001",
    descricao: "Mercedes Atego Pipa",
    empresa: "AguaVia",
    motorista: "Pedro Henrique",
    capacidade: "15.000 L",
    placa: "XYZ-1234",
    status: "ativo",
  },
  {
    prefixo: "PP-002",
    descricao: "Volkswagen Constellation Pipa",
    empresa: "HidroServ",
    motorista: "Lucas Santos",
    capacidade: "20.000 L",
    placa: "WVU-5678",
    status: "ativo",
  },
  {
    prefixo: "PP-003",
    descricao: "Ford Cargo Pipa",
    empresa: "AguaVia",
    motorista: "Marcos Lima",
    capacidade: "12.000 L",
    placa: "TSR-9012",
    status: "ativo",
  },
  {
    prefixo: "PP-004",
    descricao: "Scania G360 Pipa",
    empresa: "HidroServ",
    motorista: "-",
    capacidade: "25.000 L",
    placa: "QPO-3456",
    status: "inativo",
  },
];

const statusConfig = {
  ativo: { label: "Ativo", className: "status-active" },
  inativo: { label: "Inativo", className: "status-inactive" },
  manutencao: { label: "Manutenção", className: "status-warning" },
};

export default function FrotaPipa() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="page-header mb-0">
          <h1 className="page-title flex items-center gap-2">
            <Droplets className="h-6 w-6 text-info" />
            Caminhões Pipa
          </h1>
          <p className="page-subtitle">
            Cadastro e gestão de caminhões pipa
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            Filtros
          </Button>
          <Button size="sm" className="gap-2 bg-gradient-accent text-accent-foreground hover:opacity-90">
            <Plus className="h-4 w-4" />
            Novo Pipa
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2">
          <div className="h-2 w-2 rounded-full bg-success" />
          <span className="text-sm font-medium">3 Ativos</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
          <div className="h-2 w-2 rounded-full bg-muted-foreground" />
          <span className="text-sm font-medium">1 Inativo</span>
        </div>
      </div>

      {/* Data Table */}
      <div className="chart-container overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="data-table-header">Prefixo</TableHead>
                <TableHead className="data-table-header">Descrição</TableHead>
                <TableHead className="data-table-header">Motorista</TableHead>
                <TableHead className="data-table-header">Empresa</TableHead>
                <TableHead className="data-table-header">Capacidade</TableHead>
                <TableHead className="data-table-header">Placa</TableHead>
                <TableHead className="data-table-header">Status</TableHead>
                <TableHead className="data-table-header w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pipaData.map((row, idx) => (
                <TableRow key={idx} className="data-table-row">
                  <TableCell className="font-semibold text-info">{row.prefixo}</TableCell>
                  <TableCell>{row.descricao}</TableCell>
                  <TableCell>{row.motorista}</TableCell>
                  <TableCell>{row.empresa}</TableCell>
                  <TableCell>
                    <span className="status-badge bg-info/10 text-info">{row.capacidade}</span>
                  </TableCell>
                  <TableCell className="font-mono">{row.placa}</TableCell>
                  <TableCell>
                    <span className={statusConfig[row.status as keyof typeof statusConfig].className}>
                      {statusConfig[row.status as keyof typeof statusConfig].label}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
