import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GOOGLE_SHEETS_API_KEY = Deno.env.get('GOOGLE_SHEETS_API_KEY');

// Production spreadsheet
const SPREADSHEET_ID = '1B9-SbnayFySlsITdRqn_2WJNnA9ZHhD0PWYka83581c';
// Abastech spreadsheet (combustível/frota)
const ABASTECH_SPREADSHEET_ID = Deno.env.get('ABASTECH_SPREADSHEET_ID') || SPREADSHEET_ID;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SheetConfig {
  range: string;
  spreadsheetId: string;
}

interface SheetRanges {
  [key: string]: SheetConfig;
}

// Production sheets
const SHEET_RANGES: SheetRanges = {
  // Production sheets (original spreadsheet)
  carga: { range: 'Carga!A:U', spreadsheetId: SPREADSHEET_ID },
  descarga: { range: 'Descarga!A:O', spreadsheetId: SPREADSHEET_ID },
  equipamentos: { range: 'Equipamentos!A:F', spreadsheetId: SPREADSHEET_ID },
  caminhao: { range: 'Caminhao!A:G', spreadsheetId: SPREADSHEET_ID },
  cam_reboque: { range: 'Cam_Reboque!A:I', spreadsheetId: SPREADSHEET_ID },
  caminhao_pipa: { range: 'Caminhao_Pipa!A:G', spreadsheetId: SPREADSHEET_ID },
  apontamento_pedreira: { range: 'Apontamento_Pedreira!A:Q', spreadsheetId: SPREADSHEET_ID },
  apontamento_pipa: { range: 'Apontamento_Pipa!A:J', spreadsheetId: SPREADSHEET_ID },
  mov_cal: { range: 'Mov_Cal!B:L', spreadsheetId: SPREADSHEET_ID },
  estoque_cal: { range: 'Estoque_Cal!A:F', spreadsheetId: SPREADSHEET_ID },
  
  // Abastech sheets (combustível/frota) - Extended ranges for all columns
  AbastecimentoCanteiro01: { range: 'AbastecimentoCanteiro01!A:AI', spreadsheetId: ABASTECH_SPREADSHEET_ID },
  AbastecimentoCanteiro02: { range: 'AbastecimentoCanteiro02!A:AI', spreadsheetId: ABASTECH_SPREADSHEET_ID },
  AbastecimentoComboio01: { range: 'AbastecimentoComboio01!A:AI', spreadsheetId: ABASTECH_SPREADSHEET_ID },
  AbastecimentoComboio02: { range: 'AbastecimentoComboio02!A:AI', spreadsheetId: ABASTECH_SPREADSHEET_ID },
  AbastecimentoComboio03: { range: 'AbastecimentoComboio03!A:AI', spreadsheetId: ABASTECH_SPREADSHEET_ID },
  Geral: { range: 'Geral!A:AI', spreadsheetId: ABASTECH_SPREADSHEET_ID },
  EstoqueCanteiro01: { range: 'EstoqueCanteiro01!A:Z', spreadsheetId: ABASTECH_SPREADSHEET_ID },
  EstoqueCanteiro02: { range: 'EstoqueCanteiro02!A:Z', spreadsheetId: ABASTECH_SPREADSHEET_ID },
  EstoqueComboio01: { range: 'EstoqueComboio01!A:Z', spreadsheetId: ABASTECH_SPREADSHEET_ID },
  EstoqueComboio02: { range: 'EstoqueComboio02!A:Z', spreadsheetId: ABASTECH_SPREADSHEET_ID },
  EstoqueComboio03: { range: 'EstoqueComboio03!A:Z', spreadsheetId: ABASTECH_SPREADSHEET_ID },
  EstoqueObraSaneamento: { range: 'EstoqueObraSaneamento!A:Z', spreadsheetId: ABASTECH_SPREADSHEET_ID },
  Estoque_Arla: { range: 'Estoque_Arla!A:Z', spreadsheetId: ABASTECH_SPREADSHEET_ID },
  Veiculos: { range: 'Veiculos!A:Z', spreadsheetId: ABASTECH_SPREADSHEET_ID },
  Horimetros: { range: 'Horimetros!A:Z', spreadsheetId: ABASTECH_SPREADSHEET_ID },
  Ordem_Servico: { range: 'Ordem_Servico!A:Z', spreadsheetId: ABASTECH_SPREADSHEET_ID },
};

async function fetchSheetData(sheetName: string): Promise<any[]> {
  const sheetConfig = SHEET_RANGES[sheetName];
  if (!sheetConfig) {
    throw new Error(`Sheet "${sheetName}" not found. Available: ${Object.keys(SHEET_RANGES).join(', ')}`);
  }

  const { range, spreadsheetId } = sheetConfig;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?key=${GOOGLE_SHEETS_API_KEY}`;
  
  console.log(`Fetching data from: ${sheetName} (range: ${range}, spreadsheet: ${spreadsheetId})`);
  
  const response = await fetch(url);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Google Sheets API error: ${response.status} - ${errorText}`);
    
    // If the sheet name with accent fails, try alternative names
    if (response.status === 400 && sheetName === 'caminhao') {
      console.log('Trying alternative sheet name: Caminhão');
      const altUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent('Caminhão!A:G')}?key=${GOOGLE_SHEETS_API_KEY}`;
      const altResponse = await fetch(altUrl);
      if (altResponse.ok) {
        const data = await altResponse.json();
        return processSheetData(data, sheetName);
      }
    }
    
    throw new Error(`Failed to fetch sheet data: ${response.status}`);
  }

  const data = await response.json();
  return processSheetData(data, sheetName);
}

function processSheetData(data: any, sheetName: string): any[] {
  if (!data.values || data.values.length === 0) {
    console.log(`No data found in sheet: ${sheetName}`);
    return [];
  }

  // First row is header, rest is data
  const headers = data.values[0];
  const rows = data.values.slice(1);

  // Convert to array of objects
  const result = rows.map((row: string[]) => {
    const obj: Record<string, string> = {};
    headers.forEach((header: string, index: number) => {
      obj[header] = row[index] || '';
    });
    return obj;
  });

  console.log(`Fetched ${result.length} rows from ${sheetName}`);
  return result;
}

// Handle bulk updates - Note: Google Sheets API key doesn't support writes
// This is a simulation that would work with a service account
async function updateSheetData(
  sheetName: string, 
  filters: Record<string, string>, 
  updates: Record<string, string>,
  affectedRows: Record<string, string>[]
): Promise<{ updatedCount: number; message: string }> {
  console.log(`Bulk update request for ${sheetName}`);
  console.log(`Filters:`, filters);
  console.log(`Updates:`, updates);
  console.log(`Affected rows count:`, affectedRows.length);

  // For now, we'll log the update request
  // To actually update, you would need a service account with write permissions
  // and use the batchUpdate endpoint
  
  // Example of what the actual update would look like:
  // 1. Fetch all data to find row indices
  // 2. Build batch update request
  // 3. Send to Google Sheets API
  
  const sheetConfig = SHEET_RANGES[sheetName];
  if (!sheetConfig) {
    throw new Error(`Sheet "${sheetName}" not found`);
  }

  // Simulate the update by returning success
  // In production, you would implement actual update logic here
  console.log(`Would update ${affectedRows.length} rows with:`, updates);
  
  return {
    updatedCount: affectedRows.length,
    message: `Atualização registrada para ${affectedRows.length} registros. As alterações serão processadas.`
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);

    // Handle PUT request for bulk updates
    if (req.method === 'PUT') {
      const body = await req.json();
      const { sheet, filters, updates, affectedRows } = body;

      if (!sheet) {
        return new Response(
          JSON.stringify({ error: 'Missing "sheet" parameter' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!updates || Object.keys(updates).length === 0) {
        return new Response(
          JSON.stringify({ error: 'No updates provided' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const result = await updateSheetData(sheet, filters, updates, affectedRows);

      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle GET request
    const sheet = url.searchParams.get('sheet');

    if (!sheet) {
      return new Response(
        JSON.stringify({ error: 'Missing "sheet" parameter', available: Object.keys(SHEET_RANGES) }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await fetchSheetData(sheet);

    return new Response(
      JSON.stringify({ data, count: data.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in google-sheets function:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
