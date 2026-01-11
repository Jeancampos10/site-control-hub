import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface HorimetroDB {
  id: string;
  data: string;
  veiculo: string;
  descricao_veiculo: string | null;
  horimetro_anterior: number;
  horimetro_atual: number;
  horas_trabalhadas: number;
  operador: string | null;
  obra: string | null;
  observacao: string | null;
  sincronizado_sheets: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateHorimetroInput {
  data: string;
  veiculo: string;
  descricao_veiculo?: string;
  horimetro_anterior: number;
  horimetro_atual: number;
  operador?: string;
  obra?: string;
  observacao?: string;
}

export interface UpdateHorimetroInput {
  id: string;
  originalData: {
    data: string;
    veiculo: string;
  };
  data?: string;
  horimetro_anterior?: number;
  horimetro_atual?: number;
  operador?: string;
  obra?: string;
  observacao?: string;
}

export interface ImportHorimetroInput {
  data: string;
  veiculo: string;
  descricao_veiculo: string | null;
  horimetro_anterior: number;
  horimetro_atual: number;
  operador: string | null;
  obra: string | null;
  observacao: string | null;
  sincronizado_sheets: boolean;
}

// Fetch all horimetros
export function useHorimetros() {
  return useQuery({
    queryKey: ["horimetros"],
    queryFn: async (): Promise<HorimetroDB[]> => {
      const { data, error } = await supabase
        .from("horimetros")
        .select("*")
        .order("data", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as HorimetroDB[];
    },
  });
}

// Fetch horimetros by vehicle
export function useHorimetrosByVeiculo(veiculo: string) {
  return useQuery({
    queryKey: ["horimetros", "veiculo", veiculo],
    queryFn: async (): Promise<HorimetroDB[]> => {
      const { data, error } = await supabase
        .from("horimetros")
        .select("*")
        .eq("veiculo", veiculo)
        .order("data", { ascending: false });

      if (error) throw error;
      return data as HorimetroDB[];
    },
    enabled: !!veiculo,
  });
}

// Create new horimetro
export function useCreateHorimetro() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateHorimetroInput) => {
      const { data, error } = await supabase
        .from("horimetros")
        .insert({
          data: input.data,
          veiculo: input.veiculo,
          descricao_veiculo: input.descricao_veiculo || null,
          horimetro_anterior: input.horimetro_anterior,
          horimetro_atual: input.horimetro_atual,
          operador: input.operador || null,
          obra: input.obra || null,
          observacao: input.observacao || null,
          sincronizado_sheets: false,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error("Já existe um registro para este veículo nesta data");
        }
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["horimetros"] });
      toast.success("Horímetro registrado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao registrar horímetro");
    },
  });
}

// Update horimetro
export function useUpdateHorimetro() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateHorimetroInput) => {
      const updates: Record<string, unknown> = {};
      
      if (input.data) updates.data = input.data;
      if (input.horimetro_anterior !== undefined) updates.horimetro_anterior = input.horimetro_anterior;
      if (input.horimetro_atual !== undefined) updates.horimetro_atual = input.horimetro_atual;
      if (input.operador !== undefined) updates.operador = input.operador || null;
      if (input.obra !== undefined) updates.obra = input.obra || null;
      if (input.observacao !== undefined) updates.observacao = input.observacao || null;
      updates.sincronizado_sheets = false; // Mark as needing sync

      const { data, error } = await supabase
        .from("horimetros")
        .update(updates)
        .eq("id", input.id)
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error("Já existe um registro para este veículo nesta data");
        }
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["horimetros"] });
      toast.success("Horímetro atualizado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar horímetro");
    },
  });
}

// Delete horimetro
export function useDeleteHorimetro() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: string; data?: HorimetroDB }) => {
      const { error } = await supabase
        .from("horimetros")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["horimetros"] });
      toast.success("Registro excluído com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao excluir registro");
    },
  });
}

// Batch import horimetros
export function useImportHorimetros() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (records: ImportHorimetroInput[]) => {
      // Use upsert to handle duplicates gracefully
      const { data, error } = await supabase
        .from("horimetros")
        .upsert(
          records.map(r => ({
            data: r.data,
            veiculo: r.veiculo,
            descricao_veiculo: r.descricao_veiculo,
            horimetro_anterior: r.horimetro_anterior,
            horimetro_atual: r.horimetro_atual,
            operador: r.operador,
            obra: r.obra,
            observacao: r.observacao,
            sincronizado_sheets: r.sincronizado_sheets,
          })),
          { onConflict: 'data,veiculo' }
        )
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["horimetros"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao importar registros");
    },
  });
}
