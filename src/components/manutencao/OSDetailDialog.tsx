import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { OrdemServico } from "@/hooks/useManutencoes";
import { formatBR, formatBRL } from "@/lib/formatters";
import { FileText, Share2, Loader2, Wrench, Truck, Calendar, DollarSign, Clock, User } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ordem: OrdemServico | null;
}

export function OSDetailDialog({ open, onOpenChange, ordem }: Props) {
  const [exporting, setExporting] = useState(false);

  if (!ordem) return null;

  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes("aberta")) return "bg-blue-500/10 text-blue-600";
    if (s.includes("andamento")) return "bg-yellow-500/10 text-yellow-600";
    if (s.includes("aguard")) return "bg-orange-500/10 text-orange-600";
    if (s.includes("conclu")) return "bg-green-500/10 text-green-600";
    return "";
  };

  const getPrioridadeColor = (p: string) => {
    const s = p.toLowerCase();
    if (s.includes("baixa")) return "border-green-500 text-green-600";
    if (s.includes("méd") || s === "média") return "border-yellow-500 text-yellow-600";
    if (s.includes("alta")) return "border-orange-500 text-orange-600";
    if (s.includes("urgente")) return "border-red-500 text-red-600";
    return "";
  };

  const generatePDF = async () => {
    setExporting(true);
    try {
      const doc = new jsPDF();
      const w = doc.internal.pageSize.width;

      // Header
      doc.setFillColor(30, 64, 120);
      doc.rect(0, 0, w, 32, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.text(`OS-${ordem.numero_os}`, 14, 16);
      doc.setFontSize(10);
      doc.text(`${ordem.veiculo} — ${ordem.descricao_veiculo || ""}`, 14, 24);
      doc.text(`L. Pereira Engenharia`, w - 14, 16, { align: "right" });
      doc.text(`Emitido: ${new Date().toLocaleDateString("pt-BR")}`, w - 14, 24, { align: "right" });

      // Info table
      const info = [
        ["Tipo", ordem.tipo, "Status", ordem.status],
        ["Prioridade", ordem.prioridade, "Mecânico", ordem.mecanico_responsavel || "—"],
        ["Data Abertura", ordem.data_abertura, "Data Fechamento", ordem.data_fechamento || "—"],
        ["Horímetro/KM", ordem.horimetro_km ? formatBR(ordem.horimetro_km) : "—", "Local", ordem.local_servico || "—"],
      ];

      autoTable(doc, {
        startY: 38,
        body: info,
        theme: "grid",
        styles: { fontSize: 9, cellPadding: 4 },
        columnStyles: { 0: { fontStyle: "bold", cellWidth: 35 }, 2: { fontStyle: "bold", cellWidth: 35 } },
      });

      let y = (doc as any).lastAutoTable?.finalY + 10 || 90;

      // Sections
      const sections = [
        { title: "Problema Relatado", text: ordem.problema_relatado },
        { title: "Diagnóstico", text: ordem.diagnostico },
        { title: "Solução Aplicada", text: ordem.solucao_aplicada },
        { title: "Peças Utilizadas", text: ordem.pecas_utilizadas },
        { title: "Observações", text: ordem.observacoes },
      ];

      for (const sec of sections) {
        if (!sec.text) continue;
        if (y > 260) { doc.addPage(); y = 20; }
        doc.setFontSize(11);
        doc.setTextColor(30, 64, 120);
        doc.text(sec.title, 14, y);
        y += 6;
        doc.setFontSize(9);
        doc.setTextColor(60, 60, 60);
        const lines = doc.splitTextToSize(sec.text, w - 28);
        doc.text(lines, 14, y);
        y += lines.length * 5 + 6;
      }

      // Costs
      if (ordem.custo_estimado || ordem.custo_real) {
        if (y > 250) { doc.addPage(); y = 20; }
        doc.setFontSize(11);
        doc.setTextColor(30, 64, 120);
        doc.text("Custos", 14, y);
        y += 6;
        doc.setFontSize(9);
        doc.setTextColor(60, 60, 60);
        if (ordem.custo_estimado) { doc.text(`Estimado: ${formatBRL(ordem.custo_estimado)}`, 14, y); y += 5; }
        if (ordem.custo_real) { doc.text(`Real: ${formatBRL(ordem.custo_real)}`, 14, y); y += 5; }
        if (ordem.tempo_estimado_horas) { doc.text(`Tempo Estimado: ${formatBR(ordem.tempo_estimado_horas)}h`, 14, y); y += 5; }
        if (ordem.tempo_real_horas) { doc.text(`Tempo Real: ${formatBR(ordem.tempo_real_horas)}h`, 14, y); y += 5; }
      }

      // Footer
      const pages = doc.getNumberOfPages();
      for (let i = 1; i <= pages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Página ${i} de ${pages}`, w - 14, doc.internal.pageSize.height - 8, { align: "right" });
        doc.text("Sistema de Controle — L. Pereira Engenharia", 14, doc.internal.pageSize.height - 8);
      }

      doc.save(`OS-${ordem.numero_os}_${ordem.veiculo}.pdf`);
      toast.success("PDF da OS exportado!");
    } catch {
      toast.error("Erro ao gerar PDF");
    } finally {
      setExporting(false);
    }
  };

  const shareWhatsApp = () => {
    const text = `*OS-${ordem.numero_os} — ${ordem.veiculo}*\n` +
      `Tipo: ${ordem.tipo} | Prioridade: ${ordem.prioridade}\n` +
      `Status: ${ordem.status}\n` +
      `Data: ${ordem.data_abertura}\n` +
      (ordem.mecanico_responsavel ? `Mecânico: ${ordem.mecanico_responsavel}\n` : "") +
      `\n*Problema:*\n${ordem.problema_relatado}\n` +
      (ordem.diagnostico ? `\n*Diagnóstico:*\n${ordem.diagnostico}\n` : "") +
      (ordem.solucao_aplicada ? `\n*Solução:*\n${ordem.solucao_aplicada}\n` : "") +
      (ordem.custo_real ? `\n💰 Custo Real: ${formatBRL(ordem.custo_real)}` : "") +
      `\n\n_L. Pereira Engenharia_`;

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const InfoRow = ({ icon: Icon, label, value }: { icon: any; label: string; value: string | null | undefined }) => {
    if (!value) return null;
    return (
      <div className="flex items-start gap-2">
        <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-sm font-medium">{value}</p>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[620px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-primary" />
              OS-{ordem.numero_os}
            </span>
            <div className="flex gap-1.5">
              <Button size="sm" variant="outline" onClick={shareWhatsApp} className="gap-1.5 text-xs">
                <Share2 className="h-3.5 w-3.5" /> WhatsApp
              </Button>
              <Button size="sm" variant="outline" onClick={generatePDF} disabled={exporting} className="gap-1.5 text-xs">
                {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
                PDF
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Vehicle + Status */}
          <div className="flex items-center justify-between rounded-lg bg-muted/60 p-3">
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              <div>
                <p className="font-bold">{ordem.veiculo}</p>
                {ordem.descricao_veiculo && <p className="text-xs text-muted-foreground">{ordem.descricao_veiculo}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(ordem.status)}>{ordem.status}</Badge>
              <Badge variant="outline" className={getPrioridadeColor(ordem.prioridade)}>{ordem.prioridade}</Badge>
            </div>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-3">
            <InfoRow icon={Wrench} label="Tipo" value={ordem.tipo} />
            <InfoRow icon={User} label="Mecânico" value={ordem.mecanico_responsavel} />
            <InfoRow icon={Calendar} label="Abertura" value={ordem.data_abertura} />
            <InfoRow icon={Calendar} label="Fechamento" value={ordem.data_fechamento} />
            <InfoRow icon={Clock} label="Horímetro/KM" value={ordem.horimetro_km ? formatBR(ordem.horimetro_km) : null} />
            <InfoRow icon={User} label="Motorista" value={ordem.motorista_operador} />
          </div>

          <Separator />

          {/* Sections */}
          {ordem.problema_relatado && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Problema Relatado</p>
              <p className="text-sm">{ordem.problema_relatado}</p>
            </div>
          )}
          {ordem.diagnostico && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Diagnóstico</p>
              <p className="text-sm">{ordem.diagnostico}</p>
            </div>
          )}
          {ordem.solucao_aplicada && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Solução Aplicada</p>
              <p className="text-sm">{ordem.solucao_aplicada}</p>
            </div>
          )}
          {ordem.pecas_utilizadas && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Peças Utilizadas</p>
              <p className="text-sm">{ordem.pecas_utilizadas}</p>
            </div>
          )}

          {/* Costs */}
          {(ordem.custo_estimado || ordem.custo_real || ordem.tempo_estimado_horas || ordem.tempo_real_horas) && (
            <>
              <Separator />
              <div className="grid grid-cols-2 gap-3">
                <InfoRow icon={DollarSign} label="Custo Estimado" value={ordem.custo_estimado ? formatBRL(ordem.custo_estimado) : null} />
                <InfoRow icon={DollarSign} label="Custo Real" value={ordem.custo_real ? formatBRL(ordem.custo_real) : null} />
                <InfoRow icon={Clock} label="Horas Estimadas" value={ordem.tempo_estimado_horas ? `${formatBR(ordem.tempo_estimado_horas)}h` : null} />
                <InfoRow icon={Clock} label="Horas Reais" value={ordem.tempo_real_horas ? `${formatBR(ordem.tempo_real_horas)}h` : null} />
              </div>
            </>
          )}

          {ordem.observacoes && (
            <>
              <Separator />
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Observações</p>
                <p className="text-sm">{ordem.observacoes}</p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
