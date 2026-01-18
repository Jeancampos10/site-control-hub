import { useEffect, useMemo, useState } from "react";
import { Users, Plus, Search, Edit, UserX } from "lucide-react";
import { z } from "zod";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type TipoUsuarioUI = "Apontador" | "Sala Técnica" | "Administrador";

type RoleDb = "admin_principal" | "admin" | "colaborador" | "visualizacao";

interface ApontadorRow {
  id: string;
  nome: string;
  sobrenome: string;
  email: string;
  whatsapp: string | null;
  role: RoleDb;
  approved: boolean;
}

const formSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome").max(80, "Nome muito longo"),
  sobrenome: z.string().trim().max(120, "Sobrenome muito longo").optional().default(""),
  whatsapp: z
    .string()
    .trim()
    .max(30, "WhatsApp muito longo")
    .optional()
    .transform((v) => (v ? v : "")),
  tipoUsuario: z.enum(["Apontador", "Sala Técnica", "Administrador"]),
  ativo: z.boolean(),
});

function roleToTipoUsuario(role: RoleDb): TipoUsuarioUI {
  if (role === "admin_principal") return "Administrador";
  if (role === "admin") return "Sala Técnica";
  return "Apontador";
}

function tipoUsuarioToRole(tipo: TipoUsuarioUI): RoleDb {
  if (tipo === "Administrador") return "admin"; // admin_principal é reservado ao 1º usuário
  if (tipo === "Sala Técnica") return "admin";
  return "colaborador";
}

export default function CadastroApontadores() {
  const { isAdmin, isAdminPrincipal } = useAuth();
  const canManage = isAdmin || isAdminPrincipal;

  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<ApontadorRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ApontadorRow | null>(null);

  const [form, setForm] = useState({
    nome: "",
    sobrenome: "",
    whatsapp: "",
    tipoUsuario: "Apontador" as TipoUsuarioUI,
    ativo: true,
  });

  const fetchRows = async () => {
    setLoading(true);
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id,nome,sobrenome,email,whatsapp")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role, approved");

      if (rolesError) throw rolesError;

      const rolesMap = new Map(
        (roles || []).map((r) => [
          r.user_id,
          { role: (r.role as RoleDb) || "colaborador", approved: !!r.approved },
        ])
      );

      const merged: ApontadorRow[] = (profiles || []).map((p) => {
        const roleInfo = rolesMap.get(p.id) || { role: "colaborador" as RoleDb, approved: false };
        return {
          id: p.id,
          nome: p.nome,
          sobrenome: p.sobrenome,
          email: p.email,
          whatsapp: p.whatsapp,
          role: roleInfo.role,
          approved: roleInfo.approved,
        };
      });

      setRows(merged);
    } catch (e: any) {
      console.error("Erro ao carregar apontadores:", e);
      toast.error(e?.message || "Erro ao carregar apontadores");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows();
  }, []);

  const filteredData = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const full = `${r.nome} ${r.sobrenome}`.toLowerCase();
      return full.includes(q) || r.email.toLowerCase().includes(q);
    });
  }, [rows, search]);

  const openNew = () => {
    setEditing(null);
    setForm({ nome: "", sobrenome: "", whatsapp: "", tipoUsuario: "Apontador", ativo: true });
    setDialogOpen(true);
  };

  const openEdit = (row: ApontadorRow) => {
    setEditing(row);
    setForm({
      nome: row.nome || "",
      sobrenome: row.sobrenome || "",
      whatsapp: row.whatsapp || "",
      tipoUsuario: roleToTipoUsuario(row.role),
      ativo: row.approved,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!canManage) {
      toast.error("Apenas administradores podem gerenciar apontadores");
      return;
    }

    const parsed = formSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || "Verifique os campos");
      return;
    }

    // OBS: criar novo usuário (login/senha) não pode ser feito só pelo front.
    // Fluxo correto: o apontador se cadastra na tela de login e o admin aprova aqui.
    if (!editing) {
      toast.message(
        "Para adicionar um apontador: peça para ele se cadastrar (email/senha) na tela de login; depois você aprova aqui."
      );
      setDialogOpen(false);
      return;
    }

    try {
      // Atualiza perfil
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          nome: parsed.data.nome,
          sobrenome: parsed.data.sobrenome || "",
          whatsapp: parsed.data.whatsapp || null,
        })
        .eq("id", editing.id);

      if (profileError) throw profileError;

      // Atualiza role/approved
      const roleToSave = tipoUsuarioToRole(parsed.data.tipoUsuario);
      const { error: roleError } = await supabase
        .from("user_roles")
        .update({
          role: roleToSave,
          approved: parsed.data.ativo,
          approved_at: parsed.data.ativo ? new Date().toISOString() : null,
        })
        .eq("user_id", editing.id);

      if (roleError) throw roleError;

      toast.success("Apontador atualizado!");
      setDialogOpen(false);
      await fetchRows();
    } catch (e: any) {
      console.error("Erro ao salvar apontador:", e);
      toast.error(e?.message || "Erro ao salvar apontador");
    }
  };

  const handleDisable = async (row: ApontadorRow) => {
    if (!canManage) {
      toast.error("Apenas administradores podem gerenciar apontadores");
      return;
    }

    try {
      const { error } = await supabase
        .from("user_roles")
        .update({ approved: false })
        .eq("user_id", row.id);

      if (error) throw error;

      toast.success("Apontador desativado!");
      await fetchRows();
    } catch (e: any) {
      console.error("Erro ao desativar:", e);
      toast.error(e?.message || "Erro ao desativar apontador");
    }
  };

  if (!canManage) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <Users className="h-12 w-12 text-muted-foreground mb-4" />
        <h1 className="text-xl font-bold mb-2">Acesso restrito</h1>
        <p className="text-muted-foreground">Apenas administradores podem acessar o cadastro de apontadores.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="page-header">
          <h1 className="page-title flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Cadastro de Apontadores
          </h1>
          <p className="page-subtitle">Aprovar e gerenciar usuários do campo</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Apontador
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Editar Apontador" : "Novo Apontador"}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {!editing && (
                <div className="text-sm text-muted-foreground">
                  Para criar um novo apontador, ele deve se cadastrar (email/senha) na tela de login. Depois, você aprova e configura aqui.
                </div>
              )}

              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={form.nome} onChange={(e) => setForm((s) => ({ ...s, nome: e.target.value }))} placeholder="Nome" />
              </div>

              <div className="space-y-2">
                <Label>Sobrenome</Label>
                <Input
                  value={form.sobrenome}
                  onChange={(e) => setForm((s) => ({ ...s, sobrenome: e.target.value }))}
                  placeholder="Sobrenome"
                />
              </div>

              <div className="space-y-2">
                <Label>WhatsApp</Label>
                <Input
                  value={form.whatsapp}
                  onChange={(e) => setForm((s) => ({ ...s, whatsapp: e.target.value }))}
                  placeholder="(DD) 9xxxx-xxxx"
                />
              </div>

              <div className="space-y-2">
                <Label>Tipo de Usuário</Label>
                <Select
                  value={form.tipoUsuario}
                  onValueChange={(v) => setForm((s) => ({ ...s, tipoUsuario: v as TipoUsuarioUI }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Apontador">Apontador</SelectItem>
                    <SelectItem value="Sala Técnica">Sala Técnica</SelectItem>
                    <SelectItem value="Administrador">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label>Ativo</Label>
                <Switch checked={form.ativo} onCheckedChange={(v) => setForm((s) => ({ ...s, ativo: v }))} />
              </div>

              <Button className="w-full" onClick={handleSave}>
                Salvar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-10 text-center text-muted-foreground">Carregando...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((item) => {
                  const tipo = roleToTipoUsuario(item.role);
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.nome} {item.sobrenome}
                      </TableCell>
                      <TableCell>{item.email}</TableCell>
                      <TableCell>
                        <Badge variant={tipo === "Administrador" ? "default" : "secondary"}>{tipo}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.approved ? "default" : "outline"}>
                          {item.approved ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(item)} title="Editar">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDisable(item)}
                          title="Desativar"
                          className="text-destructive"
                        >
                          <UserX className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

