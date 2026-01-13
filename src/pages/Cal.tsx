import { useMemo, useState } from "react";
import { filterByDate, MovCalRow, EstoqueCalRow, useGoogleSheets } from "@/hooks/useGoogleSheets";
import { DateFilter } from "@/components/shared/DateFilter";
import { CalMovimentacaoTable } from "@/components/cal/CalMovimentacaoTable";
import { CalEstoqueTable } from "@/components/cal/CalEstoqueTable";
import { CalResumoChart } from "@/components/cal/CalResumoChart";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  FileDown,
  MessageCircle,
  Package,
  Printer,
  Warehouse,
  TrendingUp,
  Calendar,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ErrorState } from "@/components/ui/error-state";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { parsePtBrNumber } from "@/lib/utils";

const normalizeDateStr = (dateStr?: string) => {
  if (!dateStr) return null;
  const match = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!match) return null;
  const [, d, m, y] = match;
  return `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y}`;
};

const parsePtBrDate = (dateStr?: string): Date | null => {
  const norm = normalizeDateStr(dateStr);
  if (!norm) return null;
  const [dd, mm, yyyy] = norm.split("/").map((n) => parseInt(n, 10));
  if (!dd || !mm || !yyyy) return null;
  return new Date(yyyy, mm - 1, dd);
};

export default function Cal() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [tipoFilter, setTipoFilter] = useState<string>("todos");
  const [whatsappDialogOpen, setWhatsappDialogOpen] = useState(false);

  const { data: movimentacoes, isLoading: loadingMov, error: errorMov } = useGoogleSheets<MovCalRow>("mov_cal");
  const { data: estoque, isLoading: loadingEstoque, error: errorEstoque } = useGoogleSheets<EstoqueCalRow>("estoque_cal");

  const isLoading = loadingMov || loadingEstoque;
  const hasError = errorMov || errorEstoque;

  // =============== Base do DIA (para KPIs) ===============
  const baseDia = useMemo(() => {
    if (selectedDate) {
      return { date: selectedDate, label: selectedDate.toLocaleDateString("pt-BR") };
    }

    const candidates: { dt: Date; label: string }[] = [];

    (estoque || []).forEach((r) => {
      const dt = parsePtBrDate(r.Data);
      const label = normalizeDateStr(r.Data);
      if (dt && label) candidates.push({ dt, label });
    });

    if (candidates.length === 0) {
      (movimentacoes || []).forEach((r) => {
        const dt = parsePtBrDate(r.Data);
        const label = normalizeDateStr(r.Data);
        if (dt && label) candidates.push({ dt, label });
      });
    }

    if (candidates.length === 0) {
      const today = new Date();
      return { date: today, label: today.toLocaleDateString("pt-BR") };
    }

    candidates.sort((a, b) => a.dt.getTime() - b.dt.getTime());
    const latest = candidates[candidates.length - 1];
    return { date: latest.dt, label: latest.label };
  }, [selectedDate, estoque, movimentacoes]);

  // =============== Resumo do Período (TOTAL) ===============
  const resumoPeriodo = useMemo(() => {
    if (!movimentacoes || movimentacoes.length === 0) {
      return { totalEntradas: 0, totalSaidas: 0, countEntradas: 0, countSaidas: 0, diasComDados: 0 };
    }

    let totalEntradas = 0;
    let totalSaidas = 0;
    let countEntradas = 0;
    let countSaidas = 0;
    const diasSet = new Set<string>();

    movimentacoes.forEach((mov) => {
      const quantidade = parsePtBrNumber(mov.Qtd);
      const tipo = mov.Tipo?.toLowerCase().trim();
      const dataStr = normalizeDateStr(mov.Data);
      if (dataStr) diasSet.add(dataStr);

      if (tipo === "entrada" || tipo === "compra") {
        totalEntradas += quantidade;
        countEntradas++;
      } else if (tipo === "saída" || tipo === "saida" || tipo === "consumo") {
        totalSaidas += quantidade;
        countSaidas++;
      }
    });

    return { totalEntradas, totalSaidas, countEntradas, countSaidas, diasComDados: diasSet.size };
  }, [movimentacoes]);

  // =============== Tabelas (filtradas apenas quando usuário seleciona data) ===============
  const filteredByDate = filterByDate(movimentacoes, selectedDate);

  const filteredMovimentacoes = useMemo(() => {
    if (!filteredByDate) return [];
    if (tipoFilter === "todos") return filteredByDate;

    return filteredByDate.filter((mov) => {
      const tipo = mov.Tipo?.toLowerCase().trim();
      if (tipoFilter === "entrada") {
        return tipo === "entrada" || tipo === "compra";
      }
      if (tipoFilter === "saida") {
        return tipo === "saída" || tipo === "saida" || tipo === "consumo";
      }
      return true;
    });
  }, [filteredByDate, tipoFilter]);

  const sortedMovimentacoes = useMemo(() => {
    if (!filteredMovimentacoes) return [];
    return [...filteredMovimentacoes].sort((a, b) => {
      const tipoA = a.Tipo?.toLowerCase().trim() || "";
      const tipoB = b.Tipo?.toLowerCase().trim() || "";
      return tipoA.localeCompare(tipoB);
    });
  }, [filteredMovimentacoes]);

  // =============== KPIs do DIA ===============
  const movimentacoesDoDia = useMemo(() => {
    return filterByDate(movimentacoes, baseDia.date);
  }, [movimentacoes, baseDia.date]);

  const kpisDoDia = useMemo(() => {
    if (!movimentacoesDoDia || movimentacoesDoDia.length === 0) {
      return { totalEntradas: 0, totalSaidas: 0, countEntradas: 0, countSaidas: 0 };
    }

    let totalEntradas = 0;
    let totalSaidas = 0;
    let countEntradas = 0;
    let countSaidas = 0;

    movimentacoesDoDia.forEach((mov) => {
      const quantidade = parsePtBrNumber(mov.Qtd);
      const tipo = mov.Tipo?.toLowerCase().trim();

      if (tipo === "entrada" || tipo === "compra") {
        totalEntradas += quantidade;
        countEntradas++;
      } else if (tipo === "saída" || tipo === "saida" || tipo === "consumo") {
        totalSaidas += quantidade;
        countSaidas++;
      }
    });

    return { totalEntradas, totalSaidas, countEntradas, countSaidas };
  }, [movimentacoesDoDia]);

  const estoqueDoDia = useMemo(() => {
    return filterByDate(estoque, baseDia.date);
  }, [estoque, baseDia.date]);

  const estoqueInfo = useMemo(() => {
    if (!estoque || estoque.length === 0) {
      return { estoqueAnterior: 0, estoqueAtual: 0, ultimaAtualizacao: "-", descricao: "-", baseDiaLabel: baseDia.label };
    }

    const row = (estoqueDoDia && estoqueDoDia.length > 0)
      ? estoqueDoDia[estoqueDoDia.length - 1]
      : estoque[estoque.length - 1];

    return {
      estoqueAnterior: parsePtBrNumber(row.EstoqueAnterior),
      estoqueAtual: parsePtBrNumber(row.EstoqueAtual),
      ultimaAtualizacao: normalizeDateStr(row.Data) || row.Data || "-",
      descricao: (row.Descricao || "CAL").trim(),
      baseDiaLabel: baseDia.label,
    };
  }, [estoque, estoqueDoDia, baseDia.label]);

  const kpis = kpisDoDia;

  // =============== WhatsApp / Export ===============
  const gerarTextoWhatsApp = () => {
    const tituloData = baseDia.label;

    return `📊 *RESUMO CAL - ${tituloData}*\n\n` +
      `📦 *Estoque Anterior:* ${estoqueInfo.estoqueAnterior.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ton\n\n` +
      `⬇️ *Entradas:* ${kpis.totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ton (${kpis.countEntradas} registros)\n\n` +
      `⬆️ *Saídas:* ${kpis.totalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ton (${kpis.countSaidas} registros)\n\n` +
      `🏭 *Estoque Atual:* ${estoqueInfo.estoqueAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ton\n\n` +
      `📅 Data do estoque: ${estoqueInfo.ultimaAtualizacao}`;
  };

  const copiarParaWhatsApp = async () => {
    try {
      await navigator.clipboard.writeText(gerarTextoWhatsApp());
      toast.success("Texto copiado! Cole no WhatsApp.");
      setWhatsappDialogOpen(false);
    } catch {
      toast.error("Não foi possível copiar. Tente novamente.");
    }
  };

  const imprimirRelatorio = () => window.print();

  const exportarPDF = async () => {
    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF();
      const dataGeracao = new Date().toLocaleDateString("pt-BR");
      const horaGeracao = new Date().toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' });

      // Header com logo/título
      doc.setFillColor(34, 92, 176);
      doc.rect(0, 0, 210, 35, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text("RELATÓRIO DE CONTROLE DE CAL", 14, 18);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Gerado em: ${dataGeracao} às ${horaGeracao}`, 14, 28);

      // Reset text color
      doc.setTextColor(0, 0, 0);

      // Seção: Resumo do Período
      let yPos = 45;
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("RESUMO TOTAL DO PERÍODO", 14, yPos);
      
      yPos += 5;
      const periodoData = [
        ["Total de Entradas", `${resumoPeriodo.totalEntradas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} ton`, `${resumoPeriodo.countEntradas} registros`],
        ["Total de Saídas", `${resumoPeriodo.totalSaidas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} ton`, `${resumoPeriodo.countSaidas} registros`],
        ["Saldo do Período", `${(resumoPeriodo.totalEntradas - resumoPeriodo.totalSaidas).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} ton`, "Entradas - Saídas"],
        ["Dias com Registros", `${resumoPeriodo.diasComDados}`, ""],
      ];

      autoTable(doc, {
        startY: yPos,
        head: [["Indicador", "Valor", "Observação"]],
        body: periodoData,
        theme: "striped",
        headStyles: { fillColor: [34, 92, 176], fontStyle: 'bold' },
        columnStyles: {
          0: { fontStyle: 'bold' },
          1: { halign: 'right' },
        },
        margin: { left: 14, right: 14 },
      });

      // Seção: Controle Diário
      yPos = (doc as any).lastAutoTable.finalY + 15;
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(`CONTROLE DIÁRIO - ${baseDia.label}`, 14, yPos);

      yPos += 5;
      const diaData = [
        ["Estoque Anterior", `${estoqueInfo.estoqueAnterior.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} ton`],
        ["Entradas do Dia", `${kpis.totalEntradas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} ton (${kpis.countEntradas} registros)`],
        ["Saídas do Dia", `${kpis.totalSaidas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} ton (${kpis.countSaidas} registros)`],
        ["Estoque Atual", `${estoqueInfo.estoqueAtual.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} ton`],
      ];

      autoTable(doc, {
        startY: yPos,
        head: [["Indicador", "Valor"]],
        body: diaData,
        theme: "striped",
        headStyles: { fillColor: [76, 175, 80], fontStyle: 'bold' },
        columnStyles: {
          0: { fontStyle: 'bold' },
          1: { halign: 'right' },
        },
        margin: { left: 14, right: 14 },
      });

      // Seção: Movimentações do Dia (se houver)
      if (movimentacoesDoDia && movimentacoesDoDia.length > 0) {
        yPos = (doc as any).lastAutoTable.finalY + 15;
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text(`MOVIMENTAÇÕES DO DIA - ${baseDia.label}`, 14, yPos);

        yPos += 5;
        const movData = movimentacoesDoDia.slice(0, 20).map((mov) => [
          mov.Hora || "-",
          mov.Tipo || "-",
          mov.Fornecedor || "-",
          `${parsePtBrNumber(mov.Qtd).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} ${mov.Und || "ton"}`,
          mov.NF || "-",
        ]);

        autoTable(doc, {
          startY: yPos,
          head: [["Hora", "Tipo", "Fornecedor", "Quantidade", "NF"]],
          body: movData,
          theme: "striped",
          headStyles: { fillColor: [96, 125, 139], fontStyle: 'bold' },
          styles: { fontSize: 9 },
          margin: { left: 14, right: 14 },
        });

        if (movimentacoesDoDia.length > 20) {
          yPos = (doc as any).lastAutoTable.finalY + 5;
          doc.setFontSize(9);
          doc.setFont("helvetica", "italic");
          doc.setTextColor(128, 128, 128);
          doc.text(`... e mais ${movimentacoesDoDia.length - 20} registros`, 14, yPos);
          doc.setTextColor(0, 0, 0);
        }
      }

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(
          `Página ${i} de ${pageCount} | ApropriaApp - Controle de CAL`,
          105,
          290,
          { align: 'center' }
        );
      }

      doc.save(`relatorio-cal-${baseDia.label.replace(/\//g, "-")}.pdf`);
      toast.success("PDF exportado com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao exportar PDF");
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Controle de CAL</h1>
          <p className="text-sm text-muted-foreground">Gestão de estoque e movimentações de CAL</p>
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
              <Button
                variant="outline"
                size="sm"
                className="bg-success/10 hover:bg-success/20 text-success border-success/30"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                WhatsApp
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Resumo para WhatsApp</DialogTitle>
                <DialogDescription>Copie o texto abaixo e cole no WhatsApp.</DialogDescription>
              </DialogHeader>
              <div className="bg-muted p-4 rounded-lg font-mono text-sm whitespace-pre-wrap">
                {gerarTextoWhatsApp()}
              </div>
              <Button
                onClick={copiarParaWhatsApp}
                className="w-full bg-success text-success-foreground hover:bg-success/90"
              >
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
          {/* RESUMO TOTAL DO PERÍODO - ACIMA DOS KPIs DIÁRIOS */}
          <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5 text-primary" />
                Resumo Total do Período
              </CardTitle>
              <CardDescription>
                Consolidado de todas as movimentações ({resumoPeriodo.diasComDados} dias com registros)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="flex flex-col gap-1 p-4 rounded-lg bg-background border">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Entradas</span>
                  <span className="text-2xl font-bold text-success">
                    {resumoPeriodo.totalEntradas.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ton
                  </span>
                  <span className="text-xs text-muted-foreground">{resumoPeriodo.countEntradas} registros</span>
                </div>
                <div className="flex flex-col gap-1 p-4 rounded-lg bg-background border">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Saídas</span>
                  <span className="text-2xl font-bold text-destructive">
                    {resumoPeriodo.totalSaidas.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ton
                  </span>
                  <span className="text-xs text-muted-foreground">{resumoPeriodo.countSaidas} registros</span>
                </div>
                <div className="flex flex-col gap-1 p-4 rounded-lg bg-background border">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Saldo do Período</span>
                  <span className={`text-2xl font-bold ${(resumoPeriodo.totalEntradas - resumoPeriodo.totalSaidas) >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {(resumoPeriodo.totalEntradas - resumoPeriodo.totalSaidas).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ton
                  </span>
                  <span className="text-xs text-muted-foreground">Entradas - Saídas</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* KPIs do Dia Selecionado */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Controle Diário - {baseDia.label}
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border bg-card p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Estoque Anterior</p>
                    <p className="text-xl font-bold">
                      {estoqueInfo.estoqueAnterior.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ton
                    </p>
                  </div>
                  <Package className="h-8 w-8 text-muted-foreground/50" />
                </div>
              </div>
              <div className="rounded-xl border bg-card p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Entradas do Dia</p>
                    <p className="text-xl font-bold text-success">
                      {kpis.totalEntradas.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ton
                    </p>
                    <p className="text-xs text-muted-foreground">{kpis.countEntradas} registro(s)</p>
                  </div>
                  <ArrowDownToLine className="h-8 w-8 text-success/50" />
                </div>
              </div>
              <div className="rounded-xl border bg-card p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Saídas do Dia</p>
                    <p className="text-xl font-bold text-destructive">
                      {kpis.totalSaidas.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ton
                    </p>
                    <p className="text-xs text-muted-foreground">{kpis.countSaidas} registro(s)</p>
                  </div>
                  <ArrowUpFromLine className="h-8 w-8 text-destructive/50" />
                </div>
              </div>
              <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-primary">Estoque Atual</p>
                    <p className="text-xl font-bold text-primary">
                      {estoqueInfo.estoqueAtual.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ton
                    </p>
                  </div>
                  <Warehouse className="h-8 w-8 text-primary/50" />
                </div>
              </div>
            </div>
          </div>

          <CalResumoChart data={movimentacoes || []} />

          <Tabs defaultValue="movimentacoes" className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <TabsList>
                <TabsTrigger value="movimentacoes">Movimentações</TabsTrigger>
                <TabsTrigger value="estoque">Histórico de Estoque</TabsTrigger>
              </TabsList>

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
