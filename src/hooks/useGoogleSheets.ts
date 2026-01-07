import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type SheetName = 
  | 'carga' 
  | 'descarga' 
  | 'equipamentos' 
  | 'caminhao' 
  | 'cam_reboque' 
  | 'caminhao_pipa' 
  | 'apontamento_pedreira' 
  | 'apontamento_pipa';

export function useGoogleSheets<T = Record<string, string>>(sheetName: SheetName) {
  return useQuery({
    queryKey: ['google-sheets', sheetName],
    queryFn: async (): Promise<T[]> => {
      console.log(`Fetching ${sheetName} from Google Sheets...`);
      
      const { data, error } = await supabase.functions.invoke('google-sheets', {
        body: null,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Use query params approach
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-sheets?sheet=${sheetName}`,
        {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch data');
      }

      const result = await response.json();
      console.log(`Received ${result.count} rows from ${sheetName}`);
      return result.data as T[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

// Type definitions for each sheet
export interface CargaRow {
  Data: string;
  Hora_Carga: string;
  Prefixo_Eq: string;
  Potencia: string;
  Descricao_Eq: string;
  Empresa_Eq: string;
  Operador: string;
  Prefixo_Cb: string;
  Descricao_Cb: string;
  Empresa_Cb: string;
  Motorista: string;
  Volume: string;
  N_Viagens: string;
  Volume_Total: string;
  Local_da_Obra: string;
  Estaca: string;
  Material: string;
  Usuario: string;
  Observacao: string;
}

export interface DescargaRow {
  Data: string;
  Hora: string;
  Prefixo_Cb: string;
  Empresa_Cb: string;
  Motorista: string;
  Volume: string;
  N_Viagens: string;
  Volume_Total: string;
  Local_da_Obra: string;
  Estaca: string;
  Material: string;
  Usuario: string;
  Observacao: string;
}

export interface EquipamentoRow {
  Prefixo_Eq: string;
  Descricao_Eq: string;
  Operador: string;
  Marca: string;
  Potencia: string;
  Empresa_Eq: string;
}

export interface CaminhaoRow {
  Prefixo_Cb: string;
  Descricao_Cb: string;
  Motorista: string;
  Marca: string;
  Potencia: string;
  Volume: string;
  Empresa_Cb: string;
}

export interface CamReboqueRow {
  Prefixo_Cb: string;
  Descricao: string;
  Empresa: string;
  Motorista: string;
  Modelo: string;
  Placa: string;
  Peso_Vazio: string;
  Volume: string;
  Empresa_Cb: string;
}

export interface CaminhaoPipaRow {
  Prefixo: string;
  Descricao: string;
  Empresa: string;
  Motorista: string;
  Capacidade: string;
  Placa: string;
}

export interface ApontamentoPedreiraRow {
  Data: string;
  Hora: string;
  Ordem_Carregamento: string;
  Fornecedor: string;
  Prefixo_Eq: string;
  Descricao_Eq: string;
  Empresa_Eq: string;
  Motorista: string;
  Placa: string;
  Material: string;
  Peso_Vazio: string;
  Peso_Final: string;
  Peso_Liquido: string;
  Metro_Cubico: string;
  Densidade: string;
  Tonelada: string;
}

export interface ApontamentoPipaRow {
  Data: string;
  Prefixo: string;
  Descricao: string;
  Empresa: string;
  Motorista: string;
  Capacidade: string;
  Hora_Chegada: string;
  Hora_Saida: string;
  N_Viagens: string;
}
