import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GOOGLE_APPS_SCRIPT_URL = Deno.env.get('GOOGLE_APPS_SCRIPT_URL');
const GOOGLE_APPS_SCRIPT_SECRET = Deno.env.get('GOOGLE_APPS_SCRIPT_SECRET');
const SPREADSHEET_ID = '1B9-SbnayFySlsITdRqn_2WJNnA9ZHhD0PWYka83581c';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed. Use POST.' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { action, sheetName, rowData, rowId, idColumn, filters, updates, dateFilter } = body;

    console.log(`Google Sheets Append - Action: ${action}, Sheet: ${sheetName}`);

    if (!GOOGLE_APPS_SCRIPT_URL) {
      console.error('GOOGLE_APPS_SCRIPT_URL not configured');
      return new Response(
        JSON.stringify({ error: 'Google Apps Script URL not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare the request to Apps Script
    const appsScriptBody = {
      authToken: GOOGLE_APPS_SCRIPT_SECRET,
      spreadsheetId: SPREADSHEET_ID,
      action,
      sheetName,
      rowData,
      rowId,
      idColumn,
      filters,
      updates,
      dateFilter,
    };

    console.log('Calling Apps Script with:', JSON.stringify(appsScriptBody, null, 2));

    const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(appsScriptBody),
    });

    const responseText = await response.text();
    console.log('Apps Script response:', responseText);

    let result;
    try {
      result = JSON.parse(responseText);
    } catch {
      console.error('Failed to parse Apps Script response:', responseText);
      result = { success: false, error: 'Invalid response from Apps Script', raw: responseText };
    }

    if (!result.success) {
      console.error('Apps Script error:', result.error);
      return new Response(
        JSON.stringify(result),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in google-sheets-append function:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
