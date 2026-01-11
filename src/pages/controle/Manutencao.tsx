import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DateFilter } from "@/components/shared/DateFilter";
import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Wrench, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Truck,
  Calendar,
  FileText,
  Plus,
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
import { Button } from "@/components/ui/button";

interface OrdemServico {
  id: string;
  numero: string;
  veiculo: string;
  descricaoVeiculo: string;
  tipo: "preventiva" | "corretiva";
  prioridade: "baixa" | "media" | "alta" | "urgente";
  status: "aberta" | "em_andamento" | "aguardando_pecas" | "concluida";
  problemaRelatado: string;
  mecanico: string;
  dataAbertura: string;
  previsaoConclusao: string;
}

export default function Manutencao() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTab, setSelectedTab] = useState("todas");

  // Dados mockados
  const ordensServico: OrdemServico[] = [
    { id: "1", numero: "OS-2026-001", veiculo: "CAM-001", descricaoVeiculo: "Caminhão Mercedes Atego", tipo: "preventiva", prioridade: "media", status: "em_andamento", problemaRelatado: "Troca de óleo e filtros programada", mecanico: "José Ferreira", dataAbertura: "10/01/2026", previsaoConclusao: "11/01/2026" },
    { id: "2", numero: "OS-2026-002", veiculo: "ESC-002", descricaoVeiculo: "Escavadeira CAT 320", tipo: "corretiva", prioridade: "alta", status: "aguardando_pecas", problemaRelatado: "Vazamento no sistema hidráulico", mecanico: "Carlos Lima", dataAbertura: "09/01/2026", previsaoConclusao: "12/01/2026" },
    { id: "3", numero: "OS-2026-003", veiculo: "CAM-005", descricaoVeiculo: "Caminhão Volvo FMX", tipo: "preventiva", prioridade: "baixa", status: "aberta", problemaRelatado: "Revisão de 50.000km", mecanico: "A definir", dataAbertura: "11/01/2026", previsaoConclusao: "13/01/2026" },
    { id: "4", numero: "OS-2026-004", veiculo: "RET-001", descricaoVeiculo: "Retroescavadeira JCB 3CX", tipo: "corretiva", prioridade: "urgente", status: "em_andamento", problemaRelatado: "Falha no motor - não liga", mecanico: "Roberto Alves", dataAbertura: "11/01/2026", previsaoConclusao: "11/01/2026" },
    { id: "5", numero: "OS-2026-005", veiculo: "MOT-001", descricaoVeiculo: "Motoniveladora CAT 120", tipo: "preventiva", prioridade: "media", status: "concluida", problemaRelatado: "Troca de lâmina e ajuste de nivelamento", mecanico: "Fernando Souza", dataAbertura: "08/01/2026", previsaoConclusao: "10/01/2026" },
    { id: "6", numero: "OS-2026-006", veiculo: "CAR-001", descricaoVeiculo: "Carregadeira CAT 966", tipo: "corretiva", prioridade: "alta", status: "em_andamento", problemaRelatado: "Problema na transmissão - ruído anormal", mecanico: "José Ferreira", dataAbertura: "10/01/2026", previsaoConclusao: "12/01/2026" },
  ];

  const getFilteredOrdens = () => {
    if (selectedTab === "todas") return ordensServico;
    return ordensServico.filter(os => os.status === selectedTab);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "aberta":
        return <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20">Aberta</Badge>;
      case "em_andamento":
        return <Badge className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20">Em Andamento</Badge>;
      case "aguardando_pecas":
        return <Badge className="bg-orange-500/10 text-orange-500 hover:bg-orange-500/20">Aguard. Peças</Badge>;
      case "concluida":
        return <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">Concluída</Badge>;
      default:
        return <Badge variant="outline">-</Badge>;
    }
  };

  const getPrioridadeBadge = (prioridade: string) => {
    switch (prioridade) {
      case "baixa":
        return <Badge variant="outline" className="border-green-500 text-green-500">Baixa</Badge>;
      case "media":
        return <Badge variant="outline" className="border-yellow-500 text-yellow-500">Média</Badge>;
      case "alta":
        return <Badge variant="outline" className="border-orange-500 text-orange-500">Alta</Badge>;
      case "urgente":
        return <Badge variant="outline" className="border-red-500 text-red-500">Urgente</Badge>;
      default:
        return <Badge variant="outline">-</Badge>;
    }
  };

  const getTipoBadge = (tipo: string) => {
    switch (tipo) {
      case "preventiva":
        return <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20">Preventiva</Badge>;
      case "corretiva":
        return <Badge className="bg-red-500/10 text-red-500 hover:bg-red-500/20">Corretiva</Badge>;
      default:
        return <Badge variant="outline">-</Badge>;
    }
  };

  const countByStatus = (status: string) => ordensServico.filter(os => os.status === status).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Manutenção</h1>
          <p className="text-muted-foreground">
            Gestão de ordens de serviço - {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
        <div className="flex gap-2">
          <DateFilter date={selectedDate} onDateChange={(d) => d && setSelectedDate(d)} />
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nova OS
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">OS Abertas</p>
                <p className="text-3xl font-bold">{countByStatus("aberta")}</p>
                <p className="text-xs text-muted-foreground">aguardando início</p>
              </div>
              <div className="rounded-lg bg-blue-500/10 p-3">
                <FileText className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Em Andamento</p>
                <p className="text-3xl font-bold">{countByStatus("em_andamento")}</p>
                <p className="text-xs text-muted-foreground">em execução</p>
              </div>
              <div className="rounded-lg bg-yellow-500/10 p-3">
                <Wrench className="h-6 w-6 text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Aguard. Peças</p>
                <p className="text-3xl font-bold">{countByStatus("aguardando_pecas")}</p>
                <p className="text-xs text-muted-foreground">pendentes</p>
              </div>
              <div className="rounded-lg bg-orange-500/10 p-3">
                <Clock className="h-6 w-6 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Concluídas Hoje</p>
                <p className="text-3xl font-bold">{countByStatus("concluida")}</p>
                <p className="text-xs text-muted-foreground">finalizadas</p>
              </div>
              <div className="rounded-lg bg-green-500/10 p-3">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs e Tabela */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Ordens de Serviço
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="todas">Todas ({ordensServico.length})</TabsTrigger>
              <TabsTrigger value="aberta">Abertas ({countByStatus("aberta")})</TabsTrigger>
              <TabsTrigger value="em_andamento">Em Andamento ({countByStatus("em_andamento")})</TabsTrigger>
              <TabsTrigger value="aguardando_pecas">Aguard. Peças ({countByStatus("aguardando_pecas")})</TabsTrigger>
              <TabsTrigger value="concluida">Concluídas ({countByStatus("concluida")})</TabsTrigger>
            </TabsList>

            <TabsContent value={selectedTab}>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nº OS</TableHead>
                      <TableHead>Veículo</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Prioridade</TableHead>
                      <TableHead>Problema</TableHead>
                      <TableHead>Mecânico</TableHead>
                      <TableHead>Abertura</TableHead>
                      <TableHead>Previsão</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getFilteredOrdens().map((os) => (
                      <TableRow key={os.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell className="font-medium">{os.numero}</TableCell>
                        <TableCell>
                          <div>
                            <Badge variant="outline">{os.veiculo}</Badge>
                            <p className="mt-1 text-xs text-muted-foreground">{os.descricaoVeiculo}</p>
                          </div>
                        </TableCell>
                        <TableCell>{getTipoBadge(os.tipo)}</TableCell>
                        <TableCell>{getPrioridadeBadge(os.prioridade)}</TableCell>
                        <TableCell className="max-w-[200px] truncate" title={os.problemaRelatado}>
                          {os.problemaRelatado}
                        </TableCell>
                        <TableCell>{os.mecanico}</TableCell>
                        <TableCell>{os.dataAbertura}</TableCell>
                        <TableCell>{os.previsaoConclusao}</TableCell>
                        <TableCell>{getStatusBadge(os.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Resumo por Tipo */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-5 w-5 text-blue-500" />
              Manutenções Preventivas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {ordensServico.filter(os => os.tipo === "preventiva").map((os) => (
                <div key={os.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                      <Truck className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-medium">{os.veiculo}</p>
                      <p className="text-sm text-muted-foreground">{os.problemaRelatado}</p>
                    </div>
                  </div>
                  {getStatusBadge(os.status)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Manutenções Corretivas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {ordensServico.filter(os => os.tipo === "corretiva").map((os) => (
                <div key={os.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
                      <Truck className="h-5 w-5 text-red-500" />
                    </div>
                    <div>
                      <p className="font-medium">{os.veiculo}</p>
                      <p className="text-sm text-muted-foreground">{os.problemaRelatado}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getPrioridadeBadge(os.prioridade)}
                    {getStatusBadge(os.status)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
