import { useCallback } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface NumericInputProps {
  value: string;
  onChange: (value: string) => void;
  decimals?: number;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * Numeric input — user types only digits.
 * The component formats in real-time to Brazilian standard (1.234,56).
 * Last `decimals` digits are always after the comma.
 */
function formatRawDigits(raw: string, decimals: number): string {
  if (!raw) return "";
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";

  // Pad with leading zeros if needed
  const padded = digits.padStart(decimals + 1, "0");
  const intPart = padded.slice(0, padded.length - decimals);
  const decPart = padded.slice(padded.length - decimals);

  // Remove leading zeros from integer part (keep at least one digit)
  const intClean = intPart.replace(/^0+/, "") || "0";

  // Add thousand separators
  const intFormatted = intClean.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  return `${intFormatted},${decPart}`;
}

function toRawDigits(formatted: string): string {
  return formatted.replace(/\D/g, "");
}

export function NumericInput({ value, onChange, decimals = 2, placeholder = "0,00", className, disabled }: NumericInputProps) {
  const displayValue = value ? formatRawDigits(toRawDigits(value), decimals) : "";

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    // Store formatted value
    if (!raw) {
      onChange("");
      return;
    }
    onChange(formatRawDigits(raw, decimals));
  }, [onChange, decimals]);

  return (
    <Input
      value={displayValue}
      onChange={handleChange}
      placeholder={placeholder}
      className={cn("h-10", className)}
      inputMode="numeric"
      disabled={disabled}
    />
  );
}

/** Parse a NumericInput formatted value back to a JS number */
export function parseNumericInput(value: string): number | null {
  if (!value) return null;
  const digits = value.replace(/\D/g, "");
  if (!digits) return null;
  // Last 2 digits are decimals
  const num = parseInt(digits, 10) / 100;
  return isNaN(num) ? null : num;
}
