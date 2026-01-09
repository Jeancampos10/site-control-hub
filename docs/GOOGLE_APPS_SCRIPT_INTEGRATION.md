# Integração com Google Apps Script

Este guia explica como configurar a integração para aplicar alterações em lote automaticamente na planilha Google Sheets.

## Passo 1: Criar o Google Apps Script

1. Acesse a planilha Google Sheets
2. Vá em **Extensões** → **Apps Script**
3. Cole o código abaixo e salve:

```javascript
// ===============================================
// CONFIGURAÇÃO
// ===============================================
const SPREADSHEET_ID = '1B9-SbnayFySlsITdRqn_2WJNnA9ZHhD0PWYka83581c';

// Token de segurança - Defina o mesmo valor na variável de ambiente GOOGLE_APPS_SCRIPT_SECRET
const AUTH_TOKEN = 'SEU_TOKEN_SECRETO_AQUI'; // Troque por um token seguro

// Mapeamento de nomes de sheets
const SHEET_NAMES = {
  'carga': 'Carga',
  'descarga': 'Descarga',
  'equipamentos': 'Equipamentos',
  'caminhao': 'Caminhao',
  'cam_reboque': 'Cam_Reboque',
  'caminhao_pipa': 'Caminhao_Pipa',
  'apontamento_pedreira': 'Apontamento_Pedreira',
  'apontamento_pipa': 'Apontamento_Pipa',
};

// ===============================================
// FUNÇÕES PRINCIPAIS
// ===============================================

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    // Verificar autenticação
    if (data.authToken !== AUTH_TOKEN) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'Não autorizado'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    const result = applyBulkUpdate(
      data.sheetName,
      data.dateFilter,
      data.filters,
      data.updates
    );
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'ok',
    message: 'ApropriAPP Bulk Update Service'
  })).setMimeType(ContentService.MimeType.JSON);
}

function applyBulkUpdate(sheetNameKey, dateFilter, filters, updates) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheetName = SHEET_NAMES[sheetNameKey] || sheetNameKey;
  const sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    return { success: false, error: `Sheet '${sheetName}' não encontrada` };
  }
  
  const dataRange = sheet.getDataRange();
  const allData = dataRange.getValues();
  
  if (allData.length < 2) {
    return { success: false, error: 'Planilha vazia ou sem dados' };
  }
  
  const headers = allData[0];
  let updatedCount = 0;
  
  // Encontrar índices das colunas
  const columnIndices = {};
  headers.forEach((header, index) => {
    columnIndices[header] = index;
  });
  
  // Encontrar índice da coluna de data
  const dateColumnIndex = columnIndices['Data'];
  if (dateColumnIndex === undefined && dateFilter) {
    return { success: false, error: 'Coluna "Data" não encontrada' };
  }
  
  // Processar cada linha
  for (let rowIndex = 1; rowIndex < allData.length; rowIndex++) {
    const row = allData[rowIndex];
    
    // Verificar filtro de data
    if (dateFilter) {
      const cellDate = formatDateForComparison(row[dateColumnIndex]);
      if (cellDate !== dateFilter) {
        continue;
      }
    }
    
    // Verificar outros filtros
    let matchesAllFilters = true;
    for (const [filterKey, filterValue] of Object.entries(filters)) {
      if (!filterValue || filterValue === '__all__') continue;
      
      const colIndex = columnIndices[filterKey];
      if (colIndex === undefined) continue;
      
      const cellValue = String(row[colIndex] || '').trim();
      if (cellValue !== filterValue) {
        matchesAllFilters = false;
        break;
      }
    }
    
    if (!matchesAllFilters) continue;
    
    // Aplicar atualizações
    let rowUpdated = false;
    for (const [updateKey, updateValue] of Object.entries(updates)) {
      const colIndex = columnIndices[updateKey];
      if (colIndex === undefined) continue;
      
      // Atualizar célula (rowIndex + 1 porque a planilha é 1-indexed)
      sheet.getRange(rowIndex + 1, colIndex + 1).setValue(updateValue);
      rowUpdated = true;
    }
    
    if (rowUpdated) {
      updatedCount++;
    }
  }
  
  return {
    success: true,
    updatedCount: updatedCount,
    message: `${updatedCount} registro(s) atualizado(s) com sucesso`
  };
}

function formatDateForComparison(date) {
  if (!date) return '';
  
  // Se já for string, retornar como está
  if (typeof date === 'string') {
    return date.trim();
  }
  
  // Se for objeto Date, formatar como DD/MM/YYYY
  if (date instanceof Date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }
  
  return String(date);
}

// ===============================================
// FUNÇÃO DE TESTE
// ===============================================
function testUpdate() {
  const result = applyBulkUpdate(
    'carga',
    '08/01/2025',
    { 'Prefixo_Cb': 'CB-29-ENG' },
    { 'Motorista': 'Teste Motorista' }
  );
  Logger.log(result);
}
```

## Passo 2: Implantar como Web App

1. No editor do Apps Script, clique em **Implantar** → **Nova implantação**
2. Selecione **Tipo** → **Aplicativo da Web**
3. Configure:
   - **Descrição**: "ApropriAPP Bulk Update"
   - **Executar como**: Eu mesmo
   - **Quem tem acesso**: Qualquer pessoa
4. Clique em **Implantar**
5. **Copie a URL** gerada (algo como `https://script.google.com/macros/s/XXX/exec`)

## Passo 3: Configurar os Secrets no Sistema

Adicione os seguintes secrets no Lovable:

1. **GOOGLE_APPS_SCRIPT_URL**: A URL do Web App (copiada no passo anterior)
2. **GOOGLE_APPS_SCRIPT_SECRET**: O mesmo token que você definiu no `AUTH_TOKEN` do script

## Passo 4: Testar

1. Acesse a página de Carga ou Descarga
2. Clique em "Editar Lote"
3. Selecione uma data e filtros
4. Defina as alterações
5. Salve
6. Acesse "Histórico"
7. Clique em "Aplicar na Planilha"
8. As alterações serão aplicadas automaticamente!

## Observações

- O script só pode alterar dados que o usuário tem permissão de editar na planilha
- As alterações são registradas no histórico para auditoria
- Em caso de erro, a alteração permanece como "Pendente" e pode ser reaplicada
