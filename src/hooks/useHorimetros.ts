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
}

export interface HorimetroFormData {
  id?: string;
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
}

// Transform raw sheet data to our Horimetro interface
function transformSheetData(row: Record<string, string>): Horimetro {
  const parseNumber = (val: string): number | null => {
    if (!val || val.trim() === '') return null;
    // Handle Brazilian number format (1.234,56)
    const cleaned = val.replace(/\./g, '').replace(',', '.');
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  };

  const horAnterior = parseNumber(row['Hor_Anterior'] || '');
  const horAtual = parseNumber(row['Hor_Atual'] || '');
  
  // Calculate hours worked
  let horasTrabalhadas = 0;
  if (horAnterior !== null && horAtual !== null && horAnterior > 0) {
    horasTrabalhadas = horAtual - horAnterior;
  }

  return {
    id: row['ID'] || '',
    data: (row[' Data'] || row['Data'] || '').trim(),
    categoria: row['Categoria'] || '',
    veiculo: row['Veiculo'] || '',
    descricao: row['Descricao'] || '',
    operador: row['Operador'] || '',
    empresa: row['Empresa'] || '',
    horimetro_anterior: horAnterior,
    horimetro_atual: horAtual,
    km_anterior: parseNumber(row['Km_Anterior'] || ''),
    km_atual: parseNumber(row['Km_Atual'] || ''),
    horas_trabalhadas: horasTrabalhadas,
  };
}

export function useHorimetros() {
  return useQuery({
    queryKey: ['horimetros'],
    queryFn: async () => {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-sheets?sheet=Horimetros`,
        {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }

      const horimetros = (result.data || []).map(transformSheetData);
      
      // Sort by date descending
      horimetros.sort((a: Horimetro, b: Horimetro) => {
        const parseDate = (dateStr: string) => {
          const match = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
          if (match) {
            return new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]));
          }
          return new Date(0);
        };
        return parseDate(b.data).getTime() - parseDate(a.data).getTime();
      });

      return horimetros as Horimetro[];
    },
    staleTime: 1000 * 60 * 5,
  });
}

// Hook to update a horimetro
export function useUpdateHorimetro() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: HorimetroFormData) => {
      const response = await supabase.functions.invoke('sync-horimetros', {
        body: { 
          action: 'update', 
          data: {
            id: data.id,
            data: data.data,
            categoria: data.categoria,
            veiculo: data.veiculo,
            descricao: data.descricao,
            operador: data.operador,
            empresa: data.empresa,
            horimetro_anterior: data.horimetro_anterior,
            horimetro_atual: data.horimetro_atual,
            km_anterior: data.km_anterior,
            km_atual: data.km_atual,
          },
          rowId: data.id,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['horimetros'] });
      toast.success('Horímetro atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Update error:', error);
      toast.error(`Erro ao atualizar: ${error.message}`);
    },
  });
}

// Hook to delete a horimetro
export function useDeleteHorimetro() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rowId: string) => {
      const response = await supabase.functions.invoke('sync-horimetros', {
        body: { action: 'delete', rowId },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['horimetros'] });
      toast.success('Horímetro excluído com sucesso!');
    },
    onError: (error) => {
      console.error('Delete error:', error);
      toast.error(`Erro ao excluir: ${error.message}`);
    },
  });
}

// Hook to get summary statistics
export function useHorimetrosSummary(horimetros: Horimetro[], selectedDate: string | null) {
  const filteredData = selectedDate 
    ? horimetros.filter(h => {
        const hDate = h.data.trim();
        const normalizeDate = (d: string) => {
          const match = d.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
          if (match) {
            return `${match[1].padStart(2, '0')}/${match[2].padStart(2, '0')}/${match[3]}`;
          }
          return d;
        };
        return normalizeDate(hDate) === normalizeDate(selectedDate);
      })
    : horimetros;

  const totalHoras = filteredData.reduce((acc, h) => acc + h.horas_trabalhadas, 0);
  const equipamentosAtivos = filteredData.length;
  const mediaHoras = equipamentosAtivos > 0 ? totalHoras / equipamentosAtivos : 0;
  
  const byEmpresa: Record<string, { horas: number; equipamentos: number }> = {};
  filteredData.forEach(h => {
    const key = h.empresa || 'Sem Empresa';
    if (!byEmpresa[key]) {
      byEmpresa[key] = { horas: 0, equipamentos: 0 };
    }
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
