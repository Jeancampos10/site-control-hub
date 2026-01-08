import { CalendarIcon, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface FilterBarProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export function FilterBar({ selectedDate, onDateChange }: FilterBarProps) {
  const isToday = format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

  const handleResetDate = () => {
    onDateChange(new Date());
  };

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border/50 bg-card p-4 shadow-card">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Filter className="h-4 w-4" />
        Filtros:
      </div>
      
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "gap-2 min-w-[180px] justify-start",
              !isToday && "border-primary text-primary"
            )}
          >
            <CalendarIcon className="h-4 w-4" />
            {format(selectedDate, "dd 'de' MMMM, yyyy", { locale: ptBR })}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && onDateChange(date)}
            locale={ptBR}
            initialFocus
            className="pointer-events-auto"
          />
        </PopoverContent>
      </Popover>

      {!isToday && (
        <Button 
          variant="ghost" 
          size="sm" 
          className="gap-2 text-muted-foreground"
          onClick={handleResetDate}
        >
          <X className="h-4 w-4" />
          Voltar para hoje
        </Button>
      )}
    </div>
  );
}
