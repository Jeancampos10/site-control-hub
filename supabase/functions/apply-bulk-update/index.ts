import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ApplyBulkUpdateRequest {
  sheetName: string;
  dateFilter: string | null;
  filters: Record<string, string>;
  updates: Record<string, string>;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const APPS_SCRIPT_URL = Deno.env.get('GOOGLE_APPS_SCRIPT_URL');
    const APPS_SCRIPT_SECRET = Deno.env.get('GOOGLE_APPS_SCRIPT_SECRET');

    if (!APPS_SCRIPT_URL) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Google Apps Script não configurado. Siga as instruções em docs/GOOGLE_APPS_SCRIPT_INTEGRATION.md' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: ApplyBulkUpdateRequest = await req.json();
    
    console.log('Applying bulk update:', {
      sheetName: body.sheetName,
      dateFilter: body.dateFilter,
      filtersCount: Object.keys(body.filters).length,
      updatesCount: Object.keys(body.updates).length,
    });

    // Call Google Apps Script
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        authToken: APPS_SCRIPT_SECRET,
        sheetName: body.sheetName,
        dateFilter: body.dateFilter,
        filters: body.filters,
        updates: body.updates,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Apps Script error:', errorText);
      throw new Error(`Erro ao chamar Google Apps Script: ${response.status}`);
    }

    const result = await response.json();
    console.log('Apps Script result:', result);

    if (!result.success) {
      return new Response(
        JSON.stringify({ success: false, error: result.error || 'Erro desconhecido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        updatedCount: result.updatedCount,
        message: result.message,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in apply-bulk-update function:', errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
