import { useState, useMemo } from "react";
import { Edit, Filter, Save, Loader2, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Check } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface EditableField {
  key: string;
  label: string;
  type?: "text" | "select";
  options?: string[]; // For select fields
}

export interface FilterOption {
  key: string;
  label: string;
  values: string[]; // Available values to filter by
}

interface BulkEditDialogProps<T> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  data: T[];
  filterOptions: FilterOption[];
  editableFields: EditableField[];
  onSave: (filters: Record<string, string>, updates: Record<string, string>, affectedRows: T[]) => Promise<void>;
  dateField?: string; // Field name that contains the date
  getFieldValue: (item: T, field: string) => string; // Helper to get field value from item
}

export function BulkEditDialog<T>({
  open,
  onOpenChange,
  title,
  description,
  data,
  filterOptions,
  editableFields,
  onSave,
  dateField = "Data",
  getFieldValue,
}: BulkEditDialogProps<T>) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [updates, setUpdates] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Filter data based on selected date and filters
  const filteredData = useMemo(() => {
    let result = [...data];

    // Filter by date if selected
    if (selectedDate) {
      const formattedDate = format(selectedDate, "dd/MM/yyyy");
      result = result.filter((row) => {
        const rowDate = getFieldValue(row, dateField)?.trim() || "";
        return rowDate === formattedDate || rowDate.startsWith(formattedDate);
      });
    }

    // Apply other filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== "__all__") {
        result = result.filter((row) => getFieldValue(row, key) === value);
      }
    });

    return result;
  }, [data, selectedDate, filters, dateField, getFieldValue]);

  // Get dynamic options based on filtered data
  const dynamicFilterOptions = useMemo(() => {
    return filterOptions.map((option) => {
      // Get unique values from data (filtered by date if selected)
      let sourceData = [...data];
      if (selectedDate) {
        const formattedDate = format(selectedDate, "dd/MM/yyyy");
        sourceData = sourceData.filter((row) => {
          const rowDate = getFieldValue(row, dateField)?.trim() || "";
          return rowDate === formattedDate || rowDate.startsWith(formattedDate);
        });
      }

      // Apply previous filters to narrow down options
      Object.entries(filters).forEach(([key, value]) => {
        if (key !== option.key && value && value !== "__all__") {
          sourceData = sourceData.filter((row) => getFieldValue(row, key) === value);
        }
      });

      const uniqueValues = [...new Set(sourceData.map((row) => getFieldValue(row, option.key)).filter(Boolean))];
      return { ...option, values: uniqueValues.sort() };
    });
  }, [data, filterOptions, selectedDate, filters, dateField, getFieldValue]);

  // Get dynamic options for editable select fields
  const dynamicEditableFields = useMemo(() => {
    return editableFields.map((field) => {
      if (field.type === "select" && !field.options) {
        const uniqueValues = [...new Set(data.map((row) => getFieldValue(row, field.key)).filter(Boolean))];
        return { ...field, options: uniqueValues.sort() };
      }
      return field;
    });
  }, [data, editableFields, getFieldValue]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleUpdateChange = (key: string, value: string) => {
    setUpdates((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (filteredData.length === 0) return;

    const activeUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value.trim() !== "")
    );

    if (Object.keys(activeUpdates).length === 0) return;

    setIsSaving(true);
    try {
      await onSave(
        { ...filters, [dateField]: selectedDate ? format(selectedDate, "dd/MM/yyyy") : "" },
        activeUpdates,
        filteredData
      );
      // Reset form on success
      setFilters({});
      setUpdates({});
      setSelectedDate(undefined);
      onOpenChange(false);
    } catch (error) {
      console.error("Bulk edit failed:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setFilters({});
    setUpdates({});
    setSelectedDate(undefined);
    onOpenChange(false);
  };

  const hasUpdates = Object.values(updates).some((v) => v.trim() !== "");

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Step 1: Select Date */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="rounded-full">1</Badge>
                <Label className="text-sm font-medium">Selecione a Data</Label>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate
                      ? format(selectedDate, "PPP", { locale: ptBR })
                      : "Escolha uma data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    locale={ptBR}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Step 2: Apply Filters */}
            {selectedDate && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="rounded-full">2</Badge>
                  <Label className="text-sm font-medium">Filtre os Registros</Label>
                  <Filter className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {dynamicFilterOptions.map((option) => (
                    <div key={option.key} className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">{option.label}</Label>
                      <Select
                        value={filters[option.key] || "__all__"}
                        onValueChange={(value) => handleFilterChange(option.key, value)}
                        disabled={option.values.length === 0}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder={`Todos ${option.label}`} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all__">Todos</SelectItem>
                          {option.values.map((value) => (
                            <SelectItem key={value} value={value}>
                              {value}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>

                {/* Show affected records count */}
                <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
                  <div className="flex items-center gap-2">
                    {filteredData.length > 0 ? (
                      <>
                        <Check className="h-4 w-4 text-success" />
                        <span className="text-sm">
                          <strong>{filteredData.length}</strong> registro(s) serão afetados
                        </span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-4 w-4 text-warning" />
                        <span className="text-sm text-muted-foreground">
                          Nenhum registro encontrado com esses filtros
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Define Updates */}
            {selectedDate && filteredData.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="rounded-full">3</Badge>
                  <Label className="text-sm font-medium">Defina as Alterações</Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Preencha apenas os campos que deseja alterar. Os demais permanecerão inalterados.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {dynamicEditableFields.map((field) => (
                    <div key={field.key} className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">{field.label}</Label>
                      {field.type === "select" && field.options ? (
                        <Select
                          value={updates[field.key] || "__keep__"}
                          onValueChange={(value) => handleUpdateChange(field.key, value === "__keep__" ? "" : value)}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder={`Manter atual`} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__keep__">Manter atual</SelectItem>
                            {field.options.filter(Boolean).map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          value={updates[field.key] || ""}
                          onChange={(e) => handleUpdateChange(field.key, e.target.value)}
                          placeholder="Manter atual"
                          className="h-9"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasUpdates || filteredData.length === 0 || isSaving}
            className="gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Salvar Alterações
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
