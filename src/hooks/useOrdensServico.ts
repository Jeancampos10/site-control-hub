import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface OrdemServicoDB {
  id: string;
  numero_os: number;
  data_abertura: string;
  data_fechamento: string | null;
  veiculo: string;
  descricao_veiculo: string | null;
  tipo: string;
  status: string;
  prioridade: string;
  problema_relatado: string;
  diagnostico: string | null;
  solucao_aplicada: string | null;
  pecas_utilizadas: string | null;
  observacoes: string | null;
  motorista_operador: string | null;
  encarregado: string | null;
  mecanico_responsavel: string | null;
  horimetro_km: number | null;
  tempo_estimado_horas: number | null;
  tempo_real_horas: number | null;
  custo_estimado: number | null;
  custo_real: number | null;
  local_servico: string | null;
  created_at: string;
  updated_at: string;
}

export function useOrdensServico() {
  return useQuery({
    queryKey: ["ordens_servico"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ordens_servico")
        .select("*")
        .order("numero_os", { ascending: false });

      if (error) throw error;
      return data as OrdemServicoDB[];
    },
  });
}

export function useCreateOrdemServico() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ordem: Record<string, unknown>) => {
      const { data, error } = await supabase
        .from("ordens_servico")
        .insert(ordem as never)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ordens_servico"] });
    },
  });
}

export function useUpdateOrdemServico() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Record<string, unknown>) => {
      const { data, error } = await supabase
        .from("ordens_servico")
        .update(updates as never)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ordens_servico"] });
    },
  });
}

export function useDeleteOrdemServico() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("ordens_servico")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ordens_servico"] });
    },
  });
}
