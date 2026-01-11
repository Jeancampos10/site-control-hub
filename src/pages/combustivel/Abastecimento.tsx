import { Fuel, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Abastecimento() {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Fuel className="h-6 w-6 text-orange-500" />
            Abastecimento
          </h1>
          <p className="text-muted-foreground">
            Registros de abastecimento de combustível
          </p>
        </div>
        <Button variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Atualizar
        </Button>
      </div>

      {/* Info Card */}
      <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-orange-100 p-3 dark:bg-orange-900/50">
              <Fuel className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold text-orange-800 dark:text-orange-200">
                Página em Configuração
              </h3>
              <p className="mt-1 text-sm text-orange-700 dark:text-orange-300">
                Esta página foi integrada do sistema Abastech. Configure a conexão
                com as planilhas específicas para visualizar os dados de abastecimento.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Placeholder KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Abastecimentos Hoje</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Volume Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-- L</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Veículos Atendidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Média por Abast.</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-- L</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
