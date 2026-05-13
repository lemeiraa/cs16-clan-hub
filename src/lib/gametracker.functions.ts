// Scraping leve do GameTracker para status, players e top ranking.
// Sem dependências Node-only (apenas fetch + regex), compatível com Worker SSR.

import { createServerFn } from "@tanstack/react-start";
import { SERVERS, getServerBySlug, type ServerInfo } from "./servers";

export type LivePlayer = {
  name: string;
  score: number;
  timeMinutes: number;
};

export type TopPlayer = {
  rank: number;
  name: string;
  score: number;
  timeHours: number;
};

export type ServerStatus = {
  slug: string;
  online: boolean;
  map: string | null;
  players: number;
  maxPlayers: number;
  livePlayers: LivePlayer[];
  topPlayers: TopPlayer[];
  fetchedAt: string;
  error?: string;
};

const UA =
  "Mozilla/5.0 (compatible; CSNostalgiaBot/1.0; +https://csnostalgia.com)";

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, c) => String.fromCharCode(parseInt(c, 10)));
}

function stripTags(s: string): string {
  return decodeEntities(s.replace(/<[^>]+>/g, "")).trim();
}

function parsePlayersCount(html: string): { current: number; max: number } {
  const cur = html.match(/id="HTML_num_players"[^>]*>\s*(\d+)/i);
  const max = html.match(/id="HTML_max_players"[^>]*>\s*(\d+)/i);
  if (cur && max) {
    return { current: parseInt(cur[1], 10), max: parseInt(max[1], 10) };
  }
  const fb = html.match(/(\d+)\s*\/\s*(\d+)/);
  if (fb) return { current: parseInt(fb[1], 10), max: parseInt(fb[2], 10) };
  return { current: 0, max: 0 };
}

function parseMap(html: string): string | null {
  const m = html.match(/id="HTML_curr_map"[^>]*>\s*([^<]+?)\s*</i);
  if (m) {
    const v = stripTags(m[1]);
    if (v) return v;
  }
  const m2 = html.match(/<a[^>]+href="\/map_info\/[^"]+"[^>]*>([^<]+)</i);
  if (m2) return stripTags(m2[1]);
  return null;
}

function parseStatusOnline(html: string): boolean {
  // GameTracker uses item_color_success with "Alive" / "Online"
  const m = html.match(
    /Status:[\s\S]{0,200}?<span class="item_color_(success|failure|fail)"[^>]*>\s*([^<]+?)\s*</i,
  );
  if (m) {
    const cls = m[1].toLowerCase();
    const txt = m[2].toLowerCase();
    if (cls === "success") return true;
    if (txt.includes("alive") || txt.includes("online")) return true;
    return false;
  }
  // Fallback: assume online if there are players
  const pc = html.match(/id="HTML_num_players"[^>]*>\s*(\d+)/i);
  if (pc && parseInt(pc[1], 10) > 0) return true;
  return false;
}

function parseAllTables(html: string): { headers: string[]; rows: string[][] }[] {
  const tables = [...html.matchAll(/<table[^>]*class="[^"]*table_lst[^"]*"[^>]*>([\s\S]*?)<\/table>/gi)];
  return tables.map((t) => {
    const rowMatches = [...t[1].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
    let headers: string[] = [];
    const rows: string[][] = [];
    for (const r of rowMatches) {
      const ths = [...r[1].matchAll(/<th[^>]*>([\s\S]*?)<\/th>/gi)].map((c) => stripTags(c[1]));
      if (ths.length) {
        headers = ths;
        continue;
      }
      const tds = [...r[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((c) => stripTags(c[1]));
      if (!headers.length && tds.length && /Rank|Name|Score|Time/i.test(tds.join(" "))) {
        headers = tds;
        continue;
      }
      if (tds.length) rows.push(tds);
    }
    return { headers, rows };
  });
}

function parseTimeToHours(raw: string): number {
  const hm = raw.match(/(\d+)\s*h(?:\s*(\d+)\s*m)?/i);
  if (hm) return parseInt(hm[1], 10) + (hm[2] ? parseInt(hm[2], 10) / 60 : 0);
  const n = parseFloat(raw.replace(",", "."));
  return Number.isNaN(n) ? 0 : n;
}

function parseRankingTable(html: string): TopPlayer[] {
  const tables = parseAllTables(html);
  const t = tables.find((tbl) => /Rank/i.test(tbl.headers.join(" ")));
  if (!t) return [];
  const out: TopPlayer[] = [];
  for (const cells of t.rows) {
    if (cells.length < 4) continue;
    const rank = parseInt(cells[0].replace(/\D/g, ""), 10);
    if (Number.isNaN(rank)) continue;
    const name = cells[1];
    if (!name) continue;
    const score = parseFloat(cells[2].replace(/[^\d.,-]/g, "").replace(",", ".")) || 0;
    out.push({ rank, name, score, timeHours: parseTimeToHours(cells[3]) });
    if (out.length >= 50) break;
  }
  return out;
}

function parseLivePlayers(html: string): LivePlayer[] {
  const tables = parseAllTables(html);
  const t = tables.find(
    (tbl) =>
      /Name/i.test(tbl.headers.join(" ")) &&
      /Time/i.test(tbl.headers.join(" ")) &&
      !/Rank/i.test(tbl.headers.join(" ")),
  );
  if (!t) return [];
  const nameIdx = Math.max(0, t.headers.findIndex((h) => /Name/i.test(h)));
  const scoreIdx = t.headers.findIndex((h) => /Score/i.test(h));
  const timeIdx = t.headers.findIndex((h) => /Time/i.test(h));
  const out: LivePlayer[] = [];
  for (const cells of t.rows) {
    const name = cells[nameIdx];
    if (!name) continue;
    const scoreStr = cells[scoreIdx >= 0 ? scoreIdx : 1] ?? "";
    const timeStr = cells[timeIdx >= 0 ? timeIdx : 2] ?? "";
    const score = parseFloat(scoreStr.replace(/[^\d.,-]/g, "").replace(",", ".")) || 0;
    const timeMinutes = Math.round(parseTimeToHours(timeStr) * 60);
    out.push({ name, score, timeMinutes });
    if (out.length >= 64) break;
  }
  return out;
}

async function fetchWithTimeout(url: string, ms: number): Promise<string> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "text/html" },
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchStatus(server: ServerInfo): Promise<ServerStatus> {
  const base = `${server.ip}:${server.port}`;
  const now = new Date().toISOString();

  if (server.comingSoon) {
    return {
      slug: server.slug,
      online: false,
      map: null,
      players: 0,
      maxPlayers: 0,
      livePlayers: [],
      topPlayers: [],
      fetchedAt: now,
    };
  }

  try {
    const [infoHtml, topHtml] = await Promise.all([
      fetchWithTimeout(
        `https://www.gametracker.com/server_info/${base}/`,
        8000,
      ),
      fetchWithTimeout(
        `https://www.gametracker.com/server_info/${base}/top_players/`,
        8000,
      ).catch(() => ""),
    ]);

    const players = parsePlayersCount(infoHtml);
    const map = parseMap(infoHtml);
    const online = parseStatusOnline(infoHtml);
    const topPlayers = parseRankingTable(topHtml || infoHtml);
    const livePlayers = parseLivePlayers(infoHtml);

    return {
      slug: server.slug,
      online,
      map,
      players: players.current,
      maxPlayers: players.max,
      livePlayers,
      topPlayers,
      fetchedAt: now,
    };
  } catch (err) {
    return {
      slug: server.slug,
      online: false,
      map: null,
      players: 0,
      maxPlayers: 0,
      livePlayers: [],
      topPlayers: [],
      fetchedAt: now,
      error: err instanceof Error ? err.message : "Erro ao consultar GameTracker",
    };
  }
}

// In-memory cache (per worker instance) ~ 60s
const cache = new Map<string, { at: number; data: ServerStatus }>();
const TTL_MS = 60_000;

export const getServerStatus = createServerFn({ method: "GET" })
  .inputValidator((input: { slug: string }) => input)
  .handler(async ({ data }) => {
    const server = getServerBySlug(data.slug);
    if (!server) {
      throw new Error(`Servidor não encontrado: ${data.slug}`);
    }
    const cached = cache.get(server.slug);
    if (cached && Date.now() - cached.at < TTL_MS) {
      return cached.data;
    }
    const status = await fetchStatus(server);
    cache.set(server.slug, { at: Date.now(), data: status });
    return status;
  });

export const getAllServersStatus = createServerFn({ method: "GET" }).handler(
  async () => {
    const results = await Promise.all(
      SERVERS.map(async (s) => {
        const cached = cache.get(s.slug);
        if (cached && Date.now() - cached.at < TTL_MS) return cached.data;
        const status = await fetchStatus(s);
        cache.set(s.slug, { at: Date.now(), data: status });
        return status;
      }),
    );
    return results;
  },
);
