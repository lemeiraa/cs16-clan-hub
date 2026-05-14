import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type RecentUser = {
  id: string;
  nick: string;
  avatar_url: string | null;
  created_at: string;
};

export const getRecentUsers = createServerFn({ method: "GET" }).handler(
  async (): Promise<RecentUser[]> => {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("id, nick, avatar_url, created_at")
      .eq("banned", false)
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) throw new Error(error.message);
    return (data ?? []).map((u) => ({
      id: u.id,
      nick: u.nick ?? "player",
      avatar_url: u.avatar_url,
      created_at: u.created_at,
    }));
  },
);
