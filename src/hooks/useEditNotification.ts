import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Json } from "@/integrations/supabase/types";

interface EditNotificationData {
  sheetType: string;
  recordId: string;
  changes: Record<string, { old: string; new: string }>;
  description?: string;
}

export function useEditNotification() {
  const { user, profile } = useAuth();

  return useMutation({
    mutationFn: async (data: EditNotificationData) => {
      if (!user) return;

      // Get all admin users to notify
      const { data: adminRoles, error: adminError } = await supabase
        .from('user_roles')
        .select('user_id')
        .in('role', ['admin_principal', 'admin'])
        .eq('approved', true);

      if (adminError) {
        console.error('Error fetching admins:', adminError);
        return;
      }

      const userName = profile ? `${profile.nome} ${profile.sobrenome}` : user.email;
      const changesDescription = Object.entries(data.changes)
        .map(([field, { old, new: newVal }]) => `${field}: "${old}" → "${newVal}"`)
        .join(', ');

      // Convert changes to JSON-compatible format
      const changesJson: Record<string, { old: string; new: string }> = {};
      Object.entries(data.changes).forEach(([key, value]) => {
        changesJson[key] = { old: String(value.old), new: String(value.new) };
      });

      const notificationData: Json = {
        editorId: user.id,
        editorName: userName || '',
        sheetType: data.sheetType,
        recordId: data.recordId,
        changes: changesJson as unknown as Json,
      };

      // Create notification for each admin
      const notifications = adminRoles?.map(admin => ({
        user_id: admin.user_id,
        type: 'edit_apontamento',
        title: `Edição de ${data.sheetType}`,
        message: `${userName} editou um registro: ${data.description || changesDescription}`,
        data: notificationData,
        read: false,
      })) || [];

      if (notifications.length > 0) {
        const { error } = await supabase
          .from('notifications')
          .insert(notifications);

        if (error) {
          console.error('Error creating notifications:', error);
          throw error;
        }
      }
    },
  });
}
