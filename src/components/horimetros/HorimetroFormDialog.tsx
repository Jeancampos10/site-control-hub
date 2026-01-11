import { useState, useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, Loader2, Plus, Check, ChevronsUpDown, History, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useCreateHorimetro } from "@/hooks/useHorimetros";
import { useGoogleSheets } from "@/hooks/useGoogleSheets";
import { transformVeiculosData, VeiculoRecord } from "@/lib/sheetsDataTransform";
import { supabase } from "@/integrations/supabase/client";

const horimetroSchema = z.object({
  data: z.date(),
  veiculo: z.string().min(1, "Veículo é obrigatório"),
  descricao_veiculo: z.string().optional(),
  horimetro_anterior: z.number().min(0, "Deve ser maior ou igual a 0"),
  horimetro_atual: z.number().min(0, "Deve ser maior ou igual a 0"),
  operador: z.string().optional(),
  obra: z.string().optional(),
  observacao: z.string().optional(),
});

type HorimetroFormValues = z.infer<typeof horimetroSchema>;

interface HorimetroFormDialogProps {
  onSuccess?: () => void;
  defaultVeiculo?: string;
  defaultDescricao?: string;
  triggerButton?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface HistoryRecord {
  data: string;
  horimetro_anterior: number;
  horimetro_atual: number;
  horas_trabalhadas: number;
  operador: string | null;
}

export function HorimetroFormDialog({ 
  onSuccess, 
  defaultVeiculo,
  defaultDescricao,
  triggerButton,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange 
}: HorimetroFormDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [veiculoOpen, setVeiculoOpen] = useState(false);
  const [operadorOpen, setOperadorOpen] = useState(false);
  const [lastHorimetro, setLastHorimetro] = useState(0);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingData, setPendingData] = useState<HorimetroFormValues | null>(null);

  // Support both controlled and uncontrolled modes
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled 
    ? (value: boolean) => controlledOnOpenChange?.(value) 
    : setInternalOpen;
  const [vehicleHistory, setVehicleHistory] = useState<HistoryRecord[]>([]);

  const createHorimetro = useCreateHorimetro();

  // Fetch veículos from Google Sheets
  const { data: veiculosData } = useGoogleSheets("Veiculos");

  const veiculos: VeiculoRecord[] = useMemo(() => {
    if (!veiculosData) return [];
    const rawData = Array.isArray(veiculosData) ? veiculosData : (veiculosData as { data?: Record<string, string>[] }).data;
    if (!rawData) return [];
    return transformVeiculosData(rawData);
  }, [veiculosData]);

  const operadores = useMemo(() => {
    const uniqueOperadores = new Set<string>();
    veiculos.forEach((v) => {
      if (v.motorista && v.motorista.trim()) {
        uniqueOperadores.add(v.motorista.trim());
      }
    });
    return Array.from(uniqueOperadores).sort();
  }, [veiculos]);

  const form = useForm<HorimetroFormValues>({
    resolver: zodResolver(horimetroSchema),
    defaultValues: {
      data: new Date(),
      veiculo: "",
      descricao_veiculo: "",
      horimetro_anterior: 0,
      horimetro_atual: 0,
      operador: "",
      obra: "",
      observacao: "",
    },
  });

  const selectedVeiculo = form.watch("veiculo");
  const horimetroAtual = form.watch("horimetro_atual");
  const horimetroAnterior = form.watch("horimetro_anterior");

  // Set default values when dialog opens with pre-selected vehicle
  useEffect(() => {
    if (open && defaultVeiculo) {
      form.setValue("veiculo", defaultVeiculo);
      if (defaultDescricao) {
        form.setValue("descricao_veiculo", defaultDescricao);
      }
    }
  }, [open, defaultVeiculo, defaultDescricao, form]);

  // Fetch last horimetro and history when vehicle changes
  useEffect(() => {
    async function fetchVehicleData() {
      if (!selectedVeiculo) {
        setLastHorimetro(0);
        setVehicleHistory([]);
        form.setValue("horimetro_anterior", 0);
        return;
      }

      // Fetch last 5 records for history
      const { data: historyData } = await supabase
        .from("horimetros")
        .select("data, horimetro_anterior, horimetro_atual, horas_trabalhadas, operador")
        .eq("veiculo", selectedVeiculo)
        .order("data", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(5);

      if (historyData && historyData.length > 0) {
        setVehicleHistory(historyData.map(h => ({
          data: h.data,
          horimetro_anterior: Number(h.horimetro_anterior),
          horimetro_atual: Number(h.horimetro_atual),
          horas_trabalhadas: Number(h.horas_trabalhadas),
          operador: h.operador,
        })));
        
        const lastValue = Number(historyData[0].horimetro_atual);
        setLastHorimetro(lastValue);
        form.setValue("horimetro_anterior", lastValue);
      } else {
        setVehicleHistory([]);
        
        // Try to get from vehicle data
        const veiculo = veiculos.find(
          (v) => v.codigo.toLowerCase() === selectedVeiculo.toLowerCase()
        );
        
        if (veiculo && veiculo.horimetro > 0) {
          setLastHorimetro(veiculo.horimetro);
          form.setValue("horimetro_anterior", veiculo.horimetro);
        } else {
          setLastHorimetro(0);
          form.setValue("horimetro_anterior", 0);
        }
      }

      // Fill description and other fields from vehicle data
      const veiculo = veiculos.find(
        (v) => v.codigo.toLowerCase() === selectedVeiculo.toLowerCase()
      );

      if (veiculo) {
        form.setValue("descricao_veiculo", veiculo.tipo || "");
        form.setValue("obra", veiculo.obra || "");
        if (veiculo.motorista) {
          form.setValue("operador", veiculo.motorista);
        }
      }
    }

    fetchVehicleData();
  }, [selectedVeiculo, veiculos, form]);

  const horasTrabalhadas = horimetroAtual - horimetroAnterior;

  const submitData = async (data: HorimetroFormValues) => {
    try {
      await createHorimetro.mutateAsync({
        data: format(data.data, "yyyy-MM-dd"),
        veiculo: data.veiculo,
        descricao_veiculo: data.descricao_veiculo,
        horimetro_anterior: data.horimetro_anterior,
        horimetro_atual: data.horimetro_atual,
        operador: data.operador,
        obra: data.obra,
        observacao: data.observacao,
      });

      form.reset();
      setOpen(false);
      setPendingData(null);
      onSuccess?.();
    } catch (error) {
      console.error("Erro ao criar horímetro:", error);
    }
  };

  const onSubmit = async (data: HorimetroFormValues) => {
    // Se valor inconsistente, exigir confirmação
    if (data.horimetro_atual < data.horimetro_anterior) {
      setPendingData(data);
      setShowConfirmDialog(true);
      return;
    }
    await submitData(data);
  };

  const handleConfirmSubmit = async () => {
    if (pendingData) {
      await submitData(pendingData);
    }
    setShowConfirmDialog(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        {triggerButton ? (
          <DialogTrigger asChild>{triggerButton}</DialogTrigger>
        ) : (
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Registro
            </Button>
          </DialogTrigger>
        )}
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Registro de Horímetro</DialogTitle>
            <DialogDescription>
              Registre as horas trabalhadas do equipamento
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Data */}
                <FormField
                  control={form.control}
                  name="data"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button variant="outline" className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                              {field.value ? format(field.value, "dd/MM/yyyy") : "Selecione"}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date > new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Veículo */}
                <FormField
                  control={form.control}
                  name="veiculo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Veículo *</FormLabel>
                      <Popover open={veiculoOpen} onOpenChange={setVeiculoOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button variant="outline" role="combobox" className={cn("w-full justify-between", !field.value && "text-muted-foreground")}>
                              {field.value || "Selecione..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Buscar veículo..." />
                            <CommandEmpty>Nenhum veículo encontrado.</CommandEmpty>
                            <CommandList>
                              <CommandGroup>
                                {veiculos.map((veiculo) => (
                                  <CommandItem
                                    key={veiculo.codigo}
                                    value={veiculo.codigo}
                                    onSelect={() => {
                                      form.setValue("veiculo", veiculo.codigo);
                                      setVeiculoOpen(false);
                                    }}
                                  >
                                    <Check className={cn("mr-2 h-4 w-4", field.value === veiculo.codigo ? "opacity-100" : "opacity-0")} />
                                    <div className="flex flex-col">
                                      <span className="font-medium">{veiculo.codigo}</span>
                                      <span className="text-xs text-muted-foreground">
                                        {veiculo.tipo}
                                      </span>
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Histórico do Veículo */}
              {selectedVeiculo && vehicleHistory.length > 0 && (
                <div className="rounded-lg border bg-muted/50 p-3">
                  <div className="flex items-center gap-2 text-sm font-medium mb-2">
                    <History className="h-4 w-4" />
                    Últimos registros
                  </div>
                  <div className="space-y-1">
                    {vehicleHistory.map((record, index) => (
                      <div key={index} className="flex justify-between text-xs text-muted-foreground">
                        <span className="font-medium">
                          {format(new Date(record.data), "dd/MM/yyyy")}
                        </span>
                        <span>
                          {record.horimetro_anterior.toLocaleString('pt-BR', { minimumFractionDigits: 1 })} → {' '}
                          {record.horimetro_atual.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}
                        </span>
                        <span className="text-primary font-medium">
                          {record.horas_trabalhadas.toFixed(1)} h
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Descrição */}
              <FormField
                control={form.control}
                name="descricao_veiculo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição do Veículo</FormLabel>
                    <FormControl>
                      <Input {...field} readOnly className="bg-muted" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-3 gap-4">
                {/* Horímetro Anterior */}
                <FormField
                  control={form.control}
                  name="horimetro_anterior"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Anterior (h)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Horímetro Atual */}
                <FormField
                  control={form.control}
                  name="horimetro_atual"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Atual (h) *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Horas Trabalhadas (calculado) */}
                <div className="space-y-2">
                  <FormLabel>Trabalhadas</FormLabel>
                  <div className={cn("flex h-9 items-center justify-center rounded-md border px-3 text-sm font-medium", horasTrabalhadas < 0 ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary")}>
                    {horasTrabalhadas.toFixed(1)} h
                  </div>
                </div>
              </div>

              {/* Alerta de valor inconsistente */}
              {horasTrabalhadas < 0 && (
                <div className="flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>
                    Atenção: O horímetro atual ({horimetroAtual}) é menor que o anterior ({horimetroAnterior}). Verifique se os valores estão corretos.
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {/* Operador */}
                <FormField
                  control={form.control}
                  name="operador"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Operador</FormLabel>
                      <Popover open={operadorOpen} onOpenChange={setOperadorOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button variant="outline" role="combobox" className={cn("w-full justify-between", !field.value && "text-muted-foreground")}>
                              {field.value || "Selecione..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[250px] p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Buscar operador..." />
                            <CommandEmpty>Nenhum operador encontrado.</CommandEmpty>
                            <CommandList>
                              <CommandGroup>
                                {operadores.map((operador) => (
                                  <CommandItem
                                    key={operador}
                                    value={operador}
                                    onSelect={() => {
                                      form.setValue("operador", operador);
                                      setOperadorOpen(false);
                                    }}
                                  >
                                    <Check className={cn("mr-2 h-4 w-4", field.value === operador ? "opacity-100" : "opacity-0")} />
                                    {operador}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Obra */}
                <FormField
                  control={form.control}
                  name="obra"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Obra</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Observação */}
              <FormField
                control={form.control}
                name="observacao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observação</FormLabel>
                    <FormControl>
                      <Textarea rows={2} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createHorimetro.isPending}>
                  {createHorimetro.isPending && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  Registrar
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* AlertDialog para confirmar valor inconsistente */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Valor Inconsistente
            </AlertDialogTitle>
            <AlertDialogDescription>
              O horímetro atual ({pendingData?.horimetro_atual}) é menor que o anterior ({pendingData?.horimetro_anterior}). 
              Isso pode indicar um erro de digitação ou troca de equipamento.
              <br /><br />
              <strong>Deseja continuar mesmo assim?</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingData(null)}>
              Corrigir Valores
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmSubmit}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Confirmar Mesmo Assim
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
