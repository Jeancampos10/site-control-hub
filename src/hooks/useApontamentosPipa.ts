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

// Sync with Google Sheets
async function syncWithSheets(action: 'append' | 'update' | 'delete', data: any, recordId?: string) {
  try {
    console.log('Syncing with sheets:', { action, data, recordId });
    
    const response = await supabase.functions.invoke('sync-apontamento-pipa', {
      body: { action, data, recordId }
    });
    
    console.log('Sync response:', response);
    
    if (response.error) {
      console.error('Sync error:', response.error);
      return { synced: false, error: response.error };
    }
    
    // Invalidate query to refresh sync status
    return response.data;
  } catch (error) {
    console.error('Sync failed:', error);
    return { synced: false, error };
  }
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
      // First save to database
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
          sincronizado_sheets: false,
        })
        .select()
        .single();

      if (error) throw error;

      // Then sync with Google Sheets in background
      syncWithSheets('append', {
        data: formData.data,
        prefixo: formData.prefixo,
        descricao: formData.descricao || '',
        empresa: formData.empresa || '',
        motorista: formData.motorista || '',
        capacidade: formData.capacidade || '',
        n_viagens: formData.n_viagens,
      }, data.id).then(result => {
        if (result?.synced) {
          console.log('Synced with Google Sheets');
        } else {
          console.warn('Failed to sync with Google Sheets');
        }
      });

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
      // Update in database
      const { data, error } = await supabase
        .from('apontamentos_pipa')
        .update({
          ...formData,
          sincronizado_sheets: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Sync with Google Sheets in background
      // Note: For updates, we would need the row index from the sheet
      // For now, we'll just mark it and handle manually or via a batch sync
      syncWithSheets('append', {
        data: data.data,
        prefixo: data.prefixo,
        descricao: data.descricao || '',
        empresa: data.empresa || '',
        motorista: data.motorista || '',
        capacidade: data.capacidade || '',
        n_viagens: data.n_viagens,
      }, data.id);

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
      
      // Note: Delete from sheets would require row index
      // For full sync, consider a periodic batch job
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

// Hook to sync all pending records
export function useSyncPendingApontamentos() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data: pending, error } = await supabase
        .from('apontamentos_pipa')
        .select('*')
        .eq('sincronizado_sheets', false);

      if (error) throw error;
      if (!pending || pending.length === 0) return { synced: 0 };

      let syncedCount = 0;
      for (const record of pending) {
        const result = await syncWithSheets('append', {
          data: record.data,
          prefixo: record.prefixo,
          descricao: record.descricao || '',
          empresa: record.empresa || '',
          motorista: record.motorista || '',
          capacidade: record.capacidade || '',
          n_viagens: record.n_viagens,
        }, record.id);

        if (result?.synced) syncedCount++;
      }

      return { synced: syncedCount, total: pending.length };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['apontamentos-pipa'] });
      if (result.synced > 0) {
        toast.success(`${result.synced} de ${result.total} registros sincronizados!`);
      } else {
        toast.info("Nenhum registro pendente para sincronizar");
      }
    },
    onError: (error) => {
      console.error('Error syncing:', error);
      toast.error("Erro ao sincronizar registros");
    },
  });
}
