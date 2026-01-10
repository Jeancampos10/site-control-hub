import { useState, useMemo } from "react";
import { Mountain, Plus, Download, Building2, DollarSign, Calendar, CalendarDays, TrendingUp } from "lucide-react";
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
import { useGoogleSheets, ApontamentoPedreiraRow, CamReboqueRow, filterByDate } from "@/hooks/useGoogleSheets";
import { TableLoader } from "@/components/ui/loading-spinner";
import { ErrorState } from "@/components/ui/error-state";
import { DateFilter } from "@/components/shared/DateFilter";
import { format, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { parsePtBrNumber } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const FRETE_POR_TONELADA = 0.45;

interface MaterialSummary {
  material: string;
  viagens: number;
  toneladas: number;
  frete: number;
}

interface EmpresaSummary {
  empresa: string;
  caminhoes: number;
  viagens: number;
  toneladas: number;
  frete: number;
}

interface CompanySummary {
  empresa: string;
  caminhoes: number;
  viagens: number;
}

// Helper to parse Brazilian date to Date object
const parsePtBrDate = (dateStr?: string): Date | null => {
  if (!dateStr) return null;
  const match = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!match) return null;
  const [, d, m, y] = match;
  return new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
};

export default function Pedreira() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { data: allData, isLoading, error, refetch } = useGoogleSheets<ApontamentoPedreiraRow>('apontamento_pedreira');
  const { data: reboqueData } = useGoogleSheets<CamReboqueRow>('cam_reboque');

  // Total mobilizado (reboques cadastrados)
  const totalMobilizado = reboqueData?.length || 0;

  // Filter data by selected date
  const pedreiraData = useMemo(() => {
    return filterByDate(allData, selectedDate);
  }, [allData, selectedDate]);

  // Filter data for current month
  const pedreiraDataMes = useMemo(() => {
    if (!allData) return [];
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);
    
    return allData.filter(row => {
      const rowDate = parsePtBrDate(row.Data);
      if (!rowDate) return false;
      return isWithinInterval(rowDate, { start: monthStart, end: monthEnd });
    });
  }, [allData, selectedDate]);

  // Calculate KPIs from filtered data (day)
  const totalRegistros = pedreiraData?.length || 0;
  const pesoTotal = pedreiraData?.reduce((acc, row) => acc + parsePtBrNumber(row.Tonelada), 0) || 0;
  const veiculosAtivos = new Set(pedreiraData?.map(row => row.Prefixo_Eq).filter(Boolean)).size;

  // Totals for period (all data)
  const totalPesoPeriodo = allData?.reduce((acc, row) => acc + parsePtBrNumber(row.Tonelada), 0) || 0;
  const totalFretePeriodo = totalPesoPeriodo * FRETE_POR_TONELADA;

  // Totals for month
  const totalPesoMes = pedreiraDataMes?.reduce((acc, row) => acc + parsePtBrNumber(row.Tonelada), 0) || 0;
  const totalFreteMes = totalPesoMes * FRETE_POR_TONELADA;

  // Totals for day
  const totalPesoDia = pesoTotal;
  const totalFreteDia = totalPesoDia * FRETE_POR_TONELADA;

  // Summary by material for each period
  const createMaterialSummary = (data: ApontamentoPedreiraRow[] | undefined): MaterialSummary[] => {
    if (!data) return [];
    
    const grouped = new Map<string, MaterialSummary>();
    
    data.forEach(row => {
      const material = row.Material || 'Outros';
      const toneladas = parsePtBrNumber(row.Tonelada);
      
      if (!grouped.has(material)) {
        grouped.set(material, { material, viagens: 0, toneladas: 0, frete: 0 });
      }
      
      const summary = grouped.get(material)!;
      summary.viagens += 1;
      summary.toneladas += toneladas;
      summary.frete = summary.toneladas * FRETE_POR_TONELADA;
    });
    
    return Array.from(grouped.values()).sort((a, b) => b.toneladas - a.toneladas);
  };

  // Summary by empresa for each period
  const createEmpresaSummary = (data: ApontamentoPedreiraRow[] | undefined): EmpresaSummary[] => {
    if (!data) return [];
    
    const grouped = new Map<string, { trucks: Set<string>; viagens: number; toneladas: number }>();
    
    data.forEach(row => {
      const empresa = row.Empresa_Eq || row.Fornecedor || 'Outros';
      const toneladas = parsePtBrNumber(row.Tonelada);
      
      if (!grouped.has(empresa)) {
        grouped.set(empresa, { trucks: new Set(), viagens: 0, toneladas: 0 });
      }
      
      const summary = grouped.get(empresa)!;
      summary.viagens += 1;
      summary.toneladas += toneladas;
      if (row.Prefixo_Eq) summary.trucks.add(row.Prefixo_Eq);
    });
    
    return Array.from(grouped.entries()).map(([empresa, data]) => ({
      empresa,
      caminhoes: data.trucks.size,
      viagens: data.viagens,
      toneladas: data.toneladas,
      frete: data.toneladas * FRETE_POR_TONELADA,
    })).sort((a, b) => b.viagens - a.viagens);
  };

  const materialSummaryPeriodo = useMemo(() => createMaterialSummary(allData), [allData]);
  const materialSummaryMes = useMemo(() => createMaterialSummary(pedreiraDataMes), [pedreiraDataMes]);
  const materialSummaryDia = useMemo(() => createMaterialSummary(pedreiraData), [pedreiraData]);

  const empresaSummaryPeriodo = useMemo(() => createEmpresaSummary(allData), [allData]);
  const empresaSummaryMes = useMemo(() => createEmpresaSummary(pedreiraDataMes), [pedreiraDataMes]);
  const empresaSummaryDia = useMemo(() => createEmpresaSummary(pedreiraData), [pedreiraData]);

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
  const formattedMonth = format(selectedDate, "MMMM/yyyy", { locale: ptBR });

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
    doc.text(`Valor Frete: R$ ${totalFreteDia.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 14, 48);

    // Material Summary
    doc.setFontSize(14);
    doc.text('Resumo por Material', 14, 60);
    
    autoTable(doc, {
      head: [['Material', 'Viagens', 'Toneladas', 'Frete (R$)']],
      body: materialSummaryDia.map(row => [
        row.material,
        row.viagens.toString(),
        row.toneladas.toLocaleString('pt-BR', { maximumFractionDigits: 2 }) + ' t',
        'R$ ' + row.frete.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
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
      head: [['Hora', 'Ordem', 'Veículo', 'Material', 'Peso Líq.', 'Ton']],
      body: (pedreiraData || []).map(row => [
        row.Hora,
        row.Ordem_Carregamento,
        row.Prefixo_Eq,
        row.Material,
        row.Peso_Liquido,
        row.Tonelada,
      ]),
      startY: finalY2 > 220 ? 27 : finalY2 + 20,
      theme: 'striped',
      styles: { fontSize: 8 },
    });

    doc.save(`relatorio-pedreira-${dateStr.replace(/\//g, '-')}.pdf`);
  };

  // Period Summary Card Component with distinct styling
  interface PeriodSummaryProps {
    materialData: MaterialSummary[];
    empresaData: EmpresaSummary[];
    title: string;
    subtitle: string;
    colorScheme: 'blue' | 'amber' | 'emerald';
    icon: React.ReactNode;
  }

  const PeriodSummaryCard = ({ materialData, empresaData, title, subtitle, colorScheme, icon }: PeriodSummaryProps) => {
    const totalViagens = materialData.reduce((sum, r) => sum + r.viagens, 0);
    const totalToneladas = materialData.reduce((sum, r) => sum + r.toneladas, 0);
    const totalFrete = totalToneladas * FRETE_POR_TONELADA;

    const colorClasses = {
      blue: {
        border: 'border-l-4 border-l-blue-500',
        header: 'bg-blue-500/10',
        title: 'text-blue-700 dark:text-blue-400',
        badge: 'bg-blue-500 text-white',
      },
      amber: {
        border: 'border-l-4 border-l-amber-500',
        header: 'bg-amber-500/10',
        title: 'text-amber-700 dark:text-amber-400',
        badge: 'bg-amber-500 text-white',
      },
      emerald: {
        border: 'border-l-4 border-l-emerald-500',
        header: 'bg-emerald-500/10',
        title: 'text-emerald-700 dark:text-emerald-400',
        badge: 'bg-emerald-500 text-white',
      },
    };

    const colors = colorClasses[colorScheme];

    return (
      <Card className={`${colors.border} overflow-hidden`}>
        <CardHeader className={`${colors.header} pb-3`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {icon}
              <div>
                <CardTitle className={`text-lg font-bold ${colors.title}`}>{title}</CardTitle>
                <CardDescription className="text-xs">{subtitle}</CardDescription>
              </div>
            </div>
            <span className={`${colors.badge} px-3 py-1 rounded-full text-sm font-bold`}>
              {totalViagens} viagens
            </span>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          {/* Totals */}
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold">{totalToneladas.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} t</p>
              <p className="text-xs text-muted-foreground">Total Toneladas</p>
            </div>
            <div className="text-center p-3 bg-success/10 rounded-lg">
              <p className="text-2xl font-bold text-success">R$ {totalFrete.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              <p className="text-xs text-muted-foreground">Total Frete</p>
            </div>
          </div>

          {/* Material Summary */}
          <div>
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
              <Box className="h-3 w-3" /> Por Material
            </h4>
            <div className="overflow-x-auto max-h-32 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="text-xs">
                    <TableHead className="py-1 px-2">Material</TableHead>
                    <TableHead className="py-1 px-2 text-right">Viagens</TableHead>
                    <TableHead className="py-1 px-2 text-right">Ton</TableHead>
                    <TableHead className="py-1 px-2 text-right">Frete</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {materialData.length > 0 ? (
                    materialData.map((row) => (
                      <TableRow key={row.material} className="text-xs">
                        <TableCell className="py-1 px-2 font-medium">{row.material}</TableCell>
                        <TableCell className="py-1 px-2 text-right">{row.viagens}</TableCell>
                        <TableCell className="py-1 px-2 text-right">{row.toneladas.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}</TableCell>
                        <TableCell className="py-1 px-2 text-right text-success">R$ {row.frete.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow><TableCell colSpan={4} className="text-center text-xs py-2">Sem dados</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Empresa Summary */}
          <div>
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
              <Building2 className="h-3 w-3" /> Por Empresa
            </h4>
            <div className="overflow-x-auto max-h-32 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="text-xs">
                    <TableHead className="py-1 px-2">Empresa</TableHead>
                    <TableHead className="py-1 px-2 text-right">Cam.</TableHead>
                    <TableHead className="py-1 px-2 text-right">Viagens</TableHead>
                    <TableHead className="py-1 px-2 text-right">Ton</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {empresaData.length > 0 ? (
                    empresaData.map((row) => (
                      <TableRow key={row.empresa} className="text-xs">
                        <TableCell className="py-1 px-2 font-medium">{row.empresa}</TableCell>
                        <TableCell className="py-1 px-2 text-right">{row.caminhoes}</TableCell>
                        <TableCell className="py-1 px-2 text-right">{row.viagens}</TableCell>
                        <TableCell className="py-1 px-2 text-right">{row.toneladas.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow><TableCell colSpan={4} className="text-center text-xs py-2">Sem dados</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    );
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
          {/* Period Summaries Section - Distinct from KPIs */}
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
                subtitle="Todo o período disponível"
                colorScheme="blue"
                icon={<Calendar className="h-5 w-5 text-blue-500" />}
              />
              <PeriodSummaryCard 
                materialData={materialSummaryMes}
                empresaData={empresaSummaryMes}
                title={formattedMonth} 
                subtitle="Mês selecionado"
                colorScheme="amber"
                icon={<CalendarDays className="h-5 w-5 text-amber-500" />}
              />
              <PeriodSummaryCard 
                materialData={materialSummaryDia}
                empresaData={empresaSummaryDia}
                title={formattedDate} 
                subtitle="Dia selecionado"
                colorScheme="emerald"
                icon={<Calendar className="h-5 w-5 text-emerald-500" />}
              />
            </div>
          </div>

          {/* Visual Separator */}
          <div className="relative py-2">
            <Separator className="bg-border" />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-4 text-sm font-medium text-muted-foreground">
              Informações do Dia
            </span>
          </div>

          {/* Daily KPIs Section */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
              title="Veículos"
              value={`${veiculosAtivos} / ${totalMobilizado}`}
              subtitle="Utilizados / Mobilizados"
              icon={Truck}
              variant="default"
            />
          </div>

          {/* Summaries side by side */}
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Material Summary (Day) */}
            <div className="chart-container">
              <h3 className="mb-4 font-semibold">Resumo por Material (Dia)</h3>
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
                    {materialSummaryDia.length > 0 ? (
                      materialSummaryDia.map((row) => (
                        <TableRow key={row.material} className="data-table-row">
                          <TableCell>
                            <span className="status-badge bg-accent/10 text-accent">{row.material}</span>
                          </TableCell>
                          <TableCell className="text-right font-medium">{row.viagens}</TableCell>
                          <TableCell className="text-right font-semibold">
                            {row.toneladas.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} t
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
                    <TableHead className="data-table-header text-right">Toneladas</TableHead>
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
                        <TableCell className="text-right">{row.Tonelada}</TableCell>
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
