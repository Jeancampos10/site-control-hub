import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Parses a number string in pt-BR format (e.g., "1.234,56" or "55,52")
 * to a JavaScript number. Handles both comma and dot as decimal separators.
 */
export function parsePtBrNumber(value: string | undefined | null): number {
  if (!value) return 0;
  
  const cleaned = String(value).replace(/[^0-9,.\-]/g, "").trim();
  if (!cleaned) return 0;

  // pt-BR format uses comma as decimal separator
  // If comma exists, treat dots as thousand separators
  const normalized = cleaned.includes(",")
    ? cleaned.replace(/\./g, "").replace(",", ".")
    : cleaned;

  const num = parseFloat(normalized);
  return Number.isFinite(num) ? num : 0;
}
