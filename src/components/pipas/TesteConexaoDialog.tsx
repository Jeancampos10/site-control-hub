import { useState } from "react";
import { Settings2, CheckCircle2, XCircle, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

interface TestResult {
  name: string;
  status: "ok" | "error";
  message: string;
}

interface TestResponse {
  success: boolean;
  tests: TestResult[];
  summary: string;
}

export function TesteConexaoDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<TestResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runTest = async () => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        "sync-apontamento-pipa",
        { body: { action: "test" } }
      );

      if (fnError) {
        setError(fnError.message || "Erro ao executar teste");
        return;
      }

      setResults(data as TestResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && !results && !loading) {
      runTest();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings2 className="h-4 w-4" />
          Testar Conexão
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-primary" />
            Teste de Conexão com Planilha
          </DialogTitle>
          <DialogDescription>
            Verifica se todas as configurações estão corretas para sincronização.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {loading && (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Executando testes...</p>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
              <p className="text-sm text-destructive font-medium">Erro ao executar teste:</p>
              <p className="text-sm text-destructive/80 mt-1">{error}</p>
            </div>
          )}

          {results && (
            <>
              {/* Summary */}
              <div
                className={`rounded-lg p-4 ${
                  results.success
                    ? "bg-success/10 border border-success/30"
                    : "bg-warning/10 border border-warning/30"
                }`}
              >
                <p
                  className={`text-sm font-medium ${
                    results.success ? "text-success" : "text-warning"
                  }`}
                >
                  {results.summary}
                </p>
              </div>

              {/* Test Results */}
              <div className="space-y-2">
                {results.tests.map((test, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 rounded-lg border bg-card p-3"
                  >
                    {test.status === "ok" ? (
                      <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{test.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {test.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={runTest}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Executar Novamente
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
