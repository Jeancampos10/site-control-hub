import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Abastecimento {
  id: string;
  data: string;
  hora: string;
  tipo: string;
  categoria: string;
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
  local: string;
  arla: boolean;
  quantidade_arla: number | null;
  fornecedor: string;
  nota_fiscal: string;
  valor_unitario: number | null;
  valor_total: number | null;
  localizacao: string;
  observacao: string;
  foto_bomba: string;
  foto_horimetro: string;
  local_entrada: string;
  lubrificar: boolean;
  lubrificante: string;
  completar_oleo: boolean;
  tipo_oleo: string;
  qtd_oleo: number | null;
  sopra_filtro: boolean;
}

// Transform raw sheet data to our Abastecimento interface
function transformSheetData(row: Record<string, string>): Abastecimento {
  const parseNumber = (val: string): number | null => {
    if (!val) return null;
    // Handle Brazilian number format (1.234,56)
    const cleaned = val.replace(/\./g, '').replace(',', '.');
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  };

  const parseBoolean = (val: string): boolean => {
    return val === '✔' || val === 'true' || val === '1' || val === 'Sim';
  };

  return {
    id: row['IdAbastecimento'] || row['id'] || '',
    data: row['Data'] || '',
    hora: row['Hora'] || '',
    tipo: row['Tipo'] || '',
    categoria: row['Categoria'] || '',
    veiculo: row['Veiculo'] || '',
    potencia: row['Potencia'] || '',
    descricao: row['Descricao'] || '',
    motorista: row['Motorista'] || '',
    empresa: row['Empresa'] || '',
    obra: row['Obra'] || '',
    horimetro_anterior: parseNumber(row['Horimetro_Anterior_Eq'] || row['Horimetro_Anterior'] || ''),
    horimetro_atual: parseNumber(row['Horimetro_Atual_Eq'] || row['Horimetro_Atual'] || ''),
    km_anterior: parseNumber(row['Km_Anterior_Eq'] || row['Km_Anterior'] || ''),
    km_atual: parseNumber(row['Km_Atual_Eq'] || row['Km_Atual'] || ''),
    quantidade: parseNumber(row['Quantidade'] || '0') || 0,
    tipo_combustivel: row['Tipo_Combustivel'] || '',
    local: row['Local'] || '',
    arla: parseBoolean(row['Arla'] || ''),
    quantidade_arla: parseNumber(row['Quantidade_Arla'] || ''),
    fornecedor: row['Fornecedor'] || '',
    nota_fiscal: row['NotaFiscal'] || '',
    valor_unitario: parseNumber(row['ValorUnitario'] || ''),
    valor_total: parseNumber(row['ValorTotal'] || ''),
    localizacao: row['Localizacao'] || row['Observacao'] || '', // Note: Column Y might be Localizacao or Observacao depending on sheet
    observacao: row['Observacao'] || '',
    foto_bomba: row['Foto_Bomba'] || '',
    foto_horimetro: row['Foto_Horimetro'] || '',
    local_entrada: row['Local_Entrada'] || '',
    lubrificar: parseBoolean(row['Lubrificar'] || ''),
    lubrificante: row['Lubrificante'] || '',
    completar_oleo: parseBoolean(row['CompletarOleo'] || ''),
    tipo_oleo: row['TipoOleo'] || '',
    qtd_oleo: parseNumber(row['Qtd_Oleo'] || ''),
    sopra_filtro: parseBoolean(row['Sopra_Filtro'] || ''),
  };
}

// Source to sheet name mapping
const SOURCE_TO_SHEET: Record<string, string> = {
  'tanque01': 'AbastecimentoCanteiro01',
  'tanque02': 'AbastecimentoCanteiro02',
  'comboio01': 'AbastecimentoComboio01',
  'comboio02': 'AbastecimentoComboio02',
  'comboio03': 'AbastecimentoComboio03',
};

export function useAbastecimentos(source: string) {
  const sheetName = SOURCE_TO_SHEET[source];
  
  return useQuery({
    queryKey: ['abastecimentos', source],
    queryFn: async () => {
      if (!sheetName) {
        throw new Error(`Unknown source: ${source}`);
      }

      const { data, error } = await supabase.functions.invoke('google-sheets', {
        body: null,
        method: 'GET',
      });

      // For GET requests, we need to use the URL params approach
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-sheets?sheet=${sheetName}`,
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

      const abastecimentos = (result.data || []).map(transformSheetData);
      return abastecimentos as Abastecimento[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!source,
  });
}

// Hook to sync changes with Google Sheets
export function useSyncAbastecimento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      action, 
      source, 
      data, 
      rowId 
    }: { 
      action: 'append' | 'update' | 'delete'; 
      source: string; 
      data?: Partial<Abastecimento>; 
      rowId?: string;
    }) => {
      const response = await supabase.functions.invoke('sync-abastecimentos', {
        body: { action, source, data, rowId },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['abastecimentos', variables.source] });
      
      const actionMessages = {
        append: 'Abastecimento adicionado com sucesso!',
        update: 'Abastecimento atualizado com sucesso!',
        delete: 'Abastecimento excluído com sucesso!',
      };
      
      toast.success(actionMessages[variables.action]);
    },
    onError: (error) => {
      console.error('Sync error:', error);
      toast.error(`Erro ao sincronizar: ${error.message}`);
    },
  });
}

// Hook for bulk updates
export function useBulkUpdateAbastecimentos() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      source,
      filters,
      updates,
      dateFilter,
    }: {
      source: string;
      filters: Record<string, string>;
      updates: Record<string, string>;
      dateFilter?: string;
    }) => {
      const response = await supabase.functions.invoke('sync-abastecimentos', {
        body: { 
          action: 'bulkUpdate', 
          source, 
          filters, 
          updates, 
          dateFilter 
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['abastecimentos', variables.source] });
      toast.success(`${data.updatedCount || 0} registros atualizados com sucesso!`);
    },
    onError: (error) => {
      console.error('Bulk update error:', error);
      toast.error(`Erro na atualização em lote: ${error.message}`);
    },
  });
}

// Hook to get all abastecimentos from all sources combined
export function useAllAbastecimentos() {
  const sources = Object.keys(SOURCE_TO_SHEET);
  
  return useQuery({
    queryKey: ['abastecimentos', 'all'],
    queryFn: async () => {
      const allData: Abastecimento[] = [];
      
      for (const source of sources) {
        const sheetName = SOURCE_TO_SHEET[source];
        try {
          const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-sheets?sheet=${sheetName}`,
            {
              headers: {
                'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
                'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              },
            }
          );

          if (response.ok) {
            const result = await response.json();
            const abastecimentos = (result.data || []).map((row: Record<string, string>) => ({
              ...transformSheetData(row),
              fonte: source, // Add source identifier
            }));
            allData.push(...abastecimentos);
          }
        } catch (error) {
          console.error(`Error fetching ${source}:`, error);
        }
      }

      // Sort by date and time descending
      allData.sort((a, b) => {
        const dateA = a.data.split('/').reverse().join('-') + ' ' + a.hora;
        const dateB = b.data.split('/').reverse().join('-') + ' ' + b.hora;
        return dateB.localeCompare(dateA);
      });

      return allData;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
