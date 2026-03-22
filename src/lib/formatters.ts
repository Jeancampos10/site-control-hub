/**
 * Brazilian number formatting utilities
 * Formats numbers as: 4.250,40 (dot for thousands, comma for decimal)
 */

/** Format a number to Brazilian standard: 1.234,56 */
export function formatBR(value: number | null | undefined, decimals = 2): string {
  if (value == null || isNaN(value)) return '';
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/** Format currency in BRL: R$ 1.234,56 */
export function formatBRL(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return '';
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

/** Parse a Brazilian formatted string to number: "4.250,40" → 4250.40 */
export function parseBR(value: string): number | null {
  if (!value || !value.trim()) return null;
  // Remove dots (thousands), replace comma with dot (decimal)
  const cleaned = value.replace(/\./g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

/**
 * Auto-format input as user types numbers.
 * Input: "42504" → Output: "4.250,40" (when blur)
 * During typing, just allows digits and comma
 */
export function formatInputBR(raw: string): string {
  // Remove everything except digits and comma
  const clean = raw.replace(/[^\d,]/g, '');
  return clean;
}

/** Format on blur: takes raw digits and formats */
export function formatOnBlur(raw: string, decimals = 2): string {
  const num = parseBR(raw);
  if (num == null) return raw;
  return formatBR(num, decimals);
}

/** Validate that current value >= previous value */
export function validateNotLessThan(
  current: number | null,
  previous: number | null,
  fieldName: string
): string | null {
  if (current == null || previous == null) return null;
  if (current < previous) {
    return `${fieldName} atual (${formatBR(current)}) não pode ser menor que o anterior (${formatBR(previous)})`;
  }
  return null;
}

/** Calculate fuel consumption */
export function calcConsumo(
  tipo: 'veiculo' | 'equipamento',
  intervalo: number,
  litros: number
): number | null {
  if (!litros || litros <= 0 || !intervalo || intervalo <= 0) return null;
  if (tipo === 'veiculo') {
    // KM/L
    return intervalo / litros;
  } else {
    // L/h
    return litros / intervalo;
  }
}
