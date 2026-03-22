import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface FrotaItem {
  id: string;
  codigo: string;
  descricao: string;
  categoria: string;
  potencia: string;
  motorista: string;
  empresa: string;
  obra: string;
  status: string;
  ativo: boolean;
}

export function useFrota() {
  return useQuery({
    queryKey: ["frota"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("frota" as any)
        .select("*")
        .eq("ativo", true)
        .order("codigo", { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as FrotaItem[];
    },
  });
}

export function useCreateFrota() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: Omit<FrotaItem, "id" | "ativo">) => {
      const { error } = await supabase.from("frota" as any).insert(item as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["frota"] });
      toast.success("Veículo/equipamento cadastrado!");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useUpdateFrota() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FrotaItem> & { id: string }) => {
      const { error } = await supabase.from("frota" as any).update(updates as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["frota"] });
      toast.success("Registro atualizado!");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useDeleteFrota() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // Soft delete
      const { error } = await supabase.from("frota" as any).update({ ativo: false } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["frota"] });
      toast.success("Registro excluído!");
    },
    onError: (e: any) => toast.error(e.message),
  });
}
