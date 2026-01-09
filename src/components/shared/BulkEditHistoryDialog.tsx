import { useState, useEffect, useRef } from "react";
import { History, Check, X, Clock, ChevronDown, ChevronUp, User, Play, Loader2, Sparkles, Wifi, WifiOff, RefreshCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useBulkEditLogs, useUpdateBulkEditStatus, useApplyBulkEdit, BulkEditLog } from "@/hooks/useBulkEditLogs";
import { useAppsScriptHealth } from "@/hooks/useAppsScriptHealth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TableLoader } from "@/components/ui/loading-spinner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface BulkEditHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sheetName: string;
  title?: string;
  highlightedLogId?: string | null;
  onHighlightClear?: () => void;
}

export function BulkEditHistoryDialog({
  open,
  onOpenChange,
  sheetName,
  title = "Histórico de Alterações",
  highlightedLogId,
  onHighlightClear,
}: BulkEditHistoryDialogProps) {
  const { data: logs, isLoading } = useBulkEditLogs(sheetName);
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateBulkEditStatus();
  const { mutate: applyBulkEdit, isPending: isApplying } = useApplyBulkEdit();
  const { data: healthCheck, isLoading: isCheckingHealth, refetch: recheckHealth } = useAppsScriptHealth(open);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [applyingLogId, setApplyingLogId] = useState<string | null>(null);
  const highlightedRef = useRef<HTMLDivElement>(null);

  const isAppsScriptConnected = healthCheck?.success === true;

  // Auto-expand and scroll to highlighted log
  useEffect(() => {
    if (open && highlightedLogId && logs) {
      setExpandedLog(highlightedLogId);
      // Scroll after a short delay to allow DOM to update
      setTimeout(() => {
        highlightedRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    }
  }, [open, highlightedLogId, logs]);

  // Clear highlight when dialog closes
  useEffect(() => {
    if (!open && highlightedLogId && onHighlightClear) {
      onHighlightClear();
    }
  }, [open, highlightedLogId, onHighlightClear]);

  const getStatusBadge = (status: BulkEditLog["status"]) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">
            <Clock className="h-3 w-3 mr-1" />
            Pendente
          </Badge>
        );
      case "applied":
        return (
          <Badge variant="outline" className="bg-success/10 text-success border-success/30">
            <Check className="h-3 w-3 mr-1" />
            Aplicado
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
            <X className="h-3 w-3 mr-1" />
            Rejeitado
          </Badge>
        );
    }
  };

  const formatFilters = (filters: Record<string, string>) => {
    return Object.entries(filters)
      .filter(([_, value]) => value && value !== "__all__")
      .map(([key, value]) => `${key}: ${value}`)
      .join(", ");
  };

  const formatUpdates = (updates: Record<string, string>) => {
    return Object.entries(updates)
      .map(([key, value]) => `${key} → ${value}`)
      .join(", ");
  };

  const handleApply = (log: BulkEditLog) => {
    setApplyingLogId(log.id);
    applyBulkEdit(log, {
      onSettled: () => {
        setApplyingLogId(null);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription className="flex items-center justify-between">
            <span>Visualize e gerencie as alterações em lote registradas</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => recheckHealth()}
                      disabled={isCheckingHealth}
                    >
                      <RefreshCw className={`h-3 w-3 ${isCheckingHealth ? 'animate-spin' : ''}`} />
                    </Button>
                    {isCheckingHealth ? (
                      <Badge variant="outline" className="text-xs gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Verificando...
                      </Badge>
                    ) : isAppsScriptConnected ? (
                      <Badge variant="outline" className="text-xs gap-1 bg-success/10 text-success border-success/30">
                        <Wifi className="h-3 w-3" />
                        Apps Script Conectado
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs gap-1 bg-destructive/10 text-destructive border-destructive/30">
                        <WifiOff className="h-3 w-3" />
                        Desconectado
                      </Badge>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  {isAppsScriptConnected 
                    ? "Google Apps Script está respondendo corretamente" 
                    : healthCheck?.message || "Clique para verificar a conexão"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          {isLoading ? (
            <TableLoader />
          ) : logs && logs.length > 0 ? (
            <div className="space-y-3 pr-4">
              {logs.map((log) => {
                const isHighlighted = log.id === highlightedLogId;
                return (
                  <div
                    key={log.id}
                    ref={isHighlighted ? highlightedRef : undefined}
                  >
                    <Collapsible
                      open={expandedLog === log.id}
                      onOpenChange={() =>
                        setExpandedLog(expandedLog === log.id ? null : log.id)
                      }
                    >
                      <div className={`rounded-lg border bg-card overflow-hidden transition-all ${
                        isHighlighted 
                          ? "border-primary ring-2 ring-primary/20 shadow-lg" 
                          : "border-border/50"
                      }`}>
                        <CollapsibleTrigger asChild>
                          <button className="w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-colors text-left">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              {isHighlighted && (
                                <Sparkles className="h-4 w-4 text-primary shrink-0 animate-pulse" />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  {getStatusBadge(log.status)}
                                  <span className="text-sm font-medium">
                                    {log.affected_rows_count} registro(s)
                                  </span>
                                  {log.date_filter && (
                                    <Badge variant="secondary" className="text-xs">
                                      {log.date_filter}
                                    </Badge>
                                  )}
                                  {isHighlighted && (
                                    <Badge className="text-xs bg-primary/10 text-primary border-primary/30">
                                      Novo
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground truncate">
                                  Alterações: {formatUpdates(log.updates)}
                                </p>
                              </div>
                              <div className="text-right text-xs text-muted-foreground shrink-0">
                                {format(new Date(log.created_at), "dd/MM/yyyy HH:mm", {
                                  locale: ptBR,
                                })}
                              </div>
                            </div>
                            {expandedLog === log.id ? (
                              <ChevronUp className="h-4 w-4 ml-2 text-muted-foreground shrink-0" />
                            ) : (
                              <ChevronDown className="h-4 w-4 ml-2 text-muted-foreground shrink-0" />
                            )}
                          </button>
                        </CollapsibleTrigger>

                        <CollapsibleContent>
                          <div className="px-4 pb-4 space-y-3 border-t border-border/50 pt-3">
                            {/* Filters */}
                            {Object.keys(log.filters).length > 0 && (
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-1">
                                  Filtros aplicados:
                                </p>
                                <p className="text-sm">{formatFilters(log.filters) || "Nenhum"}</p>
                              </div>
                            )}

                            {/* Updates */}
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1">
                                Alterações:
                              </p>
                              <div className="space-y-1">
                                {Object.entries(log.updates).map(([key, value]) => (
                                  <div
                                    key={key}
                                    className="text-sm flex items-center gap-2"
                                  >
                                    <span className="text-muted-foreground">{key}:</span>
                                    <span className="font-medium">{value}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Sample rows */}
                            {log.affected_rows_sample && log.affected_rows_sample.length > 0 && (
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-1">
                                  Amostra de registros afetados:
                                </p>
                                <div className="bg-muted/30 rounded p-2 text-xs font-mono overflow-x-auto">
                                  {log.affected_rows_sample.slice(0, 3).map((row, idx) => (
                                    <div key={idx} className="truncate">
                                      {Object.entries(row)
                                        .slice(0, 4)
                                        .map(([k, v]) => `${k}: ${v}`)
                                        .join(" | ")}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Notes */}
                            {log.notes && (
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-1">
                                  Observações:
                                </p>
                                <p className="text-sm">{log.notes}</p>
                              </div>
                            )}

                            {/* Applied info */}
                            {log.applied_at && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <User className="h-3 w-3" />
                                {log.status === "applied" ? "Aplicado" : "Rejeitado"} em{" "}
                                {format(new Date(log.applied_at), "dd/MM/yyyy HH:mm", {
                                  locale: ptBR,
                                })}
                              </div>
                            )}

                            {/* Actions for pending logs */}
                            {log.status === "pending" && (
                              <div className="space-y-2 pt-2">
                                {!isAppsScriptConnected && (
                                  <div className="text-xs text-destructive bg-destructive/10 p-2 rounded flex items-center gap-2">
                                    <WifiOff className="h-3 w-3" />
                                    Apps Script desconectado. Verifique a configuração antes de aplicar.
                                  </div>
                                )}
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    className="gap-1 bg-success hover:bg-success/90"
                                    onClick={() => handleApply(log)}
                                    disabled={isApplying || isUpdating || !isAppsScriptConnected}
                                  >
                                    {applyingLogId === log.id ? (
                                      <>
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                        Aplicando...
                                      </>
                                    ) : (
                                      <>
                                        <Play className="h-3 w-3" />
                                        Aplicar na Planilha
                                      </>
                                    )}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="gap-1 text-muted-foreground"
                                    onClick={() =>
                                      updateStatus({
                                        logId: log.id,
                                        status: "applied",
                                        notes: "Marcado manualmente como aplicado",
                                      })
                                    }
                                    disabled={isApplying || isUpdating}
                                  >
                                    <Check className="h-3 w-3" />
                                    Marcar Aplicado
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() =>
                                      updateStatus({
                                        logId: log.id,
                                        status: "rejected",
                                        notes: "Rejeitado pelo administrador",
                                      })
                                    }
                                    disabled={isApplying || isUpdating}
                                  >
                                    <X className="h-3 w-3" />
                                    Rejeitar
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Nenhuma alteração registrada</p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
