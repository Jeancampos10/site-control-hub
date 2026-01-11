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
  CheckCircle,
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

interface HorimetroRegistro {
  id: string;
  veiculo: string;
  descricao: string;
  horimetroAnterior: number;
  horimetroAtual: number;
  horasTrabalhadas: number;
  operador: string;
  obra: string;
  status: "normal" | "alerta" | "critico";
}

export default function Horimetros() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Dados mockados
  const registros: HorimetroRegistro[] = [
    { id: "1", veiculo: "ESC-001", descricao: "Escavadeira Volvo EC210", horimetroAnterior: 4520, horimetroAtual: 4528, horasTrabalhadas: 8, operador: "Carlos Lima", obra: "Pedreira Norte", status: "normal" },
    { id: "2", veiculo: "ESC-002", descricao: "Escavadeira CAT 320", horimetroAnterior: 3890, horimetroAtual: 3897, horasTrabalhadas: 7, operador: "João Silva", obra: "Pedreira Sul", status: "normal" },
    { id: "3", veiculo: "CAR-001", descricao: "Carregadeira CAT 966", horimetroAnterior: 5210, horimetroAtual: 5219, horasTrabalhadas: 9, operador: "Pedro Santos", obra: "Britagem", status: "alerta" },
    { id: "4", veiculo: "RET-001", descricao: "Retroescavadeira JCB", horimetroAnterior: 2340, horimetroAtual: 2346, horasTrabalhadas: 6, operador: "Roberto Alves", obra: "Manutenção Vias", status: "normal" },
    { id: "5", veiculo: "MOT-001", descricao: "Motoniveladora CAT 120", horimetroAnterior: 6780, horimetroAtual: 6788, horasTrabalhadas: 8, operador: "Fernando Souza", obra: "Terraplanagem", status: "critico" },
    { id: "6", veiculo: "ROL-001", descricao: "Rolo Compactador BOMAG", horimetroAnterior: 1890, horimetroAtual: 1898, horasTrabalhadas: 8, operador: "Marcos Dias", obra: "Terraplanagem", status: "normal" },
    { id: "7", veiculo: "TRA-001", descricao: "Trator de Esteira D6", horimetroAnterior: 4120, horimetroAtual: 4127, horasTrabalhadas: 7, operador: "Paulo Mendes", obra: "Desmate", status: "normal" },
    { id: "8", veiculo: "GER-001", descricao: "Gerador 150kVA", horimetroAnterior: 8920, horimetroAtual: 8932, horasTrabalhadas: 12, operador: "Lucas Pereira", obra: "Britagem", status: "alerta" },
  ];

  const totalHoras = registros.reduce((acc, r) => acc + r.horasTrabalhadas, 0);
  const mediaHoras = totalHoras / registros.length;
  const equipamentosAtivos = registros.length;
  const alertas = registros.filter(r => r.status !== "normal").length;

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

  const getProgressColor = (horas: number) => {
    if (horas >= 10) return "bg-red-500";
    if (horas >= 8) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Horímetros</h1>
          <p className="text-muted-foreground">
            Controle de horas trabalhadas - {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
        <DateFilter date={selectedDate} onDateChange={(d) => d && setSelectedDate(d)} />
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Total de Horas</p>
                <p className="text-3xl font-bold">{totalHoras}h</p>
                <p className="text-xs text-muted-foreground">horas trabalhadas hoje</p>
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
                <p className="text-sm font-medium text-muted-foreground">Equipamentos Ativos</p>
                <p className="text-3xl font-bold">{equipamentosAtivos}</p>
                <p className="text-xs text-muted-foreground">em operação</p>
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
                <p className="text-sm font-medium text-muted-foreground">Média por Equipamento</p>
                <p className="text-3xl font-bold">{mediaHoras.toFixed(1)}h</p>
                <p className="text-xs text-muted-foreground">horas/equipamento</p>
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
                <p className="text-sm font-medium text-muted-foreground">Alertas de Revisão</p>
                <p className="text-3xl font-bold">{alertas}</p>
                <p className="text-xs text-muted-foreground">equipamentos</p>
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
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Registros de Horímetros do Dia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Veículo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Operador</TableHead>
                  <TableHead>Obra</TableHead>
                  <TableHead className="text-right">Hor. Anterior</TableHead>
                  <TableHead className="text-right">Hor. Atual</TableHead>
                  <TableHead className="text-right">Horas Trab.</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {registros.map((registro) => (
                  <TableRow key={registro.id}>
                    <TableCell>
                      <Badge variant="outline">{registro.veiculo}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{registro.descricao}</TableCell>
                    <TableCell>{registro.operador}</TableCell>
                    <TableCell>{registro.obra}</TableCell>
                    <TableCell className="text-right">{registro.horimetroAnterior.toLocaleString()}h</TableCell>
                    <TableCell className="text-right">{registro.horimetroAtual.toLocaleString()}h</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16">
                          <Progress 
                            value={(registro.horasTrabalhadas / 12) * 100} 
                            className="h-2"
                          />
                        </div>
                        <span className="font-semibold">{registro.horasTrabalhadas}h</span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(registro.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Resumo por Obra */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { obra: "Pedreira Norte", horas: 15, equipamentos: 2 },
          { obra: "Pedreira Sul", horas: 7, equipamentos: 1 },
          { obra: "Britagem", horas: 21, equipamentos: 2 },
          { obra: "Terraplanagem", horas: 16, equipamentos: 2 },
        ].map((resumo) => (
          <Card key={resumo.obra}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{resumo.obra}</p>
                  <p className="text-sm text-muted-foreground">{resumo.equipamentos} equipamentos</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">{resumo.horas}h</p>
                  <p className="text-xs text-muted-foreground">total</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
