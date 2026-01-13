import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GOOGLE_APPS_SCRIPT_URL = Deno.env.get('GOOGLE_APPS_SCRIPT_URL');
const GOOGLE_APPS_SCRIPT_SECRET = Deno.env.get('GOOGLE_APPS_SCRIPT_SECRET');
const SPREADSHEET_ID = '1B9-SbnayFySlsITdRqn_2WJNnA9ZHhD0PWYka83581c';

interface ApontamentoPipaData {
  Data: string;
  Prefixo: string;
  Descricao?: string;
  Empresa?: string;
  Motorista?: string;
  Capacidade?: string;
  Hora_Chegada?: string;
  Hora_Saida?: string;
  N_Viagens: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, data, rowIndex } = body;

    console.log(`Sync apontamento pipa - Action: ${action}`, data);

    if (!GOOGLE_APPS_SCRIPT_URL) {
      console.warn('GOOGLE_APPS_SCRIPT_URL not configured');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Google Apps Script URL não configurado',
          message: 'Configure GOOGLE_APPS_SCRIPT_URL nas variáveis de ambiente'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Map data to sheet columns for Apontamento_Pipa
    // Columns: A(auto), B(Data), C(Prefixo), D(Descrição), E(Empresa), F(Motorista), G(Capacidade), H(Hora_Chegada), I(Hora_Saida), J(N_Viagens)
    const mapToSheetRow = (d: ApontamentoPipaData) => [
      '', // A - auto
      d.Data || '',
      d.Prefixo || '',
      d.Descricao || '',
      d.Empresa || '',
      d.Motorista || '',
      d.Capacidade || '',
      d.Hora_Chegada || '',
      d.Hora_Saida || '',
      d.N_Viagens || '',
    ];

    let payload: any = {
      secret: GOOGLE_APPS_SCRIPT_SECRET,
      spreadsheetId: SPREADSHEET_ID,
      sheetName: 'Apontamento_Pipa',
    };

    switch (action) {
      case 'append':
        payload.action = 'append';
        payload.rowData = mapToSheetRow(data);
        break;

      case 'update':
        if (!rowIndex) {
          return new Response(
            JSON.stringify({ success: false, error: 'rowIndex é obrigatório para update' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        payload.action = 'update';
        payload.rowIndex = rowIndex;
        payload.rowData = mapToSheetRow(data);
        break;

      case 'delete':
        if (!rowIndex) {
          return new Response(
            JSON.stringify({ success: false, error: 'rowIndex é obrigatório para delete' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        payload.action = 'delete';
        payload.rowIndex = rowIndex;
        break;

      default:
        return new Response(
          JSON.stringify({ success: false, error: `Ação desconhecida: ${action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    console.log('Sending to Apps Script:', payload);

    const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    console.log('Apps Script response:', responseText);

    let result;
    try {
      result = JSON.parse(responseText);
    } catch {
      result = { message: responseText };
    }

    if (!response.ok) {
      return new Response(
        JSON.stringify({ success: false, error: result.error || 'Erro no Apps Script' }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, ...result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in sync-apontamento-pipa:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
