import { Clock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Horimetros() {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Clock className="h-6 w-6 text-purple-500" />
            Horímetros
          </h1>
          <p className="text-muted-foreground">
            Controle de horímetros e quilometragem
          </p>
        </div>
        <Button variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Atualizar
        </Button>
      </div>

      {/* Info Card */}
      <Card className="border-purple-200 bg-purple-50 dark:bg-purple-950/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900/50">
              <Clock className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-purple-800 dark:text-purple-200">
                Página em Configuração
              </h3>
              <p className="mt-1 text-sm text-purple-700 dark:text-purple-300">
                Esta página foi integrada do sistema Abastech. Configure a conexão
                com as planilhas de horímetros para visualizar os dados.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Placeholder KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Registros Hoje</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Horas Totais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-- h</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Média por Veículo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-- h</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Inconsistências</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">--</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
