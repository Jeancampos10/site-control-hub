import { useState, useEffect, useCallback } from "react";
import {
  Server, Users, Database, Activity, Shield, Truck, Fuel, Clock,
  Wrench, ClipboardCheck, BarChart3, RefreshCw, Settings2, Mail,
  AlertTriangle, CheckCircle2, HardDrive, Wifi, Globe, UserPlus,
  FileText, TrendingUp, Calendar, Pencil, Trash2, KeyRound,
  Search, Building2, GripVertical, Save, RotateCcw, Type, Palette,
  Layout, Menu
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import { Separator } from "@/components/ui/separator";
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

interface MenuConfig {
  id: string;
  label: string;
  visible: boolean;
  order: number;
}

interface SystemTexts {
  systemName: string;
  systemSubtitle: string;
  companyName: string;
  adminName: string;
  loginWelcome: string;
  loginSubtitle: string;
  footerText: string;
  copyrightText: string;
}

const DEFAULT_MENUS: MenuConfig[] = [
  { id: 'dashboard', label: 'Dashboard', visible: true, order: 0 },
  { id: 'controle', label: 'Controle', visible: true, order: 1 },
  { id: 'frota', label: 'Frota Geral', visible: true, order: 2 },
  { id: 'cadastros', label: 'Cadastros', visible: true, order: 3 },
  { id: 'relatorios', label: 'Relatórios', visible: true, order: 4 },
  { id: 'alertas', label: 'Alertas', visible: true, order: 5 },
];

const DEFAULT_TEXTS: SystemTexts = {
  systemName: 'Abastech',
  systemSubtitle: 'Gestão de Equipamentos',
  companyName: 'L. Pereira',
  adminName: 'Jean Campos',
  loginWelcome: 'Bem-vindo de volta!',
  loginSubtitle: 'Faça login para acessar o sistema',
  footerText: 'Desenvolvido por Jean Campos',
  copyrightText: 'Abastech — Gestão de Equipamentos',
};

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

  // Config states
  const [menuConfig, setMenuConfig] = useState<MenuConfig[]>(DEFAULT_MENUS);
  const [systemTexts, setSystemTexts] = useState<SystemTexts>(DEFAULT_TEXTS);
  const [configSaving, setConfigSaving] = useState(false);
  const [configDirty, setConfigDirty] = useState(false);

  // Create user dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    nome: '', sobrenome: '', email: '', password: '', whatsapp: '', tipoUsuario: 'colaborador',
    isCompanyAdmin: false
  });
  const [creating, setCreating] = useState(false);

  // Edit user dialog
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [editRole, setEditRole] = useState('colaborador');
  const [editModulos, setEditModulos] = useState<ModuloPermitido[]>([]);

  // Change password
  const [passwordUser, setPasswordUser] = useState<UserData | null>(null);
  const [newPassword, setNewPassword] = useState('');

  // Dragging for menu reorder
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const fetchConfig = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('system_config')
        .select('config_key, config_value');
      
      if (data) {
        const menusRow = data.find(d => d.config_key === 'menu_config');
        const textsRow = data.find(d => d.config_key === 'system_texts');
        if (menusRow?.config_value) {
          setMenuConfig(menusRow.config_value as unknown as MenuConfig[]);
        }
        if (textsRow?.config_value) {
          setSystemTexts({ ...DEFAULT_TEXTS, ...(textsRow.config_value as unknown as SystemTexts) });
        }
      }
    } catch (err) {
      console.error('Error loading config:', err);
    }
  }, []);

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
        { role: r.role, approved: r.approved, modulos_permitidos: (r as any).modulos_permitidos || ['apropriacao', 'pedreira', 'pipas', 'cal'] }
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
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAll();
    fetchConfig();
  }, [fetchConfig]);

  // ---- Save system config ----
  const saveConfig = async (key: string, value: any) => {
    setConfigSaving(true);
    try {
      const { data: existing } = await supabase
        .from('system_config')
        .select('id')
        .eq('config_key', key)
        .maybeSingle();

      if (existing) {
        await supabase.from('system_config')
          .update({ config_value: value as any, updated_at: new Date().toISOString(), updated_by: user?.id })
          .eq('config_key', key);
      } else {
        await supabase.from('system_config')
          .insert({ config_key: key, config_value: value as any, updated_by: user?.id });
      }
      toast.success('Configuração salva!');
      setConfigDirty(false);
    } catch (err) {
      toast.error('Erro ao salvar configuração');
    } finally {
      setConfigSaving(false);
    }
  };

  const handleSaveMenus = () => saveConfig('menu_config', menuConfig as any);
  const handleSaveTexts = () => saveConfig('system_texts', systemTexts as any);

  const handleResetMenus = () => {
    setMenuConfig(DEFAULT_MENUS);
    setConfigDirty(true);
  };

  const handleResetTexts = () => {
    setSystemTexts(DEFAULT_TEXTS);
    setConfigDirty(true);
  };

  // Menu reorder
  const moveMenu = (from: number, to: number) => {
    const items = [...menuConfig];
    const [moved] = items.splice(from, 1);
    items.splice(to, 0, moved);
    setMenuConfig(items.map((item, i) => ({ ...item, order: i })));
    setConfigDirty(true);
  };

  // ---- User actions ----
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
    if (createForm.password.length < 6) { toast.error('Senha mínima: 6 caracteres'); return; }
    setCreating(true);
    try {
      const finalRole = createForm.isCompanyAdmin ? 'admin' : createForm.tipoUsuario;
      const { data, error } = await supabase.functions.invoke('create-user', { 
        body: { ...createForm, tipoUsuario: finalRole } 
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success('Usuário criado!');
      setCreateOpen(false);
      setCreateForm({ nome: '', sobrenome: '', email: '', password: '', whatsapp: '', tipoUsuario: 'colaborador', isCompanyAdmin: false });
      fetchAll();
    } catch (err: any) { toast.error(err.message || 'Erro ao criar'); }
    finally { setCreating(false); }
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
    if (!passwordUser || newPassword.length < 6) { toast.error('Senha mínima: 6 caracteres'); return; }
    try {
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: { action: 'change-password', userId: passwordUser.id, password: newPassword },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success('Senha alterada!');
      setPasswordUser(null);
      setNewPassword('');
    } catch (err: any) { toast.error(err.message || 'Erro ao alterar senha'); }
  };

  if (!isAdminPrincipal) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <Shield className="h-16 w-16 text-destructive/50 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Acesso Restrito</h2>
        <p className="text-muted-foreground max-w-md">
          Este painel é exclusivo do administrador do sistema.
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
    admin_principal: { label: 'Servidor', color: 'bg-accent text-accent-foreground' },
    admin: { label: 'Gestor da Empresa', color: 'bg-primary text-primary-foreground' },
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
            Administração completa do sistema — {systemTexts.adminName}
          </p>
        </div>
        <Button variant="outline" onClick={fetchAll} disabled={refreshing} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="gap-1 text-xs sm:text-sm">
            <BarChart3 className="h-4 w-4" /> <span className="hidden sm:inline">Visão Geral</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-1 text-xs sm:text-sm">
            <Users className="h-4 w-4" /> <span className="hidden sm:inline">Usuários</span>
          </TabsTrigger>
          <TabsTrigger value="config" className="gap-1 text-xs sm:text-sm">
            <Settings2 className="h-4 w-4" /> <span className="hidden sm:inline">Configurações</span>
          </TabsTrigger>
          <TabsTrigger value="system" className="gap-1 text-xs sm:text-sm">
            <HardDrive className="h-4 w-4" /> <span className="hidden sm:inline">Sistema</span>
          </TabsTrigger>
        </TabsList>

        {/* ===== VISÃO GERAL ===== */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Users, value: stats.totalUsers, label: 'Usuários', borderColor: 'border-accent/20', iconColor: 'text-accent', bgColor: 'bg-accent/10' },
              { icon: Truck, value: stats.totalFrota, label: 'Frota', borderColor: 'border-success/20', iconColor: 'text-success', bgColor: 'bg-success/10' },
              { icon: Fuel, value: stats.totalAbastecimentos, label: 'Abastecimentos', borderColor: 'border-warning/20', iconColor: 'text-warning', bgColor: 'bg-warning/10' },
              { icon: Wrench, value: stats.totalOS, label: 'Ordens de Serviço', borderColor: 'border-primary/20', iconColor: 'text-primary', bgColor: 'bg-primary/10' },
            ].map(({ icon: Icon, value, label, borderColor, iconColor, bgColor }) => (
              <Card key={label} className={borderColor}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${bgColor}`}><Icon className={`h-5 w-5 ${iconColor}`} /></div>
                    <div>
                      <p className="text-2xl font-bold">{value}</p>
                      <p className="text-xs text-muted-foreground">{label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Clock, value: stats.totalHorimetros, label: 'Horímetros' },
              { icon: ClipboardCheck, value: stats.totalChecklists, label: 'Checklists' },
              { icon: CheckCircle2, value: stats.approvedUsers, label: 'Aprovados', iconClass: 'text-success' },
              { icon: AlertTriangle, value: stats.pendingUsers, label: 'Pendentes', iconClass: stats.pendingUsers > 0 ? 'text-warning' : '' },
            ].map(({ icon: Icon, value, label, iconClass }) => (
              <Card key={label}>
                <CardContent className="pt-4 pb-4 flex items-center gap-3">
                  <Icon className={`h-5 w-5 ${iconClass || 'text-muted-foreground'}`} />
                  <div>
                    <p className="text-xl font-bold">{value}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Server Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5 text-accent" /> Informações do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  {[
                    { icon: Globe, label: 'Plataforma', value: `${systemTexts.systemName} v2.0` },
                    { icon: Database, label: 'Banco de Dados', badge: true },
                    { icon: Wifi, label: 'API', badge: true },
                  ].map(item => (
                    <div key={item.label} className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm text-muted-foreground flex items-center gap-2">
                        <item.icon className="h-4 w-4" /> {item.label}
                      </span>
                      {item.badge ? (
                        <Badge variant="outline" className="bg-success/10 text-success border-success/30">Online</Badge>
                      ) : (
                        <span className="text-sm font-medium">{item.value}</span>
                      )}
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
                  {[
                    { icon: Shield, label: 'Administrador', value: systemTexts.adminName },
                    { icon: Building2, label: 'Cliente', value: systemTexts.companyName },
                    { icon: Calendar, label: 'Última Atualização', value: format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR }) },
                  ].map(item => (
                    <div key={item.label} className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm text-muted-foreground flex items-center gap-2">
                        <item.icon className="h-4 w-4" /> {item.label}
                      </span>
                      <span className="text-sm font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pending */}
          {stats.pendingUsers > 0 && (
            <Card className="border-warning/30 bg-warning/5">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-warning">
                  <AlertTriangle className="h-5 w-5" /> Usuários Pendentes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {users.filter(u => !u.approved).map(u => (
                  <div key={u.id} className="flex items-center justify-between p-3 rounded-lg bg-background border">
                    <div>
                      <p className="font-medium">{u.nome} {u.sobrenome}</p>
                      <p className="text-sm text-muted-foreground">{u.email}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="text-success border-success/30 hover:bg-success/10" onClick={() => handleApprove(u.id)}>
                        <CheckCircle2 className="h-4 w-4 mr-1" /> Aprovar
                      </Button>
                      <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => handleReject(u.id)}>
                        <Trash2 className="h-4 w-4 mr-1" /> Rejeitar
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ===== USUÁRIOS ===== */}
        <TabsContent value="users" className="space-y-6 mt-6">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por nome ou email..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
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
                          <TableCell><Badge className={rl.color}>{rl.label}</Badge></TableCell>
                          <TableCell>
                            <Badge variant="outline" className={u.approved ? 'bg-success/10 text-success border-success/30' : 'bg-warning/10 text-warning border-warning/30'}>
                              {u.approved ? 'Ativo' : 'Pendente'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{format(new Date(u.created_at), 'dd/MM/yy')}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {!u.approved && (
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-success" onClick={() => handleApprove(u.id)} title="Aprovar">
                                  <CheckCircle2 className="h-4 w-4" />
                                </Button>
                              )}
                              <Button variant="ghost" size="icon" className="h-8 w-8" title="Editar"
                                onClick={() => { setEditingUser(u); setEditRole(u.role); setEditModulos(u.modulos_permitidos); }}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8" title="Senha"
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

        {/* ===== CONFIGURAÇÕES ===== */}
        <TabsContent value="config" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Menu Management */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Menu className="h-5 w-5 text-accent" /> Menus do Sistema
                    </CardTitle>
                    <CardDescription>Renomear, reordenar e ocultar menus</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={handleResetMenus} title="Restaurar padrão">
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                    <Button size="sm" onClick={handleSaveMenus} disabled={configSaving} className="gap-1">
                      <Save className="h-4 w-4" /> Salvar
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {menuConfig
                  .sort((a, b) => a.order - b.order)
                  .map((menu, index) => (
                    <div
                      key={menu.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                        dragIndex === index ? 'bg-accent/10 border-accent/30 scale-[1.02]' : 'bg-background hover:bg-muted/50'
                      }`}
                      draggable
                      onDragStart={() => setDragIndex(index)}
                      onDragOver={(e) => { e.preventDefault(); }}
                      onDrop={() => {
                        if (dragIndex !== null && dragIndex !== index) {
                          moveMenu(dragIndex, index);
                        }
                        setDragIndex(null);
                      }}
                      onDragEnd={() => setDragIndex(null)}
                    >
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab flex-shrink-0" />
                      <div className="flex-1">
                        <Input
                          value={menu.label}
                          onChange={(e) => {
                            setMenuConfig(prev => prev.map(m => m.id === menu.id ? { ...m, label: e.target.value } : m));
                            setConfigDirty(true);
                          }}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Label className="text-xs text-muted-foreground">Visível</Label>
                        <Switch
                          checked={menu.visible}
                          onCheckedChange={(checked) => {
                            setMenuConfig(prev => prev.map(m => m.id === menu.id ? { ...m, visible: checked } : m));
                            setConfigDirty(true);
                          }}
                        />
                      </div>
                    </div>
                  ))}
                <p className="text-xs text-muted-foreground mt-3">
                  💡 Arraste para reordenar. Altere os nomes livremente.
                </p>
              </CardContent>
            </Card>

            {/* System Texts */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Type className="h-5 w-5 text-accent" /> Textos do Sistema
                    </CardTitle>
                    <CardDescription>Edite os textos exibidos no sistema</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={handleResetTexts} title="Restaurar padrão">
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                    <Button size="sm" onClick={handleSaveTexts} disabled={configSaving} className="gap-1">
                      <Save className="h-4 w-4" /> Salvar
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { key: 'systemName', label: 'Nome do Sistema' },
                  { key: 'systemSubtitle', label: 'Subtítulo' },
                  { key: 'companyName', label: 'Nome da Empresa' },
                  { key: 'adminName', label: 'Nome do Administrador' },
                  { key: 'loginWelcome', label: 'Texto de Boas-Vindas (Login)' },
                  { key: 'loginSubtitle', label: 'Subtítulo do Login' },
                  { key: 'footerText', label: 'Texto do Rodapé' },
                  { key: 'copyrightText', label: 'Copyright' },
                ].map(({ key, label }) => (
                  <div key={key} className="space-y-1">
                    <Label className="text-xs text-muted-foreground">{label}</Label>
                    <Input
                      value={(systemTexts as any)[key] || ''}
                      onChange={(e) => {
                        setSystemTexts(prev => ({ ...prev, [key]: e.target.value }));
                        setConfigDirty(true);
                      }}
                      className="h-9 text-sm"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Controle de Sub-Menus */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Layout className="h-5 w-5 text-accent" /> Módulos de Controle
                </CardTitle>
                <CardDescription>Gerencie quais sub-menus aparecem dentro de cada seção</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { group: 'Controle', items: ['Visão Geral', 'Manutenção', 'Horímetros', 'Abastecimentos', 'Checklist'] },
                    { group: 'Cadastros', items: ['Fornecedores', 'Tanques / Locais', 'Obras', 'Tipos de Óleo', 'Mecânicos', 'Peças', 'Gestão de Usuários'] },
                    { group: 'Frota', items: ['Frota Geral'] },
                  ].map(section => (
                    <div key={section.group} className="rounded-lg border p-4">
                      <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                        <Settings2 className="h-4 w-4 text-accent" />
                        {section.group}
                      </h3>
                      <div className="space-y-2">
                        {section.items.map(item => (
                          <div key={item} className="flex items-center justify-between">
                            <span className="text-sm">{item}</span>
                            <Badge variant="outline" className="bg-success/10 text-success border-success/30 text-xs">Ativo</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ===== SISTEMA ===== */}
        <TabsContent value="system" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings2 className="h-5 w-5 text-accent" /> Módulos do Sistema
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { name: 'Frota Geral', icon: Truck },
                  { name: 'Abastecimentos', icon: Fuel },
                  { name: 'Horímetros', icon: Clock },
                  { name: 'Manutenção', icon: Wrench },
                  { name: 'Checklist', icon: ClipboardCheck },
                  { name: 'Relatórios', icon: FileText },
                  { name: 'Dashboard', icon: BarChart3 },
                ].map(mod => (
                  <div key={mod.name} className="flex items-center justify-between py-2 border-b last:border-0">
                    <span className="flex items-center gap-2 text-sm">
                      <mod.icon className="h-4 w-4 text-muted-foreground" /> {mod.name}
                    </span>
                    <Badge variant="outline" className="bg-success/10 text-success border-success/30">Ativo</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Database className="h-5 w-5 text-accent" /> Registros no Banco
                </CardTitle>
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

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Mail className="h-5 w-5 text-accent" /> Suporte & Contato
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-accent/5 border border-accent/20 text-center">
                    <Shield className="h-8 w-8 text-accent mx-auto mb-2" />
                    <p className="font-medium">Administrador</p>
                    <p className="text-sm text-muted-foreground">{systemTexts.adminName}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 text-center">
                    <Globe className="h-8 w-8 text-primary mx-auto mb-2" />
                    <p className="font-medium">Plataforma</p>
                    <p className="text-sm text-muted-foreground">{systemTexts.systemName} Cloud</p>
                  </div>
                  <div className="p-4 rounded-lg bg-success/5 border border-success/20 text-center">
                    <Building2 className="h-8 w-8 text-success mx-auto mb-2" />
                    <p className="font-medium">Cliente</p>
                    <p className="text-sm text-muted-foreground">{systemTexts.companyName}</p>
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
            <DialogDescription>Crie uma conta para um novo usuário</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Nome</Label><Input value={createForm.nome} onChange={e => setCreateForm(p => ({ ...p, nome: e.target.value }))} /></div>
              <div><Label>Sobrenome</Label><Input value={createForm.sobrenome} onChange={e => setCreateForm(p => ({ ...p, sobrenome: e.target.value }))} /></div>
            </div>
            <div><Label>Email</Label><Input type="email" value={createForm.email} onChange={e => setCreateForm(p => ({ ...p, email: e.target.value }))} /></div>
            <div><Label>Senha</Label><Input type="password" value={createForm.password} onChange={e => setCreateForm(p => ({ ...p, password: e.target.value }))} /></div>
            <div><Label>WhatsApp</Label><Input value={createForm.whatsapp} onChange={e => setCreateForm(p => ({ ...p, whatsapp: e.target.value }))} placeholder="(99) 99999-9999" /></div>
            <div>
              <Label>Perfil de Acesso</Label>
              <Select value={createForm.tipoUsuario} onValueChange={v => setCreateForm(p => ({ ...p, tipoUsuario: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Gestor da Empresa (Admin)</SelectItem>
                  <SelectItem value="colaborador">Operador de Campo</SelectItem>
                  <SelectItem value="visualizacao">Somente Visualização</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                O <strong>Gestor da Empresa</strong> terá acesso administrativo para gerenciar os demais usuários e todos os módulos.
              </p>
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
                  <SelectItem value="admin">Gestor da Empresa (Admin)</SelectItem>
                  <SelectItem value="colaborador">Operador de Campo</SelectItem>
                  <SelectItem value="visualizacao">Somente Visualização</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                O Gestor da Empresa pode gerenciar usuários e ter acesso total ao sistema.
              </p>
            </div>
            <div>
              <Label>Módulos Permitidos</Label>
              <div className="space-y-2 mt-2">
                {modulosOptions.map(m => (
                  <div key={m.id} className="flex items-center gap-2">
                    <Checkbox
                      checked={editModulos.includes(m.id)}
                      onCheckedChange={checked => setEditModulos(prev => checked ? [...prev, m.id] : prev.filter(x => x !== m.id))}
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
            <div><Label>Nova Senha</Label><Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Mínimo 6 caracteres" /></div>
            <Button onClick={handleChangePassword} className="w-full">Confirmar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
