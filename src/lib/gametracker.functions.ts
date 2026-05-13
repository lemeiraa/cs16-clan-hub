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

function parsePlayersRow(html: string): { current: number; max: number } {
  // ex.: "5/32"
  const m = html.match(/(\d+)\s*\/\s*(\d+)/);
  if (!m) return { current: 0, max: 0 };
  return { current: parseInt(m[1], 10), max: parseInt(m[2], 10) };
}

function parseLivePlayers(html: string): LivePlayer[] {
  // table.table_lst_spec contains rows with name / score / time
  const tableMatch = html.match(
    /<table[^>]*class="[^"]*table_lst_spec[^"]*"[^>]*>([\s\S]*?)<\/table>/i,
  );
  if (!tableMatch) return [];
  const rows = [...tableMatch[1].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
  const players: LivePlayer[] = [];
  for (const row of rows) {
    const cells = [...row[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(
      (c) => stripTags(c[1]),
    );
    if (cells.length < 3) continue;
    // typical layout: [#, name, score, time]
    const name = cells.find((c) => c && !/^\d+$/.test(c) && !/^\d+:/.test(c));
    if (!name) continue;
    const numbers = cells.filter((c) => /^\d+$/.test(c)).map(Number);
    const time = cells.find((c) => /^\d+:\d+/.test(c));
    let timeMinutes = 0;
    if (time) {
      const [h, m] = time.split(":").map(Number);
      timeMinutes = (h || 0) * 60 + (m || 0);
    }
    const score = numbers.length ? numbers[numbers.length - 1] : 0;
    players.push({ name, score, timeMinutes });
  }
  return players;
}

function parseMap(html: string): string | null {
  // Try og:image map name pattern, then fall back to "Current Map"
  const m1 = html.match(
    /Current Map[^<]*<\/[^>]+>\s*<[^>]*>([\s\S]{0,80}?)</i,
  );
  if (m1) {
    const v = stripTags(m1[1]);
    if (v) return v;
  }
  const m2 = html.match(
    /map[s]?\s*\/\s*([a-z0-9_\-]+)\.(?:jpg|png|gif)/i,
  );
  if (m2) return m2[1];
  const m3 = html.match(/<a[^>]+href="\/map_info\/[^"]+"[^>]*>([^<]+)</i);
  if (m3) return stripTags(m3[1]);
  return null;
}

function parsePlayersCount(html: string): { current: number; max: number } {
  // Look for "Players" label followed by "X/Y"
  const m = html.match(/Players[^<]*<\/[^>]+>[\s\S]{0,200}?(\d+)\s*\/\s*(\d+)/i);
  if (m) return { current: parseInt(m[1], 10), max: parseInt(m[2], 10) };
  // fallback any "X/Y" near "Status"
  return parsePlayersRow(html);
}

function parseStatusOnline(html: string): boolean {
  // "Status" cell with Online/Offline image alt
  if (/alt="Online"/i.test(html)) return true;
  if (/alt="Offline"/i.test(html)) return false;
  // fallback: any current players > 0 implies online
  return /Players[^<]*<\/[^>]+>[\s\S]{0,200}?\d+\s*\/\s*\d+/i.test(html);
}

function parseTopPlayers(html: string): TopPlayer[] {
  const tableMatch = html.match(
    /<table[^>]*class="[^"]*table_lst[^"]*"[^>]*>([\s\S]*?)<\/table>/i,
  );
  if (!tableMatch) return [];
  const rows = [...tableMatch[1].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
  const out: TopPlayer[] = [];
  for (const row of rows) {
    const cells = [...row[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(
      (c) => stripTags(c[1]),
    );
    if (cells.length < 3) continue;
    const rank = parseInt(cells[0], 10);
    if (Number.isNaN(rank)) continue;
    const name = cells[1];
    if (!name) continue;
    // Find score and time among remaining cells
    const nums = cells
      .slice(2)
      .map((c) => ({ raw: c, n: parseFloat(c.replace(",", ".")) }))
      .filter((x) => !Number.isNaN(x.n));
    const score = nums[0]?.n ?? 0;
    const timeHours = nums[1]?.n ?? 0;
    out.push({ rank, name, score, timeHours });
    if (out.length >= 50) break;
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
    const livePlayers = parseLivePlayers(infoHtml);
    const topPlayers = topHtml ? parseTopPlayers(topHtml) : [];

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
