import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ApontamentoPipa {
  id: string;
  data: string;
  prefixo: string;
  descricao: string | null;
  empresa: string | null;
  motorista: string | null;
  capacidade: string | null;
  hora_chegada: string | null;
  hora_saida: string | null;
  n_viagens: number;
  sincronizado_sheets: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApontamentoPipaFormData {
  data: string;
  prefixo: string;
  descricao?: string;
  empresa?: string;
  motorista?: string;
  capacidade?: string;
  n_viagens: number;
}

export function useApontamentosPipa() {
  return useQuery({
    queryKey: ['apontamentos-pipa'],
    queryFn: async (): Promise<ApontamentoPipa[]> => {
      const { data, error } = await supabase
        .from('apontamentos_pipa')
        .select('*')
        .order('data', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateApontamentoPipa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: ApontamentoPipaFormData) => {
      const { data, error } = await supabase
        .from('apontamentos_pipa')
        .insert({
          data: formData.data,
          prefixo: formData.prefixo,
          descricao: formData.descricao || null,
          empresa: formData.empresa || null,
          motorista: formData.motorista || null,
          capacidade: formData.capacidade || null,
          n_viagens: formData.n_viagens,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apontamentos-pipa'] });
      toast.success("Apontamento salvo com sucesso!");
    },
    onError: (error) => {
      console.error('Error creating apontamento:', error);
      toast.error("Erro ao salvar apontamento");
    },
  });
}

export function useUpdateApontamentoPipa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: Partial<ApontamentoPipaFormData> }) => {
      const { data, error } = await supabase
        .from('apontamentos_pipa')
        .update({
          ...formData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apontamentos-pipa'] });
      toast.success("Apontamento atualizado com sucesso!");
    },
    onError: (error) => {
      console.error('Error updating apontamento:', error);
      toast.error("Erro ao atualizar apontamento");
    },
  });
}

export function useDeleteApontamentoPipa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('apontamentos_pipa')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apontamentos-pipa'] });
      toast.success("Apontamento excluído com sucesso!");
    },
    onError: (error) => {
      console.error('Error deleting apontamento:', error);
      toast.error("Erro ao excluir apontamento");
    },
  });
}
