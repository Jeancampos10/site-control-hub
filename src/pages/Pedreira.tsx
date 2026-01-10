import { useState, useMemo } from "react";
import { Mountain, Plus, Download, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { KPICard } from "@/components/dashboard/KPICard";
import { Truck, Box, Activity } from "lucide-react";
import { useGoogleSheets, ApontamentoPedreiraRow, filterByDate } from "@/hooks/useGoogleSheets";
import { TableLoader } from "@/components/ui/loading-spinner";
import { ErrorState } from "@/components/ui/error-state";
import { DateFilter } from "@/components/shared/DateFilter";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface MaterialSummary {
  material: string;
  viagens: number;
  toneladas: number;
}

interface CompanySummary {
  empresa: string;
  caminhoes: number;
  viagens: number;
}

export default function Pedreira() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { data: allData, isLoading, error, refetch } = useGoogleSheets<ApontamentoPedreiraRow>('apontamento_pedreira');

  // Filter data by selected date
  const pedreiraData = useMemo(() => {
    return filterByDate(allData, selectedDate);
  }, [allData, selectedDate]);

  // Calculate KPIs from filtered data
  const totalRegistros = pedreiraData?.length || 0;
  const pesoTotal = pedreiraData?.reduce((acc, row) => {
    const peso = parseFloat(row.Tonelada) || 0;
    return acc + peso;
  }, 0) || 0;
  const volumeTotal = pedreiraData?.reduce((acc, row) => {
    const vol = parseFloat(row.Metro_Cubico) || 0;
    return acc + vol;
  }, 0) || 0;
  const veiculosAtivos = new Set(pedreiraData?.map(row => row.Prefixo_Eq).filter(Boolean)).size;

  // Summary by material
  const materialSummary = useMemo((): MaterialSummary[] => {
    if (!pedreiraData) return [];
    
    const grouped = new Map<string, MaterialSummary>();
    
    pedreiraData.forEach(row => {
      const material = row.Material || 'Outros';
      
      if (!grouped.has(material)) {
        grouped.set(material, { material, viagens: 0, toneladas: 0 });
      }
      
      const summary = grouped.get(material)!;
      summary.viagens += 1;
      summary.toneladas += parseFloat(row.Tonelada) || 0;
    });
    
    return Array.from(grouped.values()).sort((a, b) => b.toneladas - a.toneladas);
  }, [pedreiraData]);

  // Summary by company (truck companies like Engemat, L. Pereira)
  const companySummary = useMemo((): CompanySummary[] => {
    if (!pedreiraData) return [];
    
    const grouped = new Map<string, { trucks: Set<string>; viagens: number }>();
    
    pedreiraData.forEach(row => {
      // Use Empresa_Eq (truck company) instead of Fornecedor
      const empresa = row.Empresa_Eq || row.Fornecedor || 'Outros';
      
      if (!grouped.has(empresa)) {
        grouped.set(empresa, { trucks: new Set(), viagens: 0 });
      }
      
      const summary = grouped.get(empresa)!;
      summary.viagens += 1;
      if (row.Prefixo_Eq) summary.trucks.add(row.Prefixo_Eq);
    });
    
    return Array.from(grouped.entries()).map(([empresa, data]) => ({
      empresa,
      caminhoes: data.trucks.size,
      viagens: data.viagens,
    })).sort((a, b) => b.viagens - a.viagens);
  }, [pedreiraData]);

  const formattedDate = format(selectedDate, "dd 'de' MMMM", { locale: ptBR });

  const exportToPDF = () => {
    const doc = new jsPDF();
    const dateStr = format(selectedDate, "dd/MM/yyyy");

    // Header
    doc.setFontSize(18);
    doc.text('Relatório Diário - Pedreira', 14, 22);
    doc.setFontSize(11);
    doc.text(`Data: ${dateStr}`, 14, 30);
    doc.text(`Total de Carregamentos: ${totalRegistros}`, 14, 36);
    doc.text(`Peso Total: ${pesoTotal.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} t`, 14, 42);
    doc.text(`Volume Total: ${volumeTotal.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} m³`, 14, 48);

    // Material Summary
    doc.setFontSize(14);
    doc.text('Resumo por Material', 14, 60);
    
    autoTable(doc, {
      head: [['Material', 'Viagens', 'Toneladas']],
      body: materialSummary.map(row => [
        row.material,
        row.viagens.toString(),
        row.toneladas.toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' t',
      ]),
      startY: 65,
      theme: 'striped',
    });

    // Company Summary
    const finalY1 = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || 80;
    doc.setFontSize(14);
    doc.text('Resumo por Empresa', 14, finalY1 + 15);
    
    autoTable(doc, {
      head: [['Empresa', 'Caminhões', 'Viagens']],
      body: companySummary.map(row => [
        row.empresa,
        row.caminhoes.toString(),
        row.viagens.toString(),
      ]),
      startY: finalY1 + 20,
      theme: 'striped',
    });

    // Detailed records
    const finalY2 = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || 120;
    
    if (finalY2 > 220) {
      doc.addPage();
      doc.setFontSize(14);
      doc.text('Registros Detalhados', 14, 22);
    } else {
      doc.setFontSize(14);
      doc.text('Registros Detalhados', 14, finalY2 + 15);
    }

    autoTable(doc, {
      head: [['Hora', 'Ordem', 'Veículo', 'Material', 'Peso Líq.', 'm³']],
      body: (pedreiraData || []).map(row => [
        row.Hora,
        row.Ordem_Carregamento,
        row.Prefixo_Eq,
        row.Material,
        row.Peso_Liquido,
        row.Metro_Cubico,
      ]),
      startY: finalY2 > 220 ? 27 : finalY2 + 20,
      theme: 'striped',
      styles: { fontSize: 8 },
    });

    doc.save(`relatorio-pedreira-${dateStr.replace(/\//g, '-')}.pdf`);
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
          <DateFilter date={selectedDate} onDateChange={setSelectedDate} />
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

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Carregamentos com destaque especial */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary to-primary/80 p-5 text-primary-foreground shadow-lg animate-fade-in">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium opacity-90">Carregamentos</p>
              <p className="text-3xl font-bold tracking-tight">{totalRegistros}</p>
              <p className="text-xs opacity-80">Hoje</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-foreground/20">
              <Activity className="h-5 w-5" />
            </div>
          </div>
        </div>
        <KPICard
          title="Peso Total"
          value={`${pesoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} t`}
          subtitle="Transportado"
          icon={Box}
          variant="accent"
        />
        <KPICard
          title="Volume"
          value={`${volumeTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m³`}
          subtitle="Material"
          icon={Mountain}
          variant="success"
        />
        <KPICard
          title="Veículos"
          value={veiculosAtivos}
          subtitle="Utilizados"
          icon={Truck}
          variant="default"
        />
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
        <div className="space-y-6">
          {/* Summaries side by side */}
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Material Summary */}
            <div className="chart-container">
              <h3 className="mb-4 font-semibold">Resumo por Material</h3>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/50 hover:bg-transparent">
                      <TableHead className="data-table-header">Material</TableHead>
                      <TableHead className="data-table-header text-right">Viagens</TableHead>
                      <TableHead className="data-table-header text-right">Toneladas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {materialSummary.length > 0 ? (
                      materialSummary.map((row) => (
                        <TableRow key={row.material} className="data-table-row">
                          <TableCell>
                            <span className="status-badge bg-accent/10 text-accent">{row.material}</span>
                          </TableCell>
                          <TableCell className="text-right font-medium">{row.viagens}</TableCell>
                          <TableCell className="text-right font-semibold">
                            {row.toneladas.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} t
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className="h-16 text-center text-muted-foreground">
                          Nenhum registro encontrado
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Company Summary */}
            <div className="chart-container">
              <h3 className="mb-4 font-semibold flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Resumo por Empresa
              </h3>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/50 hover:bg-transparent">
                      <TableHead className="data-table-header">Empresa</TableHead>
                      <TableHead className="data-table-header text-right">Caminhões</TableHead>
                      <TableHead className="data-table-header text-right">Viagens</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {companySummary.length > 0 ? (
                      companySummary.map((row) => (
                        <TableRow key={row.empresa} className="data-table-row">
                          <TableCell>
                            <span className="font-medium">{row.empresa}</span>
                          </TableCell>
                          <TableCell className="text-right">{row.caminhoes}</TableCell>
                          <TableCell className="text-right font-semibold">{row.viagens}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className="h-16 text-center text-muted-foreground">
                          Nenhum registro encontrado
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          {/* Data Table */}
          <div className="chart-container overflow-hidden">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold">Registros Detalhados</h3>
              <p className="text-sm text-muted-foreground">{totalRegistros} registros</p>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="data-table-header">Data</TableHead>
                    <TableHead className="data-table-header">Hora</TableHead>
                    <TableHead className="data-table-header">Ordem</TableHead>
                    <TableHead className="data-table-header">Fornecedor</TableHead>
                    <TableHead className="data-table-header">Veículo</TableHead>
                    <TableHead className="data-table-header">Motorista</TableHead>
                    <TableHead className="data-table-header">Material</TableHead>
                    <TableHead className="data-table-header text-right">P. Líquido</TableHead>
                    <TableHead className="data-table-header text-right">m³</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pedreiraData && pedreiraData.length > 0 ? (
                    pedreiraData.slice(0, 50).map((row, idx) => (
                      <TableRow key={idx} className="data-table-row">
                        <TableCell className="font-medium">{row.Data}</TableCell>
                        <TableCell>{row.Hora}</TableCell>
                        <TableCell className="font-semibold text-primary">#{row.Ordem_Carregamento}</TableCell>
                        <TableCell>{row.Fornecedor}</TableCell>
                        <TableCell>
                          <div>
                            <span className="font-medium">{row.Prefixo_Eq}</span>
                            <p className="text-xs text-muted-foreground">{row.Placa}</p>
                          </div>
                        </TableCell>
                        <TableCell>{row.Motorista}</TableCell>
                        <TableCell>
                          <span className="status-badge bg-accent/10 text-accent">{row.Material}</span>
                        </TableCell>
                        <TableCell className="text-right font-semibold">{row.Peso_Liquido}</TableCell>
                        <TableCell className="text-right">{row.Metro_Cubico}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                        Nenhum registro encontrado para esta data
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            {pedreiraData && pedreiraData.length > 50 && (
              <div className="border-t border-border/50 px-4 py-3 text-center text-sm text-muted-foreground">
                Exibindo 50 de {pedreiraData.length} registros
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
