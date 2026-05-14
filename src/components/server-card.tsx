import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useTranslation } from "react-i18next";
import { Users, MapPin, Activity, Copy, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  type ServerInfo,
  serverAddress,
  steamConnectUrl,
} from "@/lib/servers";
import { getServerStatus } from "@/lib/gametracker.functions";
import { cn } from "@/lib/utils";

type Props = { server: ServerInfo; compact?: boolean };

export function ServerCard({ server, compact = false }: Props) {
  const { t } = useTranslation();
  const fetchStatus = useServerFn(getServerStatus);
  const [copied, setCopied] = useState(false);

  const { data: status, isLoading } = useQuery({
    queryKey: ["server-status", server.slug],
    queryFn: () => fetchStatus({ data: { slug: server.slug } }),
    refetchInterval: server.comingSoon ? false : 30_000,
    staleTime: 25_000,
    enabled: !server.comingSoon,
  });

  const onCopy = async () => {
    await navigator.clipboard.writeText(serverAddress(server));
    setCopied(true);
    toast.success(t("card.ipCopied"), { description: serverAddress(server) });
    setTimeout(() => setCopied(false), 1500);
  };

  const online = status?.online && !server.comingSoon;
  const playersTxt = server.comingSoon
    ? t("common.comingSoon")
    : isLoading
      ? "..."
      : `${status?.players ?? 0}/${status?.maxPlayers ?? 0}`;

  const mapName = !server.comingSoon ? status?.map ?? null : null;

  // Build fallback chain of map image URLs (custom maps often don't exist on GameTracker,
  // so we also try a normalized base name like de_dust2_ng -> de_dust2).
  const mapCandidates = (() => {
    if (!mapName) return [] as string[];
    const variants = new Set<string>();
    variants.add(mapName);
    // Strip common custom suffixes progressively
    const stripped = mapName
      .replace(/_(ng|pz|neon|v\d+|final|fix|fixed|b\d+|beta\d*|cz|csn|nostalgia|br|ve)$/i, "");
    if (stripped !== mapName) variants.add(stripped);
    // Try base prefix (everything up to second underscore): de_dust2_ng -> de_dust2
    const m = mapName.match(/^([a-z]+_[a-z0-9]+)/i);
    if (m && m[1] !== mapName) variants.add(m[1]);
    const sources = (name: string) => [
      `https://image.gametracker.com/images/maps/160x120/cs/${name}.jpg`,
      `https://image.gametracker.com/images/maps/160x120/${name}.jpg`,
      `https://image.gametracker.com/images/maps/320x240/${name}.jpg`,
    ];
    return Array.from(variants).flatMap(sources);
  })();

  const [imgIdx, setImgIdx] = useState(0);
  useEffect(() => { setImgIdx(0); }, [mapName]);
  const mapImg = mapCandidates[imgIdx] ?? null;

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border border-border bg-card shadow-card flex flex-col",
        "transition hover:border-accent/60 hover:-translate-y-0.5",
      )}
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-brand z-30" />

      {/* Map banner */}
      <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-secondary via-card to-secondary/40">
        {mapImg && (
          <img
            src={mapImg}
            alt={mapName ?? ""}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImgIdx((i) => i + 1)}
            className="absolute inset-0 w-full h-full object-cover scale-105 group-hover:scale-110 transition-transform duration-500"
          />
        )}
        {!mapImg && (
          <div aria-hidden className="absolute inset-0 flex items-center justify-center">
            <MapPin className="h-12 w-12 text-accent/20" />
          </div>
        )}
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-card/10" />

        {/* Top row: flag/mode + status */}
        <div className="absolute inset-x-0 top-0 p-3 flex items-start justify-between gap-2 z-10">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-background/70 backdrop-blur-sm border border-border/50">
            <span className="text-base leading-none">{server.flag}</span>
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-foreground">
              {server.mode || "CS 1.6"}
            </span>
          </div>
          {server.comingSoon ? (
            <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md bg-warning/90 text-warning-foreground backdrop-blur-sm">
              {t("common.comingSoon")}
            </span>
          ) : (
            <span
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md backdrop-blur-sm border",
                online
                  ? "bg-success/90 text-success-foreground border-success/40"
                  : "bg-destructive/90 text-destructive-foreground border-destructive/40",
              )}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  online ? "bg-success-foreground animate-pulse" : "bg-destructive-foreground",
                )}
              />
              {online ? t("common.online") : t("common.offline")}
            </span>
          )}
        </div>

        {/* Bottom: current map name */}
        {!server.comingSoon && mapName && (
          <div className="absolute inset-x-0 bottom-0 p-3 z-10">
            <p className="text-[10px] uppercase tracking-[0.25em] text-accent font-bold drop-shadow">
              {t("servers.currentMap")}
            </p>
            <p className="font-display text-xl font-bold text-foreground leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              {mapName}
            </p>
          </div>
        )}
      </div>

      {/* Info area */}
      <div className="relative z-10 p-5 flex flex-col gap-4 flex-1">
        <h3 className="font-display text-xl font-bold leading-tight">
          {server.name}
        </h3>

        {!compact && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {server.description}
          </p>
        )}

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-border bg-secondary/40 p-3">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              <Users className="h-3.5 w-3.5 text-accent" />
              {t("servers.playersLabel")}
            </div>
            <p className="font-display text-xl font-bold text-foreground mt-1 tabular-nums">
              {playersTxt}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-secondary/40 p-3 min-w-0">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              <MapPin className="h-3.5 w-3.5 text-accent" />
              {t("servers.mapLabel")}
            </div>
            <p className="font-display text-xl font-bold text-foreground mt-1 truncate">
              {server.comingSoon ? "—" : mapName ?? "—"}
            </p>
          </div>
        </div>

        {!server.comingSoon && (
          <div className="flex items-center gap-2 rounded-md border border-border bg-secondary/40 px-3 py-2">
            <Activity className="h-4 w-4 text-accent shrink-0" />
            <code className="text-xs font-mono flex-1 truncate">
              {serverAddress(server)}
            </code>
            <button
              onClick={onCopy}
              className="p-1 hover:text-accent transition"
              aria-label={t("card.copyIp")}
            >
              {copied ? (
                <Check className="h-4 w-4 text-success" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </div>
        )}

        <div className="flex gap-2 mt-auto">
          <Link
            to="/servidores/$slug"
            params={{ slug: server.slug }}
            className="flex-1 px-3 py-2 text-sm font-semibold uppercase tracking-wider rounded-md border border-border hover:bg-secondary text-center transition"
          >
            {t("card.details")}
          </Link>
          {!server.comingSoon && (
            <a
              href={steamConnectUrl(server)}
              className="flex-1 px-3 py-2 text-sm font-semibold uppercase tracking-wider rounded-md bg-gradient-brand text-brand-foreground text-center hover:opacity-90 transition shadow-glow"
            >
              {t("card.connect")}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
