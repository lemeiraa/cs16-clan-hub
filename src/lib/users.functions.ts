import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type RecentUser = {
  id: string;
  nick: string;
  avatar_url: string | null;
  created_at: string;
  roles: string[];
};

export type PublicProfile = {
  id: string;
  nick: string;
  avatar_url: string | null;
  created_at: string;
  roles: string[];
  memberNumber: number;
};

export const getRecentUsers = createServerFn({ method: "GET" })
  .inputValidator((input) =>
    z
      .object({
        limit: z.number().int().min(1).max(50).optional(),
        offset: z.number().int().min(0).max(2000).optional(),
      })
      .optional()
      .parse(input ?? {}),
  )
  .handler(async ({ data }): Promise<RecentUser[]> => {
    const limit = data?.limit ?? 20;
    const offset = data?.offset ?? 0;
    const { data: rows, error } = await supabaseAdmin
      .from("profiles")
      .select("id, nick, avatar_url, created_at")
      .eq("banned", false)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw new Error(error.message);
    const ids = (rows ?? []).map((u) => u.id);
    const rolesByUser = new Map<string, string[]>();
    if (ids.length) {
      const { data: roleRows } = await supabaseAdmin
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", ids);
      for (const r of roleRows ?? []) {
        const arr = rolesByUser.get(r.user_id) ?? [];
        arr.push(r.role);
        rolesByUser.set(r.user_id, arr);
      }
    }
    return (rows ?? []).map((u) => ({
      id: u.id,
      nick: u.nick ?? "player",
      avatar_url: u.avatar_url,
      created_at: u.created_at,
      roles: rolesByUser.get(u.id) ?? [],
    }));
  });

export const getPublicProfile = createServerFn({ method: "GET" })
  .inputValidator((input) =>
    z.object({ id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data }): Promise<PublicProfile | null> => {
    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select("id, nick, avatar_url, created_at, banned")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!profile || profile.banned) return null;

    const [{ data: roles }, { count }] = await Promise.all([
      supabaseAdmin.from("user_roles").select("role").eq("user_id", data.id),
      supabaseAdmin
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .lte("created_at", profile.created_at),
    ]);

    return {
      id: profile.id,
      nick: profile.nick ?? "player",
      avatar_url: profile.avatar_url,
      created_at: profile.created_at,
      roles: (roles ?? []).map((r: { role: string }) => r.role),
      memberNumber: count ?? 0,
    };
  });
