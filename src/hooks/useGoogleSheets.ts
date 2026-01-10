import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

type SheetName = 
  | 'carga' 
  | 'descarga' 
  | 'equipamentos' 
  | 'caminhao' 
  | 'cam_reboque' 
  | 'caminhao_pipa' 
  | 'apontamento_pedreira' 
  | 'apontamento_pipa'
  | 'mov_cal'
  | 'estoque_cal';

export function useGoogleSheets<T = Record<string, string>>(sheetName: SheetName) {
  return useQuery({
    queryKey: ['google-sheets', sheetName],
    queryFn: async (): Promise<T[]> => {
      console.log(`Fetching ${sheetName} from Google Sheets...`);
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-sheets?sheet=${sheetName}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error fetching sheet:', errorData);
        throw new Error(errorData.error || 'Failed to fetch data');
      }

      const result = await response.json();
      console.log(`Received ${result.count} rows from ${sheetName}`);
      return result.data as T[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 2,
  });
}

// Helper to filter data by date
export function filterByDate<T extends { Data?: string }>(
  data: T[] | undefined,
  dateFilter: Date | null
): T[] {
  if (!data) return [];
  if (!dateFilter) return data;

  // Format date to match the spreadsheet format (DD/MM/YYYY)
  const formattedDate = format(dateFilter, 'dd/MM/yyyy');
  
  return data.filter(row => {
    if (!row.Data) return false;
    // Handle different date formats
    const rowDate = row.Data.trim();
    return rowDate === formattedDate || 
           rowDate.startsWith(formattedDate) ||
           normalizeDate(rowDate) === normalizeDate(formattedDate);
  });
}

// Normalize date string to compare
function normalizeDate(dateStr: string): string {
  // Try to extract DD/MM/YYYY pattern
  const match = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (match) {
    const [, day, month, year] = match;
    return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
  }
  return dateStr;
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

// CAL Tables
export interface MovCalRow {
  Data: string;
  Hora: string;
  Tipo: string;
  Fornecedor: string;
  Prefixo_Eq: string;
  Und: string;
  Qtd: string;
  NF: string;
  Valor: string;
  Frete: string;
  Local: string;
}

export interface EstoqueCalRow {
  Descricao: string;
  Data: string;
  EstoqueAnterior: string;
  Saida: string;
  Entrada: string;
  EstoqueAtual: string;
}
