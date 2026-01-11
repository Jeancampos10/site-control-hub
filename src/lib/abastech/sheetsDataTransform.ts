// Transform raw Google Sheets data to typed objects - Abastech Module

export interface AbastecimentoRecord {
  id: string;
  data: string;
  hora: string;
  tipo: string;
  veiculo: string;
  potencia: string;
  descricao: string;
  motorista: string;
  empresa: string;
  obra: string;
  horimetroAnterior: number;
  horimetroAtual: number;
  kmAnterior: number;
  kmAtual: number;
  quantidadeCombustivel: number;
  tipoCombustivel: string;
  local: string;
  arla: boolean;
  quantidadeArla: number;
  fornecedor: string;
  notaFiscal: string;
  valorUnitario: number;
  valorTotal: number;
  localizacao: string;
  observacao: string;
  fotos: string;
  lubrificacao: boolean;
  oleo: string;
  filtro: string;
}

export interface VeiculoRecord {
  id: string;
  codigo: string;
  tipo: string;
  categoria: 'Veiculo' | 'Equipamento' | 'Outros';
  marca: string;
  modelo: string;
  potencia: string;
  placa: string;
  ano: number;
  status: 'active' | 'inactive' | 'warning' | 'pending';
  statusLabel: string;
  horimetro: number;
  consumoMedio: number;
  obra: string;
  empresa: string;
  motorista: string;
}

export interface HorimetroRecord {
  id: string;
  data: string;
  veiculo: string;
  anterior: number;
  atual: number;
  trabalhadas: number;
  operador: string;
  obra: string;
  status: 'success' | 'warning' | 'error';
}

export interface EstoqueRecord {
  id: string;
  local: string;
  produto: string;
  quantidade: number;
  unidade: string;
  minimo: number;
  maximo: number;
  ultimaAtualizacao: string;
}

export interface GeralRecord {
  id: string;
  data: string;
  descricao: string;
  estoqueAnterior: number;
  estoqueAtual: number;
  entrada: number;
  saida: number;
  saidasComboios: number;
}

export interface OrdemServicoRecord {
  id: string;
  data: string;
  veiculo: string;
  tipo: string;
  descricao: string;
  responsavel: string;
  prioridade: string;
  status: 'pending' | 'success' | 'warning' | 'error';
  statusLabel: string;
  diasParado: number;
}

// Helper function to parse numbers safely
function parseNumber(value: string | undefined): number {
  if (!value) return 0;
  
  let cleaned = value.replace(/[^\d.,-]/g, '').trim();
  if (!cleaned) return 0;
  
  const hasComma = cleaned.includes(',');
  const hasDot = cleaned.includes('.');
  const dotCount = (cleaned.match(/\./g) || []).length;
  const commaCount = (cleaned.match(/,/g) || []).length;
  
  if (hasComma && hasDot) {
    const lastCommaPos = cleaned.lastIndexOf(',');
    const lastDotPos = cleaned.lastIndexOf('.');
    
    if (lastCommaPos > lastDotPos) {
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      cleaned = cleaned.replace(/,/g, '');
    }
  } else if (hasComma && !hasDot) {
    if (commaCount === 1) {
      cleaned = cleaned.replace(',', '.');
    } else {
      cleaned = cleaned.replace(/,/g, '');
    }
  } else if (hasDot && !hasComma) {
    if (dotCount > 1) {
      cleaned = cleaned.replace(/\./g, '');
    } else {
      const parts = cleaned.split('.');
      if (parts.length === 2) {
        const afterDot = parts[1];
        if (afterDot.length === 3 && parseInt(parts[0]) >= 1) {
          cleaned = cleaned.replace('.', '');
        }
      }
    }
  }
  
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function parseBoolean(value: string | undefined): boolean {
  if (!value) return false;
  return ['sim', 'yes', 'true', '1', 's'].includes(value.toLowerCase());
}

export function transformAbastecimentoData(rawData: Record<string, string>[]): AbastecimentoRecord[] {
  return rawData.map((row, index) => ({
    id: row['IdAbastecimento'] || String(index + 1),
    data: row['Data'] || row['data'] || '',
    hora: row['Hora'] || row['hora'] || '',
    tipo: row['Tipo'] || row['tipo'] || '',
    veiculo: row['Veiculo'] || row['veiculo'] || row['Veículo'] || '',
    potencia: row['Potencia'] || row['potencia'] || row['Potência'] || '',
    descricao: row['Descricao'] || row['descricao'] || row['Descrição'] || '',
    motorista: row['Motorista'] || row['motorista'] || '',
    empresa: row['Empresa'] || row['empresa'] || '',
    obra: row['Obra'] || row['obra'] || '',
    horimetroAnterior: parseNumber(row['Horimetro_Anterior_Eq'] || row['Horimetro_Anterior'] || row['horimetro_anterior']),
    horimetroAtual: parseNumber(row['Horimetro_Atual_Eq'] || row['Horimetro_Atual'] || row['horimetro_atual']),
    kmAnterior: parseNumber(row['Km_Anterior_Eq'] || row['Km_Anterior'] || row['km_anterior']),
    kmAtual: parseNumber(row['Km_Atual_Eq'] || row['Km_Atual'] || row['km_atual']),
    quantidadeCombustivel: parseNumber(row['Quantidade'] || row['Quantidade_Combustivel'] || row['quantidade_combustivel']),
    tipoCombustivel: row['Tipo_Combustivel'] || row['tipo_combustivel'] || row['Combustível'] || 'Diesel S10',
    local: row['Local'] || row['local'] || '',
    arla: parseBoolean(row['Arla'] || row['arla']),
    quantidadeArla: parseNumber(row['Quantidade_Arla'] || row['quantidade_arla']),
    fornecedor: row['Fornecedor'] || row['fornecedor'] || '',
    notaFiscal: row['NotaFiscal'] || row['Nota_Fiscal'] || row['nota_fiscal'] || '',
    valorUnitario: parseNumber(row['ValorUnitario'] || row['Valor_Unitario'] || row['valor_unitario']),
    valorTotal: parseNumber(row['ValorTotal'] || row['Valor_Total'] || row['valor_total']),
    localizacao: row['Localizacao'] || row['localizacao'] || row['Localização'] || '',
    observacao: row['Observacao'] || row['observacao'] || row['Observação'] || '',
    fotos: row['Foto_Bomba'] || row['Foto_Horimetro'] || row['Fotos'] || row['fotos'] || '',
    lubrificacao: parseBoolean(row['Lubrificar'] || row['Lubrificação'] || row['lubrificacao']),
    oleo: row['TipoOleo'] || row['Óleo'] || row['oleo'] || '',
    filtro: row['Sopra_Filtro'] || row['Filtro'] || row['filtro'] || '',
  }));
}

export function transformVeiculosData(rawData: Record<string, string>[]): VeiculoRecord[] {
  return rawData.map((row, index) => {
    const statusRaw = (row['Status'] || row['status'] || 'ativo').toLowerCase();
    let status: VeiculoRecord['status'] = 'active';
    let statusLabel = 'Ativo';
    
    if (statusRaw.includes('manut') || statusRaw.includes('parado')) {
      status = 'warning';
      statusLabel = 'Manutenção';
    } else if (statusRaw.includes('inativo') || statusRaw.includes('inoperante')) {
      status = 'inactive';
      statusLabel = 'Inativo';
    } else if (statusRaw.includes('aguard')) {
      status = 'pending';
      statusLabel = 'Aguardando';
    }
    
    const categoriaRaw = (row['Categoria'] || row['categoria'] || 'Equipamento').toLowerCase();
    let categoria: VeiculoRecord['categoria'] = 'Equipamento';
    if (categoriaRaw.includes('veiculo') || categoriaRaw.includes('veículo')) {
      categoria = 'Veiculo';
    } else if (categoriaRaw.includes('outro')) {
      categoria = 'Outros';
    }
    
    return {
      id: row['IdVeiculo'] || String(index + 1),
      codigo: row['Codigo'] || row['código'] || row['Código'] || `VEI-${index + 1}`,
      tipo: row['Descricao'] || row['descricao'] || row['Tipo'] || row['tipo'] || '',
      categoria,
      marca: row['Marca'] || row['marca'] || '',
      modelo: row['Modelo'] || row['modelo'] || '',
      potencia: row['Potencia'] || row['potencia'] || row['Potência'] || '',
      placa: row['Placa'] || row['placa'] || '-',
      ano: parseNumber(row['Ano'] || row['ano']) || 2020,
      status,
      statusLabel,
      horimetro: parseNumber(row['Horimetro'] || row['horimetro'] || row['Horímetro']),
      consumoMedio: parseNumber(row['Consumo_Teorico'] || row['Consumo_Medio'] || row['consumo_medio'] || row['ConsumoMedio']) || 0,
      obra: row['Obra'] || row['obra'] || '',
      empresa: row['Empresa'] || row['empresa'] || '',
      motorista: row['Motorista'] || row['motorista'] || '',
    };
  });
}

export function transformHorimetrosData(rawData: Record<string, string>[]): HorimetroRecord[] {
  return rawData.map((row, index) => {
    const anterior = parseNumber(
      row['Hor_Anterior'] || row['Horimetro_Anterior'] || row['Anterior'] || row['anterior']
    );
    const atual = parseNumber(
      row['Hor_Atual'] || row['Horimetro_Atual'] || row['Atual'] || row['atual']
    );
    const trabalhadas = atual - anterior;
    
    let status: HorimetroRecord['status'] = 'success';
    if (trabalhadas < 0) {
      status = 'error';
    } else if (trabalhadas < 10) {
      status = 'warning';
    }
    
    return {
      id: String(index + 1),
      data: row['Data'] || row['data'] || '',
      veiculo: row['Veiculo'] || row['veiculo'] || row['Veículo'] || '',
      anterior,
      atual,
      trabalhadas,
      operador: row['Operador'] || row['operador'] || row['Motorista'] || row['motorista'] || '',
      obra: row['Obra'] || row['obra'] || '',
      status,
    };
  });
}

export function transformEstoqueData(rawData: Record<string, string>[]): EstoqueRecord[] {
  return rawData.map((row, index) => ({
    id: String(index + 1),
    local: row['Local'] || row['local'] || '',
    produto: row['Produto'] || row['produto'] || row['Item'] || row['item'] || row['Descricao'] || '',
    quantidade: parseNumber(row['Quantidade'] || row['quantidade'] || row['Qtd'] || row['qtd'] || row['EstoqueAtual']),
    unidade: row['Unidade'] || row['unidade'] || 'L',
    minimo: parseNumber(row['Minimo'] || row['minimo'] || row['Mínimo']),
    maximo: parseNumber(row['Maximo'] || row['maximo'] || row['Máximo']),
    ultimaAtualizacao: row['Ultima_Atualizacao'] || row['ultima_atualizacao'] || row['Data'] || '',
  }));
}

export function transformGeralData(rawData: Record<string, string>[]): GeralRecord[] {
  return rawData.map((row, index) => ({
    id: String(index + 1),
    data: row['Data'] || row['data'] || '',
    descricao: row['Descricao'] || row['descricao'] || '',
    estoqueAnterior: parseNumber(row['EstoqueAnterior'] || row['Estoque_Anterior']),
    estoqueAtual: parseNumber(row['EstoqueAtual'] || row['Estoque_Atual']),
    entrada: parseNumber(row['Entrada'] || row['entrada']),
    saida: parseNumber(row['Saida'] || row['saida']),
    saidasComboios: parseNumber(
      row['Saidas_Para_Comboios'] ||
      row['Saídas_Para_Comboios'] ||
      row['Saida_Para_Comboios'] ||
      row['Saída_Para_Comboios'] ||
      row['SaidaParaComboios'] ||
      row['Saidas_Comboios'] ||
      row['saidas_comboios'] ||
      row['SaidasComboios'] ||
      row['Saidas_Comboio'] ||
      row['SaidasComboio'] ||
      row['Saida_Comboios'] ||
      row['SaidaComboios']
    ),
  }));
}

export interface EstoqueObraSaneamentoRecord {
  data: string;
  estoqueAnterior: number;
  saida: number;
  entrada: number;
  estoqueAtual: number;
}

export function transformEstoqueObraSaneamentoData(rawData: Record<string, string>[]): EstoqueObraSaneamentoRecord[] {
  return rawData.map((row) => ({
    data: row['Data'] || row['data'] || '',
    estoqueAnterior: parseNumber(row['Estoque Anterior'] || row['EstoqueAnterior'] || row['Estoque_Anterior']),
    saida: parseNumber(row['Saída'] || row['Saida'] || row['saida']),
    entrada: parseNumber(row['Entrada'] || row['entrada']),
    estoqueAtual: parseNumber(row['Estoque Atual'] || row['EstoqueAtual'] || row['Estoque_Atual']),
  }));
}

export function transformOrdemServicoData(rawData: Record<string, string>[]): OrdemServicoRecord[] {
  return rawData.map((row, index) => {
    const statusRaw = (row['Status'] || row['status'] || '').toLowerCase();
    let status: OrdemServicoRecord['status'] = 'pending';
    let statusLabel = 'Em Andamento';
    
    if (statusRaw.includes('finaliz') || statusRaw.includes('conclu')) {
      status = 'success';
      statusLabel = 'Finalizado';
    } else if (statusRaw.includes('aguard')) {
      status = 'warning';
      statusLabel = 'Aguardando Peças';
    } else if (statusRaw.includes('cancel')) {
      status = 'error';
      statusLabel = 'Cancelado';
    }
    
    return {
      id: row['ID'] || row['id'] || row['OS'] || row['Ordem'] || `OS-${String(index + 1).padStart(3, '0')}`,
      data: row['Data'] || row['data'] || '',
      veiculo: row['Veiculo'] || row['veiculo'] || row['Veículo'] || '',
      tipo: row['Tipo'] || row['tipo'] || 'Corretiva',
      descricao: row['Descricao'] || row['descricao'] || row['Descrição'] || '',
      responsavel: row['Responsavel'] || row['responsavel'] || row['Responsável'] || '',
      prioridade: row['Prioridade'] || row['prioridade'] || 'Média',
      status,
      statusLabel,
      diasParado: parseNumber(row['Dias_Parado'] || row['dias_parado'] || row['DiasParado']),
    };
  });
}
