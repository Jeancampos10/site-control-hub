import { useState } from "react";
import { Users, Plus, Filter, Settings, Shield, MessageCircle } from "lucide-react";
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
import { EditDialog, FormField } from "@/components/shared/EditDialog";
import { toast } from "sonner";

interface ColaboradorData {
  nome: string;
  sobrenome: string;
  email: string;
  telefone: string;
  perfil: string;
  status: string;
}

const initialColaboradores: ColaboradorData[] = [
  {
    nome: "Jean",
    sobrenome: "Campos",
    email: "jean.campos@apropriapp.com",
    telefone: "(11) 99999-0001",
    perfil: "Administrador Principal",
    status: "ativo",
  },
  {
    nome: "Maria",
    sobrenome: "Santos",
    email: "maria.santos@obra.com",
    telefone: "(11) 99999-0002",
    perfil: "Administrador",
    status: "ativo",
  },
  {
    nome: "Carlos",
    sobrenome: "Silva",
    email: "carlos.silva@obra.com",
    telefone: "(11) 99999-0003",
    perfil: "Colaborador",
    status: "ativo",
  },
  {
    nome: "João",
    sobrenome: "Pedro",
    email: "joao.pedro@obra.com",
    telefone: "(11) 99999-0004",
    perfil: "Colaborador",
    status: "ativo",
  },
  {
    nome: "Ana",
    sobrenome: "Costa",
    email: "ana.costa@obra.com",
    telefone: "(11) 99999-0005",
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

const colaboradorFields: FormField[] = [
  { key: "nome", label: "Nome", required: true },
  { key: "sobrenome", label: "Sobrenome", required: true },
  { key: "email", label: "Email", type: "email", required: true },
  { key: "telefone", label: "Telefone" },
  { key: "perfil", label: "Perfil", required: true },
  { key: "status", label: "Status", required: true },
];

export default function Colaboradores() {
  const [colaboradores, setColaboradores] = useState<ColaboradorData[]>(initialColaboradores);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Record<string, string> | null>(null);
  const [isNew, setIsNew] = useState(false);

  const handleEdit = (colaborador: ColaboradorData) => {
    setEditingItem({
      nome: colaborador.nome,
      sobrenome: colaborador.sobrenome,
      email: colaborador.email,
      telefone: colaborador.telefone,
      perfil: colaborador.perfil,
      status: colaborador.status,
    });
    setIsNew(false);
    setDialogOpen(true);
  };

  const handleNew = () => {
    setEditingItem({
      nome: "",
      sobrenome: "",
      email: "",
      telefone: "",
      perfil: "Colaborador",
      status: "ativo",
    });
    setIsNew(true);
    setDialogOpen(true);
  };

  const handleSave = (data: Record<string, string>) => {
    if (isNew) {
      setColaboradores(prev => [...prev, data as unknown as ColaboradorData]);
    } else {
      setColaboradores(prev => 
        prev.map(c => c.email === editingItem?.email ? data as unknown as ColaboradorData : c)
      );
    }
  };

  const handleDelete = (data: Record<string, string>) => {
    setColaboradores(prev => prev.filter(c => c.email !== data.email));
  };

  const handleWhatsApp = (telefone: string, nome: string) => {
    const phone = telefone.replace(/\D/g, '');
    const message = encodeURIComponent(`Olá ${nome}, tudo bem?`);
    window.open(`https://wa.me/55${phone}?text=${message}`, '_blank');
    toast.success(`Abrindo WhatsApp para ${nome}`);
  };

  const activeCount = colaboradores.filter(c => c.status === 'ativo').length;
  const inactiveCount = colaboradores.filter(c => c.status === 'inativo').length;

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
          <Button 
            size="sm" 
            className="gap-2 bg-gradient-accent text-accent-foreground hover:opacity-90"
            onClick={handleNew}
          >
            <Plus className="h-4 w-4" />
            Novo Colaborador
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2">
          <div className="h-2 w-2 rounded-full bg-success" />
          <span className="text-sm font-medium">{activeCount} Ativos</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
          <div className="h-2 w-2 rounded-full bg-muted-foreground" />
          <span className="text-sm font-medium">{inactiveCount} Inativos</span>
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
                <TableHead className="data-table-header">Telefone</TableHead>
                <TableHead className="data-table-header">Perfil</TableHead>
                <TableHead className="data-table-header">Status</TableHead>
                <TableHead className="data-table-header w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {colaboradores.map((row, idx) => {
                const initials = `${row.nome[0]}${row.sobrenome[0]}`;
                const perfil = perfilConfig[row.perfil as keyof typeof perfilConfig] || perfilConfig.Colaborador;

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
                    <TableCell className="text-muted-foreground">{row.telefone}</TableCell>
                    <TableCell>
                      <span className={`status-badge ${perfil.className}`}>
                        {row.perfil}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={statusConfig[row.status as keyof typeof statusConfig]?.className || ''}>
                        {statusConfig[row.status as keyof typeof statusConfig]?.label || row.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => handleWhatsApp(row.telefone, row.nome)}
                        >
                          <MessageCircle className="h-4 w-4 text-success" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => handleEdit(row)}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Edit Dialog */}
      <EditDialog
        title="Colaborador"
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        data={editingItem}
        fields={colaboradorFields}
        onSave={handleSave}
        onDelete={handleDelete}
        isNew={isNew}
      />
    </div>
  );
}
