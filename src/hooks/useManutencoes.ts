import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface OrdemServico {
  id: string;
  numero_os: number;
  veiculo: string;
  descricao_veiculo: string;
  tipo: string;
  prioridade: string;
  status: string;
  problema_relatado: string;
  diagnostico: string;
  solucao_aplicada: string;
  pecas_utilizadas: string;
  mecanico_responsavel: string;
  motorista_operador: string;
  encarregado: string;
  local_servico: string;
  data_abertura: string;
  data_fechamento: string | null;
  horimetro_km: number | null;
  tempo_estimado_horas: number | null;
  tempo_real_horas: number | null;
  custo_estimado: number | null;
  custo_real: number | null;
  observacoes: string;
}

function transformDbRow(row: any): OrdemServico {
  return {
    id: row.id,
    numero_os: row.numero_os,
    veiculo: row.veiculo || '',
    descricao_veiculo: row.descricao_veiculo || '',
    tipo: row.tipo || 'Corretiva',
    prioridade: row.prioridade || 'Média',
    status: row.status || 'Em Andamento',
    problema_relatado: row.problema_relatado || '',
    diagnostico: row.diagnostico || '',
    solucao_aplicada: row.solucao_aplicada || '',
    pecas_utilizadas: row.pecas_utilizadas || '',
    mecanico_responsavel: row.mecanico_responsavel || '',
    motorista_operador: row.motorista_operador || '',
    encarregado: row.encarregado || '',
    local_servico: row.local_servico || '',
    data_abertura: row.data_abertura || '',
    data_fechamento: row.data_fechamento,
    horimetro_km: row.horimetro_km,
    tempo_estimado_horas: row.tempo_estimado_horas,
    tempo_real_horas: row.tempo_real_horas,
    custo_estimado: row.custo_estimado,
    custo_real: row.custo_real,
    observacoes: row.observacoes || '',
  };
}

export function useManutencoes() {
  return useQuery({
    queryKey: ['ordens_servico'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ordens_servico')
        .select('*')
        .order('data_abertura', { ascending: false });

      if (error) throw new Error(error.message);
      return (data || []).map(transformDbRow) as OrdemServico[];
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function useCreateOrdemServico() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<OrdemServico>) => {
      const { error } = await supabase.from('ordens_servico').insert({
        veiculo: data.veiculo || '',
        descricao_veiculo: data.descricao_veiculo,
        tipo: data.tipo || 'Corretiva',
        prioridade: data.prioridade || 'Média',
        status: data.status || 'Em Andamento',
        problema_relatado: data.problema_relatado || '',
        diagnostico: data.diagnostico,
        solucao_aplicada: data.solucao_aplicada,
        pecas_utilizadas: data.pecas_utilizadas,
        mecanico_responsavel: data.mecanico_responsavel,
        motorista_operador: data.motorista_operador,
        encarregado: data.encarregado,
        local_servico: data.local_servico,
        horimetro_km: data.horimetro_km,
        tempo_estimado_horas: data.tempo_estimado_horas,
        custo_estimado: data.custo_estimado,
        observacoes: data.observacoes,
      });
      if (error) throw new Error(error.message);
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordens_servico'] });
      toast.success('Ordem de serviço criada!');
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });
}

export function useUpdateOrdemServico() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<OrdemServico> }) => {
      const { error } = await supabase.from('ordens_servico').update({
        veiculo: data.veiculo,
        descricao_veiculo: data.descricao_veiculo,
        tipo: data.tipo,
        prioridade: data.prioridade,
        status: data.status,
        problema_relatado: data.problema_relatado,
        diagnostico: data.diagnostico,
        solucao_aplicada: data.solucao_aplicada,
        pecas_utilizadas: data.pecas_utilizadas,
        mecanico_responsavel: data.mecanico_responsavel,
        motorista_operador: data.motorista_operador,
        encarregado: data.encarregado,
        local_servico: data.local_servico,
        data_fechamento: data.data_fechamento,
        horimetro_km: data.horimetro_km,
        tempo_estimado_horas: data.tempo_estimado_horas,
        tempo_real_horas: data.tempo_real_horas,
        custo_estimado: data.custo_estimado,
        custo_real: data.custo_real,
        observacoes: data.observacoes,
      }).eq('id', id);
      if (error) throw new Error(error.message);
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordens_servico'] });
      toast.success('Ordem de serviço atualizada!');
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });
}
