// Transform data from Google Sheets Abastech to typed records

export interface VeiculoRecord {
  codigo: string;
  tipo: string;
  placa: string;
  motorista: string;
  obra: string;
  horimetro: number;
  status: string;
}

export interface HorimetroRecord {
  data: string;
  veiculo: string;
  anterior: number;
  atual: number;
  trabalhadas: number;
  operador: string;
  obra: string;
}

export interface AbastecimentoRecord {
  data: string;
  hora: string;
  veiculo: string;
  combustivel: string;
  quantidade: number;
  valor: number;
  operador: string;
  km_horimetro: number;
  observacao: string;
}

export interface EstoqueRecord {
  data: string;
  produto: string;
  quantidade: number;
  unidade: string;
  local: string;
}

// Transform Veiculos sheet data
export function transformVeiculosData(data: Record<string, string>[]): VeiculoRecord[] {
  return data.map(row => ({
    codigo: row['Codigo'] || row['Prefixo'] || row['CODIGO'] || row['codigo'] || '',
    tipo: row['Tipo'] || row['Descricao'] || row['TIPO'] || row['tipo'] || '',
    placa: row['Placa'] || row['PLACA'] || row['placa'] || '',
    motorista: row['Motorista'] || row['Operador'] || row['MOTORISTA'] || row['motorista'] || '',
    obra: row['Obra'] || row['Local'] || row['OBRA'] || row['obra'] || '',
    horimetro: parseFloat(row['Horimetro'] || row['HORIMETRO'] || row['horimetro'] || row['Km'] || '0') || 0,
    status: row['Status'] || row['STATUS'] || row['status'] || 'Ativo',
  })).filter(v => v.codigo);
}

// Transform Horimetros sheet data
export function transformHorimetrosData(data: Record<string, string>[]): HorimetroRecord[] {
  return data.map(row => {
    const anterior = parseFloat(row['Anterior'] || row['Horimetro_Anterior'] || row['ANTERIOR'] || '0') || 0;
    const atual = parseFloat(row['Atual'] || row['Horimetro_Atual'] || row['ATUAL'] || '0') || 0;
    
    return {
      data: row['Data'] || row['DATA'] || row['data'] || '',
      veiculo: row['Veiculo'] || row['Codigo'] || row['Prefixo'] || row['VEICULO'] || '',
      anterior,
      atual,
      trabalhadas: atual - anterior,
      operador: row['Operador'] || row['Motorista'] || row['OPERADOR'] || '',
      obra: row['Obra'] || row['Local'] || row['OBRA'] || '',
    };
  }).filter(h => h.data && h.veiculo);
}

// Transform Abastecimento sheet data
export function transformAbastecimentoData(data: Record<string, string>[]): AbastecimentoRecord[] {
  return data.map(row => ({
    data: row['Data'] || row['DATA'] || '',
    hora: row['Hora'] || row['HORA'] || '',
    veiculo: row['Veiculo'] || row['Codigo'] || row['Prefixo'] || row['VEICULO'] || '',
    combustivel: row['Combustivel'] || row['Produto'] || row['COMBUSTIVEL'] || 'Diesel',
    quantidade: parseFloat(row['Quantidade'] || row['Litros'] || row['QUANTIDADE'] || '0') || 0,
    valor: parseFloat(row['Valor'] || row['Total'] || row['VALOR'] || '0') || 0,
    operador: row['Operador'] || row['Frentista'] || row['OPERADOR'] || '',
    km_horimetro: parseFloat(row['Km'] || row['Horimetro'] || row['KM'] || '0') || 0,
    observacao: row['Observacao'] || row['Obs'] || row['OBSERVACAO'] || '',
  })).filter(a => a.data && a.veiculo);
}

// Transform Estoque sheet data
export function transformEstoqueData(data: Record<string, string>[]): EstoqueRecord[] {
  return data.map(row => ({
    data: row['Data'] || row['DATA'] || '',
    produto: row['Produto'] || row['Descricao'] || row['PRODUTO'] || '',
    quantidade: parseFloat(row['Quantidade'] || row['Qtd'] || row['QUANTIDADE'] || '0') || 0,
    unidade: row['Unidade'] || row['Und'] || row['UNIDADE'] || 'L',
    local: row['Local'] || row['Canteiro'] || row['LOCAL'] || '',
  })).filter(e => e.produto);
}
