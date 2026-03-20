import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Abastecimento {
  id: string;
  data: string;
  hora: string;
  tipo: string;
  veiculo: string;
  potencia: string;
  descricao: string;
  motorista: string;
  empresa: string;
  obra: string;
  horimetro_anterior: number | null;
  horimetro_atual: number | null;
  km_anterior: number | null;
  km_atual: number | null;
  quantidade: number;
  tipo_combustivel: string;
  local_abastecimento: string;
  arla: boolean;
  quantidade_arla: number | null;
  fornecedor: string;
  nota_fiscal: string;
  valor_unitario: number | null;
  valor_total: number | null;
  localizacao: string;
  observacao: string;
  lubrificacao: boolean;
  oleo: string;
  filtro: string;
}

function transformDbRow(row: any): Abastecimento {
  return {
    id: row.id,
    data: row.data || '',
    hora: row.hora || '',
    tipo: row.tipo || '',
    veiculo: row.veiculo || '',
    potencia: row.potencia || '',
    descricao: row.descricao || '',
    motorista: row.motorista || '',
    empresa: row.empresa || '',
    obra: row.obra || '',
    horimetro_anterior: row.horimetro_anterior,
    horimetro_atual: row.horimetro_atual,
    km_anterior: row.km_anterior,
    km_atual: row.km_atual,
    quantidade: row.quantidade_combustivel || 0,
    tipo_combustivel: row.tipo_combustivel || '',
    local_abastecimento: row.local_abastecimento || '',
    arla: row.arla || false,
    quantidade_arla: row.quantidade_arla,
    fornecedor: row.fornecedor || '',
    nota_fiscal: row.nota_fiscal || '',
    valor_unitario: row.valor_unitario,
    valor_total: row.valor_total,
    localizacao: row.localizacao || '',
    observacao: row.observacao || '',
    lubrificacao: row.lubrificacao || false,
    oleo: row.oleo || '',
    filtro: row.filtro || '',
  };
}

export function useAbastecimentos(source?: string) {
  return useQuery({
    queryKey: ['abastecimentos', source || 'all'],
    queryFn: async () => {
      let query = supabase
        .from('abastecimentos')
        .select('*')
        .order('data', { ascending: false })
        .order('hora', { ascending: false });

      if (source && source !== 'all') {
        query = query.eq('local_abastecimento', source);
      }

      const { data, error } = await query;

      if (error) throw new Error(error.message);
      return (data || []).map(transformDbRow) as Abastecimento[];
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function useAllAbastecimentos() {
  return useAbastecimentos('all');
}

export function useSyncAbastecimento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      action,
      data,
      rowId,
    }: {
      action: 'append' | 'update' | 'delete';
      source?: string;
      data?: Partial<Abastecimento>;
      rowId?: string;
    }) => {
      if (action === 'delete' && rowId) {
        const { error } = await supabase.from('abastecimentos').delete().eq('id', rowId);
        if (error) throw new Error(error.message);
        return { success: true };
      }

      if (action === 'append' && data) {
        const { error } = await supabase.from('abastecimentos').insert({
          data: data.data || new Date().toISOString().split('T')[0],
          veiculo: data.veiculo || '',
          quantidade_combustivel: data.quantidade || 0,
          hora: data.hora,
          tipo: data.tipo,
          potencia: data.potencia,
          descricao: data.descricao,
          motorista: data.motorista,
          empresa: data.empresa,
          obra: data.obra,
          horimetro_anterior: data.horimetro_anterior,
          horimetro_atual: data.horimetro_atual,
          km_anterior: data.km_anterior,
          km_atual: data.km_atual,
          tipo_combustivel: data.tipo_combustivel,
          local_abastecimento: data.local_abastecimento,
          arla: data.arla,
          quantidade_arla: data.quantidade_arla,
          fornecedor: data.fornecedor,
          nota_fiscal: data.nota_fiscal,
          valor_unitario: data.valor_unitario,
          valor_total: data.valor_total,
          localizacao: data.localizacao,
          observacao: data.observacao,
          lubrificacao: data.lubrificacao,
          oleo: data.oleo,
          filtro: data.filtro,
        });
        if (error) throw new Error(error.message);
        return { success: true };
      }

      if (action === 'update' && rowId && data) {
        const { error } = await supabase.from('abastecimentos').update({
          data: data.data,
          veiculo: data.veiculo,
          quantidade_combustivel: data.quantidade,
          hora: data.hora,
          tipo: data.tipo,
          potencia: data.potencia,
          descricao: data.descricao,
          motorista: data.motorista,
          empresa: data.empresa,
          obra: data.obra,
          horimetro_anterior: data.horimetro_anterior,
          horimetro_atual: data.horimetro_atual,
          km_anterior: data.km_anterior,
          km_atual: data.km_atual,
          tipo_combustivel: data.tipo_combustivel,
          local_abastecimento: data.local_abastecimento,
          arla: data.arla,
          quantidade_arla: data.quantidade_arla,
          fornecedor: data.fornecedor,
          nota_fiscal: data.nota_fiscal,
          valor_unitario: data.valor_unitario,
          valor_total: data.valor_total,
          localizacao: data.localizacao,
          observacao: data.observacao,
          lubrificacao: data.lubrificacao,
          oleo: data.oleo,
          filtro: data.filtro,
        }).eq('id', rowId);
        if (error) throw new Error(error.message);
        return { success: true };
      }

      throw new Error('Invalid action');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['abastecimentos'] });
      toast.success('Operação realizada com sucesso!');
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });
}

export function useBulkUpdateAbastecimentos() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      filters,
      updates,
    }: {
      source?: string;
      filters: Record<string, string>;
      updates: Record<string, string>;
      dateFilter?: string;
    }) => {
      // Build query with filters
      let query = supabase.from('abastecimentos').update(updates as any);
      Object.entries(filters).forEach(([key, value]) => {
        if (value) query = query.eq(key as any, value);
      });
      const { error, count } = await query;
      if (error) throw new Error(error.message);
      return { updatedCount: count || 0 };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['abastecimentos'] });
      toast.success(`${data.updatedCount} registros atualizados!`);
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });
}
