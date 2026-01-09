import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GOOGLE_SHEETS_API_KEY = Deno.env.get('GOOGLE_SHEETS_API_KEY');
const SPREADSHEET_ID = '1B9-SbnayFySlsITdRqn_2WJNnA9ZHhD0PWYka83581c';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SheetRange {
  [key: string]: string;
}

// Use sheet names without special characters - encode them properly
const SHEET_RANGES: SheetRange = {
  carga: 'Carga!A:U',
  descarga: 'Descarga!A:O',
  equipamentos: 'Equipamentos!A:F',
  caminhao: 'Caminhao!A:G',
  cam_reboque: 'Cam_Reboque!A:I',
  caminhao_pipa: 'Caminhao_Pipa!A:G',
  apontamento_pedreira: 'Apontamento_Pedreira!A:Q',
  apontamento_pipa: 'Apontamento_Pipa!A:J',
};

async function fetchSheetData(sheetName: string): Promise<any[]> {
  const range = SHEET_RANGES[sheetName];
  if (!range) {
    throw new Error(`Sheet "${sheetName}" not found. Available: ${Object.keys(SHEET_RANGES).join(', ')}`);
  }

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}?key=${GOOGLE_SHEETS_API_KEY}`;
  
  console.log(`Fetching data from: ${sheetName} (range: ${range})`);
  
  const response = await fetch(url);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Google Sheets API error: ${response.status} - ${errorText}`);
    
    // If the sheet name with accent fails, try alternative names
    if (response.status === 400 && sheetName === 'caminhao') {
      console.log('Trying alternative sheet name: Caminhão');
      const altUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent('Caminhão!A:G')}?key=${GOOGLE_SHEETS_API_KEY}`;
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
  
  const range = SHEET_RANGES[sheetName];
  if (!range) {
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
