import { useState, useEffect } from "react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EditDialog, FormField } from "@/components/shared/EditDialog";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface ColaboradorData {
  id: string;
  nome: string;
  sobrenome: string;
  email: string;
  telefone: string;
  whatsapp: string;
  foto_url: string | null;
  role: string;
}

const perfilConfig = {
  admin_principal: { label: "Administrador Principal", className: "bg-accent/10 text-accent", icon: Shield },
  admin: { label: "Administrador", className: "bg-primary/10 text-primary", icon: Shield },
  colaborador: { label: "Colaborador", className: "bg-success/10 text-success", icon: Users },
  visualizacao: { label: "Visualização", className: "bg-muted text-muted-foreground", icon: Users },
};

const colaboradorFields: FormField[] = [
  { key: "nome", label: "Nome", required: true },
  { key: "sobrenome", label: "Sobrenome", required: true },
  { key: "email", label: "Email", type: "email", required: true },
  { key: "telefone", label: "Telefone", type: "tel" },
  { key: "whatsapp", label: "WhatsApp", type: "tel" },
];

export default function Colaboradores() {
  const { user, isAdmin, isAdminPrincipal } = useAuth();
  const [colaboradores, setColaboradores] = useState<ColaboradorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Record<string, string> | null>(null);
  const [isNew, setIsNew] = useState(false);

  const fetchColaboradores = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      const rolesMap = new Map(roles?.map(r => [r.user_id, r.role]) || []);

      const colaboradoresData: ColaboradorData[] = (profiles || []).map(p => ({
        id: p.id,
        nome: p.nome,
        sobrenome: p.sobrenome,
        email: p.email,
        telefone: p.telefone || '',
        whatsapp: p.whatsapp || '',
        foto_url: p.foto_url,
        role: rolesMap.get(p.id) || 'colaborador',
      }));

      setColaboradores(colaboradoresData);
    } catch (error) {
      console.error('Error fetching colaboradores:', error);
      toast.error('Erro ao carregar colaboradores');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchColaboradores();
  }, []);

  const canEdit = (colaborador: ColaboradorData) => {
    // Admin principal can edit anyone
    if (isAdminPrincipal) return true;
    // Admins can edit colaboradores and visualização (but not other admins)
    if (isAdmin && (colaborador.role === 'colaborador' || colaborador.role === 'visualizacao')) return true;
    // Users can only edit themselves
    return colaborador.id === user?.id;
  };

  const handleEdit = (colaborador: ColaboradorData) => {
    if (!canEdit(colaborador)) {
      toast.error('Você não tem permissão para editar este colaborador');
      return;
    }
    
    setEditingItem({
      id: colaborador.id,
      nome: colaborador.nome,
      sobrenome: colaborador.sobrenome,
      email: colaborador.email,
      telefone: colaborador.telefone,
      whatsapp: colaborador.whatsapp,
      foto: colaborador.foto_url || '',
    });
    setIsNew(false);
    setDialogOpen(true);
  };

  const handleNew = () => {
    if (!isAdminPrincipal) {
      toast.error('Apenas o Administrador Principal pode criar novos colaboradores');
      return;
    }
    
    setEditingItem({
      nome: "",
      sobrenome: "",
      email: "",
      telefone: "",
      whatsapp: "",
      foto: "",
    });
    setIsNew(true);
    setDialogOpen(true);
  };

  const handleSave = async (data: Record<string, string>) => {
    try {
      if (isNew) {
        toast.info('Para criar novos colaboradores, eles devem se cadastrar no sistema.');
        setDialogOpen(false);
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          nome: data.nome,
          sobrenome: data.sobrenome,
          telefone: data.telefone || null,
          whatsapp: data.whatsapp || null,
          foto_url: data.foto || null,
        })
        .eq('id', data.id);

      if (error) throw error;

      toast.success('Colaborador atualizado com sucesso!');
      fetchColaboradores();
      setDialogOpen(false);
    } catch (error) {
      console.error('Error saving colaborador:', error);
      toast.error('Erro ao salvar colaborador');
    }
  };

  const handleDelete = async (data: Record<string, string>) => {
    if (!isAdminPrincipal) {
      toast.error('Apenas o Administrador Principal pode excluir colaboradores');
      return;
    }

    try {
      // Note: This will trigger cascade delete of profile and roles
      // In a real app, you might want to just deactivate instead of delete
      toast.error('Exclusão de usuários deve ser feita pelo administrador do sistema');
      setDialogOpen(false);
    } catch (error) {
      console.error('Error deleting colaborador:', error);
      toast.error('Erro ao excluir colaborador');
    }
  };

  const handleWhatsApp = (whatsapp: string, nome: string) => {
    if (!whatsapp) {
      toast.error('WhatsApp não cadastrado');
      return;
    }
    const phone = whatsapp.replace(/\D/g, '');
    const message = encodeURIComponent(`Olá ${nome}, tudo bem?`);
    window.open(`https://wa.me/55${phone}?text=${message}`, '_blank');
    toast.success(`Abrindo WhatsApp para ${nome}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

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
          {isAdminPrincipal && (
            <Button 
              size="sm" 
              className="gap-2 bg-gradient-accent text-accent-foreground hover:opacity-90"
              onClick={handleNew}
            >
              <Plus className="h-4 w-4" />
              Novo Colaborador
            </Button>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2">
          <div className="h-2 w-2 rounded-full bg-success" />
          <span className="text-sm font-medium">{colaboradores.length} Colaboradores</span>
        </div>
        {!isAdminPrincipal && !isAdmin && (
          <div className="flex items-center gap-2 rounded-lg bg-warning/10 px-3 py-2">
            <span className="text-sm text-warning">Você pode editar apenas seu próprio perfil</span>
          </div>
        )}
      </div>

      {/* Data Table */}
      <div className="chart-container overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="data-table-header">Colaborador</TableHead>
                <TableHead className="data-table-header">Email</TableHead>
                <TableHead className="data-table-header">WhatsApp</TableHead>
                <TableHead className="data-table-header">Perfil</TableHead>
                <TableHead className="data-table-header w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {colaboradores.map((row) => {
                const initials = `${row.nome?.[0] || ''}${row.sobrenome?.[0] || ''}`.toUpperCase();
                const perfil = perfilConfig[row.role as keyof typeof perfilConfig] || perfilConfig.colaborador;
                const canEditRow = canEdit(row);
                const isCurrentUser = row.id === user?.id;

                return (
                  <TableRow key={row.id} className={`data-table-row ${isCurrentUser ? 'bg-accent/5' : ''}`}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          {row.foto_url && <AvatarImage src={row.foto_url} alt={row.nome} />}
                          <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {row.nome} {row.sobrenome}
                            {isCurrentUser && (
                              <span className="ml-2 text-xs text-accent">(você)</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{row.email}</TableCell>
                    <TableCell className="text-muted-foreground">{row.whatsapp || '-'}</TableCell>
                    <TableCell>
                      <span className={`status-badge ${perfil.className}`}>
                        {perfil.label}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {row.whatsapp && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => handleWhatsApp(row.whatsapp, row.nome)}
                          >
                            <MessageCircle className="h-4 w-4 text-success" />
                          </Button>
                        )}
                        {canEditRow && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => handleEdit(row)}
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {colaboradores.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhum colaborador cadastrado
                  </TableCell>
                </TableRow>
              )}
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
        onDelete={isAdminPrincipal ? handleDelete : undefined}
        isNew={isNew}
        showPhoto={true}
      />
    </div>
  );
}
