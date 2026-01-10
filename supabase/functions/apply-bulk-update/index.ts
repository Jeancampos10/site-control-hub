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

function normalizeBrDate(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  const raw = String(dateStr).trim();
  const match = raw.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!match) return raw;
  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const year = match[3];
  return `${day}/${month}/${year}`;
}

function normalizeRecordValues(record: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(record || {})) {
    out[k] = String(v ?? '').trim();
  }
  return out;
}

async function validateAppsScript(url: string, _secret: string): Promise<{ valid: boolean; error?: string }> {
  try {
    console.log('Validating Apps Script URL:', url);

    // Use GET request for healthcheck since doGet doesn't require auth
    // Follow redirects explicitly (Google Apps Script uses 302 redirects)
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'Accept': 'application/json',
      },
    });

    console.log('Apps Script response status:', response.status);
    const text = await response.text();
    console.log('Apps Script response (first 200 chars):', text.substring(0, 200));

    // Check if response is HTML (error page)
    if (text.trim().startsWith('<!') || text.trim().startsWith('<html') || text.trim().startsWith('<HTML')) {
      return {
        valid: false,
        error: 'Apps Script retornou página HTML. Verifique se o script está implantado corretamente como Web App com acesso "Qualquer pessoa".',
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
        error: `Resposta inválida do Apps Script: ${text.substring(0, 100)}`,
      };
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Apps Script validation error:', errorMsg);
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
    const normalizedDate = normalizeBrDate(body.dateFilter);
    const normalizedFilters = normalizeRecordValues(body.filters);
    const normalizedUpdates = normalizeRecordValues(body.updates);
    
    const requestBody = {
      authToken: APPS_SCRIPT_SECRET,
      sheetName: body.sheetName,
      dateFilter: normalizedDate,
      filters: normalizedFilters,
      updates: normalizedUpdates,
    };
    
    console.log('Sending to Apps Script:', JSON.stringify(requestBody, null, 2));
    
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      redirect: 'follow',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await response.text();
    console.log('Apps Script POST response:', responseText.substring(0, 500));
    
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
