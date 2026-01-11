import { Fuel, Package, Truck, Wrench, Clock, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CombustivelDashboard() {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-foreground">
          Dashboard - Combustível e Manutenção
        </h1>
        <p className="text-muted-foreground">
          Visão geral das operações de abastecimento e manutenção
        </p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estoque Diesel</CardTitle>
            <Fuel className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">Litros em estoque</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Veículos Ativos</CardTitle>
            <Truck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">Em operação</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Manutenção</CardTitle>
            <Wrench className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">Ordens abertas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">Pendentes</p>
          </CardContent>
        </Card>
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
                Módulo em Configuração
              </h3>
              <p className="mt-1 text-sm text-orange-700 dark:text-orange-300">
                Este módulo foi integrado do sistema Abastech. Para funcionar completamente,
                é necessário configurar a conexão com as planilhas do Google Sheets
                específicas de abastecimento e manutenção.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Access Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="cursor-pointer transition-colors hover:bg-muted/50">
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-lg bg-orange-100 p-3 dark:bg-orange-900/50">
              <Fuel className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold">Abastecimento</h3>
              <p className="text-sm text-muted-foreground">Registrar e consultar</p>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer transition-colors hover:bg-muted/50">
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-lg bg-blue-100 p-3 dark:bg-blue-900/50">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold">Estoques</h3>
              <p className="text-sm text-muted-foreground">Controle de níveis</p>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer transition-colors hover:bg-muted/50">
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-lg bg-yellow-100 p-3 dark:bg-yellow-900/50">
              <Wrench className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <h3 className="font-semibold">Manutenção</h3>
              <p className="text-sm text-muted-foreground">Ordens de serviço</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
