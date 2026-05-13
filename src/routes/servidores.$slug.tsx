import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Copy, Check, Users, MapPin, ExternalLink } from "lucide-react";
import type { ServerInfo } from "@/lib/servers";
import { serverAddress, steamConnectUrl } from "@/lib/servers";
import { fetchServerBySlug } from "@/lib/servers-db";
import { getServerStatus } from "@/lib/gametracker.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/servidores/$slug")({
  component: ServerDetail,
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug} — CS Nostalgia` },
      {
        name: "description",
        content: "Servidor de Counter-Strike 1.6 — CS Nostalgia",
      },
    ],
  }),
});

function ServerDetail() {
  const { slug } = Route.useParams();
  const { data: server, isLoading: loadingServer } = useQuery({
    queryKey: ["server", slug],
    queryFn: () => fetchServerBySlug(slug),
    staleTime: 30_000,
  });
  const fetchStatus = useServerFn(getServerStatus);
  const [tab, setTab] = useState<"players" | "ranking" | "comandos" | "regras">(
    "players",
  );
  const [copied, setCopied] = useState(false);

  const { data: status, isLoading, isFetching, dataUpdatedAt } = useQuery({
    queryKey: ["server-status", slug],
    queryFn: () => fetchStatus({ data: { slug } }),
    refetchInterval: server?.comingSoon ? false : 15_000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    enabled: !!server && !server.comingSoon,
  });

  if (loadingServer) {
    return (
      <section className="container mx-auto px-4 py-10">
        <p className="text-muted-foreground">Carregando servidor...</p>
      </section>
    );
  }
  if (!server) {
    throw notFound();
  }
  const srv: ServerInfo = server;

  const onCopy = async () => {
    await navigator.clipboard.writeText(serverAddress(srv));
    setCopied(true);
    toast.success("IP copiado!");
    setTimeout(() => setCopied(false), 1500);
  };


  return (
    <section className="container mx-auto px-4 py-10">
      <Link
        to="/servidores"
        className="text-sm text-muted-foreground hover:text-foreground transition"
      >
        ← Todos os servidores
      </Link>

      <header className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{srv.flag}</span>
            <span className="text-xs uppercase tracking-[0.3em] text-accent font-semibold">
              {srv.mode}
            </span>
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold mt-2">
            {srv.name}
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            {srv.description}
          </p>
        </div>
        {!srv.comingSoon && (
          <div className="flex flex-col gap-2 min-w-[260px]">
            <div className="flex items-center gap-2 rounded-md border border-border bg-secondary/40 px-3 py-2">
              <code className="text-sm font-mono flex-1 truncate">
                {serverAddress(srv)}
              </code>
              <button onClick={onCopy} className="p-1 hover:text-accent">
                {copied ? (
                  <Check className="h-4 w-4 text-success" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
            <a
              href={steamConnectUrl(srv)}
              className="px-4 py-3 text-sm font-bold uppercase tracking-wider rounded-md bg-gradient-brand text-brand-foreground text-center shadow-glow hover:opacity-90 transition"
            >
              Conectar via Steam
            </a>
          </div>
        )}
      </header>

      {!srv.comingSoon && (
        <>
          <div className="mt-8 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="relative inline-flex h-2 w-2">
                <span className={cn("absolute inline-flex h-full w-full rounded-full opacity-75", isFetching ? "animate-ping bg-success" : "bg-success/60")} />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
              </span>
              <span className="uppercase tracking-wider font-semibold">Ao vivo</span>
              {dataUpdatedAt > 0 && (
                <span>· atualizado {new Date(dataUpdatedAt).toLocaleTimeString("pt-BR")}</span>
              )}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3 mt-3">
            <StatCard
              label="Status"
              value={status?.online ? "Online" : isLoading ? "..." : "Offline"}
              tone={status?.online ? "success" : "destructive"}
            />
            <StatCard
              icon={<Users className="h-5 w-5" />}
              label="Jogadores"
              value={
                isLoading
                  ? "..."
                  : `${status?.players ?? 0}/${status?.maxPlayers ?? 0}`
              }
            />
            <StatCard
              icon={<MapPin className="h-5 w-5" />}
              label="Mapa"
              value={isLoading ? "..." : status?.map ?? "—"}
            />
          </div>
        </>
      )}

      <div className="mt-10 border-b border-border flex flex-wrap gap-1">
        {(
          [
            ["players", "Jogadores online"],
            ["ranking", "Top Ranking"],
            ["comandos", "Comandos"],
            ["regras", "Regras"],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={cn(
              "px-4 py-3 text-sm font-semibold uppercase tracking-wider transition border-b-2",
              tab === k
                ? "border-accent text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {srv.comingSoon && (
          <p className="text-muted-foreground">
            Este servidor estará disponível em breve. Fique de olho!
          </p>
        )}
        {!srv.comingSoon && tab === "players" && (
          <PlayersTable players={status?.livePlayers ?? []} loading={isLoading} />
        )}
        {!srv.comingSoon && tab === "ranking" && (
          <RankingTable players={status?.topPlayers ?? []} loading={isLoading} />
        )}
        {tab === "comandos" && <CommandsList server={srv} />}
        {tab === "regras" && <RulesList server={srv} />}
      </div>

      {!srv.comingSoon && (
        <a
          href={`https://www.gametracker.com/server_info/${serverAddress(srv)}/`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-accent"
        >
          Ver no GameTracker <ExternalLink className="h-3 w-3" />

        </a>
      )}
    </section>
  );
}

function StatCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  tone?: "success" | "destructive";
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-card">
      <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider">
        {icon}
        {label}
      </div>
      <p
        className={cn(
          "mt-2 font-display text-2xl font-bold",
          tone === "success" && "text-success",
          tone === "destructive" && "text-destructive",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function PlayersTable({
  players,
  loading,
}: {
  players: { name: string; score: number; timeMinutes: number }[];
  loading?: boolean;
}) {
  if (loading) return <p className="text-muted-foreground">Carregando...</p>;
  if (!players.length)
    return (
      <p className="text-muted-foreground">
        Nenhum jogador conectado no momento.
      </p>
    );
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-4 py-2 text-left">Jogador</th>
            <th className="px-4 py-2 text-right">Score</th>
            <th className="px-4 py-2 text-right">Tempo</th>
          </tr>
        </thead>
        <tbody>
          {players.map((p, i) => (
            <tr key={i} className="border-t border-border">
              <td className="px-4 py-2 font-mono">{p.name}</td>
              <td className="px-4 py-2 text-right font-mono">{p.score}</td>
              <td className="px-4 py-2 text-right text-muted-foreground">
                {Math.floor(p.timeMinutes / 60)}h{" "}
                {String(p.timeMinutes % 60).padStart(2, "0")}m
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RankingTable({
  players,
  loading,
}: {
  players: { rank: number; name: string; score: number; timeHours: number }[];
  loading?: boolean;
}) {
  if (loading) return <p className="text-muted-foreground">Carregando...</p>;
  if (!players.length)
    return (
      <p className="text-muted-foreground">
        Ranking não disponível no momento.
      </p>
    );
  const rankStyle = (rank: number) => {
    if (rank === 1)
      return {
        row: "bg-[oklch(0.85_0.15_85_/_0.12)] hover:bg-[oklch(0.85_0.15_85_/_0.18)]",
        badge: "bg-gradient-to-br from-[#FFD700] to-[#B8860B] text-black shadow-[0_0_12px_oklch(0.85_0.18_85_/_0.5)]",
        name: "text-[#FFD700] font-bold",
        medal: "🥇",
      };
    if (rank === 2)
      return {
        row: "bg-[oklch(0.8_0.02_250_/_0.1)] hover:bg-[oklch(0.8_0.02_250_/_0.16)]",
        badge: "bg-gradient-to-br from-[#E8E8E8] to-[#A8A8A8] text-black shadow-[0_0_10px_oklch(0.85_0.02_250_/_0.4)]",
        name: "text-[#D8D8D8] font-bold",
        medal: "🥈",
      };
    if (rank === 3)
      return {
        row: "bg-[oklch(0.55_0.13_50_/_0.12)] hover:bg-[oklch(0.55_0.13_50_/_0.18)]",
        badge: "bg-gradient-to-br from-[#CD7F32] to-[#7B4A1E] text-black shadow-[0_0_10px_oklch(0.6_0.15_50_/_0.4)]",
        name: "text-[#E08850] font-bold",
        medal: "🥉",
      };
    return { row: "", badge: "", name: "", medal: "" };
  };
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-4 py-2 text-left w-20">#</th>
            <th className="px-4 py-2 text-left">Jogador</th>
            <th className="px-4 py-2 text-right">Pontuação</th>
            <th className="px-4 py-2 text-right">Horas</th>
          </tr>
        </thead>
        <tbody>
          {players.map((p) => {
            const s = rankStyle(p.rank);
            const isPodium = p.rank <= 3;
            return (
              <tr key={p.rank} className={cn("border-t border-border transition", s.row)}>
                <td className="px-4 py-2">
                  {isPodium ? (
                    <span className={cn("inline-flex items-center gap-1.5 px-2 py-1 rounded-md font-mono font-bold text-xs", s.badge)}>
                      <span>{s.medal}</span> #{p.rank}
                    </span>
                  ) : (
                    <span className="font-mono text-muted-foreground">#{p.rank}</span>
                  )}
                </td>
                <td className={cn("px-4 py-2 font-mono", isPodium ? s.name : "")}>{p.name}</td>
                <td className={cn("px-4 py-2 text-right font-mono", isPodium && "font-bold")}>{p.score}</td>
                <td className="px-4 py-2 text-right text-muted-foreground">
                  {p.timeHours.toFixed(1)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function CommandsList({ server }: { server: ServerInfo }) {
  if (!server?.commands?.length)
    return <p className="text-muted-foreground">Sem comandos cadastrados.</p>;
  return (
    <div className="grid gap-2 md:grid-cols-2">
      {server.commands.map((c) => (
        <div
          key={c.cmd}
          className="rounded-md border border-border bg-card px-4 py-3"
        >
          <code className="text-accent font-mono">{c.cmd}</code>
          <p className="text-sm text-muted-foreground mt-1">{c.desc}</p>
        </div>
      ))}
    </div>
  );
}

function RulesList({ server }: { server: ServerInfo }) {
  if (!server?.rules?.length)
    return <p className="text-muted-foreground">Sem regras cadastradas.</p>;
  return (
    <ol className="space-y-2 list-decimal list-inside">
      {server.rules.map((r, i) => (
        <li key={i} className="text-sm">
          {r}
        </li>
      ))}
    </ol>
  );
}
