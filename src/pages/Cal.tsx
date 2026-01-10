import { useMemo, useState } from "react";
import { filterByDate, MovCalRow, EstoqueCalRow, useGoogleSheets } from "@/hooks/useGoogleSheets";
import { DateFilter } from "@/components/shared/DateFilter";
import { KPICard } from "@/components/dashboard/KPICard";
import { CalMovimentacaoTable } from "@/components/cal/CalMovimentacaoTable";
import { CalEstoqueTable } from "@/components/cal/CalEstoqueTable";
import { CalResumoChart } from "@/components/cal/CalResumoChart";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Clock,
  FileDown,
  MessageCircle,
  Package,
  Printer,
  Warehouse,
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

// Parse Brazilian number formats safely.
// Examples:
// - "25.200" -> 25.2
// - "49.590,00" -> 49590
// - "-3.000,00" -> -3000
const parseNumber = (value: string | undefined): number => {
  if (!value || value.trim() === "") return 0;

  const cleaned = value
    .replace(/[^0-9,.-]/g, "") // strips currency and other chars
    .trim();

  const normalized = cleaned.includes(",")
    ? cleaned.replace(/\./g, "").replace(",", ".")
    : cleaned;

  const num = parseFloat(normalized);
  return Number.isFinite(num) ? num : 0;
};

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
  // Regra:
  // - Se o usuário filtrou uma data: KPIs mostram essa data
  // - Se não filtrou: KPIs mostram o ÚLTIMO dia disponível na tabela de estoque (fallback: último dia em movimentações)
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

  // Registros recentes (últimos 5 do dataset inteiro)
  const registrosRecentes = useMemo(() => {
    if (!movimentacoes || movimentacoes.length === 0) return [];
    return [...movimentacoes].slice(-5).reverse();
  }, [movimentacoes]);

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
      const quantidade = parseNumber(mov.Qtd);
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

    // Preferir o registro do dia; se não existir, cair no último registro disponível.
    const row = (estoqueDoDia && estoqueDoDia.length > 0)
      ? estoqueDoDia[estoqueDoDia.length - 1]
      : estoque[estoque.length - 1];

    return {
      estoqueAnterior: parseNumber(row.EstoqueAnterior),
      estoqueAtual: parseNumber(row.EstoqueAtual),
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

      doc.setFontSize(18);
      doc.text("Relatório de CAL", 14, 22);
      doc.setFontSize(10);
      doc.text(`Gerado em: ${dataGeracao}`, 14, 30);

      doc.setFontSize(12);
      doc.text(`Resumo do dia: ${baseDia.label}`, 14, 45);

      const kpiData = [
        ["Estoque Anterior", `${estoqueInfo.estoqueAnterior.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} ton`],
        ["Total Entradas", `${kpis.totalEntradas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} ton (${kpis.countEntradas} registros)`],
        ["Total Saídas", `${kpis.totalSaidas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} ton (${kpis.countSaidas} registros)`],
        ["Estoque Atual", `${estoqueInfo.estoqueAtual.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} ton`],
      ];

      autoTable(doc, {
        startY: 50,
        head: [["Indicador", "Valor"]],
        body: kpiData,
        theme: "striped",
        headStyles: { fillColor: [34, 92, 176] },
      });

      if (registrosRecentes.length > 0) {
        const finalY = (doc as any).lastAutoTable?.finalY || 90;
        doc.text("Últimos Registros", 14, finalY + 15);

        const registrosData = registrosRecentes.map((r) => [
          r.Data || "-",
          r.Tipo || "-",
          r.Fornecedor || "-",
          `${parseNumber(r.Qtd).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        ]);

        autoTable(doc, {
          startY: finalY + 20,
          head: [["Data", "Tipo", "Fornecedor", "Qtd (ton)"]],
          body: registrosData,
          theme: "striped",
          headStyles: { fillColor: [34, 92, 176] },
        });
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KPICard
              title="Estoque Anterior"
              value={`${estoqueInfo.estoqueAnterior.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ton`}
              subtitle={`Dia ${estoqueInfo.baseDiaLabel}`}
              icon={Package}
              variant="default"
            />
            <KPICard
              title="Entradas"
              value={`${kpis.totalEntradas.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ton`}
              subtitle={`${kpis.countEntradas} entrada${kpis.countEntradas !== 1 ? "s" : ""} (dia ${baseDia.label})`}
              icon={ArrowDownToLine}
              variant="success"
            />
            <KPICard
              title="Saídas"
              value={`${kpis.totalSaidas.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ton`}
              subtitle={`${kpis.countSaidas} saída${kpis.countSaidas !== 1 ? "s" : ""} (dia ${baseDia.label})`}
              icon={ArrowUpFromLine}
              variant="accent"
            />
            {/* Estoque Atual com destaque especial */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary to-primary/80 p-5 text-primary-foreground shadow-lg animate-fade-in">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium opacity-90">Estoque Atual</p>
                  <p className="text-2xl font-bold tracking-tight">
                    {estoqueInfo.estoqueAtual.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ton
                  </p>
                  <p className="text-xs opacity-80">Dia {estoqueInfo.ultimaAtualizacao}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-foreground/20">
                  <Warehouse className="h-5 w-5" />
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
