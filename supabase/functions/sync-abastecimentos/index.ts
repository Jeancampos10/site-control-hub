import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Format date to DD/MM/YYYY for Google Sheets
function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  } catch {
    return dateStr
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const appsScriptUrl = Deno.env.get('GOOGLE_APPS_SCRIPT_URL')
    const appsScriptSecret = Deno.env.get('GOOGLE_APPS_SCRIPT_SECRET')
    const spreadsheetId = Deno.env.get('ABASTECH_SPREADSHEET_ID')
    
    if (!appsScriptUrl) {
      return new Response(
        JSON.stringify({ 
          error: 'Google Apps Script URL not configured',
          hint: 'Configure GOOGLE_APPS_SCRIPT_URL secret'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { action, data, originalData } = await req.json()
    
    console.log(`Sync abastecimentos action: ${action}`, data)

    // Prepare row data for Google Sheets
    // Column order based on AbastecimentoCanteiro01 sheet structure
    const rowData = {
      Data: formatDate(data.data),
      Hora: data.hora || '',
      Tipo: data.tipo || '',
      Veiculo: data.veiculo,
      Potencia: data.potencia || '',
      Descricao: data.descricao || '',
      Motorista: data.motorista || '',
      Empresa: data.empresa || '',
      Obra: data.obra || '',
      Horimetro_Anterior_Eq: String(data.horimetro_anterior || 0),
      Horimetro_Atual_Eq: String(data.horimetro_atual || 0),
      Km_Anterior_Eq: String(data.km_anterior || 0),
      Km_Atual_Eq: String(data.km_atual || 0),
      Quantidade: String(data.quantidade_combustivel || 0),
      Tipo_Combustivel: data.tipo_combustivel || 'Diesel S10',
      Local: data.local_abastecimento || '',
      Arla: data.arla ? 'Sim' : 'Não',
      Quantidade_Arla: String(data.quantidade_arla || 0),
      Fornecedor: data.fornecedor || '',
      Nota_Fiscal: data.nota_fiscal || '',
      Valor_Unitario: String(data.valor_unitario || 0),
      Valor_Total: String(data.valor_total || 0),
      Localizacao: data.localizacao || '',
      Observacao: data.observacao || '',
      Lubrificar: data.lubrificacao ? 'Sim' : 'Não',
      TipoOleo: data.oleo || '',
      Sopra_Filtro: data.filtro || '',
    }

    // Build the request to Google Apps Script
    const payload = {
      action: action,
      sheet: 'AbastecimentoCanteiro01',
      spreadsheetId: spreadsheetId,
      data: rowData,
      searchKey: originalData ? {
        Data: formatDate(originalData.data),
        Veiculo: originalData.veiculo,
        Hora: originalData.hora || ''
      } : {
        Data: formatDate(data.data),
        Veiculo: data.veiculo,
        Hora: data.hora || ''
      },
      secret: appsScriptSecret
    }

    console.log('Sending to Apps Script:', JSON.stringify(payload, null, 2))

    const response = await fetch(appsScriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Apps Script error:', errorText)
      
      // Don't fail the whole operation if sync fails
      // Just log the error and return success with warning
      return new Response(
        JSON.stringify({ 
          success: true,
          synced: false,
          warning: 'Registro salvo localmente, mas sincronização com Sheets falhou',
          details: errorText
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const result = await response.json()
    console.log('Apps Script response:', result)

    return new Response(
      JSON.stringify({ 
        success: true,
        synced: true,
        message: `Abastecimento ${action === 'append' ? 'adicionado' : action === 'update' ? 'atualizado' : 'removido'} na planilha`,
        result
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: unknown) {
    console.error('Error in sync-abastecimentos:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    // Return success with warning - don't break the main operation
    return new Response(
      JSON.stringify({ 
        success: true,
        synced: false,
        warning: 'Registro salvo localmente, sincronização pendente',
        details: errorMessage 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
