import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const profileQuery = (userId: string) =>
  queryOptions({
    queryKey: ["profile", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, phone, avatar_path, updated_at")
        .eq("id", userId)
        .maybeSingle();
      if (error) throw error;
      let avatarUrl: string | null = null;
      if (data?.avatar_path) {
        const { data: signed } = await supabase.storage.from("avatars").createSignedUrl(data.avatar_path, 3600);
        avatarUrl = signed?.signedUrl ?? null;
      }
      return data ? { ...data, avatarUrl } : null;
    },
  });
