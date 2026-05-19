import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type PublicMiniProfile = {
  id: string;
  nick: string;
  avatar_url: string | null;
};

export const searchUsersByNick = createServerFn({ method: "GET" })
  .inputValidator((input) =>
    z.object({
      q: z.string().trim().min(1).max(64),
      excludeId: z.string().uuid().optional(),
    }).parse(input),
  )
  .handler(async ({ data }): Promise<PublicMiniProfile[]> => {
    const term = data.q.replace(/[%_]/g, "");
    let query = supabaseAdmin
      .from("profiles")
      .select("id, nick, avatar_url")
      .eq("banned", false)
      .ilike("nick", `%${term}%`)
      .order("created_at", { ascending: false })
      .limit(15);
    if (data.excludeId) query = query.neq("id", data.excludeId);
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    return (rows ?? []).map((r) => ({
      id: r.id,
      nick: r.nick ?? "player",
      avatar_url: r.avatar_url,
    }));
  });

export const getProfilesByIds = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z.object({
      ids: z.array(z.string().uuid()).max(200),
    }).parse(input),
  )
  .handler(async ({ data }): Promise<PublicMiniProfile[]> => {
    if (data.ids.length === 0) return [];
    const { data: rows, error } = await supabaseAdmin
      .from("profiles")
      .select("id, nick, avatar_url")
      .in("id", data.ids);
    if (error) throw new Error(error.message);
    return (rows ?? []).map((r) => ({
      id: r.id,
      nick: r.nick ?? "player",
      avatar_url: r.avatar_url,
    }));
  });
