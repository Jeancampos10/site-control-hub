import { useState } from "react";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DateFilterProps {
  date: Date | null;
  onDateChange: (date: Date | null) => void;
  placeholder?: string;
  showClear?: boolean;
}

export function DateFilter({ date, onDateChange, placeholder = "Selecionar data", showClear = true }: DateFilterProps) {
  const [open, setOpen] = useState(false);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDateChange(null);
  };

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "gap-2 justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="h-4 w-4" />
            {date ? format(date, "dd/MM/yyyy", { locale: ptBR }) : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="single"
            selected={date ?? undefined}
            onSelect={(newDate) => {
              if (newDate) {
                onDateChange(newDate);
                setOpen(false);
              }
            }}
            initialFocus
            locale={ptBR}
          />
        </PopoverContent>
      </Popover>
      {showClear && date && (
        <Button variant="ghost" size="sm" onClick={handleClear}>
          Limpar
        </Button>
      )}
    </div>
  );
}
