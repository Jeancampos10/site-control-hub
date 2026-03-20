import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DateFilter } from "@/components/shared/DateFilter";
import { useState, useMemo } from "react";
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
import { useManutencoes, OrdemServico } from "@/hooks/useManutencoes";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { NovaOrdemServicoDialog } from "@/components/manutencao/NovaOrdemServicoDialog";

export default function Manutencao() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTab, setSelectedTab] = useState("todas");
  const [novaOSOpen, setNovaOSOpen] = useState(false);
  const { data: ordens, isLoading } = useManutencoes();

  const ordensServico = ordens || [];

  const getFilteredOrdens = () => {
    if (selectedTab === "todas") return ordensServico;
    return ordensServico.filter(os => os.status.toLowerCase().replace(/\s+/g, '_') === selectedTab || os.status === selectedTab);
  };

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes("aberta") || s.includes("aberto")) return <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20">Aberta</Badge>;
    if (s.includes("andamento")) return <Badge className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20">Em Andamento</Badge>;
    if (s.includes("aguard") || s.includes("peça")) return <Badge className="bg-orange-500/10 text-orange-500 hover:bg-orange-500/20">Aguard. Peças</Badge>;
    if (s.includes("conclu") || s.includes("finaliz")) return <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">Concluída</Badge>;
    return <Badge variant="outline">{status}</Badge>;
  };

  const getPrioridadeBadge = (prioridade: string) => {
    const p = prioridade.toLowerCase();
    if (p.includes("baixa")) return <Badge variant="outline" className="border-green-500 text-green-500">Baixa</Badge>;
    if (p.includes("méd") || p === "média" || p === "media") return <Badge variant="outline" className="border-yellow-500 text-yellow-500">Média</Badge>;
    if (p.includes("alta")) return <Badge variant="outline" className="border-orange-500 text-orange-500">Alta</Badge>;
    if (p.includes("urgente") || p.includes("crítica")) return <Badge variant="outline" className="border-red-500 text-red-500">Urgente</Badge>;
    return <Badge variant="outline">{prioridade}</Badge>;
  };

  const getTipoBadge = (tipo: string) => {
    const t = tipo.toLowerCase();
    if (t.includes("prevent")) return <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20">Preventiva</Badge>;
    if (t.includes("corret")) return <Badge className="bg-red-500/10 text-red-500 hover:bg-red-500/20">Corretiva</Badge>;
    return <Badge variant="outline">{tipo}</Badge>;
  };

  const countByStatus = (keyword: string) => ordensServico.filter(os => os.status.toLowerCase().includes(keyword)).length;
  const totalAbertas = countByStatus("aberta") + countByStatus("aberto");
  const totalAndamento = countByStatus("andamento");
  const totalAguardando = countByStatus("aguard") + countByStatus("peça");
  const totalConcluidas = countByStatus("conclu") + countByStatus("finaliz");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Manutenção</h1>
          <p className="text-muted-foreground">
            Gestão de ordens de serviço — {ordensServico.length} registros
          </p>
        </div>
        <div className="flex gap-2">
          <DateFilter date={selectedDate} onDateChange={(d) => d && setSelectedDate(d)} />
          <Button className="gap-2" onClick={() => setNovaOSOpen(true)}>
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
                <p className="text-3xl font-bold">{totalAbertas}</p>
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
                <p className="text-3xl font-bold">{totalAndamento}</p>
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
                <p className="text-3xl font-bold">{totalAguardando}</p>
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
                <p className="text-sm font-medium text-muted-foreground">Concluídas</p>
                <p className="text-3xl font-bold">{totalConcluidas}</p>
                <p className="text-xs text-muted-foreground">finalizadas</p>
              </div>
              <div className="rounded-lg bg-green-500/10 p-3">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><LoadingSpinner /></div>
      ) : (
        <>
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
                  <TabsTrigger value="aberta">Abertas ({totalAbertas})</TabsTrigger>
                  <TabsTrigger value="em_andamento">Em Andamento ({totalAndamento})</TabsTrigger>
                  <TabsTrigger value="aguardando">Aguard. Peças ({totalAguardando})</TabsTrigger>
                  <TabsTrigger value="concluida">Concluídas ({totalConcluidas})</TabsTrigger>
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
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getFilteredOrdens().length > 0 ? getFilteredOrdens().map((os) => (
                          <TableRow key={os.id} className="cursor-pointer hover:bg-muted/50">
                            <TableCell className="font-medium">OS-{os.numero_os}</TableCell>
                            <TableCell>
                              <div>
                                <Badge variant="outline">{os.veiculo}</Badge>
                                {os.descricao_veiculo && <p className="mt-1 text-xs text-muted-foreground">{os.descricao_veiculo}</p>}
                              </div>
                            </TableCell>
                            <TableCell>{getTipoBadge(os.tipo)}</TableCell>
                            <TableCell>{getPrioridadeBadge(os.prioridade)}</TableCell>
                            <TableCell className="max-w-[200px] truncate" title={os.problema_relatado}>
                              {os.problema_relatado}
                            </TableCell>
                            <TableCell>{os.mecanico_responsavel || "—"}</TableCell>
                            <TableCell>{os.data_abertura}</TableCell>
                            <TableCell>{getStatusBadge(os.status)}</TableCell>
                          </TableRow>
                        )) : (
                          <TableRow>
                            <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                              Nenhuma ordem de serviço encontrada. Clique em "Nova OS" para criar.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Resumo por Tipo */}
          {ordensServico.length > 0 && (
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
                    {ordensServico.filter(os => os.tipo.toLowerCase().includes("prevent")).length > 0 ? (
                      ordensServico.filter(os => os.tipo.toLowerCase().includes("prevent")).map((os) => (
                        <div key={os.id} className="flex items-center justify-between rounded-lg border p-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                              <Truck className="h-5 w-5 text-blue-500" />
                            </div>
                            <div>
                              <p className="font-medium">{os.veiculo}</p>
                              <p className="text-sm text-muted-foreground">{os.problema_relatado}</p>
                            </div>
                          </div>
                          {getStatusBadge(os.status)}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">Nenhuma preventiva registrada</p>
                    )}
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
                    {ordensServico.filter(os => os.tipo.toLowerCase().includes("corret")).length > 0 ? (
                      ordensServico.filter(os => os.tipo.toLowerCase().includes("corret")).map((os) => (
                        <div key={os.id} className="flex items-center justify-between rounded-lg border p-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
                              <Truck className="h-5 w-5 text-red-500" />
                            </div>
                            <div>
                              <p className="font-medium">{os.veiculo}</p>
                              <p className="text-sm text-muted-foreground">{os.problema_relatado}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getPrioridadeBadge(os.prioridade)}
                            {getStatusBadge(os.status)}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">Nenhuma corretiva registrada</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}
