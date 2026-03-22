import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DateFilter } from "@/components/shared/DateFilter";
import { useState, useMemo } from "react";
import { NovoAbastecimentoDialog } from "@/components/abastecimentos/NovoAbastecimentoDialog";
import { ConfigEstoqueDialog } from "@/components/abastecimentos/ConfigEstoqueDialog";
import { NovaEntradaDialog } from "@/components/abastecimentos/NovaEntradaDialog";
import { ExportButtons } from "@/components/shared/ExportButtons";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Fuel, Droplet, TrendingUp, ArrowUpRight, RefreshCw,
  MoreHorizontal, Pencil, Trash2, BarChart3, Package, Settings2,
  Plus, AlertTriangle,
} from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAbastecimentos, Abastecimento } from "@/hooks/useAbastecimentos";
import { useSaldoEstoque, useEntradasCombustivel, useDeleteEntrada } from "@/hooks/useEstoqueCombustivel";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { AbastecimentoEditDialog } from "@/components/abastecimentos/AbastecimentoEditDialog";
import { AbastecimentoDeleteDialog } from "@/components/abastecimentos/AbastecimentoDeleteDialog";
import { formatBR } from "@/lib/formatters";

interface SourceConfig {
  key: string;
  label: string;
}

const SOURCES: SourceConfig[] = [
  { key: "tanque01", label: "Tanque 01" },
  { key: "tanque02", label: "Tanque 02" },
  { key: "comboio01", label: "CC-01" },
  { key: "comboio02", label: "CC-02" },
  { key: "comboio03", label: "CC-03" },
];

/* ─── Painel de Estoque Real ─── */
function EstoquePanel() {
  const saldos = useSaldoEstoque();
  const [configOpen, setConfigOpen] = useState(false);

  if (saldos.length === 0) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-8 text-center">
            <Droplet className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
            <h3 className="font-semibold text-lg mb-1">Nenhum estoque configurado</h3>
            <p className="text-sm text-muted-foreground mb-4">Configure o estoque inicial dos tanques e comboios para começar o controle.</p>
            <Button onClick={() => setConfigOpen(true)} className="gap-2">
              <Settings2 className="h-4 w-4" /> Configurar Estoque Inicial
            </Button>
          </CardContent>
        </Card>
        <ConfigEstoqueDialog open={configOpen} onOpenChange={setConfigOpen} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => setConfigOpen(true)} className="gap-2">
          <Settings2 className="h-4 w-4" /> Configurar Estoque
        </Button>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {saldos.map((s) => {
          const statusColor = s.percentual > 50 ? "text-green-600" : s.percentual > 25 ? "text-yellow-600" : "text-red-600";
          const barColor = s.percentual > 50 ? "bg-green-500" : s.percentual > 25 ? "bg-yellow-500" : "bg-red-500";
          const sourceLabel = SOURCES.find(src => src.key === s.local_estoque)?.label || s.local_estoque;

          return (
            <Card key={s.local_estoque}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Droplet className="h-4 w-4 text-blue-500" />
                    <span className="font-semibold text-sm">{sourceLabel}</span>
                  </div>
                  <span className={`text-sm font-bold ${statusColor}`}>{s.percentual.toFixed(0)}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div className={`h-2 rounded-full transition-all ${barColor}`} style={{ width: `${Math.min(s.percentual, 100)}%` }} />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {formatBR(s.saldo_atual, 0)}L / {formatBR(s.capacidade, 0)}L
                </p>
                {s.percentual < 20 && (
                  <div className="flex items-center gap-1 mt-2 text-xs text-destructive">
                    <AlertTriangle className="h-3 w-3" /> Estoque baixo!
                  </div>
                )}
                <div className="mt-3 pt-3 border-t grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">Entradas</p>
                    <p className="font-semibold text-green-600">+{formatBR(s.total_entradas, 0)}L</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Saídas</p>
                    <p className="font-semibold text-orange-600">-{formatBR(s.total_saidas, 0)}L</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Export */}
      <div className="flex justify-end">
        <ExportButtons
          data={saldos.map(s => ({
            local: SOURCES.find(src => src.key === s.local_estoque)?.label || s.local_estoque,
            tipo: s.tipo_combustivel,
            capacidade: s.capacidade,
            estoque_inicial: s.quantidade_inicial,
            entradas: s.total_entradas,
            saidas: s.total_saidas,
            saldo: s.saldo_atual,
          }))}
          columns={[
            { key: "local", label: "Local" },
            { key: "tipo", label: "Combustível" },
            { key: "capacidade", label: "Capacidade", format: "number" },
            { key: "estoque_inicial", label: "Estoque Inicial", format: "number" },
            { key: "entradas", label: "Entradas", format: "number" },
            { key: "saidas", label: "Saídas", format: "number" },
            { key: "saldo", label: "Saldo Atual", format: "number" },
          ]}
          title="Controle de Estoque de Combustível"
          fileName="estoque_combustivel"
          totals={{
            entradas: saldos.reduce((a, s) => a + s.total_entradas, 0),
            saidas: saldos.reduce((a, s) => a + s.total_saidas, 0),
            saldo: saldos.reduce((a, s) => a + s.saldo_atual, 0),
          }}
        />
      </div>

      <ConfigEstoqueDialog open={configOpen} onOpenChange={setConfigOpen} />
    </div>
  );
}

/* ─── Tab de Lançamento ─── */
function LancamentoTab({ selectedDate }: { selectedDate: Date | null }) {
  const [selectedTab, setSelectedTab] = useState("tanque01");
  const { data: abastecimentos, isLoading, error, refetch, isFetching } = useAbastecimentos(selectedTab);
  const saldos = useSaldoEstoque();

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAbastecimento, setSelectedAbastecimento] = useState<Abastecimento | null>(null);

  const saldoAtual = saldos.find(s => s.local_estoque === selectedTab);

  const filteredData = useMemo(() => {
    if (!abastecimentos) return [];
    if (!selectedDate) return abastecimentos;
    const targetDate = format(selectedDate, "yyyy-MM-dd");
    return abastecimentos.filter(ab => {
      if (!ab.data) return false;
      const isoMatch = ab.data.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (isoMatch) return ab.data.startsWith(targetDate);
      const brMatch = ab.data.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      if (brMatch) return `${brMatch[3]}-${brMatch[2].padStart(2, "0")}-${brMatch[1].padStart(2, "0")}` === targetDate;
      return false;
    });
  }, [abastecimentos, selectedDate]);

  if (isLoading) return <div className="flex items-center justify-center py-12"><LoadingSpinner /></div>;
  if (error) return <div className="py-12 text-center"><p className="text-red-500 mb-4">Erro: {(error as any).message}</p><Button onClick={() => refetch()} variant="outline"><RefreshCw className="h-4 w-4 mr-2" />Tentar novamente</Button></div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        {SOURCES.map((source) => (
          <Button key={source.key} variant={selectedTab === source.key ? "default" : "outline"} size="sm" onClick={() => setSelectedTab(source.key)}>
            {source.label}
          </Button>
        ))}
        {saldoAtual && (
          <Badge variant={saldoAtual.percentual < 20 ? "destructive" : "secondary"} className="ml-auto">
            Saldo: {formatBR(saldoAtual.saldo_atual, 0)}L ({saldoAtual.percentual.toFixed(0)}%)
          </Badge>
        )}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-3">
          <CardTitle className="text-sm font-semibold">Saídas (Abastecimentos)</CardTitle>
          <div className="flex gap-2">
            <ExportButtons
              data={filteredData}
              columns={[
                { key: "data", label: "Data" },
                { key: "veiculo", label: "Veículo" },
                { key: "motorista", label: "Motorista" },
                { key: "quantidade", label: "Litros", format: "number" },
                { key: "horimetro_anterior", label: "Hor/Km Ant.", format: "number" },
                { key: "horimetro_atual", label: "Hor/Km Atual", format: "number" },
              ]}
              title="Saídas de Combustível"
              fileName="saidas_combustivel"
              totals={{ quantidade: filteredData.reduce((a, b) => a + (b.quantidade || 0), 0) }}
            />
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hora</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Veículo</TableHead>
                  <TableHead>Mot/Operador</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Hor/Km Ant.</TableHead>
                  <TableHead className="text-right">Hor/Km Atual</TableHead>
                  <TableHead className="text-right">Litros</TableHead>
                  <TableHead className="w-[50px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      {selectedDate ? "Nenhum registro para esta data" : "Nenhum registro encontrado"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.slice(0, 50).map((ab) => (
                    <TableRow key={ab.id}>
                      <TableCell><Badge variant="outline">{ab.hora || "-"}</Badge></TableCell>
                      <TableCell className="font-medium">{ab.data}</TableCell>
                      <TableCell><Badge variant="secondary">{ab.veiculo}</Badge></TableCell>
                      <TableCell>{ab.motorista || "-"}</TableCell>
                      <TableCell>{ab.descricao || "-"}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{ab.horimetro_anterior || ab.km_anterior || "-"}</TableCell>
                      <TableCell className="text-right font-medium">{ab.horimetro_atual || ab.km_atual || "-"}</TableCell>
                      <TableCell className="text-right font-semibold text-green-600">{ab.quantidade?.toLocaleString("pt-BR")}L</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-popover">
                            <DropdownMenuItem onClick={() => { setSelectedAbastecimento(ab); setEditDialogOpen(true); }}>
                              <Pencil className="mr-2 h-4 w-4" />Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setSelectedAbastecimento(ab); setDeleteDialogOpen(true); }} className="text-destructive focus:text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            {filteredData.length > 50 && (
              <p className="text-center text-sm text-muted-foreground mt-4">Mostrando 50 de {filteredData.length} registros</p>
            )}
          </div>
        </CardContent>
      </Card>

      <AbastecimentoEditDialog open={editDialogOpen} onOpenChange={setEditDialogOpen} abastecimento={selectedAbastecimento} source={selectedTab} />
      <AbastecimentoDeleteDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} abastecimento={selectedAbastecimento} source={selectedTab} />
    </div>
  );
}

/* ─── Consumo Tab ─── */
function ConsumoTab() {
  return (
    <Card>
      <CardContent className="p-8 text-center">
        <TrendingUp className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
        <h3 className="font-semibold text-lg mb-1">Análise de Consumo</h3>
        <p className="text-sm text-muted-foreground">Relatórios de consumo por veículo, período e tipo de combustível em desenvolvimento.</p>
      </CardContent>
    </Card>
  );
}

/* ─── Entradas Tab ─── */
function EntradasTab() {
  const { data: entradas, isLoading } = useEntradasCombustivel("all");
  const deleteEntrada = useDeleteEntrada();
  const [entradaOpen, setEntradaOpen] = useState(false);

  if (isLoading) return <div className="flex items-center justify-center py-12"><LoadingSpinner /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Entradas de Combustível (Compras)</h3>
        <div className="flex gap-2">
          <ExportButtons
            data={(entradas || []).map(e => ({
              data: e.data,
              local: SOURCES.find(s => s.key === e.local_estoque)?.label || e.local_estoque,
              tipo: e.tipo_combustivel,
              quantidade: e.quantidade,
              fornecedor: e.fornecedor || "-",
              nf: e.nota_fiscal || "-",
              valor_total: e.valor_total || 0,
            }))}
            columns={[
              { key: "data", label: "Data", format: "date" },
              { key: "local", label: "Local" },
              { key: "tipo", label: "Combustível" },
              { key: "quantidade", label: "Litros", format: "number" },
              { key: "fornecedor", label: "Fornecedor" },
              { key: "nf", label: "NF" },
              { key: "valor_total", label: "Valor Total", format: "currency" },
            ]}
            title="Entradas de Combustível"
            fileName="entradas_combustivel"
            totals={{
              quantidade: (entradas || []).reduce((a, e) => a + e.quantidade, 0),
              valor_total: (entradas || []).reduce((a, e) => a + (e.valor_total || 0), 0),
            }}
          />
          <Button onClick={() => setEntradaOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Nova Entrada
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Local</TableHead>
                  <TableHead>Combustível</TableHead>
                  <TableHead className="text-right">Litros</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>NF</TableHead>
                  <TableHead className="text-right">Valor Total</TableHead>
                  <TableHead className="w-[50px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(!entradas || entradas.length === 0) ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Nenhuma entrada registrada
                    </TableCell>
                  </TableRow>
                ) : (
                  entradas.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="font-medium">{e.data}</TableCell>
                      <TableCell>{SOURCES.find(s => s.key === e.local_estoque)?.label || e.local_estoque}</TableCell>
                      <TableCell><Badge variant="secondary">{e.tipo_combustivel}</Badge></TableCell>
                      <TableCell className="text-right font-semibold text-green-600">+{formatBR(e.quantidade)}L</TableCell>
                      <TableCell>{e.fornecedor || "-"}</TableCell>
                      <TableCell>{e.nota_fiscal || "-"}</TableCell>
                      <TableCell className="text-right">{e.valor_total ? `R$ ${formatBR(e.valor_total)}` : "-"}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteEntrada.mutate(e.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <NovaEntradaDialog open={entradaOpen} onOpenChange={setEntradaOpen} />
    </div>
  );
}

/* ─── Main Component ─── */
export default function Abastecimentos() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [mainTab, setMainTab] = useState("estoque");
  const [novoDialogOpen, setNovoDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Abastecimentos</h1>
          <p className="text-muted-foreground">
            Controle de combustível e estoque
            {selectedDate && ` — ${format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button className="gap-2" onClick={() => setNovoDialogOpen(true)}>
            <Fuel className="h-4 w-4" /> Novo Abastecimento
          </Button>
          <DateFilter date={selectedDate} onDateChange={setSelectedDate} placeholder="Filtrar por data" showClear={true} />
        </div>
      </div>

      <Tabs value={mainTab} onValueChange={setMainTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="estoque" className="gap-2"><Droplet className="h-4 w-4" /><span className="hidden sm:inline">Estoque</span></TabsTrigger>
          <TabsTrigger value="lancamento" className="gap-2"><Fuel className="h-4 w-4" /><span className="hidden sm:inline">Lançamento</span></TabsTrigger>
          <TabsTrigger value="consumo" className="gap-2"><TrendingUp className="h-4 w-4" /><span className="hidden sm:inline">Consumo</span></TabsTrigger>
          <TabsTrigger value="entradas" className="gap-2"><ArrowUpRight className="h-4 w-4" /><span className="hidden sm:inline">Entradas</span></TabsTrigger>
        </TabsList>

        <TabsContent value="estoque"><EstoquePanel /></TabsContent>
        <TabsContent value="lancamento"><LancamentoTab selectedDate={selectedDate} /></TabsContent>
        <TabsContent value="consumo"><ConsumoTab /></TabsContent>
        <TabsContent value="entradas"><EntradasTab /></TabsContent>
      </Tabs>

      <NovoAbastecimentoDialog open={novoDialogOpen} onOpenChange={setNovoDialogOpen} />
    </div>
  );
}
