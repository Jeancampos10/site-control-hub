import { useQuery } from "@tanstack/react-query";

export interface Manutencao {
  data: string;
  veiculo: string;
  empresa: string;
  motorista: string;
  potencia: string;
  problema: string;
  servico: string;
  mecanico: string;
  data_entrada: string;
  data_saida: string;
  hora_entrada: string;
  hora_saida: string;
  horas_parado: string;
  observacao: string;
  status: string;
}

function transformSheetData(row: Record<string, string>): Manutencao {
  return {
    data: (row['Data'] || '').trim(),
    veiculo: row['Veiculo'] || '',
    empresa: row['Empresa'] || '',
    motorista: row['Motorista'] || '',
    potencia: row['Potencia'] || '',
    problema: row['Problema'] || '',
    servico: row['Servico'] || '',
    mecanico: row['Mecanico'] || '',
    data_entrada: row['Data_Entrada'] || '',
    data_saida: row['Data_Saida'] || '',
    hora_entrada: row['Hora_Entrada'] || '',
    hora_saida: row['Hora_Saida'] || '',
    horas_parado: row['Horas_Parado'] || '',
    observacao: row['Observacao'] || '',
    status: (row['Status'] || 'aberta').toLowerCase().trim(),
  };
}

export function useManutencoes() {
  return useQuery({
    queryKey: ['manutencoes'],
    queryFn: async () => {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-sheets?sheet=Manutencoes`,
        {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        }
      );

      if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);
      const result = await response.json();
      if (result.error) throw new Error(result.error);

      return (result.data || []).map(transformSheetData) as Manutencao[];
    },
    staleTime: 1000 * 60 * 5,
  });
}
