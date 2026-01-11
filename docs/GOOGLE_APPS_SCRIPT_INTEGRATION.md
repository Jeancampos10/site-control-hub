# Integração CRUD com Google Apps Script

Este guia explica como configurar a integração completa (Criar, Ler, Editar, Deletar) com Google Sheets via Apps Script.

## Configuração Necessária

### Secrets no Sistema
Os seguintes secrets devem estar configurados:

1. **ABASTECH_SPREADSHEET_ID**: ID da planilha de abastecimentos
   - Valor: `1hVYuTc3L1Isj3k-ZkQ_3Y6JOhjWLtzTB1-g0vN6FcHg`
2. **GOOGLE_APPS_SCRIPT_URL**: URL do Web App
3. **GOOGLE_APPS_SCRIPT_SECRET**: Token de autenticação

---

## Passo 1: Criar o Google Apps Script

1. Acesse a planilha: https://docs.google.com/spreadsheets/d/1hVYuTc3L1Isj3k-ZkQ_3Y6JOhjWLtzTB1-g0vN6FcHg
2. Vá em **Extensões** → **Apps Script**
3. Substitua todo o código pelo seguinte:

```javascript
// ===============================================
// CONFIGURAÇÃO
// ===============================================
const SPREADSHEET_ID = '1hVYuTc3L1Isj3k-ZkQ_3Y6JOhjWLtzTB1-g0vN6FcHg';

// Token de segurança - Configure o mesmo valor no secret GOOGLE_APPS_SCRIPT_SECRET
const AUTH_TOKEN = 'SEU_TOKEN_SECRETO_AQUI'; // TROQUE POR UM TOKEN SEGURO!

// ===============================================
// HANDLER PRINCIPAL
// ===============================================

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    // Verificar autenticação
    if (data.authToken !== AUTH_TOKEN) {
      return jsonResponse({ success: false, error: 'Não autorizado' });
    }
    
    const action = data.action;
    const sheetName = data.sheetName;
    const spreadsheetId = data.spreadsheetId || SPREADSHEET_ID;
    
    Logger.log(`Action: ${action}, Sheet: ${sheetName}`);
    
    let result;
    
    switch (action) {
      case 'append':
        result = appendRow(spreadsheetId, sheetName, data.rowData);
        break;
        
      case 'update':
        result = updateRow(spreadsheetId, sheetName, data.rowId, data.rowData, data.idColumn || 1);
        break;
        
      case 'delete':
        result = deleteRow(spreadsheetId, sheetName, data.rowId, data.idColumn || 1);
        break;
        
      case 'bulkUpdate':
        result = bulkUpdate(spreadsheetId, sheetName, data.filters, data.updates, data.dateFilter);
        break;
        
      default:
        result = { success: false, error: `Ação desconhecida: ${action}` };
    }
    
    return jsonResponse(result);
    
  } catch (error) {
    Logger.log(`Error: ${error.toString()}`);
    return jsonResponse({ success: false, error: error.toString() });
  }
}

function doGet(e) {
  return jsonResponse({
    status: 'ok',
    message: 'ApropriAPP CRUD Service',
    version: '2.0',
    actions: ['append', 'update', 'delete', 'bulkUpdate']
  });
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ===============================================
// OPERAÇÕES CRUD
// ===============================================

/**
 * Adiciona uma nova linha na planilha
 */
function appendRow(spreadsheetId, sheetName, rowData) {
  const ss = SpreadsheetApp.openById(spreadsheetId);
  const sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    return { success: false, error: `Planilha '${sheetName}' não encontrada` };
  }
  
  // Adiciona a linha no final
  sheet.appendRow(rowData);
  
  const lastRow = sheet.getLastRow();
  
  return {
    success: true,
    message: 'Registro adicionado com sucesso',
    row: lastRow,
    id: rowData[0] // Assume que o ID está na primeira coluna
  };
}

/**
 * Atualiza uma linha existente pelo ID
 */
function updateRow(spreadsheetId, sheetName, rowId, rowData, idColumn) {
  const ss = SpreadsheetApp.openById(spreadsheetId);
  const sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    return { success: false, error: `Planilha '${sheetName}' não encontrada` };
  }
  
  const dataRange = sheet.getDataRange();
  const allData = dataRange.getValues();
  
  // Encontrar a linha pelo ID
  let rowIndex = -1;
  for (let i = 1; i < allData.length; i++) { // Começa em 1 para pular header
    if (String(allData[i][idColumn - 1]).trim() === String(rowId).trim()) {
      rowIndex = i + 1; // +1 porque sheets é 1-indexed
      break;
    }
  }
  
  if (rowIndex === -1) {
    return { success: false, error: `Registro com ID '${rowId}' não encontrado` };
  }
  
  // Atualizar toda a linha
  const range = sheet.getRange(rowIndex, 1, 1, rowData.length);
  range.setValues([rowData]);
  
  return {
    success: true,
    message: 'Registro atualizado com sucesso',
    row: rowIndex,
    id: rowId
  };
}

/**
 * Deleta uma linha pelo ID
 */
function deleteRow(spreadsheetId, sheetName, rowId, idColumn) {
  const ss = SpreadsheetApp.openById(spreadsheetId);
  const sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    return { success: false, error: `Planilha '${sheetName}' não encontrada` };
  }
  
  const dataRange = sheet.getDataRange();
  const allData = dataRange.getValues();
  
  // Encontrar a linha pelo ID
  let rowIndex = -1;
  for (let i = 1; i < allData.length; i++) {
    if (String(allData[i][idColumn - 1]).trim() === String(rowId).trim()) {
      rowIndex = i + 1;
      break;
    }
  }
  
  if (rowIndex === -1) {
    return { success: false, error: `Registro com ID '${rowId}' não encontrado` };
  }
  
  // Deletar a linha
  sheet.deleteRow(rowIndex);
  
  return {
    success: true,
    message: 'Registro excluído com sucesso',
    id: rowId
  };
}

/**
 * Atualização em lote com filtros
 */
function bulkUpdate(spreadsheetId, sheetName, filters, updates, dateFilter) {
  const ss = SpreadsheetApp.openById(spreadsheetId);
  const sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    return { success: false, error: `Planilha '${sheetName}' não encontrada` };
  }
  
  const dataRange = sheet.getDataRange();
  const allData = dataRange.getValues();
  
  if (allData.length < 2) {
    return { success: false, error: 'Planilha vazia ou sem dados' };
  }
  
  const headers = allData[0];
  let updatedCount = 0;
  
  // Criar mapa de índices das colunas
  const columnIndices = {};
  headers.forEach((header, index) => {
    columnIndices[header] = index;
  });
  
  // Encontrar índice da coluna de data
  const dateColumnIndex = columnIndices['Data'];
  
  // Processar cada linha
  for (let rowIndex = 1; rowIndex < allData.length; rowIndex++) {
    const row = allData[rowIndex];
    
    // Verificar filtro de data
    if (dateFilter && dateColumnIndex !== undefined) {
      const cellDate = formatDateForComparison(row[dateColumnIndex]);
      if (cellDate !== dateFilter) {
        continue;
      }
    }
    
    // Verificar outros filtros
    let matchesAllFilters = true;
    if (filters) {
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
    }
    
    if (!matchesAllFilters) continue;
    
    // Aplicar atualizações
    let rowUpdated = false;
    if (updates) {
      for (const [updateKey, updateValue] of Object.entries(updates)) {
        const colIndex = columnIndices[updateKey];
        if (colIndex === undefined) continue;
        
        sheet.getRange(rowIndex + 1, colIndex + 1).setValue(updateValue);
        rowUpdated = true;
      }
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

// ===============================================
// FUNÇÕES AUXILIARES
// ===============================================

function formatDateForComparison(date) {
  if (!date) return '';
  
  if (date instanceof Date) {
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }
  
  if (typeof date === 'string') {
    return normalizeDate(date.trim());
  }
  
  return String(date);
}

function normalizeDate(dateStr) {
  const match = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (match) {
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const year = match[3];
    return `${day}/${month}/${year}`;
  }
  return dateStr;
}

// ===============================================
// FUNÇÕES DE TESTE
// ===============================================

function testAppend() {
  const result = appendRow(
    SPREADSHEET_ID,
    'AbastecimentoCanteiro01',
    ['test-id-123', '11/01/2026', '10:00:00', 'Saida', 'Equipamento', 'TEST-001', '100', 'Teste', 'Operador Teste', 'Empresa', 'Obra', '', '', '', '', '100', 'Diesel', 'Tanque 01', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']
  );
  Logger.log(result);
}

function testUpdate() {
  const result = updateRow(
    SPREADSHEET_ID,
    'AbastecimentoCanteiro01',
    'test-id-123',
    ['test-id-123', '11/01/2026', '10:30:00', 'Saida', 'Equipamento', 'TEST-001', '100', 'Teste Atualizado', 'Operador Teste', 'Empresa', 'Obra', '', '', '', '', '150', 'Diesel', 'Tanque 01', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
    1
  );
  Logger.log(result);
}

function testDelete() {
  const result = deleteRow(
    SPREADSHEET_ID,
    'AbastecimentoCanteiro01',
    'test-id-123',
    1
  );
  Logger.log(result);
}
```

---

## Passo 2: Implantar como Web App

1. No editor do Apps Script, clique em **Implantar** → **Nova implantação**
2. Clique em **Selecionar tipo** → **Aplicativo da Web**
3. Configure:
   - **Descrição**: "ApropriAPP CRUD v2.0"
   - **Executar como**: Eu mesmo
   - **Quem tem acesso**: Qualquer pessoa
4. Clique em **Implantar**
5. **Autorize** o acesso quando solicitado
6. **Copie a URL** gerada

---

## Passo 3: Configurar Secrets

No Lovable, configure (ou atualize) os seguintes secrets:

| Secret | Valor |
|--------|-------|
| `ABASTECH_SPREADSHEET_ID` | `1hVYuTc3L1Isj3k-ZkQ_3Y6JOhjWLtzTB1-g0vN6FcHg` |
| `GOOGLE_APPS_SCRIPT_URL` | URL copiada no passo anterior |
| `GOOGLE_APPS_SCRIPT_SECRET` | Mesmo token definido em `AUTH_TOKEN` no script |

---

## Estrutura das Abas

### AbastecimentoCanteiro01 / AbastecimentoCanteiro02
Colunas A até AI:
- A: IdAbastecimento
- B: Data
- C: Hora
- D: Tipo
- E: Categoria
- F: Veiculo
- G: Potencia
- H: Descricao
- I: Motorista
- J: Empresa
- K: Obra
- L: Horimetro_Anterior_Eq
- M: Horimetro_Atual_Eq
- N: Km_Anterior_Eq
- O: Km_Atual_Eq
- P: Quantidade
- Q: Tipo_Combustivel
- R: Local
- S: Arla
- T: Quantidade_Arla
- U: Fornecedor
- V: NotaFiscal
- W: ValorUnitario
- X: ValorTotal
- Y: Observacao
- Z: Foto_Bomba
- AA: Foto_Horimetro
- AB: Local_Entrada
- AC: Lubrificar
- AD: Lubrificante
- AE: CompletarOleo
- AF: TipoOleo
- AG: Qtd_Oleo
- AH: Sopra_Filtro

### AbastecimentoComboio01 / 02 / 03
Mesma estrutura dos tanques.

---

## Operações Disponíveis

### 1. Adicionar (append)
```javascript
{
  action: 'append',
  sheetName: 'AbastecimentoCanteiro01',
  rowData: ['id', 'data', 'hora', ...]
}
```

### 2. Atualizar (update)
```javascript
{
  action: 'update',
  sheetName: 'AbastecimentoCanteiro01',
  rowId: 'id-do-registro',
  rowData: ['id', 'data', 'hora', ...],
  idColumn: 1
}
```

### 3. Deletar (delete)
```javascript
{
  action: 'delete',
  sheetName: 'AbastecimentoCanteiro01',
  rowId: 'id-do-registro',
  idColumn: 1
}
```

### 4. Atualização em Lote (bulkUpdate)
```javascript
{
  action: 'bulkUpdate',
  sheetName: 'AbastecimentoCanteiro01',
  dateFilter: '11/01/2026',
  filters: { 'Veiculo': 'EC-21.4' },
  updates: { 'Motorista': 'Novo Nome' }
}
```

---

## Troubleshooting

### Erro "Não autorizado"
- Verifique se o `GOOGLE_APPS_SCRIPT_SECRET` está igual ao `AUTH_TOKEN` no script

### Erro "Planilha não encontrada"
- Verifique se o nome da aba está correto (case-sensitive)

### Alterações não aparecem
- Aguarde alguns segundos e atualize
- Verifique os logs no Apps Script (Execuções)
