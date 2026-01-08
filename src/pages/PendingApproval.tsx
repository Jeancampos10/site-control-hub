import { Clock, LogOut, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function PendingApproval() {
  const { profile, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Logout realizado com sucesso!");
    navigate("/auth");
  };

  const handleRefresh = async () => {
    await refreshProfile();
    toast.info("Verificando status de aprovação...");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="w-full max-w-md text-center">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-warning/10 mb-6">
          <Clock className="h-10 w-10 text-warning" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Aguardando Aprovação
        </h1>
        <p className="text-muted-foreground mb-6">
          Olá {profile?.nome || 'Usuário'}, seu cadastro foi realizado com sucesso!
        </p>

        {/* Card */}
        <div className="bg-card rounded-2xl shadow-card p-6 border border-border mb-6">
          <div className="flex items-center gap-3 text-left mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">Próximos passos</p>
              <p className="text-sm text-muted-foreground">Aguarde a aprovação do administrador</p>
            </div>
          </div>

          <ul className="text-left text-sm text-muted-foreground space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-success mt-1">✓</span>
              Cadastro realizado com sucesso
            </li>
            <li className="flex items-start gap-2">
              <span className="text-warning mt-1">○</span>
              Administrador foi notificado
            </li>
            <li className="flex items-start gap-2">
              <span className="text-muted-foreground/50 mt-1">○</span>
              Aguardando liberação de acesso
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            className="w-full"
          >
            Verificar status
          </Button>
          <Button
            variant="ghost"
            onClick={handleSignOut}
            className="w-full gap-2 text-muted-foreground"
          >
            <LogOut className="h-4 w-4" />
            Sair e tentar novamente
          </Button>
        </div>

        <p className="text-xs text-muted-foreground mt-6">
          Se você acredita que isso é um erro, entre em contato com o administrador do sistema.
        </p>
      </div>
    </div>
  );
}
