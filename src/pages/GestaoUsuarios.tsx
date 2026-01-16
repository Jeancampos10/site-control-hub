import { useState, useEffect } from "react";
import { 
  Users, Shield, MessageCircle, Check, X, Clock, 
  Copy, ExternalLink, Smartphone, ChevronDown, ChevronUp,
  Mail, Phone, Settings2, Share2, QrCode
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuth, ModuloPermitido } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface UserData {
  id: string;
  nome: string;
  sobrenome: string;
  email: string;
  telefone: string;
  whatsapp: string;
  foto_url: string | null;
  role: string;
  approved: boolean;
  modulos_permitidos: ModuloPermitido[];
  created_at: string;
}

const roleConfig = {
  admin_principal: { label: "Administrador Principal", className: "bg-accent/10 text-accent", icon: Shield },
  admin: { label: "Sala Técnica", className: "bg-primary/10 text-primary", icon: Shield },
  colaborador: { label: "Apontador", className: "bg-success/10 text-success", icon: Users },
  visualizacao: { label: "Visualização", className: "bg-muted text-muted-foreground", icon: Users },
};

const modulosOptions: { id: ModuloPermitido; label: string }[] = [
  { id: 'apropriacao', label: 'Apropriação (Carga/Lançamento)' },
  { id: 'pedreira', label: 'Pedreira' },
  { id: 'pipas', label: 'Pipas' },
  { id: 'cal', label: 'Cal' },
];

export default function GestaoUsuarios() {
  const { user, isAdminPrincipal, isAdmin } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPending, setShowPending] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  
  // Form states for editing
  const [editRole, setEditRole] = useState<string>('colaborador');
  const [editModulos, setEditModulos] = useState<ModuloPermitido[]>([]);

  const mobileAppUrl = `${window.location.origin}/m`;

  const fetchUsers = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role, approved, modulos_permitidos');

      if (rolesError) throw rolesError;

      const rolesMap = new Map(roles?.map(r => [
        r.user_id, 
        { 
          role: r.role, 
          approved: r.approved,
          modulos_permitidos: (r as unknown as { modulos_permitidos?: ModuloPermitido[] }).modulos_permitidos || ['apropriacao', 'pedreira', 'pipas', 'cal']
        }
      ]) || []);

      const usersData: UserData[] = (profiles || []).map(p => {
        const roleInfo = rolesMap.get(p.id) || { 
          role: 'colaborador', 
          approved: false,
          modulos_permitidos: ['apropriacao', 'pedreira', 'pipas', 'cal'] as ModuloPermitido[]
        };
        return {
          id: p.id,
          nome: p.nome,
          sobrenome: p.sobrenome,
          email: p.email,
          telefone: p.telefone || '',
          whatsapp: p.whatsapp || '',
          foto_url: p.foto_url,
          role: roleInfo.role,
          approved: roleInfo.approved,
          modulos_permitidos: roleInfo.modulos_permitidos,
          created_at: p.created_at,
        };
      });

      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleApprove = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ 
          approved: true, 
          approved_at: new Date().toISOString(),
          approved_by: user?.id 
        })
        .eq('user_id', userId);

      if (error) throw error;

      toast.success('Usuário aprovado com sucesso!');
      fetchUsers();
    } catch (error) {
      console.error('Error approving user:', error);
      toast.error('Erro ao aprovar usuário');
    }
  };

  const handleReject = async (userId: string) => {
    if (!confirm('Tem certeza que deseja rejeitar e remover este usuário?')) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      toast.success('Usuário rejeitado e removido');
      fetchUsers();
    } catch (error) {
      console.error('Error rejecting user:', error);
      toast.error('Erro ao rejeitar usuário');
    }
  };

  const handleEditUser = (userData: UserData) => {
    setEditingUser(userData);
    setEditRole(userData.role);
    setEditModulos(userData.modulos_permitidos);
  };

  const handleSaveUserConfig = async () => {
    if (!editingUser) return;
    
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ 
          role: editRole as 'admin' | 'colaborador' | 'visualizacao',
          modulos_permitidos: editModulos
        })
        .eq('user_id', editingUser.id);

      if (error) throw error;

      toast.success('Configurações salvas com sucesso!');
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Erro ao salvar configurações');
    }
  };

  const handleToggleModulo = (modulo: ModuloPermitido) => {
    setEditModulos(prev => {
      if (prev.includes(modulo)) {
        return prev.filter(m => m !== modulo);
      }
      return [...prev, modulo];
    });
  };

  const handleWhatsApp = (whatsapp: string, nome: string) => {
    if (!whatsapp) {
      toast.error('WhatsApp não cadastrado');
      return;
    }
    const phone = whatsapp.replace(/\D/g, '');
    const message = encodeURIComponent(`Olá ${nome}! Acesse o App Mobile: ${mobileAppUrl}`);
    window.open(`https://wa.me/55${phone}?text=${message}`, '_blank');
  };

  const copyAppLink = async () => {
    try {
      await navigator.clipboard.writeText(mobileAppUrl);
      toast.success('Link copiado para a área de transferência!');
    } catch {
      toast.error('Erro ao copiar link');
    }
  };

  const shareViaWhatsApp = () => {
    const message = encodeURIComponent(`Acesse o App Mobile de Apontamentos:\n${mobileAppUrl}\n\nFaça seu cadastro e aguarde aprovação.`);
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdminPrincipal && !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <Shield className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-bold mb-2">Acesso Restrito</h2>
        <p className="text-muted-foreground">Apenas administradores podem acessar esta página.</p>
      </div>
    );
  }

  const approvedUsers = users.filter(u => u.approved);
  const pendingUsers = users.filter(u => !u.approved);
  const displayedUsers = showPending ? pendingUsers : approvedUsers;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="page-header mb-0">
          <h1 className="page-title flex items-center gap-2">
            <Users className="h-6 w-6 text-accent" />
            Gestão de Usuários
          </h1>
          <p className="page-subtitle">
            Aprovação, permissões e configuração de acesso
          </p>
        </div>
        <Button 
          onClick={() => setShareDialogOpen(true)}
          className="gap-2"
        >
          <Share2 className="h-4 w-4" />
          Compartilhar App
        </Button>
      </div>

      {/* App Mobile Link Card */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Smartphone className="h-5 w-5 text-primary" />
            Link do App Mobile
          </CardTitle>
          <CardDescription>
            Compartilhe este link com os apontadores para que acessem o app de campo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 flex items-center gap-2 bg-background rounded-lg px-4 py-3 border">
              <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <code className="text-sm flex-1 truncate">{mobileAppUrl}</code>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={copyAppLink} className="gap-2">
                <Copy className="h-4 w-4" />
                Copiar
              </Button>
              <Button variant="outline" size="sm" onClick={shareViaWhatsApp} className="gap-2 text-success border-success/30 hover:bg-success/10">
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="flex flex-wrap gap-4">
        <button
          onClick={() => setShowPending(false)}
          className={`flex items-center gap-2 rounded-lg px-4 py-3 transition-all cursor-pointer ${
            !showPending ? 'bg-success text-success-foreground ring-2 ring-success ring-offset-2' : 'bg-success/10 hover:bg-success/20'
          }`}
        >
          <Check className={`h-4 w-4 ${!showPending ? 'text-success-foreground' : 'text-success'}`} />
          <span className="font-medium">{approvedUsers.length} Aprovados</span>
        </button>

        {pendingUsers.length > 0 && (
          <button
            onClick={() => setShowPending(true)}
            className={`flex items-center gap-2 rounded-lg px-4 py-3 transition-all cursor-pointer animate-pulse ${
              showPending ? 'bg-warning text-warning-foreground ring-2 ring-warning ring-offset-2' : 'bg-warning/10 hover:bg-warning/20'
            }`}
          >
            <Clock className={`h-4 w-4 ${showPending ? 'text-warning-foreground' : 'text-warning'}`} />
            <span className="font-medium">{pendingUsers.length} Pendentes</span>
          </button>
        )}
      </div>

      {/* Pending Alert */}
      {pendingUsers.length > 0 && !showPending && (
        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-warning">
                <Clock className="h-5 w-5" />
                <div>
                  <p className="font-semibold">{pendingUsers.length} usuário(s) aguardando aprovação</p>
                  <p className="text-sm text-warning/80">Clique para revisar e aprovar</p>
                </div>
              </div>
              <Button variant="outline" onClick={() => setShowPending(true)}>
                Revisar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {showPending ? 'Usuários Pendentes' : 'Usuários Aprovados'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Perfil</TableHead>
                  <TableHead>Módulos</TableHead>
                  <TableHead className="w-[150px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedUsers.map((userData) => {
                  const initials = `${userData.nome?.[0] || ''}${userData.sobrenome?.[0] || ''}`.toUpperCase();
                  const perfil = roleConfig[userData.role as keyof typeof roleConfig] || roleConfig.colaborador;
                  const isCurrentUser = userData.id === user?.id;
                  const isPending = !userData.approved;
                  const isExpanded = expandedUserId === userData.id;

                  return (
                    <TableRow 
                      key={userData.id} 
                      className={`${isCurrentUser ? 'bg-accent/5' : ''} ${isPending ? 'bg-warning/5' : ''}`}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            {userData.foto_url && <AvatarImage src={userData.foto_url} alt={userData.nome} />}
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {userData.nome} {userData.sobrenome}
                              {isCurrentUser && <span className="ml-2 text-xs text-accent">(você)</span>}
                            </p>
                            <p className="text-sm text-muted-foreground">{userData.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {userData.whatsapp && (
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              <span>{userData.whatsapp}</span>
                            </div>
                          )}
                          {!userData.whatsapp && (
                            <span className="text-sm text-muted-foreground">Não informado</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`status-badge ${perfil.className}`}>
                          {perfil.label}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {userData.modulos_permitidos.map(m => (
                            <span key={m} className="text-xs bg-muted px-2 py-0.5 rounded capitalize">
                              {m}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {isPending && isAdminPrincipal ? (
                            <>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-success hover:text-success hover:bg-success/10"
                                onClick={() => handleApprove(userData.id)}
                                title="Aprovar"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => handleReject(userData.id)}
                                title="Rejeitar"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              {userData.whatsapp && (
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8"
                                  onClick={() => handleWhatsApp(userData.whatsapp, userData.nome)}
                                  title="Enviar link por WhatsApp"
                                >
                                  <MessageCircle className="h-4 w-4 text-success" />
                                </Button>
                              )}
                              {isAdminPrincipal && userData.role !== 'admin_principal' && (
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8"
                                  onClick={() => handleEditUser(userData)}
                                  title="Configurar permissões"
                                >
                                  <Settings2 className="h-4 w-4" />
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {displayedUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      {showPending ? 'Nenhum usuário pendente de aprovação' : 'Nenhum usuário aprovado'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Configurar Usuário</DialogTitle>
            <DialogDescription>
              Configure o perfil e os módulos permitidos para {editingUser?.nome}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* User Info */}
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <Avatar className="h-12 w-12">
                {editingUser?.foto_url && <AvatarImage src={editingUser.foto_url} />}
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {editingUser?.nome?.[0]}{editingUser?.sobrenome?.[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{editingUser?.nome} {editingUser?.sobrenome}</p>
                <p className="text-sm text-muted-foreground">{editingUser?.email}</p>
              </div>
            </div>

            {/* Role Select */}
            <div className="space-y-2">
              <Label>Perfil de Acesso</Label>
              <Select value={editRole} onValueChange={setEditRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Sala Técnica (Admin)</SelectItem>
                  <SelectItem value="colaborador">Apontador</SelectItem>
                  <SelectItem value="visualizacao">Visualização</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Modules Checkboxes */}
            <div className="space-y-3">
              <Label>Módulos Permitidos (App Mobile)</Label>
              <div className="space-y-2">
                {modulosOptions.map(modulo => (
                  <div key={modulo.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                    <Checkbox
                      id={modulo.id}
                      checked={editModulos.includes(modulo.id)}
                      onCheckedChange={() => handleToggleModulo(modulo.id)}
                    />
                    <Label htmlFor={modulo.id} className="font-normal cursor-pointer flex-1">
                      {modulo.label}
                    </Label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                O usuário só verá no App Mobile os módulos marcados acima.
              </p>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveUserConfig}>
              Salvar Configurações
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-primary" />
              Compartilhar App Mobile
            </DialogTitle>
            <DialogDescription>
              Envie o link do app para os apontadores de campo
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="p-4 bg-muted rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-2">Link de acesso:</p>
              <code className="text-lg font-mono">{mobileAppUrl}</code>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={copyAppLink} className="gap-2">
                <Copy className="h-4 w-4" />
                Copiar Link
              </Button>
              <Button onClick={shareViaWhatsApp} className="gap-2 bg-success text-success-foreground hover:bg-success/90">
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </Button>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm text-muted-foreground mb-3">
                <strong>Instruções para o usuário:</strong>
              </p>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Acesse o link acima no celular</li>
                <li>Clique em "Cadastrar" e preencha os dados</li>
                <li>Aguarde a aprovação do administrador</li>
                <li>Após aprovado, faça login e use o app</li>
              </ol>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
