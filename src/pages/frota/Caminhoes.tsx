import { Truck, Plus, Filter, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const caminhoesData = [
  {
    prefixo: "CB-008",
    descricao: "Mercedes Actros 4844",
    motorista: "Fernando Dias",
    marca: "Mercedes-Benz",
    potencia: "440 HP",
    volume: "12 m³",
    empresa: "TransLog",
    status: "ativo",
  },
  {
    prefixo: "CB-012",
    descricao: "Volvo FMX 8x4",
    motorista: "Carlos Souza",
    marca: "Volvo",
    potencia: "500 HP",
    volume: "12 m³",
    empresa: "TransLog",
    status: "ativo",
  },
  {
    prefixo: "CB-015",
    descricao: "Scania R500",
    motorista: "Roberto Lima",
    marca: "Scania",
    potencia: "500 HP",
    volume: "15 m³",
    empresa: "Logística Norte",
    status: "ativo",
  },
  {
    prefixo: "CB-020",
    descricao: "Volvo FH 540",
    motorista: "Marcos Oliveira",
    marca: "Volvo",
    potencia: "540 HP",
    volume: "12 m³",
    empresa: "Logística Norte",
    status: "ativo",
  },
  {
    prefixo: "CB-022",
    descricao: "DAF XF 530",
    motorista: "Paulo Ferreira",
    marca: "DAF",
    potencia: "530 HP",
    volume: "14 m³",
    empresa: "TransLog",
    status: "manutencao",
  },
];

const statusConfig = {
  ativo: { label: "Ativo", className: "status-active" },
  inativo: { label: "Inativo", className: "status-inactive" },
  manutencao: { label: "Manutenção", className: "status-warning" },
};

export default function Caminhoes() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="page-header mb-0">
          <h1 className="page-title flex items-center gap-2">
            <Truck className="h-6 w-6 text-accent" />
            Caminhões Basculantes
          </h1>
          <p className="page-subtitle">
            Cadastro e gestão de caminhões basculantes
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            Filtros
          </Button>
          <Button size="sm" className="gap-2 bg-gradient-accent text-accent-foreground hover:opacity-90">
            <Plus className="h-4 w-4" />
            Novo Caminhão
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2">
          <div className="h-2 w-2 rounded-full bg-success" />
          <span className="text-sm font-medium">18 Ativos</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-warning/10 px-3 py-2">
          <div className="h-2 w-2 rounded-full bg-warning" />
          <span className="text-sm font-medium">3 Manutenção</span>
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
                <TableHead className="data-table-header">Marca</TableHead>
                <TableHead className="data-table-header">Potência</TableHead>
                <TableHead className="data-table-header">Volume</TableHead>
                <TableHead className="data-table-header">Empresa</TableHead>
                <TableHead className="data-table-header">Status</TableHead>
                <TableHead className="data-table-header w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {caminhoesData.map((row, idx) => (
                <TableRow key={idx} className="data-table-row">
                  <TableCell className="font-semibold text-primary">{row.prefixo}</TableCell>
                  <TableCell>{row.descricao}</TableCell>
                  <TableCell>{row.motorista}</TableCell>
                  <TableCell>{row.marca}</TableCell>
                  <TableCell>{row.potencia}</TableCell>
                  <TableCell>{row.volume}</TableCell>
                  <TableCell>{row.empresa}</TableCell>
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
