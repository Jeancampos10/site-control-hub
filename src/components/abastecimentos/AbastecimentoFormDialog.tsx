import { useState, useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, Loader2, Plus, Check, ChevronsUpDown, Fuel } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useCreateAbastecimento } from "@/hooks/useAbastecimentos";
import { useGoogleSheets } from "@/hooks/useGoogleSheets";
import { transformVeiculosData, VeiculoRecord } from "@/lib/abastech/sheetsDataTransform";

const abastecimentoSchema = z.object({
  data: z.date(),
  hora: z.string().optional(),
  veiculo: z.string().min(1, "Veículo é obrigatório"),
  descricao: z.string().optional(),
  motorista: z.string().optional(),
  obra: z.string().optional(),
  horimetro_anterior: z.number().min(0).optional(),
  horimetro_atual: z.number().min(0).optional(),
  km_anterior: z.number().min(0).optional(),
  km_atual: z.number().min(0).optional(),
  quantidade_combustivel: z.number().min(0.1, "Quantidade é obrigatória"),
  tipo_combustivel: z.string().default("Diesel S10"),
  local_abastecimento: z.string().optional(),
  arla: z.boolean().default(false),
  quantidade_arla: z.number().min(0).optional(),
  valor_unitario: z.number().min(0).optional(),
  valor_total: z.number().min(0).optional(),
  observacao: z.string().optional(),
});

type AbastecimentoFormValues = z.infer<typeof abastecimentoSchema>;

interface AbastecimentoFormDialogProps {
  onSuccess?: () => void;
  triggerButton?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const TIPOS_COMBUSTIVEL = [
  "Diesel S10",
  "Diesel S500",
  "Diesel Comum",
  "Gasolina Comum",
  "Gasolina Aditivada",
  "Etanol",
];

export function AbastecimentoFormDialog({ 
  onSuccess, 
  triggerButton,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange 
}: AbastecimentoFormDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [veiculoOpen, setVeiculoOpen] = useState(false);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled 
    ? (value: boolean) => controlledOnOpenChange?.(value) 
    : setInternalOpen;

  const createAbastecimento = useCreateAbastecimento();

  const { data: veiculosData } = useGoogleSheets("Veiculos");

  const veiculos: VeiculoRecord[] = useMemo(() => {
    if (!veiculosData) return [];
    const rawData = Array.isArray(veiculosData) ? veiculosData : (veiculosData as { data?: Record<string, string>[] }).data;
    if (!rawData) return [];
    return transformVeiculosData(rawData);
  }, [veiculosData]);

  const form = useForm<AbastecimentoFormValues>({
    resolver: zodResolver(abastecimentoSchema),
    defaultValues: {
      data: new Date(),
      hora: format(new Date(), "HH:mm"),
      veiculo: "",
      descricao: "",
      motorista: "",
      obra: "",
      horimetro_anterior: 0,
      horimetro_atual: 0,
      km_anterior: 0,
      km_atual: 0,
      quantidade_combustivel: 0,
      tipo_combustivel: "Diesel S10",
      local_abastecimento: "",
      arla: false,
      quantidade_arla: 0,
      valor_unitario: 0,
      valor_total: 0,
      observacao: "",
    },
  });

  const selectedVeiculo = form.watch("veiculo");
  const quantidade = form.watch("quantidade_combustivel");
  const valorUnitario = form.watch("valor_unitario");

  // Auto-calculate total value
  useEffect(() => {
    const total = quantidade * valorUnitario;
    form.setValue("valor_total", Math.round(total * 100) / 100);
  }, [quantidade, valorUnitario, form]);

  // Fill vehicle data when selected
  useEffect(() => {
    if (!selectedVeiculo) return;
    
    const veiculo = veiculos.find(
      (v) => v.codigo.toLowerCase() === selectedVeiculo.toLowerCase()
    );

    if (veiculo) {
      form.setValue("descricao", veiculo.tipo || "");
      form.setValue("obra", veiculo.obra || "");
      if (veiculo.motorista) {
        form.setValue("motorista", veiculo.motorista);
      }
    }
  }, [selectedVeiculo, veiculos, form]);

  const onSubmit = async (data: AbastecimentoFormValues) => {
    try {
      await createAbastecimento.mutateAsync({
        data: format(data.data, "yyyy-MM-dd"),
        hora: data.hora,
        veiculo: data.veiculo,
        descricao: data.descricao,
        motorista: data.motorista,
        obra: data.obra,
        horimetro_anterior: data.horimetro_anterior,
        horimetro_atual: data.horimetro_atual,
        km_anterior: data.km_anterior,
        km_atual: data.km_atual,
        quantidade_combustivel: data.quantidade_combustivel,
        tipo_combustivel: data.tipo_combustivel,
        local_abastecimento: data.local_abastecimento,
        arla: data.arla,
        quantidade_arla: data.quantidade_arla,
        valor_unitario: data.valor_unitario,
        valor_total: data.valor_total,
        observacao: data.observacao,
      });

      form.reset();
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error("Erro ao criar abastecimento:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {triggerButton ? (
        <DialogTrigger asChild>{triggerButton}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Abastecimento
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Fuel className="h-5 w-5 text-orange-500" />
            Novo Abastecimento
          </DialogTitle>
          <DialogDescription>
            Registre um novo abastecimento de combustível
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

              {/* Hora */}
              <FormField
                control={form.control}
                name="hora"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hora</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                                    <span className="text-xs text-muted-foreground">{veiculo.tipo}</span>
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

              {/* Descrição */}
              <FormField
                control={form.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Input {...field} readOnly className="bg-muted" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Motorista */}
              <FormField
                control={form.control}
                name="motorista"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motorista</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
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

            <div className="grid grid-cols-3 gap-4">
              {/* Quantidade */}
              <FormField
                control={form.control}
                name="quantidade_combustivel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade (L) *</FormLabel>
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

              {/* Tipo Combustível */}
              <FormField
                control={form.control}
                name="tipo_combustivel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Combustível</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TIPOS_COMBUSTIVEL.map((tipo) => (
                          <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Local */}
              <FormField
                control={form.control}
                name="local_abastecimento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Local</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ex: Canteiro 01" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-4 gap-4">
              {/* Horímetro Anterior */}
              <FormField
                control={form.control}
                name="horimetro_anterior"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hor. Anterior</FormLabel>
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
                    <FormLabel>Hor. Atual</FormLabel>
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

              {/* KM Anterior */}
              <FormField
                control={form.control}
                name="km_anterior"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>KM Anterior</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="1"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* KM Atual */}
              <FormField
                control={form.control}
                name="km_atual"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>KM Atual</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="1"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              {/* Valor Unitário */}
              <FormField
                control={form.control}
                name="valor_unitario"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor/L (R$)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Valor Total */}
              <FormField
                control={form.control}
                name="valor_total"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Total (R$)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        className="bg-muted"
                        readOnly
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Arla */}
              <FormField
                control={form.control}
                name="arla"
                render={({ field }) => (
                  <FormItem className="flex flex-col justify-end">
                    <FormLabel>Arla</FormLabel>
                    <div className="flex items-center gap-2">
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      {field.value && (
                        <FormField
                          control={form.control}
                          name="quantidade_arla"
                          render={({ field: arlaField }) => (
                            <Input
                              type="number"
                              step="0.1"
                              placeholder="Litros"
                              className="w-20"
                              {...arlaField}
                              onChange={(e) => arlaField.onChange(parseFloat(e.target.value) || 0)}
                            />
                          )}
                        />
                      )}
                    </div>
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
                    <Textarea {...field} rows={2} placeholder="Observações adicionais..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createAbastecimento.isPending}>
                {createAbastecimento.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
