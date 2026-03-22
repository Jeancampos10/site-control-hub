import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PlanoManutencao {
  id: string;
  veiculo: string;
  descricao_servico: string;
  tipo_intervalo: 'horimetro' | 'km' | 'dias';
  intervalo_valor: number;
  ultimo_valor_executado: number;
  ultima_execucao_data: string | null;
  ativo: boolean;
  created_at: string;
}

export interface PlanoComStatus extends PlanoManutencao {
  valor_atual: number;
  falta: number;
  percentual: number;
  status: 'ok' | 'proximo' | 'vencido';
  servicos_sugeridos: string[];
}

// Sugestões automáticas baseadas em horas acumuladas
const SUGESTOES_POR_HORAS: { intervalo: number; servico: string }[] = [
  { intervalo: 250, servico: 'Troca de óleo motor' },
  { intervalo: 500, servico: 'Troca de filtros (ar, óleo, combustível)' },
  { intervalo: 1000, servico: 'Revisão completa + inspeção geral' },
  { intervalo: 2000, servico: 'Revisão de sistema hidráulico' },
];

export function getSugestoes(horasAcumuladas: number): string[] {
  return SUGESTOES_POR_HORAS
    .filter(s => {
      const ciclo = Math.floor(horasAcumuladas / s.intervalo);
      const resto = horasAcumuladas - (ciclo * s.intervalo);
      // Sugerir quando faltam menos de 10% do intervalo
      return resto >= s.intervalo * 0.9 || resto <= s.intervalo * 0.1;
    })
    .map(s => `${s.servico} (a cada ${s.intervalo}h)`);
}

export function usePlanosManutencao(veiculo?: string) {
  return useQuery({
    queryKey: ['planos_manutencao', veiculo || 'all'],
    queryFn: async () => {
      let query = supabase
        .from('planos_manutencao')
        .select('*')
        .eq('ativo', true)
        .order('veiculo', { ascending: true });

      if (veiculo) {
        query = query.eq('veiculo', veiculo);
      }

      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return (data || []) as PlanoManutencao[];
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function usePlanosComStatus() {
  const { data: planos, isLoading: planosLoading } = usePlanosManutencao();

  return useQuery({
    queryKey: ['planos_manutencao_status', planos?.map(p => p.id).join(',')],
    queryFn: async () => {
      if (!planos || planos.length === 0) return [];

      const veiculos = [...new Set(planos.map(p => p.veiculo))];
      const results: PlanoComStatus[] = [];

      for (const veiculo of veiculos) {
        // Fetch latest horimetro
        const { data: hRows } = await supabase
          .from('horimetros')
          .select('horimetro_atual, data')
          .eq('veiculo', veiculo)
          .order('data', { ascending: false })
          .limit(1);

        // Fetch latest km from abastecimentos
        const { data: kRows } = await supabase
          .from('abastecimentos')
          .select('km_atual, data')
          .eq('veiculo', veiculo)
          .not('km_atual', 'is', null)
          .order('data', { ascending: false })
          .limit(1);

        const horimetroAtual = hRows?.[0]?.horimetro_atual ?? 0;
        const kmAtual = kRows?.[0]?.km_atual ?? 0;

        const veiculoPlanos = planos.filter(p => p.veiculo === veiculo);

        for (const plano of veiculoPlanos) {
          let valorAtual = 0;
          if (plano.tipo_intervalo === 'horimetro') {
            valorAtual = Number(horimetroAtual);
          } else if (plano.tipo_intervalo === 'km') {
            valorAtual = Number(kmAtual);
          } else {
            // dias - calcular dias desde última execução
            if (plano.ultima_execucao_data) {
              const diff = Date.now() - new Date(plano.ultima_execucao_data).getTime();
              valorAtual = Math.floor(diff / (1000 * 60 * 60 * 24));
            }
          }

          const usado = plano.tipo_intervalo === 'dias'
            ? valorAtual
            : valorAtual - plano.ultimo_valor_executado;
          const falta = plano.intervalo_valor - usado;
          const percentual = Math.min(100, (usado / plano.intervalo_valor) * 100);

          let status: 'ok' | 'proximo' | 'vencido' = 'ok';
          if (falta <= 0) status = 'vencido';
          else if (percentual >= 80) status = 'proximo';

          const servicos_sugeridos = plano.tipo_intervalo === 'horimetro'
            ? getSugestoes(valorAtual)
            : [];

          results.push({
            ...plano,
            valor_atual: valorAtual,
            falta: Math.max(0, falta),
            percentual,
            status,
            servicos_sugeridos,
          });
        }
      }

      return results;
    },
    enabled: !!planos && planos.length > 0,
    staleTime: 1000 * 60,
  });
}

export function useCreatePlano() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (plano: Omit<PlanoManutencao, 'id' | 'created_at' | 'ativo'>) => {
      const { error } = await supabase.from('planos_manutencao').insert({
        veiculo: plano.veiculo,
        descricao_servico: plano.descricao_servico,
        tipo_intervalo: plano.tipo_intervalo,
        intervalo_valor: plano.intervalo_valor,
        ultimo_valor_executado: plano.ultimo_valor_executado,
        ultima_execucao_data: plano.ultima_execucao_data,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planos_manutencao'] });
      toast.success('Plano de manutenção criado!');
    },
    onError: (e) => toast.error(`Erro: ${e.message}`),
  });
}

export function useUpdatePlano() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<PlanoManutencao> & { id: string }) => {
      const { error } = await supabase.from('planos_manutencao').update(data).eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planos_manutencao'] });
      toast.success('Plano atualizado!');
    },
    onError: (e) => toast.error(`Erro: ${e.message}`),
  });
}

export function useDeletePlano() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('planos_manutencao').update({ ativo: false }).eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planos_manutencao'] });
      toast.success('Plano removido!');
    },
    onError: (e) => toast.error(`Erro: ${e.message}`),
  });
}
