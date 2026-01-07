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

const reboqueData = [
  {
    prefixo: "RB-001",
    descricao: "Carreta Basculante 3 Eixos",
    empresa: "TransLog",
    motorista: "Carlos Mendes",
    modelo: "Randon",
    placa: "AAA-1111",
    pesoVazio: "8.500 kg",
    volume: "25 m³",
    status: "ativo",
  },
  {
    prefixo: "RB-002",
    descricao: "Carreta Basculante 3 Eixos",
    empresa: "Logística Norte",
    motorista: "Paulo Ferreira",
    modelo: "Noma",
    placa: "BBB-2222",
    pesoVazio: "8.200 kg",
    volume: "24 m³",
    status: "ativo",
  },
  {
    prefixo: "RB-003",
    descricao: "Carreta Basculante 4 Eixos",
    empresa: "TransLog",
    motorista: "Roberto Costa",
    modelo: "Randon",
    placa: "CCC-3333",
    pesoVazio: "9.800 kg",
    volume: "32 m³",
    status: "manutencao",
  },
];

const statusConfig = {
  ativo: { label: "Ativo", className: "status-active" },
  inativo: { label: "Inativo", className: "status-inactive" },
  manutencao: { label: "Manutenção", className: "status-warning" },
};

export default function Reboque() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="page-header mb-0">
          <h1 className="page-title flex items-center gap-2">
            <Truck className="h-6 w-6 text-accent" />
            Caminhões Reboque
          </h1>
          <p className="page-subtitle">
            Cadastro e gestão de carretas e reboques
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            Filtros
          </Button>
          <Button size="sm" className="gap-2 bg-gradient-accent text-accent-foreground hover:opacity-90">
            <Plus className="h-4 w-4" />
            Novo Reboque
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2">
          <div className="h-2 w-2 rounded-full bg-success" />
          <span className="text-sm font-medium">2 Ativos</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-warning/10 px-3 py-2">
          <div className="h-2 w-2 rounded-full bg-warning" />
          <span className="text-sm font-medium">1 Manutenção</span>
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
                <TableHead className="data-table-header">Modelo</TableHead>
                <TableHead className="data-table-header">Placa</TableHead>
                <TableHead className="data-table-header">Peso Vazio</TableHead>
                <TableHead className="data-table-header">Volume</TableHead>
                <TableHead className="data-table-header">Empresa</TableHead>
                <TableHead className="data-table-header">Status</TableHead>
                <TableHead className="data-table-header w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reboqueData.map((row, idx) => (
                <TableRow key={idx} className="data-table-row">
                  <TableCell className="font-semibold text-primary">{row.prefixo}</TableCell>
                  <TableCell>{row.descricao}</TableCell>
                  <TableCell>{row.motorista}</TableCell>
                  <TableCell>{row.modelo}</TableCell>
                  <TableCell className="font-mono">{row.placa}</TableCell>
                  <TableCell>{row.pesoVazio}</TableCell>
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
