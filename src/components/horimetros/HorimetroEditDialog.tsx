import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, Loader2, Pencil, Trash2 } from "lucide-react";
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
  AlertDialogTrigger,
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
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useUpdateHorimetro, useDeleteHorimetro, HorimetroDB } from "@/hooks/useHorimetros";

const horimetroEditSchema = z.object({
  data: z.date(),
  horimetro_anterior: z.number().min(0),
  horimetro_atual: z.number().min(0),
  operador: z.string().optional(),
  obra: z.string().optional(),
  observacao: z.string().optional(),
});

type HorimetroEditValues = z.infer<typeof horimetroEditSchema>;

interface HorimetroEditDialogProps {
  horimetro: HorimetroDB;
  onSuccess?: () => void;
}

export function HorimetroEditDialog({ horimetro, onSuccess }: HorimetroEditDialogProps) {
  const [open, setOpen] = useState(false);

  const updateHorimetro = useUpdateHorimetro();
  const deleteHorimetro = useDeleteHorimetro();

  const form = useForm<HorimetroEditValues>({
    resolver: zodResolver(horimetroEditSchema),
    defaultValues: {
      data: new Date(horimetro.data),
      horimetro_anterior: Number(horimetro.horimetro_anterior),
      horimetro_atual: Number(horimetro.horimetro_atual),
      operador: horimetro.operador || "",
      obra: horimetro.obra || "",
      observacao: horimetro.observacao || "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        data: new Date(horimetro.data),
        horimetro_anterior: Number(horimetro.horimetro_anterior),
        horimetro_atual: Number(horimetro.horimetro_atual),
        operador: horimetro.operador || "",
        obra: horimetro.obra || "",
        observacao: horimetro.observacao || "",
      });
    }
  }, [open, horimetro, form]);

  const horimetroAtual = form.watch("horimetro_atual");
  const horimetroAnterior = form.watch("horimetro_anterior");
  const horasTrabalhadas = horimetroAtual - horimetroAnterior;

  const onSubmit = async (data: HorimetroEditValues) => {
    try {
      await updateHorimetro.mutateAsync({
        id: horimetro.id,
        originalData: {
          data: horimetro.data,
          veiculo: horimetro.veiculo,
        },
        data: format(data.data, "yyyy-MM-dd"),
        horimetro_anterior: data.horimetro_anterior,
        horimetro_atual: data.horimetro_atual,
        operador: data.operador || undefined,
        obra: data.obra || undefined,
        observacao: data.observacao || undefined,
      });

      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error("Erro ao atualizar horímetro:", error);
      toast.error("Erro ao atualizar horímetro");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteHorimetro.mutateAsync({ id: horimetro.id, data: horimetro });
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error("Erro ao excluir horímetro:", error);
      toast.error("Erro ao excluir registro");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Horímetro</DialogTitle>
          <DialogDescription>
            {horimetro.veiculo} - {horimetro.descricao_veiculo}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    <FormLabel>Atual (h)</FormLabel>
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

              {/* Horas Trabalhadas */}
              <div className="space-y-2">
                <FormLabel>Trabalhadas</FormLabel>
                <div className={cn("flex h-9 items-center justify-center rounded-md border px-3 text-sm font-medium", horasTrabalhadas < 0 ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary")}>
                  {horasTrabalhadas.toFixed(1)} h
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Operador */}
              <FormField
                control={form.control}
                name="operador"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Operador</FormLabel>
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

            <div className="flex justify-between pt-4 border-t">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="destructive" size="sm">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja excluir este registro de horímetro?
                      Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={updateHorimetro.isPending}>
                  {updateHorimetro.isPending && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  Salvar
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
