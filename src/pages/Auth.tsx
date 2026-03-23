import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import logoAbastech from "@/assets/logo-abastech.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

export default function Auth() {
  const navigate = useNavigate();
  const { user, loading, signIn } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!loading && user) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    try {
      const validation = loginSchema.safeParse(formData);
      if (!validation.success) {
        const fieldErrors: Record<string, string> = {};
        validation.error.errors.forEach(err => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
        setIsSubmitting(false);
        return;
      }

      const { error } = await signIn(formData.email, formData.password);
      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast.error("Email ou senha incorretos");
        } else if (error.message.includes("Email not confirmed")) {
          toast.error("Email não confirmado. Contate o administrador.");
        } else {
          toast.error(error.message);
        }
      } else {
        sessionStorage.setItem('justLoggedIn', 'true');
        toast.success("Login realizado com sucesso!");
        navigate("/");
      }
    } catch (error) {
      toast.error("Ocorreu um erro. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden p-4">
      {/* Background with gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/10" />
      
      {/* Watermark Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
        <img 
          src={logoAbastech} 
          alt="" 
          className="absolute -top-10 -right-20 h-72 opacity-[0.04] rotate-12"
        />
        <img 
          src={logoAbastech} 
          alt="" 
          className="absolute -bottom-10 -left-20 h-72 opacity-[0.04] -rotate-12"
        />
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 60px, hsl(var(--foreground)) 60px, hsl(var(--foreground)) 61px),
                              repeating-linear-gradient(90deg, transparent, transparent 60px, hsl(var(--foreground)) 60px, hsl(var(--foreground)) 61px)`,
          }}
        />
        <div className="absolute top-[15%] left-[5%] text-foreground/[0.03] text-6xl font-black tracking-widest rotate-[-15deg]">
          ABASTECH
        </div>
        <div className="absolute bottom-[20%] right-[5%] text-foreground/[0.03] text-5xl font-black tracking-widest rotate-[10deg]">
          GESTÃO
        </div>
        <div className="absolute top-[60%] left-[50%] -translate-x-1/2 text-foreground/[0.02] text-4xl font-black tracking-[0.5em] rotate-[-5deg]">
          EQUIPAMENTOS
        </div>
      </div>

      {/* Decorative circles */}
      <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-accent/5 blur-3xl" />
      <div className="absolute bottom-20 right-20 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-block relative">
            <div className="absolute inset-0 bg-accent/20 rounded-full blur-2xl scale-150" />
            <img 
              src={logoAbastech} 
              alt="Abastech Logo" 
              className="relative h-28 mx-auto drop-shadow-lg"
            />
          </div>
          <h2 className="text-sm font-medium text-muted-foreground mt-3 tracking-wider uppercase">
            Sistema de Gestão de Equipamentos
          </h2>
        </div>

        {/* Card */}
        <div className="bg-card/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-border/50">
          {/* Welcome text */}
          <div className="text-center mb-6">
            <p className="text-lg font-semibold text-foreground">Bem-vindo de volta!</p>
            <p className="text-sm text-muted-foreground">Faça login para acessar o sistema</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className={`pl-10 ${errors.email ? "border-destructive" : ""}`}
                />
              </div>
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  className={`pl-10 pr-10 ${errors.password ? "border-destructive" : ""}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-accent text-accent-foreground hover:opacity-90 shadow-lg h-11 text-base font-semibold"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  Aguarde...
                </div>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>

          <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border/50">
            <p className="text-xs text-muted-foreground text-center">
              🔒 Acesso restrito. Apenas usuários cadastrados pelo administrador podem acessar o sistema.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 space-y-1">
          <p className="text-sm text-muted-foreground">
            Desenvolvido por <span className="font-semibold text-foreground">Jean Campos</span>
          </p>
          <p className="text-xs text-muted-foreground/70">
            © {new Date().getFullYear()} Abastech — Gestão de Equipamentos
          </p>
        </div>
      </div>
    </div>
  );
}
