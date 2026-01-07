import { Users, Plus, Filter, Settings, Shield } from "lucide-react";
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

const colaboradoresData = [
  {
    nome: "Jean",
    sobrenome: "Campos",
    email: "jean.campos@apropriapp.com",
    perfil: "Administrador Principal",
    status: "ativo",
  },
  {
    nome: "Maria",
    sobrenome: "Santos",
    email: "maria.santos@obra.com",
    perfil: "Administrador",
    status: "ativo",
  },
  {
    nome: "Carlos",
    sobrenome: "Silva",
    email: "carlos.silva@obra.com",
    perfil: "Colaborador",
    status: "ativo",
  },
  {
    nome: "João",
    sobrenome: "Pedro",
    email: "joao.pedro@obra.com",
    perfil: "Colaborador",
    status: "ativo",
  },
  {
    nome: "Ana",
    sobrenome: "Costa",
    email: "ana.costa@obra.com",
    perfil: "Visualização",
    status: "inativo",
  },
];

const perfilConfig = {
  "Administrador Principal": { className: "bg-accent/10 text-accent", icon: Shield },
  Administrador: { className: "bg-primary/10 text-primary", icon: Shield },
  Colaborador: { className: "bg-success/10 text-success", icon: Users },
  Visualização: { className: "bg-muted text-muted-foreground", icon: Users },
};

const statusConfig = {
  ativo: { label: "Ativo", className: "status-active" },
  inativo: { label: "Inativo", className: "status-inactive" },
};

export default function Colaboradores() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="page-header mb-0">
          <h1 className="page-title flex items-center gap-2">
            <Users className="h-6 w-6 text-accent" />
            Colaboradores
          </h1>
          <p className="page-subtitle">
            Gestão de usuários e permissões do sistema
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            Filtros
          </Button>
          <Button size="sm" className="gap-2 bg-gradient-accent text-accent-foreground hover:opacity-90">
            <Plus className="h-4 w-4" />
            Novo Colaborador
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2">
          <div className="h-2 w-2 rounded-full bg-success" />
          <span className="text-sm font-medium">4 Ativos</span>
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
                <TableHead className="data-table-header">Colaborador</TableHead>
                <TableHead className="data-table-header">Email</TableHead>
                <TableHead className="data-table-header">Perfil</TableHead>
                <TableHead className="data-table-header">Status</TableHead>
                <TableHead className="data-table-header w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {colaboradoresData.map((row, idx) => {
                const initials = `${row.nome[0]}${row.sobrenome[0]}`;
                const perfil = perfilConfig[row.perfil as keyof typeof perfilConfig];

                return (
                  <TableRow key={idx} className="data-table-row">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-primary text-primary-foreground text-sm">
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
                    <TableCell>
                      <span className={`status-badge ${perfil.className}`}>
                        {row.perfil}
                      </span>
                    </TableCell>
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
