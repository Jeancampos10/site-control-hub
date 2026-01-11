import { Package, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Estoques() {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Package className="h-6 w-6 text-blue-500" />
            Estoques
          </h1>
          <p className="text-muted-foreground">
            Controle de estoque de combustível por local
          </p>
        </div>
        <Button variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Atualizar
        </Button>
      </div>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900/50">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-800 dark:text-blue-200">
                Página em Configuração
              </h3>
              <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                Esta página foi integrada do sistema Abastech. Configure a conexão
                com as planilhas de estoque para visualizar os dados.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Placeholder KPIs */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Estoque Total Diesel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-- L</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Estoque Arla</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-- L</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Locais Monitorados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
