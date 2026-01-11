import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DateFilter } from "@/components/shared/DateFilter";
import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Clock, 
  Truck,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Loader2,
  Pencil,
  Trash2,
  MoreHorizontal,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useHorimetros, useHorimetrosSummary, Horimetro } from "@/hooks/useHorimetros";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { HorimetroEditDialog } from "@/components/horimetros/HorimetroEditDialog";
import { HorimetroDeleteDialog } from "@/components/horimetros/HorimetroDeleteDialog";

export default function Horimetros() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editingHorimetro, setEditingHorimetro] = useState<Horimetro | null>(null);
  const [deletingHorimetro, setDeletingHorimetro] = useState<Horimetro | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  const { data: horimetros, isLoading, error, refetch, isFetching } = useHorimetros();

  const selectedDateStr = selectedDate 
    ? format(selectedDate, 'dd/MM/yyyy') 
    : null;

  const { 
    filteredData, 
    totalHoras, 
    equipamentosAtivos, 
    mediaHoras, 
    byEmpresa 
  } = useHorimetrosSummary(horimetros || [], selectedDateStr);

  const getStatus = (horas: number): "normal" | "alerta" | "critico" => {
    if (horas >= 12) return "critico";
    if (horas >= 10) return "alerta";
    return "normal";
  };

  const alertas = filteredData.filter(h => getStatus(h.horas_trabalhadas) !== "normal").length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "normal":
        return <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">Normal</Badge>;
      case "alerta":
        return <Badge className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20">Alerta</Badge>;
      case "critico":
        return <Badge className="bg-red-500/10 text-red-500 hover:bg-red-500/20">Crítico</Badge>;
      default:
        return <Badge variant="outline">-</Badge>;
    }
  };

  const handleEdit = (horimetro: Horimetro) => {
    setEditingHorimetro(horimetro);
    setEditDialogOpen(true);
  };

  const handleDelete = (horimetro: Horimetro) => {
    setDeletingHorimetro(horimetro);
    setDeleteDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center">
        <p className="text-red-500 mb-4">Erro ao carregar dados: {error.message}</p>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Horímetros</h1>
          <p className="text-muted-foreground">
            Controle de horas trabalhadas
            {selectedDate && ` - ${format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`}
          </p>
        </div>
        <div className="flex gap-2">
          <DateFilter 
            date={selectedDate} 
            onDateChange={setSelectedDate}
            placeholder="Filtrar por data"
            showClear={true}
          />
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Total de Horas</p>
                <p className="text-3xl font-bold">{totalHoras.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}h</p>
                <p className="text-xs text-muted-foreground">
                  {selectedDate ? 'no dia selecionado' : 'total na base'}
                </p>
              </div>
              <div className="rounded-lg bg-blue-500/10 p-3">
                <Clock className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Registros</p>
                <p className="text-3xl font-bold">{equipamentosAtivos}</p>
                <p className="text-xs text-muted-foreground">equipamentos/veículos</p>
              </div>
              <div className="rounded-lg bg-green-500/10 p-3">
                <Truck className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Média por Registro</p>
                <p className="text-3xl font-bold">{mediaHoras.toFixed(1)}h</p>
                <p className="text-xs text-muted-foreground">horas/registro</p>
              </div>
              <div className="rounded-lg bg-purple-500/10 p-3">
                <TrendingUp className="h-6 w-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Alertas (≥10h)</p>
                <p className="text-3xl font-bold">{alertas}</p>
                <p className="text-xs text-muted-foreground">registros</p>
              </div>
              <div className="rounded-lg bg-orange-500/10 p-3">
                <AlertTriangle className="h-6 w-6 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Horímetros */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Registros de Horímetros
            {isFetching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </CardTitle>
          <span className="text-sm text-muted-foreground">
            {filteredData.length} registros
          </span>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Veículo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Operador</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead className="text-right">Hor. Anterior</TableHead>
                  <TableHead className="text-right">Hor. Atual</TableHead>
                  <TableHead className="text-right">Horas Trab.</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      {selectedDate 
                        ? 'Nenhum registro encontrado para esta data'
                        : 'Nenhum registro encontrado'
                      }
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.slice(0, 100).map((registro) => (
                    <TableRow key={registro.id}>
                      <TableCell className="font-medium">{registro.data}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{registro.veiculo}</Badge>
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate" title={registro.descricao}>
                        {registro.descricao}
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate" title={registro.operador}>
                        {registro.operador}
                      </TableCell>
                      <TableCell>{registro.empresa}</TableCell>
                      <TableCell className="text-right">
                        {registro.horimetro_anterior !== null 
                          ? registro.horimetro_anterior.toLocaleString('pt-BR')
                          : '-'
                        }
                      </TableCell>
                      <TableCell className="text-right">
                        {registro.horimetro_atual !== null 
                          ? registro.horimetro_atual.toLocaleString('pt-BR')
                          : '-'
                        }
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16">
                            <Progress 
                              value={Math.min((registro.horas_trabalhadas / 12) * 100, 100)} 
                              className="h-2"
                            />
                          </div>
                          <span className="font-semibold w-10 text-right">
                            {registro.horas_trabalhadas.toFixed(1)}h
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(getStatus(registro.horas_trabalhadas))}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-popover">
                            <DropdownMenuItem onClick={() => handleEdit(registro)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(registro)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            {filteredData.length > 100 && (
              <p className="text-center text-sm text-muted-foreground mt-4">
                Mostrando 100 de {filteredData.length} registros
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Cards de Resumo por Empresa */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(byEmpresa)
          .sort((a, b) => b[1].horas - a[1].horas)
          .slice(0, 4)
          .map(([empresa, dados]) => (
            <Card key={empresa}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium truncate max-w-[120px]" title={empresa}>
                      {empresa}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {dados.equipamentos} registro{dados.equipamentos !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">
                      {dados.horas.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}h
                    </p>
                    <p className="text-xs text-muted-foreground">total</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>

      {/* Dialogs */}
      <HorimetroEditDialog
        horimetro={editingHorimetro}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />

      <HorimetroDeleteDialog
        horimetro={deletingHorimetro}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      />
    </div>
  );
}
