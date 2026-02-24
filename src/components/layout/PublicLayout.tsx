import { ReactNode } from "react";
import { HardHat } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface PublicLayoutProps {
  children: ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Simple Public Header */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <HardHat className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg hidden sm:inline-block">ApropriAPP</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent-foreground font-medium border border-accent/30">
            Dashboard Público
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/auth">Entrar</Link>
          </Button>
        </div>
      </header>

      {/* Page Content */}
      <main className="flex-1 p-4 lg:p-6 container mx-auto max-w-7xl">
        {children}
      </main>

      {/* Simple Footer */}
      <footer className="border-t py-6 px-4 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} ApropriAPP. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
