import { Droplets, Plus, Filter, Download } from "lucide-react";
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
import { Truck, Activity, Clock } from "lucide-react";

const pipasData = [
  {
    data: "07/01/2026",
    prefixo: "PP-001",
    descricao: "Mercedes Atego Pipa",
    empresa: "AguaVia",
    motorista: "Pedro Henrique",
    capacidade: "15.000 L",
    horaChegada: "07:00",
    horaSaida: "17:30",
    nViagens: 8,
  },
  {
    data: "07/01/2026",
    prefixo: "PP-002",
    descricao: "Volkswagen Constellation Pipa",
    empresa: "HidroServ",
    motorista: "Lucas Santos",
    capacidade: "20.000 L",
    horaChegada: "06:30",
    horaSaida: "17:00",
    nViagens: 6,
  },
  {
    data: "07/01/2026",
    prefixo: "PP-003",
    descricao: "Ford Cargo Pipa",
    empresa: "AguaVia",
    motorista: "Marcos Lima",
    capacidade: "12.000 L",
    horaChegada: "07:30",
    horaSaida: "16:30",
    nViagens: 10,
  },
];

export default function Pipas() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="page-header mb-0">
          <h1 className="page-title flex items-center gap-2">
            <Droplets className="h-6 w-6 text-info" />
            Apontamento Pipas
          </h1>
          <p className="page-subtitle">
            Controle de caminhões pipa e abastecimento de água
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
          title="Pipas Ativas"
          value="3"
          subtitle="Em operação"
          icon={Truck}
          variant="accent"
        />
        <KPICard
          title="Total Viagens"
          value="24"
          subtitle="Hoje"
          icon={Activity}
          variant="primary"
        />
        <KPICard
          title="Volume Água"
          value="376.000 L"
          subtitle="Transportado"
          icon={Droplets}
          variant="success"
        />
        <KPICard
          title="Horas Operadas"
          value="30h"
          subtitle="Acumulado"
          icon={Clock}
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
                <TableHead className="data-table-header">Prefixo</TableHead>
                <TableHead className="data-table-header">Descrição</TableHead>
                <TableHead className="data-table-header">Empresa</TableHead>
                <TableHead className="data-table-header">Motorista</TableHead>
                <TableHead className="data-table-header">Capacidade</TableHead>
                <TableHead className="data-table-header">Chegada</TableHead>
                <TableHead className="data-table-header">Saída</TableHead>
                <TableHead className="data-table-header text-right">Viagens</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pipasData.map((row, idx) => (
                <TableRow key={idx} className="data-table-row">
                  <TableCell className="font-medium">{row.data}</TableCell>
                  <TableCell className="font-semibold text-info">{row.prefixo}</TableCell>
                  <TableCell>{row.descricao}</TableCell>
                  <TableCell>{row.empresa}</TableCell>
                  <TableCell>{row.motorista}</TableCell>
                  <TableCell>
                    <span className="status-badge bg-info/10 text-info">{row.capacidade}</span>
                  </TableCell>
                  <TableCell>{row.horaChegada}</TableCell>
                  <TableCell>{row.horaSaida}</TableCell>
                  <TableCell className="text-right font-semibold">{row.nViagens}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
