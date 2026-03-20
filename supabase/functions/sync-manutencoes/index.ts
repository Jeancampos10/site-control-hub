import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GOOGLE_APPS_SCRIPT_URL = Deno.env.get('GOOGLE_APPS_SCRIPT_URL');
const GOOGLE_APPS_SCRIPT_SECRET = Deno.env.get('GOOGLE_APPS_SCRIPT_SECRET');
const ABASTECH_SPREADSHEET_ID = Deno.env.get('ABASTECH_SPREADSHEET_ID');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Column mapping for Manutenções sheet
interface ManutencaoData {
  data_entrada?: string;
  hora_entrada?: string;
  data_saida?: string;
  hora_saida?: string;
  veiculo?: string;
  descricao?: string;
  categoria?: string;
  empresa?: string;
  tipo?: string;
  prioridade?: string;
  status?: string;
  problema?: string;
  tipo_problema?: string;
  solucao?: string;
  mecanico?: string;
  horimetro_km?: string;
  horas_estimadas?: string;
  horas_realizadas?: string;
  custo_estimado?: string;
  custo_real?: string;
  observacoes?: string;
}

function formatDataForSheet(data: ManutencaoData): string[] {
  return [
    data.data_entrada || '',
    data.hora_entrada || '',
    data.veiculo || '',
    data.descricao || '',
    data.categoria || '',
    data.empresa || '',
    data.tipo || '',
    data.prioridade || '',
    data.status || '',
    data.problema || '',
    data.tipo_problema || '',
    data.solucao || '',
    data.mecanico || '',
    data.horimetro_km || '',
    data.horas_estimadas || '',
    data.horas_realizadas || '',
    data.custo_estimado || '',
    data.custo_real || '',
    data.data_saida || '',
    data.hora_saida || '',
    data.observacoes || '',
  ];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!GOOGLE_APPS_SCRIPT_URL) {
      throw new Error('GOOGLE_APPS_SCRIPT_URL not configured');
    }

    const body = await req.json();
    const { action, data, rowId } = body;

    console.log(`Sync manutencoes request: action=${action}`);

    let result;

    switch (action) {
      case 'append': {
        const rowData = formatDataForSheet(data);
        result = await callAppsScript('append', {
          sheetName: 'Manutenções',
          spreadsheetId: ABASTECH_SPREADSHEET_ID,
          rowData,
        });
        break;
      }

      case 'update': {
        const rowData = formatDataForSheet(data);
        result = await callAppsScript('update', {
          sheetName: 'Manutenções',
          spreadsheetId: ABASTECH_SPREADSHEET_ID,
          rowId: rowId || data.id,
          rowData,
          idColumn: 1,
        });
        break;
      }

      case 'delete': {
        result = await callAppsScript('delete', {
          sheetName: 'Manutenções',
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
    console.error('Error in sync-manutencoes:', errorMessage);
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

  const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
  if (!result.success) {
    throw new Error(result.error || 'Apps Script returned error');
  }

  return result;
}
