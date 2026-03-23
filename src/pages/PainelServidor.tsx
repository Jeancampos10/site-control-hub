import { useState, useEffect } from "react";
import {
  Server, Users, Database, Activity, Shield, Truck, Fuel, Clock,
  Wrench, ClipboardCheck, BarChart3, RefreshCw, Settings2, Mail,
  AlertTriangle, CheckCircle2, HardDrive, Wifi, Globe, UserPlus,
  FileText, TrendingUp, Calendar, Eye, Pencil, Trash2, KeyRound,
  Plus, Search, ChevronDown, Building2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { useAuth, ModuloPermitido } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SystemStats {
  totalUsers: number;
  approvedUsers: number;
  pendingUsers: number;
  totalFrota: number;
  totalAbastecimentos: number;
  totalHorimetros: number;
  totalOS: number;
  totalChecklists: number;
}

interface UserData {
  id: string;
  nome: string;
  sobrenome: string;
  email: string;
  whatsapp: string;
  role: string;
  approved: boolean;
  modulos_permitidos: ModuloPermitido[];
  created_at: string;
}

const SYSTEM_CREATOR_EMAIL = "jean"; // Partial match for creator

const modulosOptions: { id: ModuloPermitido; label: string }[] = [
  { id: 'apropriacao', label: 'Frota / Equipamentos' },
  { id: 'pedreira', label: 'Abastecimentos / Estoque' },
  { id: 'pipas', label: 'Horímetros / Manutenção' },
  { id: 'cal', label: 'Checklist / Relatórios' },
];

export default function PainelServidor() {
  const { user, isAdminPrincipal, profile } = useAuth();
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0, approvedUsers: 0, pendingUsers: 0,
    totalFrota: 0, totalAbastecimentos: 0, totalHorimetros: 0,
    totalOS: 0, totalChecklists: 0,
  });
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  // Create user dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    nome: '', sobrenome: '', email: '', password: '', whatsapp: '', tipoUsuario: 'colaborador'
  });
  const [creating, setCreating] = useState(false);

  // Edit user dialog
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [editRole, setEditRole] = useState('colaborador');
  const [editModulos, setEditModulos] = useState<ModuloPermitido[]>([]);

  // Change password
  const [passwordUser, setPasswordUser] = useState<UserData | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const fetchAll = async () => {
    setRefreshing(true);
    try {
      const [
        { count: usersCount },
        { data: roles },
        { count: frotaCount },
        { count: abastCount },
        { count: horimCount },
        { count: osCount },
        { count: checkCount },
        { data: profiles },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('user_roles').select('user_id, role, approved, modulos_permitidos'),
        supabase.from('frota').select('*', { count: 'exact', head: true }),
        supabase.from('abastecimentos').select('*', { count: 'exact', head: true }),
        supabase.from('horimetros').select('*', { count: 'exact', head: true }),
        supabase.from('ordens_servico').select('*', { count: 'exact', head: true }),
        supabase.from('checklists').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      ]);

      const rolesMap = new Map(roles?.map(r => [
        r.user_id,
        {
          role: r.role,
          approved: r.approved,
          modulos_permitidos: (r as any).modulos_permitidos || ['apropriacao', 'pedreira', 'pipas', 'cal']
        }
      ]) || []);

      const approvedCount = roles?.filter(r => r.approved).length || 0;
      const pendingCount = roles?.filter(r => !r.approved).length || 0;

      setStats({
        totalUsers: usersCount || 0,
        approvedUsers: approvedCount,
        pendingUsers: pendingCount,
        totalFrota: frotaCount || 0,
        totalAbastecimentos: abastCount || 0,
        totalHorimetros: horimCount || 0,
        totalOS: osCount || 0,
        totalChecklists: checkCount || 0,
      });

      const usersData: UserData[] = (profiles || []).map(p => {
        const roleInfo = rolesMap.get(p.id) || { role: 'colaborador', approved: false, modulos_permitidos: [] };
        return {
          id: p.id, nome: p.nome, sobrenome: p.sobrenome,
          email: p.email, whatsapp: p.whatsapp || '',
          role: roleInfo.role, approved: roleInfo.approved,
          modulos_permitidos: roleInfo.modulos_permitidos,
          created_at: p.created_at,
        };
      });
      setUsers(usersData);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao carregar dados do servidor');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleApprove = async (userId: string) => {
    try {
      await supabase.from('user_roles').update({ approved: true, approved_at: new Date().toISOString(), approved_by: user?.id }).eq('user_id', userId);
      toast.success('Usuário aprovado!');
      fetchAll();
    } catch { toast.error('Erro ao aprovar'); }
  };

  const handleReject = async (userId: string) => {
    if (!confirm('Remover este usuário do sistema?')) return;
    try {
      await supabase.from('profiles').delete().eq('id', userId);
      toast.success('Usuário removido');
      fetchAll();
    } catch { toast.error('Erro ao remover'); }
  };

  const handleCreateUser = async () => {
    if (!createForm.nome || !createForm.email || !createForm.password) {
      toast.error('Preencha nome, email e senha'); return;
    }
    if (createForm.password.length < 6) {
      toast.error('Senha mínima: 6 caracteres'); return;
    }
    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: { ...createForm },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success('Usuário criado!');
      setCreateOpen(false);
      setCreateForm({ nome: '', sobrenome: '', email: '', password: '', whatsapp: '', tipoUsuario: 'colaborador' });
      fetchAll();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao criar');
    } finally { setCreating(false); }
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    try {
      await supabase.from('user_roles')
        .update({ role: editRole as any, modulos_permitidos: editModulos })
        .eq('user_id', editingUser.id);
      toast.success('Permissões atualizadas!');
      setEditingUser(null);
      fetchAll();
    } catch { toast.error('Erro ao salvar'); }
  };

  const handleChangePassword = async () => {
    if (!passwordUser || newPassword.length < 6) {
      toast.error('Senha mínima: 6 caracteres'); return;
    }
    try {
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: { action: 'change-password', userId: passwordUser.id, password: newPassword },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success('Senha alterada!');
      setPasswordUser(null);
      setNewPassword('');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao alterar senha');
    }
  };

  if (!isAdminPrincipal) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <Shield className="h-16 w-16 text-destructive/50 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Acesso Restrito</h2>
        <p className="text-muted-foreground max-w-md">
          Este painel é exclusivo do administrador do sistema. Contate o suporte para obter acesso.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent" />
      </div>
    );
  }

  const filteredUsers = users.filter(u =>
    `${u.nome} ${u.sobrenome} ${u.email}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const roleLabels: Record<string, { label: string; color: string }> = {
    admin_principal: { label: 'Admin Principal', color: 'bg-accent text-accent-foreground' },
    admin: { label: 'Gestor', color: 'bg-primary text-primary-foreground' },
    colaborador: { label: 'Operador', color: 'bg-secondary text-secondary-foreground' },
    visualizacao: { label: 'Visualização', color: 'bg-muted text-muted-foreground' },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent/10">
              <Server className="h-6 w-6 text-accent" />
            </div>
            Painel do Servidor
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Administração completa do sistema — Jean Campos
          </p>
        </div>
        <Button
          variant="outline"
          onClick={fetchAll}
          disabled={refreshing}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="h-4 w-4" /> Visão Geral
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" /> Usuários
          </TabsTrigger>
          <TabsTrigger value="system" className="gap-2">
            <HardDrive className="h-4 w-4" /> Sistema
          </TabsTrigger>
        </TabsList>

        {/* ===== VISÃO GERAL ===== */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Status Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-accent/20">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-accent/10">
                    <Users className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.totalUsers}</p>
                    <p className="text-xs text-muted-foreground">Usuários</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-success/20">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-success/10">
                    <Truck className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.totalFrota}</p>
                    <p className="text-xs text-muted-foreground">Frota</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-warning/20">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-warning/10">
                    <Fuel className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.totalAbastecimentos}</p>
                    <p className="text-xs text-muted-foreground">Abastecimentos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-primary/20">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Wrench className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.totalOS}</p>
                    <p className="text-xs text-muted-foreground">Ordens de Serviço</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Secondary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4 pb-4 flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xl font-bold">{stats.totalHorimetros}</p>
                  <p className="text-xs text-muted-foreground">Horímetros</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4 flex items-center gap-3">
                <ClipboardCheck className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xl font-bold">{stats.totalChecklists}</p>
                  <p className="text-xs text-muted-foreground">Checklists</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4 flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <div>
                  <p className="text-xl font-bold">{stats.approvedUsers}</p>
                  <p className="text-xs text-muted-foreground">Aprovados</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4 flex items-center gap-3">
                <AlertTriangle className={`h-5 w-5 ${stats.pendingUsers > 0 ? 'text-warning' : 'text-muted-foreground'}`} />
                <div>
                  <p className="text-xl font-bold">{stats.pendingUsers}</p>
                  <p className="text-xs text-muted-foreground">Pendentes</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Server Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5 text-accent" />
                Informações do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <Globe className="h-4 w-4" /> Plataforma
                    </span>
                    <span className="text-sm font-medium">Abastech v2.0</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <Database className="h-4 w-4" /> Banco de Dados
                    </span>
                    <Badge variant="outline" className="bg-success/10 text-success border-success/30">Online</Badge>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <Wifi className="h-4 w-4" /> API
                    </span>
                    <Badge variant="outline" className="bg-success/10 text-success border-success/30">Conectado</Badge>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <Shield className="h-4 w-4" /> Administrador
                    </span>
                    <span className="text-sm font-medium">Jean Campos</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <Building2 className="h-4 w-4" /> Cliente
                    </span>
                    <span className="text-sm font-medium">L. Pereira</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4" /> Última Atualização
                    </span>
                    <span className="text-sm font-medium">{format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pending Users Quick View */}
          {stats.pendingUsers > 0 && (
            <Card className="border-warning/30 bg-warning/5">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-warning">
                  <AlertTriangle className="h-5 w-5" />
                  Usuários Pendentes de Aprovação
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {users.filter(u => !u.approved).map(u => (
                    <div key={u.id} className="flex items-center justify-between p-3 rounded-lg bg-background border">
                      <div>
                        <p className="font-medium">{u.nome} {u.sobrenome}</p>
                        <p className="text-sm text-muted-foreground">{u.email}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="text-success border-success/30 hover:bg-success/10"
                          onClick={() => handleApprove(u.id)}>
                          <CheckCircle2 className="h-4 w-4 mr-1" /> Aprovar
                        </Button>
                        <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10"
                          onClick={() => handleReject(u.id)}>
                          <Trash2 className="h-4 w-4 mr-1" /> Rejeitar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ===== USUÁRIOS ===== */}
        <TabsContent value="users" className="space-y-6 mt-6">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button onClick={() => setCreateOpen(true)} className="gap-2 bg-gradient-accent text-accent-foreground">
              <UserPlus className="h-4 w-4" /> Cadastrar Usuário
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>WhatsApp</TableHead>
                      <TableHead>Perfil</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Cadastro</TableHead>
                      <TableHead className="w-[180px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map(u => {
                      const rl = roleLabels[u.role] || roleLabels.colaborador;
                      const initials = `${u.nome?.[0] || ''}${u.sobrenome?.[0] || ''}`.toUpperCase();
                      return (
                        <TableRow key={u.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-accent/10 text-accent text-xs">{initials}</AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{u.nome} {u.sobrenome}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{u.email}</TableCell>
                          <TableCell className="text-sm">{u.whatsapp || '—'}</TableCell>
                          <TableCell>
                            <Badge className={rl.color}>{rl.label}</Badge>
                          </TableCell>
                          <TableCell>
                            {u.approved ? (
                              <Badge variant="outline" className="bg-success/10 text-success border-success/30">Ativo</Badge>
                            ) : (
                              <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">Pendente</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {format(new Date(u.created_at), 'dd/MM/yy')}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {!u.approved && (
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-success" onClick={() => handleApprove(u.id)} title="Aprovar">
                                  <CheckCircle2 className="h-4 w-4" />
                                </Button>
                              )}
                              <Button variant="ghost" size="icon" className="h-8 w-8" title="Editar permissões"
                                onClick={() => { setEditingUser(u); setEditRole(u.role); setEditModulos(u.modulos_permitidos); }}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8" title="Alterar senha"
                                onClick={() => { setPasswordUser(u); setNewPassword(''); }}>
                                <KeyRound className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" title="Remover"
                                onClick={() => handleReject(u.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== SISTEMA ===== */}
        <TabsContent value="system" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Módulos Ativos */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings2 className="h-5 w-5 text-accent" /> Módulos do Sistema
                </CardTitle>
                <CardDescription>Módulos ativos na plataforma</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { name: 'Frota Geral', icon: Truck, status: true },
                  { name: 'Abastecimentos', icon: Fuel, status: true },
                  { name: 'Horímetros', icon: Clock, status: true },
                  { name: 'Manutenção', icon: Wrench, status: true },
                  { name: 'Checklist', icon: ClipboardCheck, status: true },
                  { name: 'Relatórios', icon: FileText, status: true },
                  { name: 'Dashboard', icon: BarChart3, status: true },
                ].map(mod => (
                  <div key={mod.name} className="flex items-center justify-between py-2 border-b last:border-0">
                    <span className="flex items-center gap-2 text-sm">
                      <mod.icon className="h-4 w-4 text-muted-foreground" />
                      {mod.name}
                    </span>
                    <Badge variant="outline" className={mod.status ? 'bg-success/10 text-success border-success/30' : 'bg-destructive/10 text-destructive'}>
                      {mod.status ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Resumo de Registros */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Database className="h-5 w-5 text-accent" /> Registros no Banco
                </CardTitle>
                <CardDescription>Total de registros por tabela</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { name: 'Frota', count: stats.totalFrota },
                  { name: 'Abastecimentos', count: stats.totalAbastecimentos },
                  { name: 'Horímetros', count: stats.totalHorimetros },
                  { name: 'Ordens de Serviço', count: stats.totalOS },
                  { name: 'Checklists', count: stats.totalChecklists },
                  { name: 'Usuários', count: stats.totalUsers },
                ].map(item => (
                  <div key={item.name} className="flex items-center justify-between py-2 border-b last:border-0">
                    <span className="text-sm">{item.name}</span>
                    <span className="text-sm font-bold">{item.count.toLocaleString('pt-BR')}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Suporte */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Mail className="h-5 w-5 text-accent" /> Suporte & Contato
                </CardTitle>
                <CardDescription>Informações de suporte do sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-accent/5 border border-accent/20 text-center">
                    <Shield className="h-8 w-8 text-accent mx-auto mb-2" />
                    <p className="font-medium">Administrador</p>
                    <p className="text-sm text-muted-foreground">Jean Campos</p>
                  </div>
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 text-center">
                    <Globe className="h-8 w-8 text-primary mx-auto mb-2" />
                    <p className="font-medium">Plataforma</p>
                    <p className="text-sm text-muted-foreground">Abastech Cloud</p>
                  </div>
                  <div className="p-4 rounded-lg bg-success/5 border border-success/20 text-center">
                    <Building2 className="h-8 w-8 text-success mx-auto mb-2" />
                    <p className="font-medium">Cliente</p>
                    <p className="text-sm text-muted-foreground">L. Pereira</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* ===== DIALOGS ===== */}

      {/* Create User */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cadastrar Novo Usuário</DialogTitle>
            <DialogDescription>Crie uma conta para um novo usuário do sistema</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Nome</Label>
                <Input value={createForm.nome} onChange={e => setCreateForm(p => ({ ...p, nome: e.target.value }))} />
              </div>
              <div>
                <Label>Sobrenome</Label>
                <Input value={createForm.sobrenome} onChange={e => setCreateForm(p => ({ ...p, sobrenome: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={createForm.email} onChange={e => setCreateForm(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div>
              <Label>Senha</Label>
              <Input type="password" value={createForm.password} onChange={e => setCreateForm(p => ({ ...p, password: e.target.value }))} />
            </div>
            <div>
              <Label>WhatsApp</Label>
              <Input value={createForm.whatsapp} onChange={e => setCreateForm(p => ({ ...p, whatsapp: e.target.value }))} placeholder="(99) 99999-9999" />
            </div>
            <div>
              <Label>Perfil de Acesso</Label>
              <Select value={createForm.tipoUsuario} onValueChange={v => setCreateForm(p => ({ ...p, tipoUsuario: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Gestor / Sala Técnica</SelectItem>
                  <SelectItem value="colaborador">Operador de Campo</SelectItem>
                  <SelectItem value="visualizacao">Somente Visualização</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleCreateUser} disabled={creating} className="w-full bg-gradient-accent text-accent-foreground">
              {creating ? 'Criando...' : 'Criar Usuário'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Permissions */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Permissões</DialogTitle>
            <DialogDescription>{editingUser?.nome} {editingUser?.sobrenome}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Perfil de Acesso</Label>
              <Select value={editRole} onValueChange={setEditRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin_principal">Administrador Principal</SelectItem>
                  <SelectItem value="admin">Gestor / Sala Técnica</SelectItem>
                  <SelectItem value="colaborador">Operador de Campo</SelectItem>
                  <SelectItem value="visualizacao">Somente Visualização</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Módulos Permitidos</Label>
              <div className="space-y-2 mt-2">
                {modulosOptions.map(m => (
                  <div key={m.id} className="flex items-center gap-2">
                    <Checkbox
                      checked={editModulos.includes(m.id)}
                      onCheckedChange={checked => {
                        setEditModulos(prev =>
                          checked ? [...prev, m.id] : prev.filter(x => x !== m.id)
                        );
                      }}
                    />
                    <span className="text-sm">{m.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <Button onClick={handleSaveEdit} className="w-full">Salvar Alterações</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Change Password */}
      <Dialog open={!!passwordUser} onOpenChange={() => setPasswordUser(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Alterar Senha</DialogTitle>
            <DialogDescription>{passwordUser?.nome} — {passwordUser?.email}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Nova Senha</Label>
              <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
            </div>
            <Button onClick={handleChangePassword} className="w-full">Confirmar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
