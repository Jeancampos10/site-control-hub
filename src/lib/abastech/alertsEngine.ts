// Intelligent Alerts Engine - Abastech Module

import { AbastecimentoRecord, EstoqueRecord, HorimetroRecord } from './sheetsDataTransform';

export type AlertSeverity = 'critical' | 'warning' | 'info';
export type AlertCategory = 'estoque' | 'consumo' | 'horimetro' | 'km' | 'manutencao';

export interface Alert {
  id: string;
  category: AlertCategory;
  severity: AlertSeverity;
  title: string;
  message: string;
  veiculo?: string;
  value?: number;
  average?: number;
  deviation?: number;
  timestamp: Date;
}

interface VehicleStats {
  veiculo: string;
  totalConsumo: number;
  abastecimentos: number;
  mediaConsumo: number;
  consumos: number[];
  horimetros: { anterior: number; atual: number; diff: number }[];
  kms: { anterior: number; atual: number; diff: number }[];
}

const ALERT_CONFIG = {
  estoque: {
    dieselCritical: 5000,
    dieselWarning: 10000,
    arlaCritical: 500,
    arlaWarning: 1000,
  },
  consumo: {
    deviationThreshold: 0.3,
    minSamples: 3,
  },
  horimetro: {
    maxDailyHours: 24,
    unusualHoursThreshold: 0.4,
    negativeDiff: true,
  },
  km: {
    unusualKmThreshold: 0.5,
  },
};

function calculateVehicleStats(abastecimentos: AbastecimentoRecord[]): Map<string, VehicleStats> {
  const vehicleMap = new Map<string, VehicleStats>();

  abastecimentos.forEach(item => {
    if (!item.veiculo) return;

    if (!vehicleMap.has(item.veiculo)) {
      vehicleMap.set(item.veiculo, {
        veiculo: item.veiculo,
        totalConsumo: 0,
        abastecimentos: 0,
        mediaConsumo: 0,
        consumos: [],
        horimetros: [],
        kms: [],
      });
    }

    const stats = vehicleMap.get(item.veiculo)!;
    stats.totalConsumo += item.quantidadeCombustivel;
    stats.abastecimentos += 1;
    stats.consumos.push(item.quantidadeCombustivel);

    if (item.horimetroAnterior > 0 && item.horimetroAtual > 0) {
      stats.horimetros.push({
        anterior: item.horimetroAnterior,
        atual: item.horimetroAtual,
        diff: item.horimetroAtual - item.horimetroAnterior,
      });
    }

    if (item.kmAnterior > 0 && item.kmAtual > 0) {
      stats.kms.push({
        anterior: item.kmAnterior,
        atual: item.kmAtual,
        diff: item.kmAtual - item.kmAnterior,
      });
    }
  });

  vehicleMap.forEach(stats => {
    if (stats.consumos.length > 0) {
      stats.mediaConsumo = stats.totalConsumo / stats.abastecimentos;
    }
  });

  return vehicleMap;
}

export function generateStockAlerts(estoqueData: EstoqueRecord[]): Alert[] {
  const alerts: Alert[] = [];
  
  let dieselTotal = 0;
  let arlaTotal = 0;

  estoqueData.forEach(item => {
    const produto = item.produto.toLowerCase();
    if (produto.includes('diesel') || produto.includes('s10') || produto.includes('s-10')) {
      dieselTotal += item.quantidade;
    } else if (produto.includes('arla')) {
      arlaTotal += item.quantidade;
    }

    if (item.minimo > 0 && item.quantidade < item.minimo) {
      alerts.push({
        id: `stock-min-${item.id}`,
        category: 'estoque',
        severity: item.quantidade < item.minimo * 0.5 ? 'critical' : 'warning',
        title: `${item.produto} abaixo do mínimo`,
        message: `${item.local}: ${item.quantidade} ${item.unidade} (mínimo: ${item.minimo} ${item.unidade})`,
        value: item.quantidade,
        average: item.minimo,
        timestamp: new Date(),
      });
    }
  });

  if (dieselTotal > 0) {
    if (dieselTotal < ALERT_CONFIG.estoque.dieselCritical) {
      alerts.push({
        id: 'stock-diesel-critical',
        category: 'estoque',
        severity: 'critical',
        title: 'Estoque Diesel Crítico',
        message: `Estoque total de diesel: ${dieselTotal.toLocaleString()} L - Necessário reabastecimento urgente`,
        value: dieselTotal,
        average: ALERT_CONFIG.estoque.dieselCritical,
        timestamp: new Date(),
      });
    } else if (dieselTotal < ALERT_CONFIG.estoque.dieselWarning) {
      alerts.push({
        id: 'stock-diesel-warning',
        category: 'estoque',
        severity: 'warning',
        title: 'Estoque Diesel Baixo',
        message: `Estoque total de diesel: ${dieselTotal.toLocaleString()} L - Considere reabastecer`,
        value: dieselTotal,
        average: ALERT_CONFIG.estoque.dieselWarning,
        timestamp: new Date(),
      });
    }
  }

  if (arlaTotal > 0) {
    if (arlaTotal < ALERT_CONFIG.estoque.arlaCritical) {
      alerts.push({
        id: 'stock-arla-critical',
        category: 'estoque',
        severity: 'critical',
        title: 'Estoque Arla Crítico',
        message: `Estoque total de Arla: ${arlaTotal.toLocaleString()} L - Necessário reabastecimento urgente`,
        value: arlaTotal,
        average: ALERT_CONFIG.estoque.arlaCritical,
        timestamp: new Date(),
      });
    } else if (arlaTotal < ALERT_CONFIG.estoque.arlaWarning) {
      alerts.push({
        id: 'stock-arla-warning',
        category: 'estoque',
        severity: 'warning',
        title: 'Estoque Arla Baixo',
        message: `Estoque total de Arla: ${arlaTotal.toLocaleString()} L - Considere reabastecer`,
        value: arlaTotal,
        average: ALERT_CONFIG.estoque.arlaWarning,
        timestamp: new Date(),
      });
    }
  }

  return alerts;
}

export function generateConsumptionAlerts(abastecimentos: AbastecimentoRecord[]): Alert[] {
  const alerts: Alert[] = [];
  const vehicleStats = calculateVehicleStats(abastecimentos);

  vehicleStats.forEach((stats, veiculo) => {
    if (stats.consumos.length < ALERT_CONFIG.consumo.minSamples) return;

    const lastConsumo = stats.consumos[stats.consumos.length - 1];
    const deviationPercent = Math.abs(lastConsumo - stats.mediaConsumo) / stats.mediaConsumo;

    if (lastConsumo > stats.mediaConsumo * (1 + ALERT_CONFIG.consumo.deviationThreshold)) {
      alerts.push({
        id: `consumo-high-${veiculo}`,
        category: 'consumo',
        severity: deviationPercent > 0.5 ? 'critical' : 'warning',
        title: `Consumo elevado: ${veiculo}`,
        message: `Último abastecimento: ${lastConsumo.toFixed(0)}L (média: ${stats.mediaConsumo.toFixed(0)}L) - Desvio de ${(deviationPercent * 100).toFixed(0)}%`,
        veiculo,
        value: lastConsumo,
        average: stats.mediaConsumo,
        deviation: deviationPercent,
        timestamp: new Date(),
      });
    }

    if (lastConsumo < stats.mediaConsumo * (1 - ALERT_CONFIG.consumo.deviationThreshold) && stats.mediaConsumo > 50) {
      alerts.push({
        id: `consumo-low-${veiculo}`,
        category: 'consumo',
        severity: 'info',
        title: `Consumo abaixo da média: ${veiculo}`,
        message: `Último abastecimento: ${lastConsumo.toFixed(0)}L (média: ${stats.mediaConsumo.toFixed(0)}L) - Desvio de ${(deviationPercent * 100).toFixed(0)}%`,
        veiculo,
        value: lastConsumo,
        average: stats.mediaConsumo,
        deviation: deviationPercent,
        timestamp: new Date(),
      });
    }
  });

  return alerts;
}

export function generateHorimeterAlerts(abastecimentos: AbastecimentoRecord[]): Alert[] {
  const alerts: Alert[] = [];
  const vehicleStats = calculateVehicleStats(abastecimentos);

  vehicleStats.forEach((stats, veiculo) => {
    if (stats.horimetros.length < 2) return;

    const diffs = stats.horimetros.map(h => h.diff).filter(d => d >= 0);
    if (diffs.length < 2) return;

    const avgDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length;
    const lastDiff = stats.horimetros[stats.horimetros.length - 1].diff;

    if (lastDiff < 0) {
      alerts.push({
        id: `horimetro-negative-${veiculo}`,
        category: 'horimetro',
        severity: 'critical',
        title: `Horímetro negativo: ${veiculo}`,
        message: `Diferença negativa detectada: ${lastDiff.toFixed(0)}h - Verificar leitura ou possível erro`,
        veiculo,
        value: lastDiff,
        average: avgDiff,
        timestamp: new Date(),
      });
      return;
    }

    if (lastDiff > ALERT_CONFIG.horimetro.maxDailyHours) {
      alerts.push({
        id: `horimetro-excessive-${veiculo}`,
        category: 'horimetro',
        severity: 'warning',
        title: `Horímetro excessivo: ${veiculo}`,
        message: `Intervalo de ${lastDiff.toFixed(0)}h detectado - Acima do limite diário de ${ALERT_CONFIG.horimetro.maxDailyHours}h`,
        veiculo,
        value: lastDiff,
        average: avgDiff,
        timestamp: new Date(),
      });
    }

    const deviationPercent = Math.abs(lastDiff - avgDiff) / avgDiff;
    if (deviationPercent > ALERT_CONFIG.horimetro.unusualHoursThreshold && avgDiff > 0) {
      const isHigh = lastDiff > avgDiff;
      alerts.push({
        id: `horimetro-deviation-${veiculo}`,
        category: 'horimetro',
        severity: 'info',
        title: `Horímetro ${isHigh ? 'acima' : 'abaixo'} da média: ${veiculo}`,
        message: `Intervalo: ${lastDiff.toFixed(0)}h (média: ${avgDiff.toFixed(0)}h) - Desvio de ${(deviationPercent * 100).toFixed(0)}%`,
        veiculo,
        value: lastDiff,
        average: avgDiff,
        deviation: deviationPercent,
        timestamp: new Date(),
      });
    }
  });

  return alerts;
}

export function generateKmAlerts(abastecimentos: AbastecimentoRecord[]): Alert[] {
  const alerts: Alert[] = [];
  const vehicleStats = calculateVehicleStats(abastecimentos);

  vehicleStats.forEach((stats, veiculo) => {
    if (stats.kms.length < 2) return;

    const diffs = stats.kms.map(k => k.diff).filter(d => d >= 0);
    if (diffs.length < 2) return;

    const avgDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length;
    const lastDiff = stats.kms[stats.kms.length - 1].diff;

    if (lastDiff < 0) {
      alerts.push({
        id: `km-negative-${veiculo}`,
        category: 'km',
        severity: 'critical',
        title: `KM negativo: ${veiculo}`,
        message: `Diferença negativa detectada: ${lastDiff.toFixed(0)} km - Verificar leitura`,
        veiculo,
        value: lastDiff,
        average: avgDiff,
        timestamp: new Date(),
      });
      return;
    }

    const deviationPercent = Math.abs(lastDiff - avgDiff) / avgDiff;
    if (deviationPercent > ALERT_CONFIG.km.unusualKmThreshold && avgDiff > 0) {
      const isHigh = lastDiff > avgDiff;
      alerts.push({
        id: `km-deviation-${veiculo}`,
        category: 'km',
        severity: isHigh ? 'warning' : 'info',
        title: `KM ${isHigh ? 'acima' : 'abaixo'} da média: ${veiculo}`,
        message: `Intervalo: ${lastDiff.toFixed(0)} km (média: ${avgDiff.toFixed(0)} km) - Desvio de ${(deviationPercent * 100).toFixed(0)}%`,
        veiculo,
        value: lastDiff,
        average: avgDiff,
        deviation: deviationPercent,
        timestamp: new Date(),
      });
    }
  });

  return alerts;
}

export function generateHorimeterDataAlerts(horimetros: HorimetroRecord[]): Alert[] {
  const alerts: Alert[] = [];
  
  const vehicleMap = new Map<string, HorimetroRecord[]>();
  horimetros.forEach(h => {
    if (!vehicleMap.has(h.veiculo)) {
      vehicleMap.set(h.veiculo, []);
    }
    vehicleMap.get(h.veiculo)!.push(h);
  });

  vehicleMap.forEach((records, veiculo) => {
    const errorRecords = records.filter(r => r.status === 'error');
    if (errorRecords.length > 0) {
      alerts.push({
        id: `horimetro-data-error-${veiculo}`,
        category: 'horimetro',
        severity: 'critical',
        title: `Erro no horímetro: ${veiculo}`,
        message: `${errorRecords.length} registro(s) com erro - Verificar leituras`,
        veiculo,
        timestamp: new Date(),
      });
    }

    const warningRecords = records.filter(r => r.status === 'warning');
    if (warningRecords.length > 0) {
      alerts.push({
        id: `horimetro-data-warning-${veiculo}`,
        category: 'horimetro',
        severity: 'warning',
        title: `Horímetro com alerta: ${veiculo}`,
        message: `${warningRecords.length} registro(s) com baixa utilização`,
        veiculo,
        timestamp: new Date(),
      });
    }

    const validRecords = records.filter(r => r.trabalhadas >= 0);
    if (validRecords.length >= 3) {
      const avgTrabalhadas = validRecords.reduce((a, b) => a + b.trabalhadas, 0) / validRecords.length;
      const lastRecord = validRecords[validRecords.length - 1];
      
      if (lastRecord.trabalhadas > avgTrabalhadas * 1.5) {
        alerts.push({
          id: `horimetro-data-high-${veiculo}`,
          category: 'horimetro',
          severity: 'info',
          title: `Horas acima da média: ${veiculo}`,
          message: `Último: ${lastRecord.trabalhadas.toFixed(0)}h (média: ${avgTrabalhadas.toFixed(0)}h)`,
          veiculo,
          value: lastRecord.trabalhadas,
          average: avgTrabalhadas,
          timestamp: new Date(),
        });
      }
    }
  });

  return alerts;
}

interface HorimetroDBRecord {
  id: string;
  veiculo: string;
  data: string;
  horimetro_anterior: number;
  horimetro_atual: number;
  horas_trabalhadas: number | null;
}

export function generateZeroHorimeterAlerts(horimetrosDB: HorimetroDBRecord[]): Alert[] {
  const alerts: Alert[] = [];
  
  const zeroRecords = horimetrosDB.filter(
    h => h.horimetro_anterior === 0 && h.horimetro_atual === 0
  );

  if (zeroRecords.length > 0) {
    const vehicleMap = new Map<string, number>();
    zeroRecords.forEach(h => {
      vehicleMap.set(h.veiculo, (vehicleMap.get(h.veiculo) || 0) + 1);
    });

    alerts.push({
      id: 'horimetro-zero-records',
      category: 'horimetro',
      severity: zeroRecords.length > 10 ? 'critical' : 'warning',
      title: `${zeroRecords.length} horímetros zerados`,
      message: `Existem registros com valores zerados que precisam ser corrigidos. Veículos afetados: ${vehicleMap.size}`,
      value: zeroRecords.length,
      timestamp: new Date(),
    });

    vehicleMap.forEach((count, veiculo) => {
      if (count >= 3) {
        alerts.push({
          id: `horimetro-zero-${veiculo}`,
          category: 'horimetro',
          severity: 'warning',
          title: `Horímetros zerados: ${veiculo}`,
          message: `${count} registro(s) com valores zerados`,
          veiculo,
          value: count,
          timestamp: new Date(),
        });
      }
    });
  }

  return alerts;
}

export function generateAllAlerts(
  abastecimentos: AbastecimentoRecord[],
  estoqueData: EstoqueRecord[],
  horimetros?: HorimetroRecord[]
): Alert[] {
  const allAlerts: Alert[] = [];

  allAlerts.push(...generateStockAlerts(estoqueData));
  allAlerts.push(...generateConsumptionAlerts(abastecimentos));
  allAlerts.push(...generateHorimeterAlerts(abastecimentos));
  allAlerts.push(...generateKmAlerts(abastecimentos));

  if (horimetros && horimetros.length > 0) {
    allAlerts.push(...generateHorimeterDataAlerts(horimetros));
  }

  const severityOrder = { critical: 0, warning: 1, info: 2 };
  allAlerts.sort((a, b) => {
    const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (severityDiff !== 0) return severityDiff;
    return b.timestamp.getTime() - a.timestamp.getTime();
  });

  return allAlerts;
}
