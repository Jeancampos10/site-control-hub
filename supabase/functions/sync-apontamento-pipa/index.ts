import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GOOGLE_APPS_SCRIPT_URL = Deno.env.get('GOOGLE_APPS_SCRIPT_URL');
const GOOGLE_APPS_SCRIPT_SECRET = Deno.env.get('GOOGLE_APPS_SCRIPT_SECRET');
const SPREADSHEET_ID = '1B9-SbnayFySlsITdRqn_2WJNnA9ZHhD0PWYka83581c';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface ApontamentoPipaData {
  id?: string;
  data: string;
  prefixo: string;
  descricao?: string;
  empresa?: string;
  motorista?: string;
  capacidade?: string;
  hora_chegada?: string;
  hora_saida?: string;
  n_viagens: number | string;
}

// Format date from YYYY-MM-DD to DD/MM/YYYY
function formatDateForSheet(isoDate: string): string {
  if (!isoDate) return '';
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, data, rowIndex, recordId } = body;

    console.log(`Sync apontamento pipa - Action: ${action}`, data);

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    if (!GOOGLE_APPS_SCRIPT_URL) {
      console.warn('GOOGLE_APPS_SCRIPT_URL not configured - saving to database only');
      
      // Just mark as not synced if Apps Script is not configured
      if (recordId) {
        await supabase
          .from('apontamentos_pipa')
          .update({ sincronizado_sheets: false })
          .eq('id', recordId);
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          synced: false,
          message: 'Salvo no banco de dados. Sincronização com planilha não configurada.'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Map data to sheet columns for Apontamento_Pipa
    // Columns: A(auto), B(Data), C(Prefixo), D(Descrição), E(Empresa), F(Motorista), G(Capacidade), H(Hora_Chegada), I(Hora_Saida), J(N_Viagens)
    const mapToSheetRow = (d: ApontamentoPipaData) => [
      '', // A - auto/index
      formatDateForSheet(d.data), // B - Data (DD/MM/YYYY)
      d.prefixo || '',
      d.descricao || '',
      d.empresa || '',
      d.motorista || '',
      d.capacidade || '',
      d.hora_chegada || '',
      d.hora_saida || '',
      String(d.n_viagens || ''),
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

    console.log('Sending to Apps Script:', JSON.stringify(payload));

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

    // Check if the Apps Script returned an error in the response body
    const hasError = result.error || result.success === false || !response.ok;
    
    if (hasError) {
      console.error('Apps Script error:', result.error || 'Unknown error');
      
      // Mark as not synced on failure
      if (recordId) {
        await supabase
          .from('apontamentos_pipa')
          .update({ sincronizado_sheets: false })
          .eq('id', recordId);
      }
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          synced: false, 
          error: result.error || 'Erro no Apps Script',
          details: 'Verifique a configuração do Google Apps Script e se o secret está correto'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update sync status in database on success
    if (recordId) {
      await supabase
        .from('apontamentos_pipa')
        .update({ sincronizado_sheets: true })
        .eq('id', recordId);
    }

    return new Response(
      JSON.stringify({ success: true, synced: true, ...result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in sync-apontamento-pipa:', error);
    return new Response(
      JSON.stringify({ success: false, synced: false, error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
