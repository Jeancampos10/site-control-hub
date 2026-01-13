import { useState, useEffect } from "react";
import { format } from "date-fns";
import { CalendarIcon, Plus, Droplets } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { CaminhaoPipaRow } from "@/hooks/useGoogleSheets";

interface NovoApontamentoDialogProps {
  pipas: CaminhaoPipaRow[];
  onSave: (data: { Data: string; Prefixo: string; N_Viagens: string }) => Promise<void>;
}

export function NovoApontamentoDialog({ pipas, onSave }: NovoApontamentoDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Date>(new Date());
  const [prefixo, setPrefixo] = useState("");
  const [viagens, setViagens] = useState("");

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setData(new Date());
      setPrefixo("");
      setViagens("");
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prefixo) {
      toast.error("Selecione um prefixo");
      return;
    }
    
    if (!viagens || parseInt(viagens) < 1) {
      toast.error("Informe o número de viagens");
      return;
    }

    setLoading(true);
    try {
      await onSave({
        Data: format(data, "dd/MM/yyyy"),
        Prefixo: prefixo,
        N_Viagens: viagens,
      });
      toast.success("Apontamento salvo com sucesso!");
      setOpen(false);
    } catch (error) {
      console.error("Error saving:", error);
      toast.error("Erro ao salvar apontamento");
    } finally {
      setLoading(false);
    }
  };

  // Get unique prefixos from pipas list
  const uniquePrefixos = Array.from(
    new Map(pipas.map((p) => [p.Prefixo, p])).values()
  ).filter((p) => p.Prefixo);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2 bg-gradient-accent text-accent-foreground hover:opacity-90">
          <Plus className="h-4 w-4" />
          Novo Apontamento
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Droplets className="h-5 w-5 text-info" />
            Novo Apontamento de Pipa
          </DialogTitle>
          <DialogDescription>
            Registre as viagens realizadas pelo caminhão pipa
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Data */}
          <div className="space-y-2">
            <Label>Data</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !data && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {data ? format(data, "dd/MM/yyyy") : "Selecione a data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={data}
                  onSelect={(date) => date && setData(date)}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Prefixo */}
          <div className="space-y-2">
            <Label>Prefixo do Pipa</Label>
            <Select value={prefixo} onValueChange={setPrefixo}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o pipa" />
              </SelectTrigger>
              <SelectContent>
                {uniquePrefixos.map((pipa) => (
                  <SelectItem key={pipa.Prefixo} value={pipa.Prefixo}>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{pipa.Prefixo}</span>
                      {pipa.Descricao && (
                        <span className="text-muted-foreground text-sm">
                          - {pipa.Descricao}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {prefixo && (
              <p className="text-xs text-muted-foreground">
                {uniquePrefixos.find((p) => p.Prefixo === prefixo)?.Empresa || ""} 
                {uniquePrefixos.find((p) => p.Prefixo === prefixo)?.Capacidade && 
                  ` • ${uniquePrefixos.find((p) => p.Prefixo === prefixo)?.Capacidade}`}
              </p>
            )}
          </div>

          {/* Número de Viagens */}
          <div className="space-y-2">
            <Label>Número de Viagens</Label>
            <Input
              type="number"
              min="1"
              value={viagens}
              onChange={(e) => setViagens(e.target.value)}
              placeholder="Ex: 5"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
