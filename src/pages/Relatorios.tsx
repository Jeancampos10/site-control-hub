import { useState } from "react";
import { FileText, Download, Calendar, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DateFilter } from "@/components/shared/DateFilter";
import { useGoogleSheets, CargaRow, DescargaRow, filterByDate } from "@/hooks/useGoogleSheets";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function Relatorios() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  const { data: cargaData } = useGoogleSheets<CargaRow>('carga');
  const { data: descargaData } = useGoogleSheets<DescargaRow>('descarga');

  const filteredCarga = filterByDate(cargaData, selectedDate);
  const filteredDescarga = filterByDate(descargaData, selectedDate);

  const formattedDate = format(selectedDate, "dd 'de' MMMM", { locale: ptBR });
  const dateStr = format(selectedDate, "dd/MM/yyyy");

  // Calculate stats
  const totalViagens = filteredCarga.reduce((acc, row) => acc + (parseInt(row.N_Viagens) || 0), 0);
  const volumeTotal = filteredCarga.reduce((acc, row) => acc + (parseFloat(row.Volume_Total) || 0), 0);
  const escavadeiras = new Set(filteredCarga.map(row => row.Prefixo_Eq).filter(Boolean)).size;
  const caminhoes = new Set(filteredCarga.map(row => row.Prefixo_Cb).filter(Boolean)).size;

  const exportEscavadeiraReport = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Relatório Diário por Escavadeira', 14, 22);
    doc.setFontSize(11);
    doc.text(`Data: ${dateStr}`, 14, 30);

    // Group by excavator
    const grouped = new Map<string, { viagens: number; volume: number; materiais: Record<string, number> }>();
    filteredCarga.forEach(row => {
      const prefixo = row.Prefixo_Eq || 'Sem Prefixo';
      if (!grouped.has(prefixo)) {
        grouped.set(prefixo, { viagens: 0, volume: 0, materiais: {} });
      }
      const data = grouped.get(prefixo)!;
      const viagens = parseInt(row.N_Viagens) || 0;
      data.viagens += viagens;
      data.volume += parseFloat(row.Volume_Total) || 0;
      const mat = row.Material || 'Outros';
      data.materiais[mat] = (data.materiais[mat] || 0) + viagens;
    });

    const tableData = Array.from(grouped.entries()).map(([prefixo, data]) => [
      prefixo,
      data.viagens.toString(),
      `${data.volume.toFixed(0)} m³`,
      Object.entries(data.materiais).map(([m, v]) => `${m}: ${v}`).join(', '),
    ]);

    autoTable(doc, {
      head: [['Escavadeira', 'Viagens', 'Volume', 'Materiais']],
      body: tableData,
      startY: 40,
      theme: 'striped',
    });

    doc.save(`relatorio-escavadeiras-${dateStr.replace(/\//g, '-')}.pdf`);
    toast.success('Relatório exportado com sucesso!');
  };

  const exportMaterialReport = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Relatório de Materiais', 14, 22);
    doc.setFontSize(11);
    doc.text(`Data: ${dateStr}`, 14, 30);

    const grouped = new Map<string, { viagens: number; volume: number }>();
    filteredCarga.forEach(row => {
      const material = row.Material || 'Outros';
      if (!grouped.has(material)) {
        grouped.set(material, { viagens: 0, volume: 0 });
      }
      const data = grouped.get(material)!;
      data.viagens += parseInt(row.N_Viagens) || 0;
      data.volume += parseFloat(row.Volume_Total) || 0;
    });

    const tableData = Array.from(grouped.entries()).map(([material, data]) => [
      material,
      data.viagens.toString(),
      `${data.volume.toFixed(0)} m³`,
    ]);

    autoTable(doc, {
      head: [['Material', 'Viagens', 'Volume']],
      body: tableData,
      startY: 40,
      theme: 'striped',
    });

    doc.save(`relatorio-materiais-${dateStr.replace(/\//g, '-')}.pdf`);
    toast.success('Relatório exportado com sucesso!');
  };

  const exportLocalReport = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Relatório por Local', 14, 22);
    doc.setFontSize(11);
    doc.text(`Data: ${dateStr}`, 14, 30);

    const grouped = new Map<string, { viagens: number; volume: number }>();
    filteredDescarga.forEach(row => {
      const local = row.Local_da_Obra || 'Sem Local';
      if (!grouped.has(local)) {
        grouped.set(local, { viagens: 0, volume: 0 });
      }
      const data = grouped.get(local)!;
      data.viagens += parseInt(row.N_Viagens) || 0;
      data.volume += parseFloat(row.Volume_Total) || 0;
    });

    const tableData = Array.from(grouped.entries()).map(([local, data]) => [
      local,
      data.viagens.toString(),
      `${data.volume.toFixed(0)} m³`,
    ]);

    autoTable(doc, {
      head: [['Local', 'Viagens', 'Volume']],
      body: tableData,
      startY: 40,
      theme: 'striped',
    });

    doc.save(`relatorio-locais-${dateStr.replace(/\//g, '-')}.pdf`);
    toast.success('Relatório exportado com sucesso!');
  };

  const exportFrotaReport = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Relatório de Frota', 14, 22);
    doc.setFontSize(11);
    doc.text(`Data: ${dateStr}`, 14, 30);

    const grouped = new Map<string, { motorista: string; viagens: number; volume: number }>();
    filteredCarga.forEach(row => {
      const prefixo = row.Prefixo_Cb || 'Sem Prefixo';
      if (!grouped.has(prefixo)) {
        grouped.set(prefixo, { motorista: row.Motorista || '', viagens: 0, volume: 0 });
      }
      const data = grouped.get(prefixo)!;
      data.viagens += parseInt(row.N_Viagens) || 0;
      data.volume += parseFloat(row.Volume_Total) || 0;
    });

    const tableData = Array.from(grouped.entries()).map(([prefixo, data]) => [
      prefixo,
      data.motorista,
      data.viagens.toString(),
      `${data.volume.toFixed(0)} m³`,
    ]);

    autoTable(doc, {
      head: [['Caminhão', 'Motorista', 'Viagens', 'Volume']],
      body: tableData,
      startY: 40,
      theme: 'striped',
    });

    doc.save(`relatorio-frota-${dateStr.replace(/\//g, '-')}.pdf`);
    toast.success('Relatório exportado com sucesso!');
  };

  const exportApontadoresReport = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Relatório de Apontadores', 14, 22);
    doc.setFontSize(11);
    doc.text(`Data: ${dateStr}`, 14, 30);

    const grouped = new Map<string, { registros: number; viagens: number }>();
    filteredCarga.forEach(row => {
      const usuario = row.Usuario || 'Sem Usuário';
      if (!grouped.has(usuario)) {
        grouped.set(usuario, { registros: 0, viagens: 0 });
      }
      const data = grouped.get(usuario)!;
      data.registros += 1;
      data.viagens += parseInt(row.N_Viagens) || 0;
    });

    const tableData = Array.from(grouped.entries()).map(([usuario, data]) => [
      usuario,
      data.registros.toString(),
      data.viagens.toString(),
    ]);

    autoTable(doc, {
      head: [['Apontador', 'Registros', 'Viagens']],
      body: tableData,
      startY: 40,
      theme: 'striped',
    });

    doc.save(`relatorio-apontadores-${dateStr.replace(/\//g, '-')}.pdf`);
    toast.success('Relatório exportado com sucesso!');
  };

  const exportGerencialReport = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Relatório Gerencial', 14, 22);
    doc.setFontSize(11);
    doc.text(`Data: ${dateStr}`, 14, 30);

    // Summary
    doc.setFontSize(14);
    doc.text('Resumo Executivo', 14, 45);
    doc.setFontSize(11);
    doc.text(`Total de Viagens: ${totalViagens}`, 14, 55);
    doc.text(`Volume Total: ${volumeTotal.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} m³`, 14, 62);
    doc.text(`Escavadeiras Ativas: ${escavadeiras}`, 14, 69);
    doc.text(`Caminhões Ativos: ${caminhoes}`, 14, 76);

    doc.save(`relatorio-gerencial-${dateStr.replace(/\//g, '-')}.pdf`);
    toast.success('Relatório exportado com sucesso!');
  };

  const relatorios = [
    {
      id: 1,
      titulo: "Relatório Diário por Escavadeira",
      descricao: "Detalhamento completo da produção diária de cada escavadeira, incluindo materiais, viagens e volumes",
      icone: "📊",
      formato: "PDF",
      onExport: exportEscavadeiraReport,
    },
    {
      id: 2,
      titulo: "Relatório de Materiais",
      descricao: "Resumo de movimentação por tipo de material (Rachão, Bota-fora, Argila, etc.)",
      icone: "📦",
      formato: "PDF",
      onExport: exportMaterialReport,
    },
    {
      id: 3,
      titulo: "Relatório por Local",
      descricao: "Análise de produção por local de obra e estaca",
      icone: "📍",
      formato: "PDF",
      onExport: exportLocalReport,
    },
    {
      id: 4,
      titulo: "Relatório de Frota",
      descricao: "Status e produtividade de caminhões e equipamentos",
      icone: "🚚",
      formato: "PDF",
      onExport: exportFrotaReport,
    },
    {
      id: 5,
      titulo: "Relatório de Apontadores",
      descricao: "Registros e produtividade por apontador de campo",
      icone: "👷",
      formato: "PDF",
      onExport: exportApontadoresReport,
    },
    {
      id: 6,
      titulo: "Relatório Gerencial",
      descricao: "Visão executiva com KPIs, tendências e análises comparativas",
      icone: "📈",
      formato: "PDF",
      onExport: exportGerencialReport,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="page-header mb-0">
          <h1 className="page-title flex items-center gap-2">
            <FileText className="h-6 w-6 text-accent" />
            Relatórios
          </h1>
          <p className="page-subtitle">
            Geração e exportação de relatórios operacionais • {formattedDate}
          </p>
        </div>
        <div className="flex gap-2">
          <DateFilter date={selectedDate} onDateChange={setSelectedDate} />
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {relatorios.map((relatorio) => (
          <Card
            key={relatorio.id}
            className="group cursor-pointer border-border/50 transition-all hover:border-accent/50 hover:shadow-card-hover"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <span className="text-3xl">{relatorio.icone}</span>
                <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                  {relatorio.formato}
                </span>
              </div>
              <CardTitle className="text-base">{relatorio.titulo}</CardTitle>
              <CardDescription className="text-sm">
                {relatorio.descricao}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-2 group-hover:border-accent group-hover:text-accent"
                  onClick={relatorio.onExport}
                >
                  <Download className="h-4 w-4" />
                  Baixar
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="gap-2"
                  onClick={() => {
                    relatorio.onExport();
                    setTimeout(() => window.print(), 500);
                  }}
                >
                  <Printer className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="chart-container">
        <h3 className="mb-4 text-base font-semibold">Resumo do Dia - {dateStr}</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
            <p className="text-sm text-muted-foreground">Total de Viagens</p>
            <p className="text-2xl font-bold text-foreground">{totalViagens}</p>
          </div>
          <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
            <p className="text-sm text-muted-foreground">Volume Total</p>
            <p className="text-2xl font-bold text-foreground">{volumeTotal.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} m³</p>
          </div>
          <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
            <p className="text-sm text-muted-foreground">Escavadeiras</p>
            <p className="text-2xl font-bold text-foreground">{escavadeiras}</p>
          </div>
          <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
            <p className="text-sm text-muted-foreground">Caminhões</p>
            <p className="text-2xl font-bold text-foreground">{caminhoes}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
