import { useState, useMemo, useRef } from "react";
import { useGoogleSheets, filterByDate, MovCalRow, EstoqueCalRow } from "@/hooks/useGoogleSheets";
import { DateFilter } from "@/components/shared/DateFilter";
import { KPICard } from "@/components/dashboard/KPICard";
import { CalMovimentacaoTable } from "@/components/cal/CalMovimentacaoTable";
import { CalEstoqueTable } from "@/components/cal/CalEstoqueTable";
import { CalResumoChart } from "@/components/cal/CalResumoChart";
import { 
  Package, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  Warehouse,
  FileDown,
  Printer,
  MessageCircle,
  Clock
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ErrorState } from "@/components/ui/error-state";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

// Helper to parse Brazilian number format
const parseNumber = (value: string | undefined): number => {
  if (!value) return 0;
  const cleaned = value.replace(/\./g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
};

export default function Cal() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [tipoFilter, setTipoFilter] = useState<string>("todos");
  const [whatsappDialogOpen, setWhatsappDialogOpen] = useState(false);
  const resumoRef = useRef<HTMLDivElement>(null);
  
  const { data: movimentacoes, isLoading: loadingMov, error: errorMov } = useGoogleSheets<MovCalRow>('mov_cal');
  const { data: estoque, isLoading: loadingEstoque, error: errorEstoque } = useGoogleSheets<EstoqueCalRow>('estoque_cal');

  const isLoading = loadingMov || loadingEstoque;
  const hasError = errorMov || errorEstoque;

  // Filtrar movimentações por data
  const filteredByDate = filterByDate(movimentacoes, selectedDate);

  // Filtrar por tipo
  const filteredMovimentacoes = useMemo(() => {
    if (!filteredByDate) return [];
    if (tipoFilter === "todos") return filteredByDate;
    
    return filteredByDate.filter(mov => {
      const tipo = mov.Tipo?.toLowerCase().trim();
      if (tipoFilter === "entrada") {
        return tipo === 'entrada' || tipo === 'compra';
      } else if (tipoFilter === "saida") {
        return tipo === 'saída' || tipo === 'saida' || tipo === 'consumo';
      }
      return true;
    });
  }, [filteredByDate, tipoFilter]);

  // Ordenar movimentações por tipo
  const sortedMovimentacoes = useMemo(() => {
    if (!filteredMovimentacoes) return [];
    return [...filteredMovimentacoes].sort((a, b) => {
      const tipoA = a.Tipo?.toLowerCase().trim() || '';
      const tipoB = b.Tipo?.toLowerCase().trim() || '';
      return tipoA.localeCompare(tipoB);
    });
  }, [filteredMovimentacoes]);

  // Registros recentes (últimos 5)
  const registrosRecentes = useMemo(() => {
    if (!movimentacoes || movimentacoes.length === 0) return [];
    return [...movimentacoes].slice(-5).reverse();
  }, [movimentacoes]);

  // Calcular KPIs das movimentações (todo o período)
  const calcularKPIsTodosPeriodos = useMemo(() => {
    if (!movimentacoes || movimentacoes.length === 0) {
      return {
        totalEntradas: 0,
        totalSaidas: 0,
        countEntradas: 0,
        countSaidas: 0,
      };
    }

    let totalEntradas = 0;
    let totalSaidas = 0;
    let countEntradas = 0;
    let countSaidas = 0;

    movimentacoes.forEach(mov => {
      const quantidade = parseNumber(mov.Qtd);
      const tipo = mov.Tipo?.toLowerCase().trim();
      
      if (tipo === 'entrada' || tipo === 'compra') {
        totalEntradas += quantidade;
        countEntradas++;
      } else if (tipo === 'saída' || tipo === 'saida' || tipo === 'consumo') {
        totalSaidas += quantidade;
        countSaidas++;
      }
    });

    return {
      totalEntradas,
      totalSaidas,
      countEntradas,
      countSaidas,
    };
  }, [movimentacoes]);

  // Calcular KPIs do período filtrado
  const calcularKPIsFiltrados = useMemo(() => {
    if (!filteredByDate || filteredByDate.length === 0) {
      return {
        totalEntradas: 0,
        totalSaidas: 0,
        countEntradas: 0,
        countSaidas: 0,
      };
    }

    let totalEntradas = 0;
    let totalSaidas = 0;
    let countEntradas = 0;
    let countSaidas = 0;

    filteredByDate.forEach(mov => {
      const quantidade = parseNumber(mov.Qtd);
      const tipo = mov.Tipo?.toLowerCase().trim();
      
      if (tipo === 'entrada' || tipo === 'compra') {
        totalEntradas += quantidade;
        countEntradas++;
      } else if (tipo === 'saída' || tipo === 'saida' || tipo === 'consumo') {
        totalSaidas += quantidade;
        countSaidas++;
      }
    });

    return {
      totalEntradas,
      totalSaidas,
      countEntradas,
      countSaidas,
    };
  }, [filteredByDate]);

  // Calcular estoque atual e anterior (do primeiro registro válido com Estoque_Anterior na coluna C)
  const calcularEstoque = useMemo(() => {
    if (!estoque || estoque.length === 0) {
      return {
        estoqueAtual: 0,
        estoqueAnterior: 0,
        ultimaAtualizacao: '-',
        descricao: '-',
      };
    }

    // Para Estoque Anterior: pegar o PRIMEIRO registro válido (coluna C - Estoque_Anterior)
    let primeiroEstoqueAnterior = 0;
    for (let i = 0; i < estoque.length; i++) {
      if (estoque[i].Estoque_Anterior && estoque[i].Estoque_Anterior.trim() !== '') {
        primeiroEstoqueAnterior = parseNumber(estoque[i].Estoque_Anterior);
        break;
      }
    }

    // Para Estoque Atual: pegar o ÚLTIMO registro válido
    let estoqueAtual = 0;
    let ultimaAtualizacao = '-';
    let descricao = 'CAL';
    
    for (let i = estoque.length - 1; i >= 0; i--) {
      if (estoque[i].Estoque_Atual && estoque[i].Estoque_Atual.trim() !== '') {
        estoqueAtual = parseNumber(estoque[i].Estoque_Atual);
        ultimaAtualizacao = estoque[i].Data || '-';
        descricao = estoque[i].Descricao || 'CAL';
        break;
      }
    }

    return {
      estoqueAtual,
      estoqueAnterior: primeiroEstoqueAnterior,
      ultimaAtualizacao,
      descricao,
    };
  }, [estoque]);

  const kpis = selectedDate ? calcularKPIsFiltrados : calcularKPIsTodosPeriodos;
  const estoqueInfo = calcularEstoque;

  // Gerar texto para WhatsApp
  const gerarTextoWhatsApp = () => {
    const dataAtual = new Date().toLocaleDateString('pt-BR');
    const texto = `📊 *RESUMO CAL - ${dataAtual}*

📦 *Estoque Anterior:* ${estoqueInfo.estoqueAnterior.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ton

⬇️ *Total Entradas:* ${kpis.totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ton (${kpis.countEntradas} registros)

⬆️ *Total Saídas:* ${kpis.totalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ton (${kpis.countSaidas} registros)

🏭 *Estoque Atual:* ${estoqueInfo.estoqueAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ton

📅 Atualizado em: ${estoqueInfo.ultimaAtualizacao}`;
    
    return texto;
  };

  const copiarParaWhatsApp = () => {
    const texto = gerarTextoWhatsApp();
    navigator.clipboard.writeText(texto);
    toast.success("Texto copiado! Cole no WhatsApp.");
    setWhatsappDialogOpen(false);
  };

  const imprimirRelatorio = () => {
    window.print();
  };

  const exportarPDF = async () => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      
      const doc = new jsPDF();
      const dataAtual = new Date().toLocaleDateString('pt-BR');
      
      // Título
      doc.setFontSize(18);
      doc.text('Relatório de CAL', 14, 22);
      doc.setFontSize(10);
      doc.text(`Gerado em: ${dataAtual}`, 14, 30);
      
      // KPIs
      doc.setFontSize(12);
      doc.text('Resumo de Estoque e Movimentações', 14, 45);
      
      const kpiData = [
        ['Estoque Anterior', `${estoqueInfo.estoqueAnterior.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ton`],
        ['Total Entradas', `${kpis.totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ton (${kpis.countEntradas} registros)`],
        ['Total Saídas', `${kpis.totalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ton (${kpis.countSaidas} registros)`],
        ['Estoque Atual', `${estoqueInfo.estoqueAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ton`],
      ];
      
      autoTable(doc, {
        startY: 50,
        head: [['Indicador', 'Valor']],
        body: kpiData,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
      });
      
      // Registros recentes
      if (registrosRecentes.length > 0) {
        const finalY = (doc as any).lastAutoTable?.finalY || 90;
        doc.text('Últimos Registros', 14, finalY + 15);
        
        const registrosData = registrosRecentes.map(r => [
          r.Data || '-',
          r.Tipo || '-',
          r.Fornecedor || '-',
          `${parseNumber(r.Qtd).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        ]);
        
        autoTable(doc, {
          startY: finalY + 20,
          head: [['Data', 'Tipo', 'Fornecedor', 'Qtd (ton)']],
          body: registrosData,
          theme: 'striped',
          headStyles: { fillColor: [59, 130, 246] },
        });
      }
      
      doc.save(`relatorio-cal-${dataAtual.replace(/\//g, '-')}.pdf`);
      toast.success("PDF exportado com sucesso!");
    } catch (error) {
      toast.error("Erro ao exportar PDF");
      console.error(error);
    }
  };

  if (hasError) {
    return (
      <div className="p-6">
        <ErrorState message="Erro ao carregar dados do CAL" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Controle de CAL</h1>
          <p className="text-sm text-muted-foreground">
            Gestão de estoque e movimentações de CAL
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <DateFilter date={selectedDate} onDateChange={setSelectedDate} />
          
          <Button variant="outline" size="sm" onClick={imprimirRelatorio}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
          
          <Button variant="outline" size="sm" onClick={exportarPDF}>
            <FileDown className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
          
          <Dialog open={whatsappDialogOpen} onOpenChange={setWhatsappDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="bg-green-500/10 hover:bg-green-500/20 text-green-600 border-green-500/30">
                <MessageCircle className="h-4 w-4 mr-2" />
                WhatsApp
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Resumo para WhatsApp</DialogTitle>
              </DialogHeader>
              <div className="bg-muted p-4 rounded-lg font-mono text-sm whitespace-pre-wrap">
                {gerarTextoWhatsApp()}
              </div>
              <Button onClick={copiarParaWhatsApp} className="w-full bg-green-600 hover:bg-green-700">
                <MessageCircle className="h-4 w-4 mr-2" />
                Copiar para WhatsApp
              </Button>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <>
          {/* KPI Cards - Nova ordem: Estoque Anterior, Entradas, Saídas, Estoque Atual */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KPICard
              title="Estoque Anterior"
              value={`${estoqueInfo.estoqueAnterior.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ton`}
              subtitle="Início do período"
              icon={Package}
              variant="default"
            />
            <KPICard
              title="Total Entradas"
              value={`${kpis.totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ton`}
              subtitle={`${kpis.countEntradas} entrada${kpis.countEntradas !== 1 ? 's' : ''}`}
              icon={ArrowDownToLine}
              variant="success"
            />
            <KPICard
              title="Total Saídas"
              value={`${kpis.totalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ton`}
              subtitle={`${kpis.countSaidas} saída${kpis.countSaidas !== 1 ? 's' : ''}`}
              icon={ArrowUpFromLine}
              variant="accent"
            />
            <KPICard
              title="Estoque Atual"
              value={`${estoqueInfo.estoqueAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ton`}
              subtitle={`Atualizado em ${estoqueInfo.ultimaAtualizacao}`}
              icon={Warehouse}
              variant="primary"
            />
          </div>

          {/* Registros Recentes */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Registros Recentes
              </CardTitle>
              <CardDescription>Últimas movimentações registradas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {registrosRecentes.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Nenhum registro encontrado</p>
                ) : (
                  registrosRecentes.map((registro, index) => (
                    <div 
                      key={index} 
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          registro.Tipo?.toLowerCase().includes('entrada') || registro.Tipo?.toLowerCase().includes('compra')
                            ? 'bg-green-500' 
                            : 'bg-orange-500'
                        }`} />
                        <div>
                          <p className="font-medium text-sm">{registro.Tipo || '-'}</p>
                          <p className="text-xs text-muted-foreground">{registro.Fornecedor || '-'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm">
                          {parseNumber(registro.Qtd).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ton
                        </p>
                        <p className="text-xs text-muted-foreground">{registro.Data || '-'}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Resumo Total do Período */}
          <CalResumoChart data={movimentacoes || []} />

          {/* Tabs com Tabelas */}
          <Tabs defaultValue="movimentacoes" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <TabsList>
                <TabsTrigger value="movimentacoes">Movimentações</TabsTrigger>
                <TabsTrigger value="estoque">Histórico de Estoque</TabsTrigger>
              </TabsList>
              
              {/* Filtro por Tipo */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Filtrar por tipo:</span>
                <Select value={tipoFilter} onValueChange={setTipoFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="entrada">Entrada</SelectItem>
                    <SelectItem value="saida">Saída</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <TabsContent value="movimentacoes">
              <CalMovimentacaoTable data={sortedMovimentacoes} />
            </TabsContent>
            <TabsContent value="estoque">
              <CalEstoqueTable data={estoque || []} />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
