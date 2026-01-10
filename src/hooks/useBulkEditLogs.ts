import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface BulkEditLog {
  id: string;
  sheet_name: string;
  date_filter: string | null;
  filters: Record<string, string>;
  updates: Record<string, string>;
  affected_rows_count: number;
  affected_rows_sample: Record<string, unknown>[] | null;
  status: "pending" | "applied" | "rejected";
  created_by: string | null;
  created_at: string;
  applied_at: string | null;
  applied_by: string | null;
  notes: string | null;
}

export function useBulkEditLogs(sheetName?: string) {
  return useQuery({
    queryKey: ["bulk-edit-logs", sheetName],
    queryFn: async (): Promise<BulkEditLog[]> => {
      let query = supabase
        .from("bulk_edit_logs")
        .select("*")
        .order("created_at", { ascending: false });

      if (sheetName) {
        query = query.eq("sheet_name", sheetName);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching bulk edit logs:", error);
        throw error;
      }

      return (data || []) as BulkEditLog[];
    },
    staleTime: 1000 * 60, // 1 minute
  });
}

export function useUpdateBulkEditStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      logId,
      status,
      notes,
    }: {
      logId: string;
      status: "applied" | "rejected";
      notes?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("bulk_edit_logs")
        .update({
          status,
          applied_at: new Date().toISOString(),
          applied_by: user?.id,
          notes,
        })
        .eq("id", logId);

      if (error) {
        throw error;
      }

      return { success: true };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["bulk-edit-logs"] });
      toast.success(
        variables.status === "applied"
          ? "Alteração marcada como aplicada"
          : "Alteração rejeitada"
      );
    },
    onError: (error: Error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });
}

export function useApplyBulkEdit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (log: BulkEditLog) => {
      console.log("Applying bulk edit to spreadsheet:", log.id);

      // Call the edge function to apply changes
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/apply-bulk-update`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sheetName: log.sheet_name,
            dateFilter: log.date_filter,
            filters: log.filters,
            updates: log.updates,
          }),
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Erro ao aplicar alterações");
      }

      const updatedCount = Number(result.updatedCount ?? 0);
      if (!Number.isFinite(updatedCount) || updatedCount <= 0) {
        throw new Error(result.message || "Nenhum registro foi atualizado na planilha (verifique data e filtros). ");
      }

      // Update the log status
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("bulk_edit_logs")
        .update({
          status: "applied",
          applied_at: new Date().toISOString(),
          applied_by: user?.id,
          notes: `Aplicado automaticamente - ${updatedCount} registros atualizados`,
        })
        .eq("id", log.id);

      if (error) {
        console.error("Error updating log status:", error);
      }

      // Create notification for the user who created the bulk edit
      if (log.created_by) {
        const sheetNameMap: Record<string, string> = {
          carga: "Carga",
          descarga: "Descarga",
        };
        const sheetDisplayName = sheetNameMap[log.sheet_name] || log.sheet_name;
        
        const { error: notifError } = await supabase
          .from("notifications")
          .insert({
            user_id: log.created_by,
            type: "bulk_edit_applied",
            title: "Alteração em lote aplicada",
            message: `${updatedCount} registros foram atualizados na planilha ${sheetDisplayName}.`,
            data: {
              logId: log.id,
              sheetName: log.sheet_name,
              updatedCount,
              updates: log.updates,
            },
          });

        if (notifError) {
          console.error("Error creating notification:", notifError);
        }
      }

      return { ...result, log };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["bulk-edit-logs"] });
      queryClient.invalidateQueries({ queryKey: ["google-sheets"] });
      toast.success(`${result.updatedCount} registros atualizados na planilha!`);
    },
    onError: (error: Error) => {
      toast.error(`Erro ao aplicar: ${error.message}`);
    },
  });
}
