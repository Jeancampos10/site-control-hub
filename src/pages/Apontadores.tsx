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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const apontadoresData = [
  {
    matricula: "APT-001",
    nome: "Maria",
    sobrenome: "Santos",
    email: "maria.santos@obra.com",
    status: "ativo",
    registrosHoje: 45,
  },
  {
    matricula: "APT-002",
    nome: "Carlos",
    sobrenome: "Silva",
    email: "carlos.silva@obra.com",
    status: "ativo",
    registrosHoje: 38,
  },
  {
    matricula: "APT-003",
    nome: "João",
    sobrenome: "Pedro",
    email: "joao.pedro@obra.com",
    status: "ativo",
    registrosHoje: 52,
  },
  {
    matricula: "APT-004",
    nome: "Ana",
    sobrenome: "Oliveira",
    email: "ana.oliveira@obra.com",
    status: "inativo",
    registrosHoje: 0,
  },
];

const statusConfig = {
  ativo: { label: "Ativo", className: "status-active" },
  inativo: { label: "Inativo", className: "status-inactive" },
};

export default function Apontadores() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="page-header mb-0">
          <h1 className="page-title flex items-center gap-2">
            <HardHat className="h-6 w-6 text-accent" />
            Apontadores
          </h1>
          <p className="page-subtitle">
            Cadastro e gestão de apontadores de campo
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            Filtros
          </Button>
          <Button size="sm" className="gap-2 bg-gradient-accent text-accent-foreground hover:opacity-90">
            <Plus className="h-4 w-4" />
            Novo Apontador
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
        <div className="ml-auto flex items-center gap-2 rounded-lg bg-accent/10 px-3 py-2">
          <span className="text-sm font-medium text-accent">135 registros hoje</span>
        </div>
      </div>

      {/* Data Table */}
      <div className="chart-container overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="data-table-header">Matrícula</TableHead>
                <TableHead className="data-table-header">Apontador</TableHead>
                <TableHead className="data-table-header">Email</TableHead>
                <TableHead className="data-table-header text-right">Registros Hoje</TableHead>
                <TableHead className="data-table-header">Status</TableHead>
                <TableHead className="data-table-header w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apontadoresData.map((row, idx) => {
                const initials = `${row.nome[0]}${row.sobrenome[0]}`;

                return (
                  <TableRow key={idx} className="data-table-row">
                    <TableCell className="font-semibold text-primary">{row.matricula}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-accent text-accent-foreground text-sm">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {row.nome} {row.sobrenome}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{row.email}</TableCell>
                    <TableCell className="text-right font-medium">{row.registrosHoje}</TableCell>
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
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
