import { Button } from "@/components/ui/button";
import { FileText, FileSpreadsheet, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { formatBR } from "@/lib/formatters";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ExportColumn {
  key: string;
  label: string;
  format?: "number" | "currency" | "date";
}

interface ExportButtonsProps {
  data: any[];
  columns: ExportColumn[];
  title: string;
  fileName: string;
  periodo?: string;
  totals?: Record<string, number>;
  averages?: Record<string, number>;
}

export function ExportButtons({
  data,
  columns,
  title,
  fileName,
  periodo,
  totals,
  averages,
}: ExportButtonsProps) {
  const [exporting, setExporting] = useState<"xlsx" | "pdf" | null>(null);

  const formatValue = (value: any, format?: string) => {
    if (value == null) return "—";
    if (format === "number") return formatBR(Number(value));
    if (format === "currency") return `R$ ${formatBR(Number(value))}`;
    return String(value);
  };

  const exportXLSX = async () => {
    setExporting("xlsx");
    try {
      const headers = columns.map(c => c.label);
      const rows = data.map(row =>
        columns.map(c => {
          const val = row[c.key];
          if (c.format === "number" || c.format === "currency") return Number(val) || 0;
          return val || "";
        })
      );

      // Add totals/averages rows
      if (totals) {
        rows.push(columns.map(c => (totals[c.key] != null ? totals[c.key] : "")));
      }
      if (averages) {
        rows.push(columns.map(c => (averages[c.key] != null ? averages[c.key] : "")));
      }

      const ws = XLSX.utils.aoa_to_sheet([
        [title],
        [periodo ? `Período: ${periodo}` : `Gerado em: ${new Date().toLocaleDateString("pt-BR")}`],
        [],
        headers,
        ...rows,
      ]);

      // Column widths
      ws["!cols"] = columns.map(() => ({ wch: 18 }));

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, title.substring(0, 31));
      XLSX.writeFile(wb, `${fileName}.xlsx`);
      toast.success("XLSX exportado com sucesso!");
    } catch (err) {
      toast.error("Erro ao exportar XLSX");
    } finally {
      setExporting(null);
    }
  };

  const exportPDF = async () => {
    setExporting("pdf");
    try {
      const doc = new jsPDF({ orientation: "landscape" });

      // Header
      doc.setFillColor(30, 64, 120);
      doc.rect(0, 0, doc.internal.pageSize.width, 28, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.text(title, 14, 14);
      doc.setFontSize(9);
      doc.text(
        periodo || `Gerado em: ${new Date().toLocaleDateString("pt-BR")}`,
        14,
        22
      );

      // Table
      const tableData = data.map(row =>
        columns.map(c => formatValue(row[c.key], c.format))
      );

      // Add totals row
      if (totals) {
        tableData.push(
          columns.map(c =>
            totals[c.key] != null ? formatValue(totals[c.key], c.format) : ""
          )
        );
      }

      autoTable(doc, {
        startY: 34,
        head: [columns.map(c => c.label)],
        body: tableData,
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: {
          fillColor: [30, 64, 120],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        alternateRowStyles: { fillColor: [240, 244, 248] },
        didDrawPage: (d) => {
          // Footer
          const pageCount = doc.getNumberOfPages();
          doc.setFontSize(8);
          doc.setTextColor(120, 120, 120);
          doc.text(
            `Página ${d.pageNumber} de ${pageCount}`,
            doc.internal.pageSize.width - 40,
            doc.internal.pageSize.height - 8
          );
        },
      });

      // KPI summary if totals/averages
      if (totals || averages) {
        const finalY = (doc as any).lastAutoTable?.finalY || 180;
        doc.setFontSize(10);
        doc.setTextColor(30, 64, 120);
        doc.text("Indicadores:", 14, finalY + 12);
        doc.setTextColor(60, 60, 60);
        doc.setFontSize(9);
        let y = finalY + 20;
        if (totals) {
          Object.entries(totals).forEach(([key, val]) => {
            const col = columns.find(c => c.key === key);
            if (col) {
              doc.text(`Total ${col.label}: ${formatValue(val, col.format)}`, 14, y);
              y += 6;
            }
          });
        }
        if (averages) {
          Object.entries(averages).forEach(([key, val]) => {
            const col = columns.find(c => c.key === key);
            if (col) {
              doc.text(`Média ${col.label}: ${formatValue(val, col.format)}`, 14, y);
              y += 6;
            }
          });
        }
      }

      doc.save(`${fileName}.pdf`);
      toast.success("PDF exportado com sucesso!");
    } catch (err) {
      toast.error("Erro ao exportar PDF");
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={exportXLSX}
        disabled={exporting !== null || data.length === 0}
        className="gap-1.5"
      >
        {exporting === "xlsx" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileSpreadsheet className="h-4 w-4" />
        )}
        XLSX
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={exportPDF}
        disabled={exporting !== null || data.length === 0}
        className="gap-1.5"
      >
        {exporting === "pdf" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileText className="h-4 w-4" />
        )}
        PDF
      </Button>
    </div>
  );
}
