import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function exportChecklistPDF(checklist: any) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(30, 30, 30);
  doc.rect(0, 0, pageWidth, 28, "F");
  doc.setTextColor(218, 165, 32);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("ABASTECH", 14, 13);
  doc.setFontSize(10);
  doc.setTextColor(200, 200, 200);
  doc.text("Checklist de Equipamento", 14, 21);

  const tipoLabel = checklist.tipo === "entrada" ? "ENTRADA" : "SAÍDA";
  doc.setFontSize(12);
  doc.setTextColor(218, 165, 32);
  doc.text(tipoLabel, pageWidth - 14, 15, { align: "right" });

  // Info section
  let y = 36;
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");

  const info = [
    ["Veículo", checklist.veiculo || "—"],
    ["Descrição", checklist.descricao_veiculo || "—"],
    ["Data", checklist.data || "—"],
    ["Hora", checklist.hora || "—"],
    ["Motorista", checklist.motorista || "—"],
    ["Obra", checklist.obra || "—"],
    ["KM/Horímetro", checklist.km_horimetro || "—"],
  ];

  info.forEach(([label, value]) => {
    doc.setFont("helvetica", "bold");
    doc.text(`${label}:`, 14, y);
    doc.setFont("helvetica", "normal");
    doc.text(String(value), 50, y);
    y += 5.5;
  });

  y += 4;

  // Parse respostas
  let respostas: any[] = [];
  try {
    respostas = typeof checklist.respostas === "string" ? JSON.parse(checklist.respostas) : checklist.respostas || [];
  } catch { respostas = []; }

  // Group by category
  const categorias: Record<string, any[]> = {};
  respostas.forEach((r: any) => {
    const cat = r.categoria || "Geral";
    if (!categorias[cat]) categorias[cat] = [];
    categorias[cat].push(r);
  });

  // Table for each category
  Object.entries(categorias).forEach(([cat, items]) => {
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 30);
    doc.text(cat.toUpperCase(), 14, y);
    y += 2;

    const tableData = items.map((r: any) => [
      r.descricao,
      r.conforme === true ? "OK" : r.conforme === false ? "NOK" : "N/A",
      r.observacao || "",
    ]);

    autoTable(doc, {
      startY: y,
      head: [["Item", "Status", "Obs"]],
      body: tableData,
      margin: { left: 14, right: 14 },
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [40, 40, 40], textColor: [218, 165, 32], fontStyle: "bold" },
      columnStyles: {
        0: { cellWidth: 100 },
        1: { cellWidth: 20, halign: "center" },
        2: { cellWidth: "auto" },
      },
      didParseCell: (data) => {
        if (data.section === "body" && data.column.index === 1) {
          const val = data.cell.raw as string;
          if (val === "OK") {
            data.cell.styles.textColor = [22, 163, 74];
            data.cell.styles.fontStyle = "bold";
          } else if (val === "NOK") {
            data.cell.styles.textColor = [220, 38, 38];
            data.cell.styles.fontStyle = "bold";
          }
        }
      },
    });

    y = (doc as any).lastAutoTable.finalY + 6;
  });

  // Observações
  if (checklist.observacoes) {
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Observações:", 14, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(checklist.observacoes, pageWidth - 28);
    doc.text(lines, 14, y);
    y += lines.length * 4 + 6;
  }

  // Signature section
  if (y > 235) { doc.addPage(); y = 20; }
  y += 10;

  doc.setDrawColor(100, 100, 100);
  doc.setLineWidth(0.3);

  // User signature
  const signWidth = 70;
  const leftX = 14;
  const rightX = pageWidth - 14 - signWidth;

  doc.line(leftX, y + 15, leftX + signWidth, y + 15);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  doc.text("Responsável / Apontador", leftX + signWidth / 2, y + 20, { align: "center" });
  doc.setFontSize(7);
  doc.text(checklist.operador || "________________", leftX + signWidth / 2, y + 24, { align: "center" });

  // Driver signature
  doc.line(rightX, y + 15, rightX + signWidth, y + 15);
  doc.setFontSize(8);
  doc.text("Motorista / Operador", rightX + signWidth / 2, y + 20, { align: "center" });
  doc.setFontSize(7);
  doc.text(checklist.motorista || "________________", rightX + signWidth / 2, y + 24, { align: "center" });

  // Footer
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(6);
  doc.setTextColor(150, 150, 150);
  doc.text(`Gerado em ${new Date().toLocaleString("pt-BR")} — Abastech`, pageWidth / 2, pageHeight - 8, { align: "center" });

  doc.save(`checklist_${checklist.tipo}_${checklist.veiculo}_${checklist.data}.pdf`);
}
