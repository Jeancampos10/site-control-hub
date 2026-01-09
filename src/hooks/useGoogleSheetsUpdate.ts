import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface BulkUpdateParams<T = unknown> {
  sheetName: string;
  filters: Record<string, string>;
  updates: Record<string, string>;
  affectedRows: T[];
}

export function useGoogleSheetsUpdate<T = unknown>() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sheetName, filters, updates, affectedRows }: BulkUpdateParams<T>) => {
      console.log(`Saving bulk edit log for ${sheetName}...`);
      console.log("Filters:", filters);
      console.log("Updates:", updates);
      console.log("Affected rows count:", affectedRows.length);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Usuário não autenticado");
      }

      // Extract date filter
      const dateFilter = filters.Data || null;
      const otherFilters = { ...filters };
      delete otherFilters.Data;

      // Take a sample of affected rows (first 5)
      const sample = affectedRows.slice(0, 5);

      // Save to bulk_edit_logs table - cast to any to bypass strict typing
      const insertData = {
        sheet_name: sheetName,
        date_filter: dateFilter,
        filters: otherFilters as unknown,
        updates: updates as unknown,
        affected_rows_count: affectedRows.length,
        affected_rows_sample: sample as unknown,
        status: "pending",
        created_by: user.id,
      };

      const { data, error } = await supabase
        .from("bulk_edit_logs")
        .insert(insertData as never)
        .select()
        .single();

      if (error) {
        console.error("Error saving bulk edit log:", error);
        throw new Error(`Erro ao salvar alteração: ${error.message}`);
      }

      console.log("Bulk edit log saved:", data);
      return {
        success: true,
        logId: data.id,
        affectedCount: affectedRows.length,
        message: `Alteração registrada para ${affectedRows.length} registros.`,
      };
    },
    onSuccess: (result) => {
      toast.success(`${result.affectedCount} registros marcados para alteração`, {
        description: "A alteração foi registrada e está aguardando aplicação.",
      });
    },
    onError: (error: Error) => {
      console.error("Bulk update error:", error);
      toast.error(`Erro ao registrar alteração: ${error.message}`);
    },
  });
}

// Hook to fetch bulk edit logs
export function useBulkEditLogs(sheetName?: string) {
  return useQueryClient();
}
