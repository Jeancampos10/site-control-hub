import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

// Produção sheets que existem na planilha
type ProdutionSheetName = 
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

// Abas virtuais (vêm do banco; antes eram mock)
type VirtualSheetName = 
  | 'escavadeiras'
  | 'locais'
  | 'materiais'
  | 'fornecedores_cal';

// Abastech (Combustível) sheets
type AbastechSheetName = 
  | 'AbastecimentoCanteiro01'
  | 'Geral'
  | 'EstoqueCanteiro01'
  | 'EstoqueCanteiro02'
  | 'EstoqueComboio01'
  | 'EstoqueComboio02'
  | 'EstoqueComboio03'
  | 'EstoqueObraSaneamento'
  | 'Estoque_Arla'
  | 'Veiculos'
  | 'Horimetros'
  | 'Ordem_Servico';

export type SheetName = ProdutionSheetName | VirtualSheetName | AbastechSheetName;

// Verificar se é uma aba virtual (banco)
function isVirtualSheet(sheetName: SheetName): sheetName is VirtualSheetName {
  return ['escavadeiras', 'locais', 'materiais', 'fornecedores_cal'].includes(sheetName);
}

async function fetchVirtualSheet<T>(sheetName: VirtualSheetName): Promise<T[]> {
  // Observação: "escavadeiras" não é mais usada (usamos 'equipamentos').
  if (sheetName === 'locais') {
    const { data, error } = await supabase
      .from('cad_locais')
      .select('id,nome,obra,tipo,ativo')
      .order('nome', { ascending: true });

    if (error) throw new Error(error.message);

    return (data || []).map((r) => ({
      ID: r.id,
      Nome: r.nome,
      Obra: r.obra,
      Tipo: r.tipo,
      Ativo: r.ativo,
    })) as unknown as T[];
  }

  if (sheetName === 'materiais') {
    const { data, error } = await supabase
      .from('cad_materiais')
      .select('id,nome,unidade,ativo')
      .order('nome', { ascending: true });

    if (error) throw new Error(error.message);

    return (data || []).map((r) => ({
      ID: r.id,
      Nome: r.nome,
      Unidade: r.unidade,
      Ativo: r.ativo,
    })) as unknown as T[];
  }

  if (sheetName === 'fornecedores_cal') {
    const { data, error } = await supabase
      .from('cad_fornecedores_cal')
      .select('id,nome,cnpj,contato,ativo')
      .order('nome', { ascending: true });

    if (error) throw new Error(error.message);

    return (data || []).map((r) => ({
      ID: r.id,
      Nome: r.nome,
      CNPJ: r.cnpj,
      Contato: r.contato,
      Ativo: r.ativo,
    })) as unknown as T[];
  }

  return [] as unknown as T[];
}

// Fetch with retry for transient 503 errors
async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      // If it's a 503, retry with exponential backoff
      if (response.status === 503 && attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
        console.log(`Got 503, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      return response;
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`Fetch error, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('Failed to fetch after retries');
}

export function useGoogleSheets<T = Record<string, string>>(sheetName: SheetName) {
  return useQuery({
    queryKey: ['google-sheets', sheetName],
    queryFn: async (): Promise<T[]> => {
      console.log(`Fetching ${sheetName}...`);

      // Se for uma aba virtual, buscar no banco
      if (isVirtualSheet(sheetName)) {
        console.log(`Using database for ${sheetName}`);
        return fetchVirtualSheet<T>(sheetName);
      }

      const response = await fetchWithRetry(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-sheets?sheet=${sheetName}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            'Content-Type': 'application/json',
          },
        },
        3 // max retries
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
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
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
