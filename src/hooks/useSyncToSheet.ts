import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Generic hook to sync a row to Google Sheets via the google-sheets-append edge function.
 * This writes data to the specified sheet tab in the ABASTECH spreadsheet.
 */
export function useSyncToSheet() {
  return useMutation({
    mutationFn: async ({
      sheetName,
      rowData,
    }: {
      sheetName: string;
      rowData: string[];
    }) => {
      console.log(`Syncing to sheet: ${sheetName}`, rowData);

      const { data, error } = await supabase.functions.invoke('google-sheets-append', {
        body: {
          action: 'append',
          sheetName,
          rowData,
        },
      });

      if (error) {
        console.warn(`Sheet sync failed for ${sheetName}:`, error.message);
        // Don't throw - sync failure shouldn't block the main save
        return { success: false, error: error.message };
      }

      return data || { success: true };
    },
  });
}
