import { HardHat, Plus, Filter, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const equipamentosData = [
  {
    prefixo: "EX-001",
    descricao: "Escavadeira CAT 320",
    operador: "José Silva",
    marca: "Caterpillar",
    potencia: "162 HP",
    empresa: "Terraplan LTDA",
    status: "ativo",
  },
  {
    prefixo: "EX-002",
    descricao: "Escavadeira CAT 336",
    operador: "Antonio Costa",
    marca: "Caterpillar",
    potencia: "311 HP",
    empresa: "MaqPesada SA",
    status: "ativo",
  },
  {
    prefixo: "EX-003",
    descricao: "Escavadeira Komatsu PC360",
    operador: "Pedro Alves",
    marca: "Komatsu",
    potencia: "257 HP",
    empresa: "Terraplan LTDA",
    status: "ativo",
  },
  {
    prefixo: "EX-004",
    descricao: "Escavadeira Volvo EC350",
    operador: "Ricardo Santos",
    marca: "Volvo",
    potencia: "268 HP",
    empresa: "MaqPesada SA",
    status: "manutencao",
  },
  {
    prefixo: "EX-005",
    descricao: "Escavadeira CAT 330",
    operador: "Marcelo Lima",
    marca: "Caterpillar",
    potencia: "272 HP",
    empresa: "Terraplan LTDA",
    status: "ativo",
  },
  {
    prefixo: "EX-006",
    descricao: "Escavadeira Hyundai R330",
    operador: "-",
    marca: "Hyundai",
    potencia: "244 HP",
    empresa: "MaqPesada SA",
    status: "inativo",
  },
];

const statusConfig = {
  ativo: { label: "Ativo", className: "status-active" },
  inativo: { label: "Inativo", className: "status-inactive" },
  manutencao: { label: "Manutenção", className: "status-warning" },
};

export default function Equipamentos() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="page-header mb-0">
          <h1 className="page-title flex items-center gap-2">
            <HardHat className="h-6 w-6 text-accent" />
            Equipamentos (Escavadeiras)
          </h1>
          <p className="page-subtitle">
            Cadastro e gestão de escavadeiras e equipamentos de carga
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            Filtros
          </Button>
          <Button size="sm" className="gap-2 bg-gradient-accent text-accent-foreground hover:opacity-90">
            <Plus className="h-4 w-4" />
            Novo Equipamento
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2">
          <div className="h-2 w-2 rounded-full bg-success" />
          <span className="text-sm font-medium">5 Ativos</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-warning/10 px-3 py-2">
          <div className="h-2 w-2 rounded-full bg-warning" />
          <span className="text-sm font-medium">1 Manutenção</span>
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
                <TableHead className="data-table-header">Operador</TableHead>
                <TableHead className="data-table-header">Marca</TableHead>
                <TableHead className="data-table-header">Potência</TableHead>
                <TableHead className="data-table-header">Empresa</TableHead>
                <TableHead className="data-table-header">Status</TableHead>
                <TableHead className="data-table-header w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {equipamentosData.map((row, idx) => (
                <TableRow key={idx} className="data-table-row">
                  <TableCell className="font-semibold text-primary">{row.prefixo}</TableCell>
                  <TableCell>{row.descricao}</TableCell>
                  <TableCell>{row.operador}</TableCell>
                  <TableCell>{row.marca}</TableCell>
                  <TableCell>{row.potencia}</TableCell>
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
