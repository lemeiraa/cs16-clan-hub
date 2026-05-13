import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Users, MapPin, Activity, Copy, Check } from "lucide-react";
import { useState } from "react";
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
    toast.success("IP copiado!", { description: serverAddress(server) });
    setTimeout(() => setCopied(false), 1500);
  };

  const online = status?.online && !server.comingSoon;
  const playersTxt = server.comingSoon
    ? "Em breve"
    : isLoading
      ? "..."
      : `${status?.players ?? 0}/${status?.maxPlayers ?? 0}`;

  const mapName = !server.comingSoon ? status?.map ?? null : null;
  const mapImg = mapName
    ? `https://image.gametracker.com/images/maps/160x120/${mapName}.jpg`
    : null;

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border border-border bg-card shadow-card",
        "transition hover:border-accent/60 hover:-translate-y-0.5",
      )}
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-brand z-20" />
      {mapImg && (
        <>
          <div
            aria-hidden
            className="absolute inset-0 bg-cover bg-center opacity-30 group-hover:opacity-40 transition-opacity"
            style={{ backgroundImage: `url(${mapImg})` }}
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-b from-card/70 via-card/85 to-card"
          />
        </>
      )}
      <div className="relative z-10 p-5 flex flex-col gap-4 [&_h3]:drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] [&_code]:drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xl">{server.flag}</span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                {server.mode}
              </span>
            </div>
            <h3 className="font-display text-lg font-bold mt-1 truncate">
              {server.name}
            </h3>
          </div>
          {server.comingSoon ? (
            <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded bg-warning/20 text-warning">
              Em breve
            </span>
          ) : (
            <span
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded",
                online
                  ? "bg-success/20 text-success"
                  : "bg-destructive/20 text-destructive",
              )}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  online ? "bg-success animate-pulse" : "bg-destructive",
                )}
              />
              {online ? "Online" : "Offline"}
            </span>
          )}
        </div>

        {!compact && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {server.description}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4 text-accent" />
            <span className="font-mono text-foreground">{playersTxt}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground min-w-0">
            <MapPin className="h-4 w-4 text-accent shrink-0" />
            <span className="font-mono text-foreground truncate">
              {server.comingSoon ? "—" : status?.map ?? "—"}
            </span>
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
              aria-label="Copiar IP"
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
            Ver detalhes
          </Link>
          {!server.comingSoon && (
            <a
              href={steamConnectUrl(server)}
              className="flex-1 px-3 py-2 text-sm font-semibold uppercase tracking-wider rounded-md bg-gradient-brand text-brand-foreground text-center hover:opacity-90 transition"
            >
              Conectar
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
