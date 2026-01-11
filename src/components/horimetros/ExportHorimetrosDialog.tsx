import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Download, Loader2, CalendarIcon, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { HorimetroDB } from "@/hooks/useHorimetros";
import * as XLSX from "xlsx";

interface ExportHorimetrosDialogProps {
  horimetros: HorimetroDB[];
}

export function ExportHorimetrosDialog({ horimetros }: ExportHorimetrosDialogProps) {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [filterVeiculo, setFilterVeiculo] = useState("");

  const normalizeDate = (date: Date): Date => {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  };

  const filteredData = horimetros.filter(h => {
    // Filter by vehicle
    if (filterVeiculo && !h.veiculo.toLowerCase().includes(filterVeiculo.toLowerCase())) {
      return false;
    }

    // Filter by date range
    if (startDate) {
      const itemDate = normalizeDate(new Date(h.data));
      const normalizedStart = normalizeDate(startDate);
      
      if (endDate) {
        const normalizedEnd = normalizeDate(endDate);
        if (itemDate < normalizedStart || itemDate > normalizedEnd) {
          return false;
        }
      } else {
        if (itemDate.getTime() !== normalizedStart.getTime()) {
          return false;
        }
      }
    }

    return true;
  });

  const handleExport = async () => {
    if (filteredData.length === 0) {
      toast.error("Nenhum registro para exportar com os filtros selecionados");
      return;
    }

    setExporting(true);

    try {
      // Prepare data for export
      const exportData = filteredData.map(h => ({
        "Data": format(new Date(h.data), "dd/MM/yyyy"),
        "Veículo": h.veiculo,
        "Descrição": h.descricao_veiculo || "",
        "Horímetro Anterior": Number(h.horimetro_anterior),
        "Horímetro Atual": Number(h.horimetro_atual),
        "Horas Trabalhadas": Number(h.horas_trabalhadas),
        "Operador": h.operador || "",
        "Obra": h.obra || "",
        "Observação": h.observacao || "",
        "Sincronizado": h.sincronizado_sheets ? "Sim" : "Não",
      }));

      // Create summary data
      const totalHoras = filteredData.reduce((sum, h) => sum + Number(h.horas_trabalhadas), 0);
      const mediaHoras = filteredData.length > 0 ? totalHoras / filteredData.length : 0;
      
      // Group by vehicle for summary
      const byVehicle: Record<string, { horas: number; registros: number }> = {};
      filteredData.forEach(h => {
        if (!byVehicle[h.veiculo]) {
          byVehicle[h.veiculo] = { horas: 0, registros: 0 };
        }
        byVehicle[h.veiculo].horas += Number(h.horas_trabalhadas);
        byVehicle[h.veiculo].registros += 1;
      });

      const summaryData = [
        { "Resumo": "Total de Registros", "Valor": filteredData.length },
        { "Resumo": "Total de Horas", "Valor": totalHoras.toFixed(1) },
        { "Resumo": "Média por Registro", "Valor": mediaHoras.toFixed(1) },
        { "Resumo": "", "Valor": "" },
        { "Resumo": "Horas por Veículo", "Valor": "" },
        ...Object.entries(byVehicle)
          .sort((a, b) => b[1].horas - a[1].horas)
          .map(([veiculo, data]) => ({
            "Resumo": veiculo,
            "Valor": `${data.horas.toFixed(1)} h (${data.registros} reg.)`,
          })),
      ];

      // Create workbook
      const wb = XLSX.utils.book_new();

      // Add data sheet
      const wsData = XLSX.utils.json_to_sheet(exportData);
      
      // Set column widths
      wsData["!cols"] = [
        { wch: 12 }, // Data
        { wch: 15 }, // Veículo
        { wch: 25 }, // Descrição
        { wch: 18 }, // Anterior
        { wch: 15 }, // Atual
        { wch: 18 }, // Trabalhadas
        { wch: 20 }, // Operador
        { wch: 20 }, // Obra
        { wch: 30 }, // Observação
        { wch: 12 }, // Sincronizado
      ];
      
      XLSX.utils.book_append_sheet(wb, wsData, "Horímetros");

      // Add summary sheet
      const wsSummary = XLSX.utils.json_to_sheet(summaryData);
      wsSummary["!cols"] = [
        { wch: 25 },
        { wch: 25 },
      ];
      XLSX.utils.book_append_sheet(wb, wsSummary, "Resumo");

      // Generate filename
      let filename = "horimetros";
      if (startDate) {
        filename += `_${format(startDate, "dd-MM-yyyy")}`;
        if (endDate) {
          filename += `_a_${format(endDate, "dd-MM-yyyy")}`;
        }
      }
      if (filterVeiculo) {
        filename += `_${filterVeiculo.replace(/\s+/g, "_")}`;
      }
      filename += ".xlsx";

      // Download file
      XLSX.writeFile(wb, filename);

      toast.success(`${filteredData.length} registros exportados com sucesso!`);
      setOpen(false);
    } catch (error) {
      console.error("Erro ao exportar:", error);
      toast.error("Erro ao exportar dados");
    } finally {
      setExporting(false);
    }
  };

  const clearFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setFilterVeiculo("");
  };

  const getPeriodLabel = () => {
    if (!startDate) return "Todos os períodos";
    if (endDate) return `${format(startDate, "dd/MM/yyyy")} - ${format(endDate, "dd/MM/yyyy")}`;
    return format(startDate, "dd/MM/yyyy");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Exportar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Exportar Horímetros</DialogTitle>
          <DialogDescription>
            Configure os filtros para exportar os dados em formato Excel.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Vehicle filter */}
          <div className="space-y-2">
            <Label>Veículo</Label>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filtrar por código do veículo..."
                value={filterVeiculo}
                onChange={(e) => setFilterVeiculo(e.target.value)}
              />
            </div>
          </div>

          {/* Date range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data Inicial</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "dd/MM/yyyy") : "Selecionar"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    locale={ptBR}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Data Final</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "dd/MM/yyyy") : "Selecionar"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    disabled={(date) => startDate ? date < startDate : false}
                    locale={ptBR}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Preview */}
          <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Período:</span>
              <span className="font-medium">{getPeriodLabel()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Veículo:</span>
              <span className="font-medium">{filterVeiculo || "Todos"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Registros a exportar:</span>
              <span className="font-medium text-primary">{filteredData.length}</span>
            </div>
          </div>

          {(startDate || filterVeiculo) && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="w-full">
              Limpar filtros
            </Button>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleExport} disabled={exporting || filteredData.length === 0}>
            {exporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exportando...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Exportar {filteredData.length} Registros
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
