import { CalendarIcon, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function FilterBar() {
  return (
    <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-border/50 bg-card p-4 shadow-card">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Filter className="h-4 w-4" />
        Filtros:
      </div>
      
      <Button variant="outline" size="sm" className="gap-2">
        <CalendarIcon className="h-4 w-4" />
        Hoje, 07 Jan 2026
      </Button>
      
      <Select defaultValue="all">
        <SelectTrigger className="h-9 w-[160px]">
          <SelectValue placeholder="Local da Obra" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os Locais</SelectItem>
          <SelectItem value="norte">Trecho Norte</SelectItem>
          <SelectItem value="central">Aterro Central</SelectItem>
          <SelectItem value="estaca">Estaca 120-150</SelectItem>
        </SelectContent>
      </Select>

      <Select defaultValue="all">
        <SelectTrigger className="h-9 w-[150px]">
          <SelectValue placeholder="Escavadeira" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas</SelectItem>
          <SelectItem value="ex001">EX-001</SelectItem>
          <SelectItem value="ex002">EX-002</SelectItem>
          <SelectItem value="ex003">EX-003</SelectItem>
        </SelectContent>
      </Select>

      <Select defaultValue="all">
        <SelectTrigger className="h-9 w-[140px]">
          <SelectValue placeholder="Material" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="rachao">Rachão</SelectItem>
          <SelectItem value="argila">Argila</SelectItem>
          <SelectItem value="botafora">Bota-fora</SelectItem>
        </SelectContent>
      </Select>

      <Button variant="ghost" size="sm" className="ml-auto text-muted-foreground">
        Limpar filtros
      </Button>
    </div>
  );
}
