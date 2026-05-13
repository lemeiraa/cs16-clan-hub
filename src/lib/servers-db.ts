import { supabase } from "@/integrations/supabase/client";
import type { ServerInfo } from "@/lib/servers";

type Row = {
  slug: string;
  name: string;
  short: string;
  ip: string;
  port: number;
  country: string;
  flag: string;
  mode: string;
  description: string;
  coming_soon: boolean;
  rules: any;
  commands: any;
  sort_order: number;
};

function rowToServer(r: Row): ServerInfo {
  return {
    slug: r.slug,
    name: r.name,
    short: r.short,
    ip: r.ip,
    port: r.port,
    country: (r.country === "VE" ? "VE" : "BR") as ServerInfo["country"],
    flag: r.flag,
    mode: r.mode,
    description: r.description,
    comingSoon: r.coming_soon,
    rules: Array.isArray(r.rules) ? (r.rules as string[]) : [],
    commands: Array.isArray(r.commands) ? (r.commands as { cmd: string; desc: string }[]) : [],
  };
}

export async function fetchServers(): Promise<ServerInfo[]> {
  const { data, error } = await supabase
    .from("servers")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => rowToServer(r as Row));
}

export async function fetchServerBySlug(slug: string): Promise<ServerInfo | null> {
  const { data, error } = await supabase
    .from("servers")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? rowToServer(data as Row) : null;
}
