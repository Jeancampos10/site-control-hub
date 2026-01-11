import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GOOGLE_APPS_SCRIPT_URL = Deno.env.get('GOOGLE_APPS_SCRIPT_URL');
const GOOGLE_APPS_SCRIPT_SECRET = Deno.env.get('GOOGLE_APPS_SCRIPT_SECRET');
const ABASTECH_SPREADSHEET_ID = Deno.env.get('ABASTECH_SPREADSHEET_ID');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Map of sheet names for each source
const SHEET_NAMES: Record<string, string> = {
  'tanque01': 'AbastecimentoCanteiro01',
  'tanque02': 'AbastecimentoCanteiro02',
  'comboio01': 'AbastecimentoComboio01',
  'comboio02': 'AbastecimentoComboio02',
  'comboio03': 'AbastecimentoComboio03',
};

// Column mapping from our system to Google Sheets columns (1-indexed for Apps Script)
const COLUMN_MAPPING: Record<string, number> = {
  'IdAbastecimento': 1,      // A
  'Data': 2,                  // B
  'Hora': 3,                  // C
  'Tipo': 4,                  // D
  'Veiculo': 5,              // E (Categoria in sheet but maps to vehicle type)
  'Categoria': 5,            // E
  'Prefixo': 6,              // F (Veiculo column in sheet)
  'Potencia': 7,             // G
  'Descricao': 8,            // H
  'Motorista': 9,            // I
  'Empresa': 10,             // J
  'Obra': 11,                // K
  'Horimetro_Anterior': 12,  // L
  'Horimetro_Atual': 13,     // M
  'Km_Anterior': 14,         // N
  'Km_Atual': 15,            // O
  'Quantidade': 16,          // P
  'Tipo_Combustivel': 17,    // Q
  'Local': 18,               // R
  'Arla': 19,                // S
  'Quantidade_Arla': 20,     // T
  'Fornecedor': 21,          // U
  'NotaFiscal': 22,          // V
  'ValorUnitario': 23,       // W
  'ValorTotal': 24,          // X
  'Localizacao': 25,         // Y
  'Observacao': 26,          // Z
  'Foto_Bomba': 27,          // AA
  'Foto_Horimetro': 28,      // AB
  'Local_Entrada': 29,       // AC
  'Lubrificar': 30,          // AD
  'Lubrificante': 31,        // AE
  'CompletarOleo': 32,       // AF
  'TipoOleo': 33,            // AG
  'Qtd_Oleo': 34,            // AH
  'Sopra_Filtro': 35,        // AI
};

interface AbastecimentoData {
  id?: string;
  data?: string;
  hora?: string;
  tipo?: string;
  veiculo?: string;
  categoria?: string;
  potencia?: string;
  descricao?: string;
  motorista?: string;
  empresa?: string;
  obra?: string;
  horimetro_anterior?: number;
  horimetro_atual?: number;
  km_anterior?: number;
  km_atual?: number;
  quantidade?: number;
  tipo_combustivel?: string;
  local?: string;
  arla?: boolean;
  quantidade_arla?: number;
  fornecedor?: string;
  nota_fiscal?: string;
  valor_unitario?: number;
  valor_total?: number;
  localizacao?: string;
  observacao?: string;
  foto_bomba?: string;
  foto_horimetro?: string;
  local_entrada?: string;
  lubrificar?: boolean;
  lubrificante?: string;
  completar_oleo?: boolean;
  tipo_oleo?: string;
  qtd_oleo?: number;
  sopra_filtro?: boolean;
}

function formatDataForSheet(data: AbastecimentoData): string[] {
  return [
    data.id || '',
    data.data || '',
    data.hora || '',
    data.tipo || 'Saida',
    data.categoria || '',
    data.veiculo || '',
    data.potencia || '',
    data.descricao || '',
    data.motorista || '',
    data.empresa || '',
    data.obra || '',
    data.horimetro_anterior?.toString() || '',
    data.horimetro_atual?.toString() || '',
    data.km_anterior?.toString() || '',
    data.km_atual?.toString() || '',
    data.quantidade?.toString() || '',
    data.tipo_combustivel || '',
    data.local || '',
    data.arla ? '✔' : '',
    data.quantidade_arla?.toString() || '',
    data.fornecedor || '',
    data.nota_fiscal || '',
    data.valor_unitario?.toString() || '',
    data.valor_total?.toString() || '',
    data.localizacao || '',
    data.observacao || '',
    data.foto_bomba || '',
    data.foto_horimetro || '',
    data.local_entrada || '',
    data.lubrificar ? '✔' : '✗',
    data.lubrificante || '',
    data.completar_oleo ? '✔' : '✗',
    data.tipo_oleo || '',
    data.qtd_oleo?.toString() || '',
    data.sopra_filtro ? '✔' : '✗',
  ];
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!GOOGLE_APPS_SCRIPT_URL) {
      throw new Error('GOOGLE_APPS_SCRIPT_URL not configured');
    }

    const body = await req.json();
    const { action, source, data, rowId } = body;

    console.log(`Sync request: action=${action}, source=${source}, rowId=${rowId}`);

    const sheetName = SHEET_NAMES[source];
    if (!sheetName) {
      throw new Error(`Unknown source: ${source}. Available: ${Object.keys(SHEET_NAMES).join(', ')}`);
    }

    let result;

    switch (action) {
      case 'append': {
        // Add new row to sheet
        const rowData = formatDataForSheet(data);
        result = await callAppsScript('append', {
          sheetName,
          spreadsheetId: ABASTECH_SPREADSHEET_ID,
          rowData,
        });
        break;
      }

      case 'update': {
        // Update existing row by ID
        const rowData = formatDataForSheet(data);
        result = await callAppsScript('update', {
          sheetName,
          spreadsheetId: ABASTECH_SPREADSHEET_ID,
          rowId: rowId || data.id,
          rowData,
          idColumn: 1, // Column A contains the ID
        });
        break;
      }

      case 'delete': {
        // Delete row by ID
        result = await callAppsScript('delete', {
          sheetName,
          spreadsheetId: ABASTECH_SPREADSHEET_ID,
          rowId,
          idColumn: 1,
        });
        break;
      }

      case 'bulkUpdate': {
        // Bulk update with filters
        const { filters, updates, dateFilter } = body;
        result = await callAppsScript('bulkUpdate', {
          sheetName,
          spreadsheetId: ABASTECH_SPREADSHEET_ID,
          filters,
          updates,
          dateFilter,
        });
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(
      JSON.stringify({ success: true, ...result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in sync-abastecimentos:', errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function callAppsScript(action: string, params: Record<string, unknown>): Promise<Record<string, unknown>> {
  if (!GOOGLE_APPS_SCRIPT_URL) {
    throw new Error('GOOGLE_APPS_SCRIPT_URL not configured');
  }

  console.log(`Calling Apps Script: action=${action}`, params);

  const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      authToken: GOOGLE_APPS_SCRIPT_SECRET,
      action,
      ...params,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Apps Script error:', response.status, errorText);
    throw new Error(`Apps Script request failed: ${response.status}`);
  }

  const result = await response.json();
  console.log('Apps Script response:', result);

  if (!result.success) {
    throw new Error(result.error || 'Apps Script returned error');
  }

  return result;
}
