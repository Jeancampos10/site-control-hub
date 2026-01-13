import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GOOGLE_APPS_SCRIPT_URL = Deno.env.get('GOOGLE_APPS_SCRIPT_URL');
const GOOGLE_APPS_SCRIPT_SECRET = Deno.env.get('GOOGLE_APPS_SCRIPT_SECRET');
const GOOGLE_SHEETS_API_KEY = Deno.env.get('GOOGLE_SHEETS_API_KEY');
const SPREADSHEET_ID = Deno.env.get('ABASTECH_SPREADSHEET_ID');
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

// Parse date from DD/MM/YYYY (sheet) to YYYY-MM-DD
function parseDateFromSheet(dateStr: string): string {
  if (!dateStr) return '';
  const match = String(dateStr).trim().match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!match) return '';
  const day = match[1].padStart(2, '0');
  const month = match[2].padStart(2, '0');
  const year = match[3];
  return `${year}-${month}-${day}`;
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

    if (!SPREADSHEET_ID) {
      return new Response(
        JSON.stringify({ success: false, synced: false, error: 'ABASTECH_SPREADSHEET_ID não configurado' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action !== 'import' && !GOOGLE_APPS_SCRIPT_SECRET) {
      return new Response(
        JSON.stringify({ success: false, synced: false, error: 'GOOGLE_APPS_SCRIPT_SECRET não configurado' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action !== 'import' && !GOOGLE_APPS_SCRIPT_URL) {
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
          message: 'Salvo no banco de dados. Sincronização com planilha não configurada.',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Map data to sheet columns for Apontamento_Pipa
    // Columns: A(auto), B(Data), C(Prefixo), D(Descrição), E(Empresa), F(Motorista), G(Capacidade), H(Hora_Chegada), I(Hora_Saida), J(N_Viagens)
    const mapToSheetRow = (d: ApontamentoPipaData, id: string) => [
      id, // A - ID (usado para update/delete)
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

    const basePayload = {
      authToken: GOOGLE_APPS_SCRIPT_SECRET,
      spreadsheetId: SPREADSHEET_ID,
      sheetName: 'Apontamento_Pipa',
    };

    let payload: any;

    switch (action) {
      case 'import': {
        if (!GOOGLE_SHEETS_API_KEY) {
          return new Response(
            JSON.stringify({ success: false, error: 'GOOGLE_SHEETS_API_KEY não configurado' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Evita duplicar importações (importa apenas se a tabela estiver vazia)
        const { count, error: countError } = await supabase
          .from('apontamentos_pipa')
          .select('id', { count: 'exact', head: true });

        if (countError) throw countError;

        if ((count ?? 0) > 0) {
          return new Response(
            JSON.stringify({
              success: true,
              imported: 0,
              skipped: true,
              message: 'Tabela já possui dados; importação ignorada.',
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const range = encodeURIComponent('Apontamento_Pipa');
        const sheetsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}?key=${GOOGLE_SHEETS_API_KEY}`;

        const sheetRes = await fetch(sheetsUrl);
        const sheetJson = await sheetRes.json();

        const values: any[] = sheetJson?.values || [];

        if (values.length < 2) {
          return new Response(
            JSON.stringify({ success: true, imported: 0, message: 'Planilha sem dados para importar.' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const headers = (values[0] || []).map((h: any) => String(h || '').trim());
        const findIdx = (...names: string[]) => {
          for (const n of names) {
            const idx = headers.findIndex((h: string) => h.toLowerCase() === n.toLowerCase());
            if (idx !== -1) return idx;
          }
          return -1;
        };

        const iData = findIdx('Data');
        const iPrefixo = findIdx('Prefixo');
        const iDescricao = findIdx('Descrição', 'Descricao');
        const iEmpresa = findIdx('Empresa');
        const iMotorista = findIdx('Motorista');
        const iCapacidade = findIdx('Capacidade');
        const iHoraChegada = findIdx('Hora_Chegada', 'Hora Chegada', 'Hora_Chegada ');
        const iHoraSaida = findIdx('Hora_Saida', 'Hora Saida', 'Hora_Saída', 'Hora_Saída ');
        const iNViagens = findIdx('N_Viagens', 'N_Viagens ', 'Viagens');

        const inserts: any[] = [];

        for (let r = 1; r < values.length; r++) {
          const row = values[r] || [];
          const isoDate = parseDateFromSheet(String(row[iData] ?? ''));
          const prefixo = String(row[iPrefixo] ?? '').trim();
          if (!isoDate || !prefixo) continue;

          const nViagens = Math.max(1, parseInt(String(row[iNViagens] ?? '1'), 10) || 1);

          inserts.push({
            data: isoDate,
            prefixo,
            descricao: (iDescricao >= 0 ? String(row[iDescricao] ?? '').trim() : '') || null,
            empresa: (iEmpresa >= 0 ? String(row[iEmpresa] ?? '').trim() : '') || null,
            motorista: (iMotorista >= 0 ? String(row[iMotorista] ?? '').trim() : '') || null,
            capacidade: (iCapacidade >= 0 ? String(row[iCapacidade] ?? '').trim() : '') || null,
            hora_chegada: (iHoraChegada >= 0 ? String(row[iHoraChegada] ?? '').trim() : '') || null,
            hora_saida: (iHoraSaida >= 0 ? String(row[iHoraSaida] ?? '').trim() : '') || null,
            n_viagens: nViagens,
            sincronizado_sheets: true,
          });
        }

        if (inserts.length === 0) {
          return new Response(
            JSON.stringify({ success: true, imported: 0, message: 'Nenhum registro válido encontrado na planilha.' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { error: insertError } = await supabase.from('apontamentos_pipa').insert(inserts);
        if (insertError) throw insertError;

        return new Response(
          JSON.stringify({ success: true, imported: inserts.length }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'append': {
        if (!recordId) {
          return new Response(
            JSON.stringify({ success: false, error: 'recordId é obrigatório para append (usado como ID na planilha)' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        payload = { ...basePayload, action: 'append', rowData: mapToSheetRow(data, recordId) };
        break;
      }

      case 'update': {
        if (!recordId) {
          return new Response(
            JSON.stringify({ success: false, error: 'recordId é obrigatório para update' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        payload = {
          ...basePayload,
          action: 'update',
          rowId: recordId,
          idColumn: 1,
          rowData: mapToSheetRow(data, recordId),
        };
        break;
      }

      case 'delete': {
        if (!recordId) {
          return new Response(
            JSON.stringify({ success: false, error: 'recordId é obrigatório para delete' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        payload = { ...basePayload, action: 'delete', rowId: recordId, idColumn: 1 };
        break;
      }

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
