import { Truck, Plus, Filter, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useGoogleSheets, CamReboqueRow } from "@/hooks/useGoogleSheets";
import { TableLoader } from "@/components/ui/loading-spinner";
import { ErrorState } from "@/components/ui/error-state";

export default function Reboque() {
  const { data: reboqueData, isLoading, error, refetch } = useGoogleSheets<CamReboqueRow>('cam_reboque');

  const totalReboques = reboqueData?.length || 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="page-header mb-0">
          <h1 className="page-title flex items-center gap-2">
            <Truck className="h-6 w-6 text-accent" />
            Caminhões Reboque
          </h1>
          <p className="page-subtitle">
            Cadastro e gestão de carretas e reboques
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            Filtros
          </Button>
          <Button size="sm" className="gap-2 bg-gradient-accent text-accent-foreground hover:opacity-90">
            <Plus className="h-4 w-4" />
            Novo Reboque
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2">
          <div className="h-2 w-2 rounded-full bg-success" />
          <span className="text-sm font-medium">{totalReboques} Cadastrados</span>
        </div>
      </div>

      {/* Data Table */}
      {isLoading ? (
        <TableLoader />
      ) : error ? (
        <ErrorState 
          message="Não foi possível buscar os dados da planilha."
          onRetry={() => refetch()} 
        />
      ) : (
        <div className="chart-container overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="data-table-header">Prefixo</TableHead>
                  <TableHead className="data-table-header">Descrição</TableHead>
                  <TableHead className="data-table-header">Motorista</TableHead>
                  <TableHead className="data-table-header">Modelo</TableHead>
                  <TableHead className="data-table-header">Placa</TableHead>
                  <TableHead className="data-table-header">Peso Vazio</TableHead>
                  <TableHead className="data-table-header">Volume</TableHead>
                  <TableHead className="data-table-header">Empresa</TableHead>
                  <TableHead className="data-table-header w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reboqueData && reboqueData.length > 0 ? (
                  reboqueData.map((row, idx) => (
                    <TableRow key={idx} className="data-table-row">
                      <TableCell className="font-semibold text-primary">{row.Prefixo_Cb}</TableCell>
                      <TableCell>{row.Descricao}</TableCell>
                      <TableCell>{row.Motorista || '-'}</TableCell>
                      <TableCell>{row.Modelo}</TableCell>
                      <TableCell className="font-mono">{row.Placa}</TableCell>
                      <TableCell>{row.Peso_Vazio}</TableCell>
                      <TableCell>{row.Volume}</TableCell>
                      <TableCell>{row.Empresa_Cb || row.Empresa}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                      Nenhum reboque encontrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
