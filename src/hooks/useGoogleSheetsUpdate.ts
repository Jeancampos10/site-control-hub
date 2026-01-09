import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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
      console.log(`Updating ${affectedRows.length} rows in ${sheetName}...`);
      console.log("Filters:", filters);
      console.log("Updates:", updates);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-sheets`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sheet: sheetName,
            filters,
            updates,
            affectedRows,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error updating sheet:", errorData);
        throw new Error(errorData.error || "Failed to update data");
      }

      const result = await response.json();
      console.log(`Updated ${result.updatedCount} rows`);
      return result;
    },
    onSuccess: (_, variables) => {
      // Invalidate the cache for this sheet to refetch fresh data
      queryClient.invalidateQueries({ queryKey: ["google-sheets", variables.sheetName] });
      toast.success("Registros atualizados com sucesso!");
    },
    onError: (error: Error) => {
      console.error("Bulk update error:", error);
      toast.error(`Erro ao atualizar: ${error.message}`);
    },
  });
}
