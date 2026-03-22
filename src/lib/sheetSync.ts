import { supabase } from "@/integrations/supabase/client";

/**
 * Column mappings for each sheet tab.
 * Order must match the spreadsheet columns exactly.
 */
const SHEET_MAPPINGS = {
  Frota: {
    sheetName: 'Frota',
    columns: ['Codigo', 'Motorista', 'Potencia', 'Categoria', 'Descricao', 'Empresa', 'Obra', 'Status'],
    mapRow: (row: any) => [
      row.codigo || '',
      row.motorista || '',
      row.potencia || '',
      row.categoria || '',
      row.descricao || '',
      row.empresa || '',
      row.obra || '',
      row.status || 'Mobilizado',
    ],
    idColumn: 'Codigo',
    idField: 'codigo',
  },
  Horimetros: {
    sheetName: 'Horimetros',
    columns: ['Data', 'Veiculo', 'Categoria', 'Descricao', 'Empresa', 'Operador', 'Horimetro Anterior', 'Horimetro Atual', 'Intervalo H', 'Km Anterior', 'Km Atual', 'Total Km'],
    mapRow: (row: any) => [
      row.data || '',
      row.veiculo || '',
      '', // Categoria - filled from frota if available
      row.descricao_veiculo || '',
      '', // Empresa
      row.operador || '',
      String(row.horimetro_anterior ?? ''),
      String(row.horimetro_atual ?? ''),
      String(row.horas_trabalhadas ?? ''),
      '', // Km Anterior
      '', // Km Atual
      '', // Total Km
    ],
    idColumn: null, // use row matching by Data+Veiculo
    idField: 'id',
  },
  Abastecimentos: {
    sheetName: 'Abastecimentos',
    columns: ['Data', 'Hora', 'Veiculo', 'Tipo', 'Potencia', 'Descricao', 'Motorista', 'Empresa', 'Obra', 'Local', 'Horimetro Anterior', 'Horimetro Atual', 'Km Anterior', 'Km Atual', 'Litros', 'Combustivel', 'Arla', 'Qtd Arla', 'Fornecedor', 'NF', 'Valor Unit', 'Valor Total', 'Observacao'],
    mapRow: (row: any) => [
      row.data || '',
      row.hora || '',
      row.veiculo || '',
      row.tipo || '',
      row.potencia || '',
      row.descricao || '',
      row.motorista || '',
      row.empresa || '',
      row.obra || '',
      row.local_abastecimento || '',
      String(row.horimetro_anterior ?? ''),
      String(row.horimetro_atual ?? ''),
      String(row.km_anterior ?? ''),
      String(row.km_atual ?? ''),
      String(row.quantidade_combustivel ?? row.quantidade ?? ''),
      row.tipo_combustivel || '',
      row.arla ? 'Sim' : 'Não',
      String(row.quantidade_arla ?? ''),
      row.fornecedor || '',
      row.nota_fiscal || '',
      String(row.valor_unitario ?? ''),
      String(row.valor_total ?? ''),
      row.observacao || '',
    ],
    idColumn: null,
    idField: 'id',
  },
  Manutencoes: {
    sheetName: 'Manutencoes',
    columns: ['Data', 'Veiculo', 'Empresa', 'Motorista', 'Potencia', 'Problema', 'Servico', 'Mecanico', 'Data_Entrada', 'Data_Saida', 'Hora_Entrada', 'Hora_Saida', 'Horas_Parado', 'Observacao', 'Status'],
    mapRow: (row: any) => [
      row.data_abertura || '',
      row.veiculo || '',
      '', // Empresa
      row.motorista_operador || '',
      '', // Potencia
      row.problema_relatado || '',
      row.solucao_aplicada || '',
      row.mecanico_responsavel || '',
      row.data_abertura || '',
      row.data_fechamento || '',
      '', // Hora_Entrada
      '', // Hora_Saida
      String(row.tempo_real_horas ?? ''),
      row.observacoes || '',
      row.status || '',
    ],
    idColumn: null,
    idField: 'id',
  },
} as const;

type SheetKey = keyof typeof SHEET_MAPPINGS;

/**
 * Sync a record to Google Sheets (append, update, or delete).
 * Fire-and-forget: errors are logged but don't block the main flow.
 */
export async function syncToSheet(
  table: SheetKey,
  action: 'append' | 'update' | 'delete',
  data?: any,
  identifierValue?: string,
) {
  const mapping = SHEET_MAPPINGS[table];
  if (!mapping) {
    console.warn(`No sheet mapping for table: ${table}`);
    return;
  }

  try {
    const body: any = {
      action,
      sheetName: mapping.sheetName,
    };

    if (action === 'append' && data) {
      body.rowData = mapping.mapRow(data);
    }

    if (action === 'update' && data) {
      body.rowData = mapping.mapRow(data);
      body.rowId = identifierValue || (data[mapping.idField] ?? '');
      body.idColumn = mapping.idColumn || mapping.columns[0]; // fallback to first column
    }

    if (action === 'delete') {
      body.rowId = identifierValue;
      body.idColumn = mapping.idColumn || mapping.columns[0];
    }

    console.log(`[SheetSync] ${action} -> ${mapping.sheetName}`, body);

    const { error } = await supabase.functions.invoke('google-sheets-append', { body });

    if (error) {
      console.warn(`[SheetSync] Failed ${action} on ${mapping.sheetName}:`, error.message);
    }
  } catch (err) {
    console.warn(`[SheetSync] Error syncing to ${mapping.sheetName}:`, err);
  }
}
