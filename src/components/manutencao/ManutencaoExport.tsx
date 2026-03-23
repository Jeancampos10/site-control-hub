import { useState } from "react";
import { Button } from "@/components/ui/button";
import { OrdemServico } from "@/hooks/useManutencoes";
import { formatBR, formatBRL } from "@/lib/formatters";
import { FileText, FileSpreadsheet, Share2, Loader2 } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { toast } from "sonner";

interface Props {
  ordens: OrdemServico[];
  title?: string;
}

export function ManutencaoExport({ ordens, title = "Relatório de Manutenções" }: Props) {
  const [exporting, setExporting] = useState<string | null>(null);

  const exportPDF = async () => {
    setExporting("pdf");
    try {
      const doc = new jsPDF({ orientation: "landscape" });
      const w = doc.internal.pageSize.width;

      doc.setFillColor(30, 64, 120);
      doc.rect(0, 0, w, 28, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.text(title, 14, 14);
      doc.setFontSize(9);
      doc.text(`L. Pereira Engenharia — ${new Date().toLocaleDateString("pt-BR")}`, 14, 22);
      doc.text(`${ordens.length} registros`, w - 14, 14, { align: "right" });

      const custoTotal = ordens.reduce((s, o) => s + (o.custo_real || 0), 0);
      doc.text(`Custo Total: ${formatBRL(custoTotal)}`, w - 14, 22, { align: "right" });

      autoTable(doc, {
        startY: 34,
        head: [["Nº OS", "Veículo", "Tipo", "Prioridade", "Status", "Problema", "Mecânico", "Abertura", "Custo"]],
        body: ordens.map(os => [
          `OS-${os.numero_os}`,
          os.veiculo,
          os.tipo,
          os.prioridade,
          os.status,
          os.problema_relatado?.substring(0, 40) + (os.problema_relatado?.length > 40 ? "..." : ""),
          os.mecanico_responsavel || "—",
          os.data_abertura,
          os.custo_real ? formatBRL(os.custo_real) : "—",
        ]),
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [30, 64, 120], textColor: [255, 255, 255], fontStyle: "bold" },
        alternateRowStyles: { fillColor: [240, 244, 248] },
        didDrawPage: (d) => {
          doc.setFontSize(7);
          doc.setTextColor(150);
          doc.text(`Página ${d.pageNumber}`, w - 14, doc.internal.pageSize.height - 8, { align: "right" });
        },
      });

      doc.save(`manutencoes_${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success("PDF exportado!");
    } catch {
      toast.error("Erro ao exportar PDF");
    } finally {
      setExporting(null);
    }
  };

  const exportXLSX = () => {
    setExporting("xlsx");
    try {
      const headers = ["Nº OS", "Veículo", "Descrição", "Tipo", "Prioridade", "Status", "Problema", "Diagnóstico", "Solução", "Peças", "Mecânico", "Abertura", "Fechamento", "Horímetro/KM", "Custo Estimado", "Custo Real", "Horas Estimadas", "Horas Reais"];
      const rows = ordens.map(os => [
        os.numero_os, os.veiculo, os.descricao_veiculo, os.tipo, os.prioridade, os.status,
        os.problema_relatado, os.diagnostico, os.solucao_aplicada, os.pecas_utilizadas,
        os.mecanico_responsavel, os.data_abertura, os.data_fechamento,
        os.horimetro_km, os.custo_estimado, os.custo_real, os.tempo_estimado_horas, os.tempo_real_horas,
      ]);

      const ws = XLSX.utils.aoa_to_sheet([[title], [`Gerado: ${new Date().toLocaleDateString("pt-BR")}`], [], headers, ...rows]);
      ws["!cols"] = headers.map(() => ({ wch: 16 }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Manutenções");
      XLSX.writeFile(wb, `manutencoes_${new Date().toISOString().split("T")[0]}.xlsx`);
      toast.success("XLSX exportado!");
    } catch {
      toast.error("Erro ao exportar XLSX");
    } finally {
      setExporting(null);
    }
  };

  const shareWhatsApp = () => {
    const abertas = ordens.filter(o => !o.status.toLowerCase().includes("conclu")).length;
    const concluidas = ordens.filter(o => o.status.toLowerCase().includes("conclu")).length;
    const custoTotal = ordens.reduce((s, o) => s + (o.custo_real || 0), 0);

    const text = `📊 *Resumo de Manutenções — L. Pereira*\n\n` +
      `Total: ${ordens.length} OS\n` +
      `✅ Concluídas: ${concluidas}\n` +
      `⏳ Em aberto: ${abertas}\n` +
      `💰 Custo Total: ${formatBRL(custoTotal)}\n\n` +
      ordens.filter(o => !o.status.toLowerCase().includes("conclu")).slice(0, 5).map(o =>
        `• OS-${o.numero_os} | ${o.veiculo} | ${o.status} | ${o.problema_relatado?.substring(0, 30)}...`
      ).join("\n") +
      `\n\n_${new Date().toLocaleDateString("pt-BR")}_`;

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={shareWhatsApp} disabled={ordens.length === 0} className="gap-1.5">
        <Share2 className="h-4 w-4" /> WhatsApp
      </Button>
      <Button variant="outline" size="sm" onClick={exportXLSX} disabled={exporting !== null || ordens.length === 0} className="gap-1.5">
        {exporting === "xlsx" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
        XLSX
      </Button>
      <Button variant="outline" size="sm" onClick={exportPDF} disabled={exporting !== null || ordens.length === 0} className="gap-1.5">
        {exporting === "pdf" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
        PDF
      </Button>
    </div>
  );
}
