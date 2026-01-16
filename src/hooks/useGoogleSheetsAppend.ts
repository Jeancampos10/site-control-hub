import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

// Mapeamento das planilhas para os nomes corretos
const SHEET_NAMES: Record<string, string> = {
  carga: 'Carga',
  descarga: 'Descarga',
  apontamento_pedreira: 'Apontamento_Pedreira',
  apontamento_pipa: 'Apontamento_Pipa',
  mov_cal: 'Mov_Cal',
};

// Mapeamento das colunas para cada planilha
const SHEET_COLUMNS: Record<string, string[]> = {
  carga: [
    'ID', 'Data', 'Local', 'Estaca', 'Escavadeira', 'Empresa_Esc', 'Operador',
    'Caminhao', 'Empresa_Cam', 'Motorista', 'Volume', 'Material', 'N_Viagens',
    'Encarregado', 'Apontador', 'Hora', 'Observacao', 'Lancamento_Local',
    'Lancamento_Auto', 'Sincronizado', 'Timestamp'
  ],
  descarga: [
    'ID', 'Data', 'Local', 'Estaca', 'Caminhao', 'Empresa', 'Motorista',
    'Volume', 'Material', 'N_Viagens', 'Apontador', 'Hora', 'Observacao',
    'Origem_Carga', 'Sincronizado'
  ],
  apontamento_pedreira: [
    'ID', 'Data', 'Caminhao', 'Empresa', 'Motorista', 'Placa', 'Hora_Carregamento',
    'N_Pedido', 'Peso_Bruto', 'Peso_Tara', 'Peso_Liquido', 'Material',
    'Apontador', 'Hora_Registro', 'Observacao', 'Sincronizado', 'Timestamp'
  ],
  apontamento_pipa: [
    'ID', 'Data', 'Prefixo', 'Empresa', 'Motorista', 'Capacidade', 'Hora_Chegada',
    'Hora_Saida', 'N_Viagens', 'Sincronizado'
  ],
  mov_cal: [
    'ID', 'Data', 'Tipo', 'Quantidade', 'Nota_Fiscal', 'Valor', 'Fornecedor',
    'Apontador', 'Hora', 'Observacao', 'Sincronizado', 'Timestamp'
  ],
};

interface AppendRowParams {
  sheetName: keyof typeof SHEET_NAMES;
  rowData: Record<string, unknown>;
  alsoSaveTo?: {
    sheetName: keyof typeof SHEET_NAMES;
    rowData: Record<string, unknown>;
  };
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function formatRowData(sheetName: string, data: Record<string, unknown>): string[] {
  const columns = SHEET_COLUMNS[sheetName] || [];
  return columns.map(col => {
    const value = data[col] ?? data[col.toLowerCase()] ?? '';
    if (value instanceof Date) {
      return format(value, 'dd/MM/yyyy');
    }
    return String(value);
  });
}

export function useGoogleSheetsAppend() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sheetName, rowData, alsoSaveTo }: AppendRowParams) => {
      console.log(`Appending row to ${sheetName}...`, rowData);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      // Generate ID if not provided
      const id = rowData.ID || rowData.id || generateId();
      const timestamp = format(new Date(), 'dd/MM/yyyy HH:mm:ss');
      const hora = format(new Date(), 'HH:mm');
      
      // Prepare main row data
      const mainRowData = {
        ...rowData,
        ID: id,
        Sincronizado: 'Sim',
        Timestamp: timestamp,
        Hora: hora,
        Apontador: user?.email || 'Sistema',
      };

      const formattedData = formatRowData(sheetName, mainRowData);
      const actualSheetName = SHEET_NAMES[sheetName] || sheetName;

      // Call the edge function to append
      const { data: response, error } = await supabase.functions.invoke('google-sheets-append', {
        body: {
          action: 'append',
          sheetName: actualSheetName,
          rowData: formattedData,
        },
      });

      if (error) {
        console.error('Error appending row:', error);
        throw new Error(`Erro ao salvar: ${error.message}`);
      }

      // If there's additional data to save (e.g., carga + lancamento)
      if (alsoSaveTo) {
        const alsoId = generateId();
        const alsoRowData = {
          ...alsoSaveTo.rowData,
          ID: alsoId,
          Sincronizado: 'Sim',
          Timestamp: timestamp,
          Hora: hora,
          Apontador: user?.email || 'Sistema',
          Origem_Carga: id,
        };

        const alsoFormattedData = formatRowData(alsoSaveTo.sheetName, alsoRowData);
        const alsoActualSheetName = SHEET_NAMES[alsoSaveTo.sheetName] || alsoSaveTo.sheetName;

        const { error: alsoError } = await supabase.functions.invoke('google-sheets-append', {
          body: {
            action: 'append',
            sheetName: alsoActualSheetName,
            rowData: alsoFormattedData,
          },
        });

        if (alsoError) {
          console.warn('Error appending secondary row:', alsoError);
        }
      }

      return {
        success: true,
        id,
        message: 'Registro salvo com sucesso',
      };
    },
    onSuccess: (result, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['sheets', variables.sheetName] });
      if (variables.alsoSaveTo) {
        queryClient.invalidateQueries({ queryKey: ['sheets', variables.alsoSaveTo.sheetName] });
      }
      return result;
    },
    onError: (error: Error) => {
      console.error('Append error:', error);
      toast.error(`Erro ao salvar: ${error.message}`);
    },
  });
}

// Hook específico para apontamentos de carga
export function useCargaAppend() {
  const appendMutation = useGoogleSheetsAppend();

  return {
    ...appendMutation,
    appendCarga: (data: {
      data: string;
      local: string;
      estaca: string;
      escavadeira: string;
      empresaEsc: string;
      operador: string;
      caminhao: string;
      empresaCam: string;
      motorista: string;
      volume: string;
      material: string;
      numViagens: number;
      adicionarLancamento: boolean;
      localLancamento?: string;
    }) => {
      const rowData = {
        Data: data.data,
        Local: data.local,
        Estaca: data.estaca,
        Escavadeira: data.escavadeira,
        Empresa_Esc: data.empresaEsc,
        Operador: data.operador,
        Caminhao: data.caminhao,
        Empresa_Cam: data.empresaCam,
        Motorista: data.motorista,
        Volume: data.volume,
        Material: data.material,
        N_Viagens: String(data.numViagens),
        Lancamento_Auto: data.adicionarLancamento ? 'Sim' : 'Não',
        Lancamento_Local: data.localLancamento || '',
      };

      const alsoSaveTo = data.adicionarLancamento && data.localLancamento ? {
        sheetName: 'descarga' as const,
        rowData: {
          Data: data.data,
          Local: data.localLancamento,
          Estaca: '',
          Caminhao: data.caminhao,
          Empresa: data.empresaCam,
          Motorista: data.motorista,
          Volume: data.volume,
          Material: data.material,
          N_Viagens: String(data.numViagens),
        },
      } : undefined;

      return appendMutation.mutateAsync({
        sheetName: 'carga',
        rowData,
        alsoSaveTo,
      });
    },
  };
}

// Hook específico para lançamento (descarga)
export function useLancamentoAppend() {
  const appendMutation = useGoogleSheetsAppend();

  return {
    ...appendMutation,
    appendLancamento: (data: {
      data: string;
      local: string;
      estaca: string;
      caminhao: string;
      empresa: string;
      motorista: string;
      volume: string;
      material: string;
      numViagens: number;
    }) => {
      const rowData = {
        Data: data.data,
        Local: data.local,
        Estaca: data.estaca,
        Caminhao: data.caminhao,
        Empresa: data.empresa,
        Motorista: data.motorista,
        Volume: data.volume,
        Material: data.material,
        N_Viagens: String(data.numViagens),
      };

      return appendMutation.mutateAsync({
        sheetName: 'descarga',
        rowData,
      });
    },
  };
}

// Hook específico para pedreira
export function usePedreiraAppend() {
  const appendMutation = useGoogleSheetsAppend();

  return {
    ...appendMutation,
    appendPedreira: (data: {
      data: string;
      caminhao: string;
      empresa: string;
      motorista: string;
      placa: string;
      horaCarregamento: string;
      numeroPedido: string;
      pesoBruto: number;
      pesoTara: number;
      pesoLiquido: number;
      material: string;
    }) => {
      const rowData = {
        Data: data.data,
        Caminhao: data.caminhao,
        Empresa: data.empresa,
        Motorista: data.motorista,
        Placa: data.placa,
        Hora_Carregamento: data.horaCarregamento,
        N_Pedido: data.numeroPedido,
        Peso_Bruto: String(data.pesoBruto),
        Peso_Tara: String(data.pesoTara),
        Peso_Liquido: String(data.pesoLiquido),
        Material: data.material,
      };

      return appendMutation.mutateAsync({
        sheetName: 'apontamento_pedreira',
        rowData,
      });
    },
  };
}

// Hook específico para pipas
export function usePipasAppend() {
  const appendMutation = useGoogleSheetsAppend();

  return {
    ...appendMutation,
    appendPipa: (data: {
      data: string;
      prefixo: string;
      empresa: string;
      motorista: string;
      capacidade: string;
      horaChegada: string;
      horaSaida: string;
      numViagens: number;
    }) => {
      const rowData = {
        Data: data.data,
        Prefixo: data.prefixo,
        Empresa: data.empresa,
        Motorista: data.motorista,
        Capacidade: data.capacidade,
        Hora_Chegada: data.horaChegada,
        Hora_Saida: data.horaSaida,
        N_Viagens: String(data.numViagens),
      };

      return appendMutation.mutateAsync({
        sheetName: 'apontamento_pipa',
        rowData,
      });
    },
  };
}

// Hook específico para CAL
export function useCalAppend() {
  const appendMutation = useGoogleSheetsAppend();

  return {
    ...appendMutation,
    appendCal: (data: {
      data: string;
      tipo: 'Entrada' | 'Saida';
      quantidade: number;
      notaFiscal?: string;
      valor?: number;
      fornecedor?: string;
    }) => {
      const rowData = {
        Data: data.data,
        Tipo: data.tipo,
        Quantidade: String(data.quantidade),
        Nota_Fiscal: data.notaFiscal || '',
        Valor: data.valor ? String(data.valor) : '',
        Fornecedor: data.fornecedor || '',
      };

      return appendMutation.mutateAsync({
        sheetName: 'mov_cal',
        rowData,
      });
    },
  };
}
