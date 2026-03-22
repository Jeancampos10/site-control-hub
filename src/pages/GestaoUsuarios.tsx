import { useState, useEffect } from "react";
import { 
  Users, Shield, MessageCircle, Check, X, Clock, 
  Copy, ExternalLink, Smartphone, 
  Mail, Phone, Settings2, Share2, Plus, Trash2, KeyRound, Pencil
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuth, ModuloPermitido } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

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
  admin: { label: "Gestor / Sala Técnica", className: "bg-primary/10 text-primary", icon: Shield },
  colaborador: { label: "Operador de Campo", className: "bg-success/10 text-success", icon: Users },
  visualizacao: { label: "Somente Visualização", className: "bg-muted text-muted-foreground", icon: Users },
};

const modulosOptions: { id: ModuloPermitido; label: string }[] = [
  { id: 'apropriacao', label: 'Frota / Equipamentos' },
  { id: 'pedreira', label: 'Abastecimentos / Estoque' },
  { id: 'pipas', label: 'Horímetros / Manutenção' },
  { id: 'cal', label: 'Checklist / Relatórios' },
];

export default function GestaoUsuarios() {
  const { user, isAdminPrincipal, isAdmin } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPending, setShowPending] = useState(false);
  
  // Edit user dialog
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [editRole, setEditRole] = useState<string>('colaborador');
  const [editModulos, setEditModulos] = useState<ModuloPermitido[]>([]);
  
  // Create user dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ nome: '', sobrenome: '', email: '', password: '', whatsapp: '', tipoUsuario: 'colaborador' });
  const [creating, setCreating] = useState(false);
  
  // Change password dialog
  const [passwordUser, setPasswordUser] = useState<UserData | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  
  // Share dialog
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  
  // Delete confirm
  const [deletingUser, setDeletingUser] = useState<UserData | null>(null);

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

  useEffect(() => { fetchUsers(); }, []);

  // ---- APPROVE / REJECT ----
  const handleApprove = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ approved: true, approved_at: new Date().toISOString(), approved_by: user?.id })
        .eq('user_id', userId);
      if (error) throw error;
      toast.success('Usuário aprovado!');
      fetchUsers();
    } catch { toast.error('Erro ao aprovar usuário'); }
  };

  const handleReject = async (userId: string) => {
    if (!confirm('Rejeitar e remover este usuário?')) return;
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', userId);
      if (error) throw error;
      toast.success('Usuário rejeitado');
      fetchUsers();
    } catch { toast.error('Erro ao rejeitar'); }
  };

  // ---- EDIT ROLE / MODULES ----
  const handleEditUser = (u: UserData) => {
    setEditingUser(u);
    setEditRole(u.role);
    setEditModulos(u.modulos_permitidos);
  };

  const handleSaveUserConfig = async () => {
    if (!editingUser) return;
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: editRole as any, modulos_permitidos: editModulos })
        .eq('user_id', editingUser.id);
      if (error) throw error;
      toast.success('Permissões atualizadas!');
      setEditingUser(null);
      fetchUsers();
    } catch { toast.error('Erro ao salvar'); }
  };

  // ---- CREATE USER ----
  const handleCreateUser = async () => {
    if (!createForm.nome || !createForm.email || !createForm.password) {
      toast.error('Preencha nome, email e senha');
      return;
    }
    if (createForm.password.length < 6) {
      toast.error('Senha deve ter no mínimo 6 caracteres');
      return;
    }
    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          nome: createForm.nome,
          sobrenome: createForm.sobrenome,
          email: createForm.email,
          password: createForm.password,
          whatsapp: createForm.whatsapp,
          tipoUsuario: createForm.tipoUsuario === 'admin' ? 'Sala Técnica' : 'Apontador',
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success('Usuário criado com sucesso!');
      setCreateDialogOpen(false);
      setCreateForm({ nome: '', sobrenome: '', email: '', password: '', whatsapp: '', tipoUsuario: 'colaborador' });
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao criar usuário');
    } finally {
      setCreating(false);
    }
  };

  // ---- CHANGE PASSWORD ----
  const handleChangePassword = async () => {
    if (!passwordUser || newPassword.length < 6) {
      toast.error('Senha deve ter no mínimo 6 caracteres');
      return;
    }
    setChangingPassword(true);
    try {
      // Use edge function to change password via admin API
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          action: 'change-password',
          userId: passwordUser.id,
          password: newPassword,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success('Senha alterada com sucesso!');
      setPasswordUser(null);
      setNewPassword('');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao alterar senha');
    } finally {
      setChangingPassword(false);
    }
  };

  // ---- DELETE USER ----
  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    try {
      // Delete profile (cascade will handle user_roles)
      const { error } = await supabase.from('profiles').delete().eq('id', deletingUser.id);
      if (error) throw error;
      toast.success('Usuário excluído!');
      setDeletingUser(null);
      fetchUsers();
    } catch { toast.error('Erro ao excluir usuário'); }
  };

  // ---- WHATSAPP ----
  const handleWhatsApp = (whatsapp: string, nome: string) => {
    if (!whatsapp) { toast.error('WhatsApp não cadastrado'); return; }
    const phone = whatsapp.replace(/\D/g, '');
    const message = encodeURIComponent(`Olá ${nome}! Acesse o Abastech: ${mobileAppUrl}`);
    window.open(`https://wa.me/55${phone}?text=${message}`, '_blank');
  };

  const copyAppLink = async () => {
    try { await navigator.clipboard.writeText(mobileAppUrl); toast.success('Link copiado!'); } 
    catch { toast.error('Erro ao copiar'); }
  };

  const shareViaWhatsApp = () => {
    const message = encodeURIComponent(`Acesse o Abastech:\n${mobileAppUrl}\n\nFaça seu login e use o app.`);
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
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
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="page-header mb-0">
          <h1 className="page-title flex items-center gap-2">
            <Users className="h-6 w-6 text-accent" />
            Gestão de Usuários
          </h1>
          <p className="page-subtitle">Cadastro, permissões e controle de acesso</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShareDialogOpen(true)} className="gap-2">
            <Share2 className="h-4 w-4" /> Compartilhar
          </Button>
          {isAdminPrincipal && (
            <Button onClick={() => setCreateDialogOpen(true)} className="gap-2 bg-gradient-accent text-accent-foreground hover:opacity-90">
              <Plus className="h-4 w-4" /> Novo Usuário
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Link */}
      <Card className="border-accent/20 bg-gradient-to-r from-accent/5 to-transparent">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Smartphone className="h-5 w-5 text-accent" />
            Link do App Mobile
          </CardTitle>
          <CardDescription>Compartilhe este link para acesso ao app de campo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 flex items-center gap-2 bg-background rounded-lg px-4 py-3 border">
              <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <code className="text-sm flex-1 truncate">{mobileAppUrl}</code>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={copyAppLink} className="gap-2">
                <Copy className="h-4 w-4" /> Copiar
              </Button>
              <Button variant="outline" size="sm" onClick={shareViaWhatsApp} className="gap-2 text-success border-success/30 hover:bg-success/10">
                <MessageCircle className="h-4 w-4" /> WhatsApp
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
                  <TableHead className="w-[200px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedUsers.map((userData) => {
                  const initials = `${userData.nome?.[0] || ''}${userData.sobrenome?.[0] || ''}`.toUpperCase();
                  const perfil = roleConfig[userData.role as keyof typeof roleConfig] || roleConfig.colaborador;
                  const isCurrentUser = userData.id === user?.id;
                  const isPending = !userData.approved;

                  return (
                    <TableRow key={userData.id} className={`${isCurrentUser ? 'bg-accent/5' : ''} ${isPending ? 'bg-warning/5' : ''}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            {userData.foto_url && <AvatarImage src={userData.foto_url} alt={userData.nome} />}
                            <AvatarFallback className="bg-accent text-accent-foreground">{initials}</AvatarFallback>
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
                        {userData.whatsapp ? (
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            <span>{userData.whatsapp}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Não informado</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={`status-badge ${perfil.className}`}>{perfil.label}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {userData.modulos_permitidos.map(m => (
                            <span key={m} className="text-xs bg-muted px-2 py-0.5 rounded capitalize">{m}</span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {isPending && isAdminPrincipal ? (
                            <>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-success hover:bg-success/10" onClick={() => handleApprove(userData.id)} title="Aprovar">
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleReject(userData.id)} title="Rejeitar">
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              {userData.whatsapp && (
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleWhatsApp(userData.whatsapp, userData.nome)} title="WhatsApp">
                                  <MessageCircle className="h-4 w-4 text-success" />
                                </Button>
                              )}
                              {isAdminPrincipal && userData.role !== 'admin_principal' && (
                                <>
                                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditUser(userData)} title="Permissões">
                                    <Settings2 className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setPasswordUser(userData); setNewPassword(''); }} title="Alterar senha">
                                    <KeyRound className="h-4 w-4 text-warning" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => setDeletingUser(userData)} title="Excluir">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </>
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
                      {showPending ? 'Nenhum usuário pendente' : 'Nenhum usuário aprovado'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ===== CREATE USER DIALOG ===== */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Plus className="h-5 w-5 text-accent" /> Novo Usuário</DialogTitle>
            <DialogDescription>Crie um login para o novo usuário</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Nome *</Label>
                <Input value={createForm.nome} onChange={e => setCreateForm(p => ({...p, nome: e.target.value}))} />
              </div>
              <div className="space-y-1">
                <Label>Sobrenome</Label>
                <Input value={createForm.sobrenome} onChange={e => setCreateForm(p => ({...p, sobrenome: e.target.value}))} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Email *</Label>
              <Input type="email" value={createForm.email} onChange={e => setCreateForm(p => ({...p, email: e.target.value}))} />
            </div>
            <div className="space-y-1">
              <Label>Senha *</Label>
              <Input type="password" value={createForm.password} onChange={e => setCreateForm(p => ({...p, password: e.target.value}))} placeholder="Mínimo 6 caracteres" />
            </div>
            <div className="space-y-1">
              <Label>WhatsApp</Label>
              <Input value={createForm.whatsapp} onChange={e => setCreateForm(p => ({...p, whatsapp: e.target.value}))} placeholder="(00) 00000-0000" />
            </div>
            <div className="space-y-1">
              <Label>Perfil de Acesso</Label>
              <Select value={createForm.tipoUsuario} onValueChange={v => setCreateForm(p => ({...p, tipoUsuario: v}))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Sala Técnica (Admin)</SelectItem>
                  <SelectItem value="colaborador">Apontador</SelectItem>
                  <SelectItem value="visualizacao">Visualização</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateUser} disabled={creating} className="bg-gradient-accent text-accent-foreground">
              {creating ? 'Criando...' : 'Criar Usuário'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ===== EDIT PERMISSIONS DIALOG ===== */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Configurar Usuário</DialogTitle>
            <DialogDescription>Perfil e módulos de {editingUser?.nome}</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <Avatar className="h-12 w-12">
                {editingUser?.foto_url && <AvatarImage src={editingUser.foto_url} />}
                <AvatarFallback className="bg-accent text-accent-foreground">
                  {editingUser?.nome?.[0]}{editingUser?.sobrenome?.[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{editingUser?.nome} {editingUser?.sobrenome}</p>
                <p className="text-sm text-muted-foreground">{editingUser?.email}</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Perfil de Acesso</Label>
              <Select value={editRole} onValueChange={setEditRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Sala Técnica (Admin)</SelectItem>
                  <SelectItem value="colaborador">Apontador</SelectItem>
                  <SelectItem value="visualizacao">Visualização</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <Label>Módulos Permitidos</Label>
              <div className="space-y-2">
                {modulosOptions.map(modulo => (
                  <div key={modulo.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                    <Checkbox
                      id={modulo.id}
                      checked={editModulos.includes(modulo.id)}
                      onCheckedChange={() => {
                        setEditModulos(prev => prev.includes(modulo.id) ? prev.filter(m => m !== modulo.id) : [...prev, modulo.id]);
                      }}
                    />
                    <Label htmlFor={modulo.id} className="font-normal cursor-pointer flex-1">{modulo.label}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setEditingUser(null)}>Cancelar</Button>
            <Button onClick={handleSaveUserConfig}>Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ===== CHANGE PASSWORD DIALOG ===== */}
      <Dialog open={!!passwordUser} onOpenChange={() => setPasswordUser(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5 text-warning" /> Alterar Senha</DialogTitle>
            <DialogDescription>Nova senha para {passwordUser?.nome} {passwordUser?.sobrenome}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Nova Senha</Label>
              <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setPasswordUser(null)}>Cancelar</Button>
            <Button onClick={handleChangePassword} disabled={changingPassword} className="bg-warning text-warning-foreground hover:bg-warning/90">
              {changingPassword ? 'Alterando...' : 'Alterar Senha'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ===== DELETE CONFIRM DIALOG ===== */}
      <Dialog open={!!deletingUser} onOpenChange={() => setDeletingUser(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive"><Trash2 className="h-5 w-5" /> Excluir Usuário</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir <strong>{deletingUser?.nome} {deletingUser?.sobrenome}</strong>? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={() => setDeletingUser(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDeleteUser}>Excluir</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ===== SHARE DIALOG ===== */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-accent" /> Compartilhar App
            </DialogTitle>
            <DialogDescription>Envie o link do app para os usuários</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-muted rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-2">Link de acesso:</p>
              <code className="text-lg font-mono">{mobileAppUrl}</code>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={copyAppLink} className="gap-2">
                <Copy className="h-4 w-4" /> Copiar Link
              </Button>
              <Button onClick={shareViaWhatsApp} className="gap-2 bg-success text-success-foreground hover:bg-success/90">
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </Button>
            </div>
            <div className="border-t pt-4">
              <p className="text-sm text-muted-foreground mb-3"><strong>Instruções:</strong></p>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Acesse o link acima no celular</li>
                <li>Faça login com as credenciais fornecidas</li>
                <li>Use o app normalmente</li>
              </ol>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
