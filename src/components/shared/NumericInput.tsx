import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { formatBR, parseBR } from "@/lib/formatters";
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
 * Numeric input that accepts only digits.
 * On blur, formats to Brazilian standard (1.234,56).
 * User never needs to type dots or commas.
 */
export function NumericInput({ value, onChange, decimals = 2, placeholder = "0", className, disabled }: NumericInputProps) {
  const [focused, setFocused] = useState(false);

  // Strip formatting when focused so user sees raw digits
  const displayValue = focused ? value.replace(/\./g, '').replace(',', '.') : value;

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow only digits
    const raw = e.target.value.replace(/[^\d]/g, '');
    onChange(raw);
  }, [onChange]);

  const handleBlur = useCallback(() => {
    setFocused(false);
    if (!value) return;
    // Convert raw digits to number with decimals
    const raw = value.replace(/[^\d]/g, '');
    if (!raw) return;
    const num = parseInt(raw, 10) / Math.pow(10, decimals);
    onChange(formatBR(num, decimals));
  }, [value, onChange, decimals]);

  const handleFocus = useCallback(() => {
    setFocused(true);
    // Strip formatting, keep only digits
    const num = parseBR(value);
    if (num != null) {
      // Show raw integer (digits only)
      const raw = Math.round(num * Math.pow(10, decimals)).toString();
      onChange(raw);
    }
  }, [value, onChange, decimals]);

  return (
    <Input
      value={value}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      placeholder={placeholder}
      className={cn("h-10", className)}
      inputMode="numeric"
      disabled={disabled}
    />
  );
}
