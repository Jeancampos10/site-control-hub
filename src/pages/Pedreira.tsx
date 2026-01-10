import { useState, useMemo, useRef } from "react";
import { Mountain, Plus, Download, Calendar, CalendarDays, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGoogleSheets, ApontamentoPedreiraRow, CamReboqueRow } from "@/hooks/useGoogleSheets";
import { TableLoader } from "@/components/ui/loading-spinner";
import { ErrorState } from "@/components/ui/error-state";
import { DateFilter } from "@/components/shared/DateFilter";
import { format, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import html2canvas from "html2canvas";

// Components
import { PeriodSummaryCard } from "@/components/pedreira/PedreiraSummaryCard";
import { ExpandedPeriodSummaryCard } from "@/components/pedreira/PedreiraExpandedCard";
import { PedreiraKPIs } from "@/components/pedreira/PedreiraKPIs";
import { PedreiraDayTables } from "@/components/pedreira/PedreiraDayTables";
import { PedreiraDetailTable } from "@/components/pedreira/PedreiraDetailTable";
import { usePedreiraData, parsePtBrDate } from "@/components/pedreira/usePedreiraData";

export default function Pedreira() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { data: allData, isLoading, error, refetch } = useGoogleSheets<ApontamentoPedreiraRow>('apontamento_pedreira');
  const { data: reboqueData } = useGoogleSheets<CamReboqueRow>('cam_reboque');
  
  // Expanded card dialog state
  const [expandedCard, setExpandedCard] = useState<'total' | 'mes' | 'dia' | null>(null);
  
  // Ref for PDF export
  const pageContentRef = useRef<HTMLDivElement>(null);

  // Use custom hook for data processing
  const {
    pedreiraData,
    totalRegistros,
    pesoTotal,
    veiculosAtivos,
    materialSummaryPeriodo,
    materialSummaryMes,
    materialSummaryDia,
    empresaSummaryPeriodo,
    empresaSummaryMes,
    empresaSummaryDia,
    companySummary,
  } = usePedreiraData(allData, reboqueData, selectedDate);

  // Calculate date range for month
  const monthDateRange = useMemo(() => {
    const monthStart = startOfMonth(selectedDate);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    return {
      start: format(monthStart, "dd/MM/yyyy"),
      end: format(yesterday, "dd/MM/yyyy"),
    };
  }, [selectedDate]);

  // Calculate date range for period total
  const periodDateRange = useMemo(() => {
    if (!allData || allData.length === 0) return null;
    
    const dates = allData
      .map(row => parsePtBrDate(row.Data))
      .filter((d): d is Date => d !== null)
      .sort((a, b) => a.getTime() - b.getTime());
    
    if (dates.length === 0) return null;
    
    const firstDate = dates[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    return {
      start: format(firstDate, "dd/MM/yyyy"),
      end: format(yesterday, "dd/MM/yyyy"),
    };
  }, [allData]);

  const formattedDate = format(selectedDate, "dd 'de' MMMM", { locale: ptBR });
  const formattedMonth = format(selectedDate, "MMMM/yyyy", { locale: ptBR });

  const exportToPDF = async () => {
    if (!pageContentRef.current) return;
    
    const dateStr = format(selectedDate, "dd/MM/yyyy");
    
    try {
      const canvas = await html2canvas(pageContentRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });
      
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      const doc = new jsPDF('p', 'mm', 'a4');
      
      doc.setFontSize(16);
      doc.text('Relatório - Apontamento Pedreira', 14, 15);
      doc.setFontSize(10);
      doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}`, 14, 22);
      
      let heightLeft = imgHeight;
      let position = 30;
      
      doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= (pageHeight - position);
      
      while (heightLeft > 0) {
        doc.addPage();
        position = -heightLeft + 10;
        doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      doc.save(`relatorio-pedreira-${dateStr.replace(/\//g, '-')}.pdf`);
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      // Fallback to table-based PDF
      const doc = new jsPDF();
      
      doc.setFontSize(18);
      doc.text('Relatório Diário - Pedreira', 14, 22);
      doc.setFontSize(11);
      doc.text(`Data: ${dateStr}`, 14, 30);
      doc.text(`Total de Carregamentos: ${totalRegistros}`, 14, 36);
      doc.text(`Peso Total: ${pesoTotal.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} t`, 14, 42);

      autoTable(doc, {
        head: [['Material', 'Viagens', 'Toneladas']],
        body: materialSummaryDia.map(row => [
          row.material,
          row.viagens.toString(),
          row.toneladas.toLocaleString('pt-BR', { maximumFractionDigits: 2 }) + ' t',
        ]),
        startY: 50,
        theme: 'striped',
      });

      const finalY1 = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || 80;
      
      autoTable(doc, {
        head: [['Empresa', 'Caminhões', 'Viagens']],
        body: companySummary.map(row => [
          row.empresa,
          row.caminhoes.toString(),
          row.viagens.toString(),
        ]),
        startY: finalY1 + 10,
        theme: 'striped',
      });

      doc.save(`relatorio-pedreira-${dateStr.replace(/\//g, '-')}.pdf`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="page-header mb-0">
          <h1 className="page-title flex items-center gap-2">
            <Mountain className="h-6 w-6 text-accent" />
            Apontamento Pedreira
          </h1>
          <p className="page-subtitle">
            Controle de carregamentos e pesagens • {formattedDate}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={exportToPDF}>
            <Download className="h-4 w-4" />
            Exportar PDF
          </Button>
          <Button size="sm" className="gap-2 bg-gradient-accent text-accent-foreground hover:opacity-90">
            <Plus className="h-4 w-4" />
            Novo Apontamento
          </Button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <TableLoader />
      ) : error ? (
        <ErrorState 
          message="Não foi possível buscar os dados da planilha."
          onRetry={() => refetch()} 
        />
      ) : (
        <div ref={pageContentRef} className="space-y-6">
          {/* Period Summaries Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold">Resumo por Período</h2>
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              <PeriodSummaryCard 
                materialData={materialSummaryPeriodo}
                empresaData={empresaSummaryPeriodo}
                title="Período Total" 
                subtitle={periodDateRange ? `${periodDateRange.start} à ${periodDateRange.end}` : "Todo o período disponível"}
                colorScheme="blue"
                icon={<Calendar className="h-5 w-5 text-blue-500" />}
                showCaminhoes={false}
                onExpand={() => setExpandedCard('total')}
              />
              <PeriodSummaryCard 
                materialData={materialSummaryMes}
                empresaData={empresaSummaryMes}
                title={formattedMonth} 
                subtitle={`${monthDateRange.start} à ${monthDateRange.end}`}
                colorScheme="amber"
                icon={<CalendarDays className="h-5 w-5 text-amber-500" />}
                showCaminhoes={false}
                onExpand={() => setExpandedCard('mes')}
              />
              <PeriodSummaryCard 
                materialData={materialSummaryDia}
                empresaData={empresaSummaryDia}
                title={formattedDate} 
                subtitle="Dia selecionado"
                colorScheme="emerald"
                icon={<Calendar className="h-5 w-5 text-emerald-500" />}
                showCaminhoes={true}
                onExpand={() => setExpandedCard('dia')}
              />
            </div>

            {/* Expanded Card Dialog */}
            <Dialog open={expandedCard !== null} onOpenChange={() => setExpandedCard(null)}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="sr-only">Detalhes do Período</DialogTitle>
                </DialogHeader>
                {expandedCard === 'total' && (
                  <ExpandedPeriodSummaryCard
                    materialData={materialSummaryPeriodo}
                    empresaData={empresaSummaryPeriodo}
                    title="Período Total"
                    subtitle={periodDateRange ? `${periodDateRange.start} à ${periodDateRange.end}` : "Todo o período disponível"}
                    colorScheme="blue"
                    icon={<Calendar className="h-6 w-6 text-blue-500" />}
                    showCaminhoes={false}
                  />
                )}
                {expandedCard === 'mes' && (
                  <ExpandedPeriodSummaryCard
                    materialData={materialSummaryMes}
                    empresaData={empresaSummaryMes}
                    title={formattedMonth}
                    subtitle={`${monthDateRange.start} à ${monthDateRange.end}`}
                    colorScheme="amber"
                    icon={<CalendarDays className="h-6 w-6 text-amber-500" />}
                    showCaminhoes={false}
                  />
                )}
                {expandedCard === 'dia' && (
                  <ExpandedPeriodSummaryCard
                    materialData={materialSummaryDia}
                    empresaData={empresaSummaryDia}
                    title={formattedDate}
                    subtitle="Dia selecionado"
                    colorScheme="emerald"
                    icon={<Calendar className="h-6 w-6 text-emerald-500" />}
                    showCaminhoes={true}
                  />
                )}
              </DialogContent>
            </Dialog>
          </div>

          {/* Visual Separator with Date Filter */}
          <div className="relative py-4">
            <Separator className="bg-primary/30" />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-6 flex items-center gap-4">
              <span className="text-base font-bold text-primary uppercase tracking-wide">
                📅 Informações do Dia
              </span>
              <DateFilter date={selectedDate} onDateChange={setSelectedDate} />
            </div>
          </div>

          {/* Daily KPIs Section */}
          <PedreiraKPIs 
            totalRegistros={totalRegistros}
            pesoTotal={pesoTotal}
            veiculosAtivos={veiculosAtivos}
          />

          {/* Summaries side by side */}
          <PedreiraDayTables 
            materialSummaryDia={materialSummaryDia}
            companySummary={companySummary}
          />

          {/* Detailed Records */}
          <PedreiraDetailTable data={pedreiraData || []} />
        </div>
      )}
    </div>
  );
}
