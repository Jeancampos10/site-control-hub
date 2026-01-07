import { Download, Plus, Filter, FileDown } from "lucide-react";
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
import { Box, Truck, Activity } from "lucide-react";

const descargaData = [
  {
    data: "07/01/2026",
    hora: "08:45",
    prefixoCb: "CB-012",
    empresaCb: "TransLog",
    motorista: "Carlos Souza",
    volume: 12,
    nViagens: 3,
    volumeTotal: 36,
    local: "Aterro Central",
    estaca: "180-185",
    material: "Rachão",
    usuario: "João Pedro",
  },
  {
    data: "07/01/2026",
    hora: "09:02",
    prefixoCb: "CB-015",
    empresaCb: "Logística Norte",
    motorista: "Roberto Lima",
    volume: 15,
    nViagens: 2,
    volumeTotal: 30,
    local: "Trecho Norte",
    estaca: "145-150",
    material: "Bota-fora",
    usuario: "Maria Santos",
  },
  {
    data: "07/01/2026",
    hora: "09:18",
    prefixoCb: "CB-008",
    empresaCb: "TransLog",
    motorista: "Fernando Dias",
    volume: 10,
    nViagens: 4,
    volumeTotal: 40,
    local: "Estaca 120-150",
    estaca: "135-140",
    material: "Argila",
    usuario: "Carlos Silva",
  },
  {
    data: "07/01/2026",
    hora: "09:35",
    prefixoCb: "CB-020",
    empresaCb: "Logística Norte",
    motorista: "Marcos Oliveira",
    volume: 12,
    nViagens: 2,
    volumeTotal: 24,
    local: "Aterro Central",
    estaca: "185-190",
    material: "Rachão",
    usuario: "João Pedro",
  },
];

export default function Descarga() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="page-header mb-0">
          <h1 className="page-title flex items-center gap-2">
            <Download className="h-6 w-6 text-info" />
            Registro de Descarga
          </h1>
          <p className="page-subtitle">
            Acompanhamento de descargas por caminhão e local
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            Filtros
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <FileDown className="h-4 w-4" />
            Exportar
          </Button>
          <Button size="sm" className="gap-2 bg-gradient-accent text-accent-foreground hover:opacity-90">
            <Plus className="h-4 w-4" />
            Nova Descarga
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Descargas Hoje"
          value="142"
          subtitle="Registros"
          icon={Activity}
          variant="accent"
        />
        <KPICard
          title="Volume Total"
          value="2.180 m³"
          subtitle="Descarregado"
          icon={Box}
          variant="primary"
        />
        <KPICard
          title="Locais Ativos"
          value="3"
          subtitle="Recebendo material"
          icon={Download}
          variant="success"
        />
        <KPICard
          title="Caminhões"
          value="18"
          subtitle="Operando"
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
                <TableHead className="data-table-header">Caminhão</TableHead>
                <TableHead className="data-table-header">Empresa</TableHead>
                <TableHead className="data-table-header">Motorista</TableHead>
                <TableHead className="data-table-header text-right">Vol. Unit.</TableHead>
                <TableHead className="data-table-header text-right">Viagens</TableHead>
                <TableHead className="data-table-header text-right">Vol. Total</TableHead>
                <TableHead className="data-table-header">Local</TableHead>
                <TableHead className="data-table-header">Estaca</TableHead>
                <TableHead className="data-table-header">Material</TableHead>
                <TableHead className="data-table-header">Apontador</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {descargaData.map((row, idx) => (
                <TableRow key={idx} className="data-table-row">
                  <TableCell className="font-medium">{row.data}</TableCell>
                  <TableCell>{row.hora}</TableCell>
                  <TableCell className="font-medium">{row.prefixoCb}</TableCell>
                  <TableCell>{row.empresaCb}</TableCell>
                  <TableCell>{row.motorista}</TableCell>
                  <TableCell className="text-right">{row.volume} m³</TableCell>
                  <TableCell className="text-right">{row.nViagens}</TableCell>
                  <TableCell className="text-right font-semibold">{row.volumeTotal} m³</TableCell>
                  <TableCell>
                    <span className="status-badge bg-primary/10 text-primary">{row.local}</span>
                  </TableCell>
                  <TableCell>{row.estaca}</TableCell>
                  <TableCell>
                    <span className="status-badge bg-accent/10 text-accent">{row.material}</span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{row.usuario}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
