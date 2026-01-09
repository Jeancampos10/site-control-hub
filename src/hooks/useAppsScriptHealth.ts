import { useQuery } from "@tanstack/react-query";

interface HealthCheckResult {
  success: boolean;
  message: string;
}

export function useAppsScriptHealth(enabled = false) {
  return useQuery({
    queryKey: ["apps-script-health"],
    queryFn: async (): Promise<HealthCheckResult> => {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/apply-bulk-update?healthcheck=true`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        }
      );

      const result = await response.json();
      return result;
    },
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
  });
}
