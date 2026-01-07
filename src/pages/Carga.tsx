import { Upload, Plus, Filter, Download } from "lucide-react";
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

const cargaData = [
  {
    data: "07/01/2026",
    hora: "08:15",
    prefixoEq: "EX-001",
    descricaoEq: "Escavadeira CAT 320",
    empresaEq: "Terraplan LTDA",
    operador: "José Silva",
    prefixoCb: "CB-012",
    descricaoCb: "Volvo FMX 8x4",
    empresaCb: "TransLog",
    motorista: "Carlos Souza",
    volume: 12,
    nViagens: 3,
    volumeTotal: 36,
    local: "Trecho Norte",
    estaca: "145-150",
    material: "Rachão",
    usuario: "Maria Santos",
  },
  {
    data: "07/01/2026",
    hora: "08:32",
    prefixoEq: "EX-003",
    descricaoEq: "Escavadeira Komatsu PC360",
    empresaEq: "Terraplan LTDA",
    operador: "Pedro Alves",
    prefixoCb: "CB-015",
    descricaoCb: "Scania R500",
    empresaCb: "Logística Norte",
    motorista: "Roberto Lima",
    volume: 15,
    nViagens: 2,
    volumeTotal: 30,
    local: "Aterro Central",
    estaca: "180-185",
    material: "Bota-fora",
    usuario: "João Pedro",
  },
  {
    data: "07/01/2026",
    hora: "08:48",
    prefixoEq: "EX-002",
    descricaoEq: "Escavadeira CAT 336",
    empresaEq: "MaqPesada SA",
    operador: "Antonio Costa",
    prefixoCb: "CB-008",
    descricaoCb: "Mercedes Actros",
    empresaCb: "TransLog",
    motorista: "Fernando Dias",
    volume: 10,
    nViagens: 4,
    volumeTotal: 40,
    local: "Estaca 120-150",
    estaca: "125-130",
    material: "Argila",
    usuario: "Carlos Silva",
  },
  {
    data: "07/01/2026",
    hora: "09:05",
    prefixoEq: "EX-001",
    descricaoEq: "Escavadeira CAT 320",
    empresaEq: "Terraplan LTDA",
    operador: "José Silva",
    prefixoCb: "CB-020",
    descricaoCb: "Volvo FH 540",
    empresaCb: "Logística Norte",
    motorista: "Marcos Oliveira",
    volume: 12,
    nViagens: 2,
    volumeTotal: 24,
    local: "Trecho Norte",
    estaca: "150-155",
    material: "Rachão",
    usuario: "Maria Santos",
  },
];

export default function Carga() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="page-header mb-0">
          <h1 className="page-title flex items-center gap-2">
            <Upload className="h-6 w-6 text-success" />
            Registro de Carga
          </h1>
          <p className="page-subtitle">
            Acompanhamento de carregamentos por escavadeira
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
            Nova Carga
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Cargas Hoje"
          value="156"
          subtitle="Registros"
          icon={Activity}
          variant="accent"
        />
        <KPICard
          title="Volume Total"
          value="2.340 m³"
          subtitle="Carregado"
          icon={Box}
          variant="primary"
        />
        <KPICard
          title="Escavadeiras"
          value="5"
          subtitle="Em operação"
          icon={Upload}
          variant="success"
        />
        <KPICard
          title="Caminhões"
          value="18"
          subtitle="Carregados"
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
                <TableHead className="data-table-header">Escavadeira</TableHead>
                <TableHead className="data-table-header">Operador</TableHead>
                <TableHead className="data-table-header">Caminhão</TableHead>
                <TableHead className="data-table-header">Motorista</TableHead>
                <TableHead className="data-table-header text-right">Vol. Unit.</TableHead>
                <TableHead className="data-table-header text-right">Viagens</TableHead>
                <TableHead className="data-table-header text-right">Vol. Total</TableHead>
                <TableHead className="data-table-header">Local</TableHead>
                <TableHead className="data-table-header">Material</TableHead>
                <TableHead className="data-table-header">Apontador</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cargaData.map((row, idx) => (
                <TableRow key={idx} className="data-table-row">
                  <TableCell className="font-medium">{row.data}</TableCell>
                  <TableCell>{row.hora}</TableCell>
                  <TableCell>
                    <div>
                      <span className="font-medium">{row.prefixoEq}</span>
                      <p className="text-xs text-muted-foreground">{row.descricaoEq}</p>
                    </div>
                  </TableCell>
                  <TableCell>{row.operador}</TableCell>
                  <TableCell>
                    <div>
                      <span className="font-medium">{row.prefixoCb}</span>
                      <p className="text-xs text-muted-foreground">{row.descricaoCb}</p>
                    </div>
                  </TableCell>
                  <TableCell>{row.motorista}</TableCell>
                  <TableCell className="text-right">{row.volume} m³</TableCell>
                  <TableCell className="text-right">{row.nViagens}</TableCell>
                  <TableCell className="text-right font-semibold">{row.volumeTotal} m³</TableCell>
                  <TableCell>
                    <span className="status-badge bg-primary/10 text-primary">{row.local}</span>
                  </TableCell>
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
