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

async function validateAppsScript(url: string, secret: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        authToken: secret,
        action: 'healthcheck',
      }),
    });

    const text = await response.text();
    
    // Check if response is HTML (error page)
    if (text.trim().startsWith('<!') || text.trim().startsWith('<html')) {
      return { 
        valid: false, 
        error: 'Apps Script retornou página HTML. Verifique se o script está implantado corretamente como Web App.' 
      };
    }

    try {
      const data = JSON.parse(text);
      if (data.success || data.status === 'ok') {
        return { valid: true };
      }
      // If it's valid JSON but not a healthcheck response, it's still a valid endpoint
      return { valid: true };
    } catch {
      return { 
        valid: false, 
        error: `Resposta inválida do Apps Script: ${text.substring(0, 100)}` 
      };
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return { valid: false, error: `Erro de conexão: ${errorMsg}` };
  }
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

    const url = new URL(req.url);
    const isHealthCheck = url.searchParams.get('healthcheck') === 'true';

    // Health check mode
    if (isHealthCheck) {
      console.log('Running Apps Script health check...');
      const validation = await validateAppsScript(APPS_SCRIPT_URL, APPS_SCRIPT_SECRET || '');
      
      return new Response(
        JSON.stringify({
          success: validation.valid,
          message: validation.valid ? 'Apps Script está respondendo corretamente' : validation.error,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: ApplyBulkUpdateRequest = await req.json();
    
    console.log('Validating Apps Script connection before applying update...');
    const validation = await validateAppsScript(APPS_SCRIPT_URL, APPS_SCRIPT_SECRET || '');
    
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ success: false, error: validation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Apps Script validated. Applying bulk update:', {
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

    const responseText = await response.text();
    
    // Parse response safely
    let result;
    try {
      result = JSON.parse(responseText);
    } catch {
      console.error('Invalid JSON response:', responseText.substring(0, 200));
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Apps Script retornou resposta inválida. Verifique a implantação do script.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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
