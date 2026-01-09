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
