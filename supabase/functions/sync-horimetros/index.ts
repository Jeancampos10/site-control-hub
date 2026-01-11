import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GOOGLE_APPS_SCRIPT_URL = Deno.env.get('GOOGLE_APPS_SCRIPT_URL');
const GOOGLE_APPS_SCRIPT_SECRET = Deno.env.get('GOOGLE_APPS_SCRIPT_SECRET');
const ABASTECH_SPREADSHEET_ID = Deno.env.get('ABASTECH_SPREADSHEET_ID');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Column mapping for Horimetros sheet
const HORIMETROS_COLUMNS = [
  'ID',           // A
  'Data',         // B
  'Categoria',    // C
  'Veiculo',      // D
  'Descricao',    // E
  'Operador',     // F
  'Empresa',      // G
  'Hor_Anterior', // H
  'Hor_Atual',    // I
  'Km_Anterior',  // J
  'Km_Atual',     // K
];

interface HorimetroData {
  id?: string;
  data?: string;
  categoria?: string;
  veiculo?: string;
  descricao?: string;
  operador?: string;
  empresa?: string;
  horimetro_anterior?: number | null;
  horimetro_atual?: number | null;
  km_anterior?: number | null;
  km_atual?: number | null;
}

function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return '';
  // Format with Brazilian decimal separator
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDataForSheet(data: HorimetroData): string[] {
  return [
    data.id || '',
    data.data || '',
    data.categoria || 'Equipamento',
    data.veiculo || '',
    data.descricao || '',
    data.operador || '',
    data.empresa || '',
    formatNumber(data.horimetro_anterior),
    formatNumber(data.horimetro_atual),
    formatNumber(data.km_anterior),
    formatNumber(data.km_atual),
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
    const { action, data, rowId } = body;

    console.log(`Sync horimetros request: action=${action}, rowId=${rowId}`);

    let result;

    switch (action) {
      case 'append': {
        const rowData = formatDataForSheet(data);
        result = await callAppsScript('append', {
          sheetName: 'Horimetros',
          spreadsheetId: ABASTECH_SPREADSHEET_ID,
          rowData,
        });
        break;
      }

      case 'update': {
        const rowData = formatDataForSheet(data);
        result = await callAppsScript('update', {
          sheetName: 'Horimetros',
          spreadsheetId: ABASTECH_SPREADSHEET_ID,
          rowId: rowId || data.id,
          rowData,
          idColumn: 1,
        });
        break;
      }

      case 'delete': {
        result = await callAppsScript('delete', {
          sheetName: 'Horimetros',
          spreadsheetId: ABASTECH_SPREADSHEET_ID,
          rowId,
          idColumn: 1,
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
    console.error('Error in sync-horimetros:', errorMessage);
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
