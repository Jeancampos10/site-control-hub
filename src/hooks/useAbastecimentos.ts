import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AbastecimentoDB {
  id: string;
  data: string;
  hora: string | null;
  tipo: string | null;
  veiculo: string;
  potencia: string | null;
  descricao: string | null;
  motorista: string | null;
  empresa: string | null;
  obra: string | null;
  horimetro_anterior: number;
  horimetro_atual: number;
  km_anterior: number;
  km_atual: number;
  quantidade_combustivel: number;
  tipo_combustivel: string;
  local_abastecimento: string | null;
  arla: boolean;
  quantidade_arla: number;
  fornecedor: string | null;
  nota_fiscal: string | null;
  valor_unitario: number;
  valor_total: number;
  localizacao: string | null;
  observacao: string | null;
  fotos: string | null;
  lubrificacao: boolean;
  oleo: string | null;
  filtro: string | null;
  sincronizado_sheets: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateAbastecimentoInput {
  data: string;
  hora?: string;
  tipo?: string;
  veiculo: string;
  potencia?: string;
  descricao?: string;
  motorista?: string;
  empresa?: string;
  obra?: string;
  horimetro_anterior?: number;
  horimetro_atual?: number;
  km_anterior?: number;
  km_atual?: number;
  quantidade_combustivel: number;
  tipo_combustivel?: string;
  local_abastecimento?: string;
  arla?: boolean;
  quantidade_arla?: number;
  fornecedor?: string;
  nota_fiscal?: string;
  valor_unitario?: number;
  valor_total?: number;
  localizacao?: string;
  observacao?: string;
  fotos?: string;
  lubrificacao?: boolean;
  oleo?: string;
  filtro?: string;
}

export interface UpdateAbastecimentoInput {
  id: string;
  originalData?: {
    data: string;
    veiculo: string;
    hora?: string;
  };
  data?: string;
  hora?: string;
  tipo?: string;
  veiculo?: string;
  potencia?: string;
  descricao?: string;
  motorista?: string;
  empresa?: string;
  obra?: string;
  horimetro_anterior?: number;
  horimetro_atual?: number;
  km_anterior?: number;
  km_atual?: number;
  quantidade_combustivel?: number;
  tipo_combustivel?: string;
  local_abastecimento?: string;
  arla?: boolean;
  quantidade_arla?: number;
  fornecedor?: string;
  nota_fiscal?: string;
  valor_unitario?: number;
  valor_total?: number;
  localizacao?: string;
  observacao?: string;
  fotos?: string;
  lubrificacao?: boolean;
  oleo?: string;
  filtro?: string;
}

export interface ImportAbastecimentoInput {
  data: string;
  hora: string | null;
  tipo: string | null;
  veiculo: string;
  potencia: string | null;
  descricao: string | null;
  motorista: string | null;
  empresa: string | null;
  obra: string | null;
  horimetro_anterior: number;
  horimetro_atual: number;
  km_anterior: number;
  km_atual: number;
  quantidade_combustivel: number;
  tipo_combustivel: string;
  local_abastecimento: string | null;
  arla: boolean;
  quantidade_arla: number;
  fornecedor: string | null;
  nota_fiscal: string | null;
  valor_unitario: number;
  valor_total: number;
  localizacao: string | null;
  observacao: string | null;
  fotos: string | null;
  lubrificacao: boolean;
  oleo: string | null;
  filtro: string | null;
  sincronizado_sheets: boolean;
}

// Sync with Google Sheets via edge function
async function syncWithSheets(action: 'append' | 'update' | 'delete', data: Record<string, unknown>, originalData?: Record<string, unknown>) {
  try {
    const { data: result, error } = await supabase.functions.invoke('sync-abastecimentos', {
      body: { action, data, originalData }
    });

    if (error) {
      console.error('Sync error:', error);
      return { synced: false, error };
    }

    // Update the record to mark as synced
    if (result?.synced && data.id) {
      await supabase
        .from('abastecimentos')
        .update({ sincronizado_sheets: true })
        .eq('id', data.id as string);
    }

    return result;
  } catch (error) {
    console.error('Sync error:', error);
    return { synced: false, error };
  }
}

// Fetch all abastecimentos
export function useAbastecimentos() {
  return useQuery({
    queryKey: ["abastecimentos"],
    queryFn: async (): Promise<AbastecimentoDB[]> => {
      const { data, error } = await supabase
        .from("abastecimentos")
        .select("*")
        .order("data", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as AbastecimentoDB[];
    },
  });
}

// Fetch abastecimentos by vehicle
export function useAbastecimentosByVeiculo(veiculo: string) {
  return useQuery({
    queryKey: ["abastecimentos", "veiculo", veiculo],
    queryFn: async (): Promise<AbastecimentoDB[]> => {
      const { data, error } = await supabase
        .from("abastecimentos")
        .select("*")
        .eq("veiculo", veiculo)
        .order("data", { ascending: false });

      if (error) throw error;
      return data as AbastecimentoDB[];
    },
    enabled: !!veiculo,
  });
}

// Fetch abastecimentos by date range
export function useAbastecimentosByDateRange(startDate: string | null, endDate: string | null) {
  return useQuery({
    queryKey: ["abastecimentos", "dateRange", startDate, endDate],
    queryFn: async (): Promise<AbastecimentoDB[]> => {
      let query = supabase
        .from("abastecimentos")
        .select("*")
        .order("data", { ascending: false });

      if (startDate) {
        query = query.gte("data", startDate);
      }
      if (endDate) {
        query = query.lte("data", endDate);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as AbastecimentoDB[];
    },
    enabled: !!(startDate || endDate),
  });
}

// Create new abastecimento with auto-sync
export function useCreateAbastecimento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateAbastecimentoInput) => {
      const insertData = {
        data: input.data,
        hora: input.hora || null,
        tipo: input.tipo || null,
        veiculo: input.veiculo,
        potencia: input.potencia || null,
        descricao: input.descricao || null,
        motorista: input.motorista || null,
        empresa: input.empresa || null,
        obra: input.obra || null,
        horimetro_anterior: input.horimetro_anterior || 0,
        horimetro_atual: input.horimetro_atual || 0,
        km_anterior: input.km_anterior || 0,
        km_atual: input.km_atual || 0,
        quantidade_combustivel: input.quantidade_combustivel,
        tipo_combustivel: input.tipo_combustivel || 'Diesel S10',
        local_abastecimento: input.local_abastecimento || null,
        arla: input.arla || false,
        quantidade_arla: input.quantidade_arla || 0,
        fornecedor: input.fornecedor || null,
        nota_fiscal: input.nota_fiscal || null,
        valor_unitario: input.valor_unitario || 0,
        valor_total: input.valor_total || 0,
        localizacao: input.localizacao || null,
        observacao: input.observacao || null,
        fotos: input.fotos || null,
        lubrificacao: input.lubrificacao || false,
        oleo: input.oleo || null,
        filtro: input.filtro || null,
        sincronizado_sheets: false,
      };

      const { data, error } = await supabase
        .from("abastecimentos")
        .insert(insertData)
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error("Já existe um registro para este veículo nesta data e hora");
        }
        throw error;
      }

      // Sync with Google Sheets in background
      syncWithSheets('append', { ...insertData, id: data.id }).then(result => {
        if (result?.synced) {
          console.log('Sincronizado com Google Sheets');
        } else {
          console.warn('Sincronização pendente:', result?.warning || result?.error);
        }
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["abastecimentos"] });
      toast.success("Abastecimento registrado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao registrar abastecimento");
    },
  });
}

// Update abastecimento with auto-sync
export function useUpdateAbastecimento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateAbastecimentoInput) => {
      // First get the original record for sync purposes
      const { data: originalRecord } = await supabase
        .from("abastecimentos")
        .select("*")
        .eq("id", input.id)
        .single();

      const updates: Record<string, unknown> = {};
      
      if (input.data !== undefined) updates.data = input.data;
      if (input.hora !== undefined) updates.hora = input.hora || null;
      if (input.tipo !== undefined) updates.tipo = input.tipo || null;
      if (input.veiculo !== undefined) updates.veiculo = input.veiculo;
      if (input.potencia !== undefined) updates.potencia = input.potencia || null;
      if (input.descricao !== undefined) updates.descricao = input.descricao || null;
      if (input.motorista !== undefined) updates.motorista = input.motorista || null;
      if (input.empresa !== undefined) updates.empresa = input.empresa || null;
      if (input.obra !== undefined) updates.obra = input.obra || null;
      if (input.horimetro_anterior !== undefined) updates.horimetro_anterior = input.horimetro_anterior;
      if (input.horimetro_atual !== undefined) updates.horimetro_atual = input.horimetro_atual;
      if (input.km_anterior !== undefined) updates.km_anterior = input.km_anterior;
      if (input.km_atual !== undefined) updates.km_atual = input.km_atual;
      if (input.quantidade_combustivel !== undefined) updates.quantidade_combustivel = input.quantidade_combustivel;
      if (input.tipo_combustivel !== undefined) updates.tipo_combustivel = input.tipo_combustivel;
      if (input.local_abastecimento !== undefined) updates.local_abastecimento = input.local_abastecimento || null;
      if (input.arla !== undefined) updates.arla = input.arla;
      if (input.quantidade_arla !== undefined) updates.quantidade_arla = input.quantidade_arla;
      if (input.fornecedor !== undefined) updates.fornecedor = input.fornecedor || null;
      if (input.nota_fiscal !== undefined) updates.nota_fiscal = input.nota_fiscal || null;
      if (input.valor_unitario !== undefined) updates.valor_unitario = input.valor_unitario;
      if (input.valor_total !== undefined) updates.valor_total = input.valor_total;
      if (input.localizacao !== undefined) updates.localizacao = input.localizacao || null;
      if (input.observacao !== undefined) updates.observacao = input.observacao || null;
      if (input.fotos !== undefined) updates.fotos = input.fotos || null;
      if (input.lubrificacao !== undefined) updates.lubrificacao = input.lubrificacao;
      if (input.oleo !== undefined) updates.oleo = input.oleo || null;
      if (input.filtro !== undefined) updates.filtro = input.filtro || null;
      updates.sincronizado_sheets = false; // Mark as needing sync

      const { data, error } = await supabase
        .from("abastecimentos")
        .update(updates)
        .eq("id", input.id)
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error("Já existe um registro para este veículo nesta data e hora");
        }
        throw error;
      }

      // Sync with Google Sheets in background
      if (originalRecord) {
        syncWithSheets('update', { ...data, id: input.id }, {
          data: originalRecord.data,
          veiculo: originalRecord.veiculo,
          hora: originalRecord.hora
        }).then(result => {
          if (result?.synced) {
            console.log('Sincronizado com Google Sheets');
          } else {
            console.warn('Sincronização pendente:', result?.warning || result?.error);
          }
        });
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["abastecimentos"] });
      toast.success("Abastecimento atualizado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar abastecimento");
    },
  });
}

// Delete abastecimento with auto-sync
export function useDeleteAbastecimento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, syncData }: { id: string; syncData?: AbastecimentoDB }) => {
      // Get record data before deletion for sync
      let recordToSync = syncData;
      if (!recordToSync) {
        const { data } = await supabase
          .from("abastecimentos")
          .select("*")
          .eq("id", id)
          .single();
        recordToSync = data as AbastecimentoDB;
      }

      const { error } = await supabase
        .from("abastecimentos")
        .delete()
        .eq("id", id);

      if (error) throw error;

      // Sync deletion with Google Sheets
      if (recordToSync) {
        syncWithSheets('delete', {
          data: recordToSync.data,
          veiculo: recordToSync.veiculo,
          hora: recordToSync.hora
        }).then(result => {
          if (result?.synced) {
            console.log('Exclusão sincronizada com Google Sheets');
          } else {
            console.warn('Sincronização de exclusão pendente:', result?.warning || result?.error);
          }
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["abastecimentos"] });
      toast.success("Registro excluído com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao excluir registro");
    },
  });
}

// Batch import abastecimentos (no sync - data comes from Sheets)
export function useImportAbastecimentos() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (records: ImportAbastecimentoInput[]) => {
      // Use upsert to handle duplicates gracefully
      const { data, error } = await supabase
        .from("abastecimentos")
        .upsert(
          records.map(r => ({
            data: r.data,
            hora: r.hora,
            tipo: r.tipo,
            veiculo: r.veiculo,
            potencia: r.potencia,
            descricao: r.descricao,
            motorista: r.motorista,
            empresa: r.empresa,
            obra: r.obra,
            horimetro_anterior: r.horimetro_anterior,
            horimetro_atual: r.horimetro_atual,
            km_anterior: r.km_anterior,
            km_atual: r.km_atual,
            quantidade_combustivel: r.quantidade_combustivel,
            tipo_combustivel: r.tipo_combustivel,
            local_abastecimento: r.local_abastecimento,
            arla: r.arla,
            quantidade_arla: r.quantidade_arla,
            fornecedor: r.fornecedor,
            nota_fiscal: r.nota_fiscal,
            valor_unitario: r.valor_unitario,
            valor_total: r.valor_total,
            localizacao: r.localizacao,
            observacao: r.observacao,
            fotos: r.fotos,
            lubrificacao: r.lubrificacao,
            oleo: r.oleo,
            filtro: r.filtro,
            sincronizado_sheets: r.sincronizado_sheets,
          })),
          { onConflict: 'data,veiculo,hora' }
        )
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["abastecimentos"] });
      toast.success(`${data?.length || 0} registros importados com sucesso!`);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao importar registros");
    },
  });
}

// Re-sync pending records
export function useSyncPendingAbastecimentos() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Get all records not synced
      const { data: pendingRecords, error } = await supabase
        .from("abastecimentos")
        .select("*")
        .eq("sincronizado_sheets", false);

      if (error) throw error;
      if (!pendingRecords || pendingRecords.length === 0) {
        return { synced: 0, failed: 0 };
      }

      let synced = 0;
      let failed = 0;

      for (const record of pendingRecords) {
        const result = await syncWithSheets('append', record);
        if (result?.synced) {
          synced++;
        } else {
          failed++;
        }
      }

      return { synced, failed, total: pendingRecords.length };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["abastecimentos"] });
      if (result.synced > 0) {
        toast.success(`${result.synced} registros sincronizados!`);
      }
      if (result.failed > 0) {
        toast.warning(`${result.failed} registros não puderam ser sincronizados`);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao sincronizar registros");
    },
  });
}
