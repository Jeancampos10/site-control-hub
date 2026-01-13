import { useState, useEffect } from "react";
import { format, parse } from "date-fns";
import { CalendarIcon, Pencil } from "lucide-react";
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
import { ApontamentoPipa, useUpdateApontamentoPipa } from "@/hooks/useApontamentosPipa";
import { CaminhaoPipaRow } from "@/hooks/useGoogleSheets";

interface ApontamentoEditDialogProps {
  apontamento: ApontamentoPipa;
  pipas: CaminhaoPipaRow[];
  trigger?: React.ReactNode;
}

export function ApontamentoEditDialog({ apontamento, pipas, trigger }: ApontamentoEditDialogProps) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<Date>(new Date());
  const [prefixo, setPrefixo] = useState("");
  const [viagens, setViagens] = useState("");

  const updateMutation = useUpdateApontamentoPipa();

  useEffect(() => {
    if (open && apontamento) {
      // Parse ISO date to Date object
      const parsedDate = new Date(apontamento.data);
      setData(parsedDate);
      setPrefixo(apontamento.prefixo);
      setViagens(apontamento.n_viagens.toString());
    }
  }, [open, apontamento]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!prefixo || !viagens) return;

    const pipaInfo = pipas.find(p => p.Prefixo === prefixo);

    await updateMutation.mutateAsync({
      id: apontamento.id,
      formData: {
        data: format(data, "yyyy-MM-dd"),
        prefixo,
        descricao: pipaInfo?.Descricao || apontamento.descricao || undefined,
        empresa: pipaInfo?.Empresa || apontamento.empresa || undefined,
        motorista: pipaInfo?.Motorista || apontamento.motorista || undefined,
        capacidade: pipaInfo?.Capacidade || apontamento.capacidade || undefined,
        n_viagens: parseInt(viagens) || 1,
      },
    });

    setOpen(false);
  };

  const uniquePrefixos = Array.from(
    new Map(pipas.map((p) => [p.Prefixo, p])).values()
  ).filter((p) => p.Prefixo);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="gap-2">
            <Pencil className="h-4 w-4" />
            Editar
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Apontamento</DialogTitle>
          <DialogDescription>
            Altere os dados do apontamento de pipa
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
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
          </div>

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
              disabled={updateMutation.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
