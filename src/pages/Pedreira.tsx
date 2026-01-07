import { Mountain, Plus, Filter, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { KPICard } from "@/components/dashboard/KPICard";
import { Truck, Box, Activity } from "lucide-react";

const pedreiraData = [
  {
    data: "07/01/2026",
    hora: "07:30",
    ordem: "001",
    fornecedor: "Pedreira Sul",
    prefixoEq: "CR-001",
    descricaoEq: "Volvo FMX 460",
    empresaEq: "TransPedra",
    motorista: "José Carlos",
    placa: "ABC-1234",
    material: "Brita 1",
    pesoVazio: "18.500 kg",
    pesoFinal: "45.200 kg",
    pesoLiquido: "26.700 kg",
    metroCubico: "17.8 m³",
    densidade: "1.50",
    tonelada: "26.7 t",
  },
  {
    data: "07/01/2026",
    hora: "08:15",
    ordem: "002",
    fornecedor: "Pedreira Norte",
    prefixoEq: "CR-003",
    descricaoEq: "Scania G460",
    empresaEq: "LogPedra",
    motorista: "Roberto Silva",
    placa: "DEF-5678",
    material: "Rachão",
    pesoVazio: "19.200 kg",
    pesoFinal: "48.500 kg",
    pesoLiquido: "29.300 kg",
    metroCubico: "19.5 m³",
    densidade: "1.50",
    tonelada: "29.3 t",
  },
  {
    data: "07/01/2026",
    hora: "09:00",
    ordem: "003",
    fornecedor: "Pedreira Sul",
    prefixoEq: "CR-002",
    descricaoEq: "Mercedes Actros",
    empresaEq: "TransPedra",
    motorista: "Antonio Souza",
    placa: "GHI-9012",
    material: "Brita 0",
    pesoVazio: "18.800 kg",
    pesoFinal: "43.600 kg",
    pesoLiquido: "24.800 kg",
    metroCubico: "16.5 m³",
    densidade: "1.50",
    tonelada: "24.8 t",
  },
];

export default function Pedreira() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="page-header mb-0">
          <h1 className="page-title flex items-center gap-2">
            <Mountain className="h-6 w-6 text-accent" />
            Apontamento Pedreira
          </h1>
          <p className="page-subtitle">
            Controle de carregamentos e pesagens de pedreira
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            Filtros
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
          <Button size="sm" className="gap-2 bg-gradient-accent text-accent-foreground hover:opacity-90">
            <Plus className="h-4 w-4" />
            Novo Apontamento
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Carregamentos"
          value="42"
          subtitle="Hoje"
          icon={Activity}
          variant="accent"
        />
        <KPICard
          title="Peso Total"
          value="1.120 t"
          subtitle="Transportado"
          icon={Box}
          variant="primary"
        />
        <KPICard
          title="Volume"
          value="746 m³"
          subtitle="Material"
          icon={Mountain}
          variant="success"
        />
        <KPICard
          title="Caminhões"
          value="8"
          subtitle="Em operação"
          icon={Truck}
          variant="default"
        />
      </div>

      {/* Data Table */}
      <div className="chart-container overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="data-table-header">Data</TableHead>
                <TableHead className="data-table-header">Hora</TableHead>
                <TableHead className="data-table-header">Ordem</TableHead>
                <TableHead className="data-table-header">Fornecedor</TableHead>
                <TableHead className="data-table-header">Veículo</TableHead>
                <TableHead className="data-table-header">Motorista</TableHead>
                <TableHead className="data-table-header">Material</TableHead>
                <TableHead className="data-table-header text-right">P. Vazio</TableHead>
                <TableHead className="data-table-header text-right">P. Final</TableHead>
                <TableHead className="data-table-header text-right">P. Líquido</TableHead>
                <TableHead className="data-table-header text-right">m³</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pedreiraData.map((row, idx) => (
                <TableRow key={idx} className="data-table-row">
                  <TableCell className="font-medium">{row.data}</TableCell>
                  <TableCell>{row.hora}</TableCell>
                  <TableCell className="font-semibold text-primary">#{row.ordem}</TableCell>
                  <TableCell>{row.fornecedor}</TableCell>
                  <TableCell>
                    <div>
                      <span className="font-medium">{row.prefixoEq}</span>
                      <p className="text-xs text-muted-foreground">{row.placa}</p>
                    </div>
                  </TableCell>
                  <TableCell>{row.motorista}</TableCell>
                  <TableCell>
                    <span className="status-badge bg-accent/10 text-accent">{row.material}</span>
                  </TableCell>
                  <TableCell className="text-right">{row.pesoVazio}</TableCell>
                  <TableCell className="text-right">{row.pesoFinal}</TableCell>
                  <TableCell className="text-right font-semibold">{row.pesoLiquido}</TableCell>
                  <TableCell className="text-right">{row.metroCubico}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
