import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DateFilter } from "@/components/shared/DateFilter";
import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Fuel, 
  Droplet,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
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

interface Abastecimento {
  id: string;
  data: string;
  hora: string;
  veiculo: string;
  motorista: string;
  litros: number;
  fonte: string;
  kmAnterior: number;
  kmAtual: number;
}

export default function Abastecimentos() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTab, setSelectedTab] = useState("tanque01");

  // Dados mockados para exemplo
  const tanques = {
    tanque01: {
      nome: "Tanque Canteiro 01",
      capacidade: 10000,
      nivelAtual: 7500,
      abastecimentos: [
        { id: "1", data: "11/01/2026", hora: "07:30", veiculo: "CAM-001", motorista: "João Silva", litros: 150, fonte: "Tanque 01", kmAnterior: 45000, kmAtual: 45450 },
        { id: "2", data: "11/01/2026", hora: "09:15", veiculo: "CAM-003", motorista: "Pedro Santos", litros: 200, fonte: "Tanque 01", kmAnterior: 32000, kmAtual: 32380 },
        { id: "3", data: "11/01/2026", hora: "11:00", veiculo: "ESC-002", motorista: "Carlos Lima", litros: 180, fonte: "Tanque 01", kmAnterior: 0, kmAtual: 0 },
        { id: "4", data: "11/01/2026", hora: "14:30", veiculo: "CAM-005", motorista: "Ana Costa", litros: 220, fonte: "Tanque 01", kmAnterior: 28000, kmAtual: 28400 },
      ] as Abastecimento[],
    },
    tanque02: {
      nome: "Tanque Canteiro 02",
      capacidade: 10000,
      nivelAtual: 3200,
      abastecimentos: [
        { id: "5", data: "11/01/2026", hora: "08:00", veiculo: "CAM-007", motorista: "Maria Oliveira", litros: 180, fonte: "Tanque 02", kmAnterior: 51000, kmAtual: 51350 },
        { id: "6", data: "11/01/2026", hora: "10:45", veiculo: "RET-001", motorista: "José Ferreira", litros: 250, fonte: "Tanque 02", kmAnterior: 0, kmAtual: 0 },
      ] as Abastecimento[],
    },
    comboio01: {
      nome: "Comboio 01",
      capacidade: 5000,
      nivelAtual: 4800,
      abastecimentos: [
        { id: "7", data: "11/01/2026", hora: "06:30", veiculo: "CAM-002", motorista: "Roberto Alves", litros: 120, fonte: "Comboio 01", kmAnterior: 67000, kmAtual: 67280 },
        { id: "8", data: "11/01/2026", hora: "13:00", veiculo: "ESC-003", motorista: "Fernando Souza", litros: 200, fonte: "Comboio 01", kmAnterior: 0, kmAtual: 0 },
      ] as Abastecimento[],
    },
    comboio02: {
      nome: "Comboio 02",
      capacidade: 5000,
      nivelAtual: 2100,
      abastecimentos: [
        { id: "9", data: "11/01/2026", hora: "07:00", veiculo: "CAM-004", motorista: "Marcos Dias", litros: 180, fonte: "Comboio 02", kmAnterior: 89000, kmAtual: 89350 },
      ] as Abastecimento[],
    },
    comboio03: {
      nome: "Comboio 03",
      capacidade: 5000,
      nivelAtual: 4200,
      abastecimentos: [
        { id: "10", data: "11/01/2026", hora: "08:30", veiculo: "CAM-006", motorista: "Paulo Mendes", litros: 150, fonte: "Comboio 03", kmAnterior: 42000, kmAtual: 42300 },
        { id: "11", data: "11/01/2026", hora: "15:00", veiculo: "RET-002", motorista: "Lucas Pereira", litros: 280, fonte: "Comboio 03", kmAnterior: 0, kmAtual: 0 },
      ] as Abastecimento[],
    },
  };

  const currentTanque = tanques[selectedTab as keyof typeof tanques];
  const totalAbastecido = currentTanque.abastecimentos.reduce((acc, ab) => acc + ab.litros, 0);
  const percentualNivel = (currentTanque.nivelAtual / currentTanque.capacidade) * 100;

  const getStatusColor = (percentual: number) => {
    if (percentual > 50) return "text-green-500";
    if (percentual > 25) return "text-yellow-500";
    return "text-red-500";
  };

  const getStatusBg = (percentual: number) => {
    if (percentual > 50) return "bg-green-500";
    if (percentual > 25) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Abastecimentos</h1>
          <p className="text-muted-foreground">
            Movimentações de combustível - {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
        <DateFilter date={selectedDate} onDateChange={(d) => d && setSelectedDate(d)} />
      </div>

      {/* Tabs para cada fonte */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="tanque01" className="text-xs sm:text-sm">Tanque 01</TabsTrigger>
          <TabsTrigger value="tanque02" className="text-xs sm:text-sm">Tanque 02</TabsTrigger>
          <TabsTrigger value="comboio01" className="text-xs sm:text-sm">Comboio 01</TabsTrigger>
          <TabsTrigger value="comboio02" className="text-xs sm:text-sm">Comboio 02</TabsTrigger>
          <TabsTrigger value="comboio03" className="text-xs sm:text-sm">Comboio 03</TabsTrigger>
        </TabsList>

        {Object.entries(tanques).map(([key, tanque]) => (
          <TabsContent key={key} value={key} className="space-y-6">
            {/* KPIs do Tanque/Comboio */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Nível Atual</p>
                      <p className="text-3xl font-bold">{tanque.nivelAtual.toLocaleString()}L</p>
                      <p className="text-xs text-muted-foreground">de {tanque.capacidade.toLocaleString()}L</p>
                    </div>
                    <div className="rounded-lg bg-blue-500/10 p-3">
                      <Droplet className="h-6 w-6 text-blue-500" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div 
                        className={`h-2 rounded-full transition-all ${getStatusBg(percentualNivel)}`}
                        style={{ width: `${percentualNivel}%` }}
                      />
                    </div>
                    <p className={`mt-1 text-sm font-medium ${getStatusColor(percentualNivel)}`}>
                      {percentualNivel.toFixed(1)}% cheio
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Abastecimentos Hoje</p>
                      <p className="text-3xl font-bold">{tanque.abastecimentos.length}</p>
                      <p className="text-xs text-muted-foreground">operações realizadas</p>
                    </div>
                    <div className="rounded-lg bg-green-500/10 p-3">
                      <Fuel className="h-6 w-6 text-green-500" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-1">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium text-green-500">Ativo</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Total Abastecido</p>
                      <p className="text-3xl font-bold">{totalAbastecido.toLocaleString()}L</p>
                      <p className="text-xs text-muted-foreground">volume do dia</p>
                    </div>
                    <div className="rounded-lg bg-orange-500/10 p-3">
                      <ArrowUpRight className="h-6 w-6 text-orange-500" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-1">
                    <ArrowDownRight className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-medium text-muted-foreground">Saída</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Média por Abast.</p>
                      <p className="text-3xl font-bold">
                        {tanque.abastecimentos.length > 0 
                          ? Math.round(totalAbastecido / tanque.abastecimentos.length)
                          : 0}L
                      </p>
                      <p className="text-xs text-muted-foreground">litros/operação</p>
                    </div>
                    <div className="rounded-lg bg-purple-500/10 p-3">
                      <TrendingUp className="h-6 w-6 text-purple-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabela de Abastecimentos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Fuel className="h-5 w-5" />
                  {tanque.nome} - Movimentações do Dia
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Hora</TableHead>
                        <TableHead>Veículo</TableHead>
                        <TableHead>Motorista/Operador</TableHead>
                        <TableHead className="text-right">Litros</TableHead>
                        <TableHead className="text-right">KM Anterior</TableHead>
                        <TableHead className="text-right">KM Atual</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tanque.abastecimentos.map((abastecimento) => (
                        <TableRow key={abastecimento.id}>
                          <TableCell className="font-medium">{abastecimento.hora}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{abastecimento.veiculo}</Badge>
                          </TableCell>
                          <TableCell>{abastecimento.motorista}</TableCell>
                          <TableCell className="text-right font-semibold text-green-600">
                            {abastecimento.litros}L
                          </TableCell>
                          <TableCell className="text-right">
                            {abastecimento.kmAnterior > 0 ? abastecimento.kmAnterior.toLocaleString() : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            {abastecimento.kmAtual > 0 ? abastecimento.kmAtual.toLocaleString() : '-'}
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
                              Sincronizado
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
