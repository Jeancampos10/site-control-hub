import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Horimetro {
  id: string;
  data: string;
  categoria: string;
  veiculo: string;
  descricao: string;
  operador: string;
  empresa: string;
  horimetro_anterior: number | null;
  horimetro_atual: number | null;
  km_anterior: number | null;
  km_atual: number | null;
  horas_trabalhadas: number;
  obra: string;
  observacao: string;
}

export interface HorimetroFormData {
  id?: string;
  data: string;
  categoria?: string;
  veiculo: string;
  descricao?: string;
  operador?: string;
  empresa?: string;
  horimetro_anterior: number | null;
  horimetro_atual: number | null;
  km_anterior?: number | null;
  km_atual?: number | null;
  obra?: string;
  observacao?: string;
}

function transformDbRow(row: any): Horimetro {
  const horAnt = row.horimetro_anterior != null ? Number(row.horimetro_anterior) : null;
  const horAtual = row.horimetro_atual != null ? Number(row.horimetro_atual) : null;
  let horas = row.horas_trabalhadas != null ? Number(row.horas_trabalhadas) : 0;
  if (!horas && horAnt !== null && horAtual !== null) {
    horas = horAtual - horAnt;
  }

  return {
    id: row.id,
    data: row.data || '',
    categoria: '',
    veiculo: row.veiculo || '',
    descricao: row.descricao_veiculo || '',
    operador: row.operador || '',
    empresa: '',
    horimetro_anterior: horAnt,
    horimetro_atual: horAtual,
    km_anterior: null,
    km_atual: null,
    horas_trabalhadas: horas,
    obra: row.obra || '',
    observacao: row.observacao || '',
  };
}

export function useHorimetros() {
  return useQuery({
    queryKey: ['horimetros'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('horimetros')
        .select('*')
        .order('data', { ascending: false });

      if (error) throw new Error(error.message);
      return (data || []).map(transformDbRow) as Horimetro[];
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function useUpdateHorimetro() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: HorimetroFormData) => {
      const horas = (formData.horimetro_atual && formData.horimetro_anterior)
        ? formData.horimetro_atual - formData.horimetro_anterior
        : null;

      const payload = {
        data: formData.data,
        veiculo: formData.veiculo,
        descricao_veiculo: formData.descricao,
        operador: formData.operador,
        horimetro_anterior: formData.horimetro_anterior || 0,
        horimetro_atual: formData.horimetro_atual || 0,
        horas_trabalhadas: horas,
        obra: formData.obra,
        observacao: formData.observacao,
      };

      if (formData.id) {
        const { error } = await supabase.from('horimetros').update(payload).eq('id', formData.id);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase.from('horimetros').insert(payload);
        if (error) throw new Error(error.message);
      }
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['horimetros'] });
      toast.success('Horímetro salvo com sucesso!');
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });
}

export function useDeleteHorimetro() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rowId: string) => {
      const { error } = await supabase.from('horimetros').delete().eq('id', rowId);
      if (error) throw new Error(error.message);
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['horimetros'] });
      toast.success('Horímetro excluído!');
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });
}

export function useHorimetrosSummary(horimetros: Horimetro[], selectedDate: string | null) {
  const filteredData = selectedDate
    ? horimetros.filter(h => h.data === selectedDate)
    : horimetros;

  const totalHoras = filteredData.reduce((acc, h) => acc + h.horas_trabalhadas, 0);
  const equipamentosAtivos = filteredData.length;
  const mediaHoras = equipamentosAtivos > 0 ? totalHoras / equipamentosAtivos : 0;

  const byEmpresa: Record<string, { horas: number; equipamentos: number }> = {};
  filteredData.forEach(h => {
    const key = h.empresa || h.obra || 'Sem Info';
    if (!byEmpresa[key]) byEmpresa[key] = { horas: 0, equipamentos: 0 };
    byEmpresa[key].horas += h.horas_trabalhadas;
    byEmpresa[key].equipamentos += 1;
  });

  const uniqueDates = [...new Set(horimetros.map(h => h.data))];

  return {
    filteredData,
    totalHoras,
    equipamentosAtivos,
    mediaHoras,
    byEmpresa,
    uniqueDates,
  };
}
