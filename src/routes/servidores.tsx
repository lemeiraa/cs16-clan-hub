import { createFileRoute } from "@tanstack/react-router";
import { SERVERS } from "@/lib/servers";
import { ServerCard } from "@/components/server-card";

export const Route = createFileRoute("/servidores")({
  component: ServidoresPage,
  head: () => ({
    meta: [
      { title: "Servidores — CS Nostalgia" },
      {
        name: "description",
        content: "Lista completa dos servidores CS 1.6 da CS Nostalgia.",
      },
    ],
  }),
});

function ServidoresPage() {
  return (
    <section className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.3em] text-accent font-semibold">
          Comunidade
        </p>
        <h1 className="font-display text-4xl font-bold mt-1">
          Todos os Servidores
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Status, mapa atual e jogadores conectados — tudo em tempo real.
        </p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {SERVERS.map((s) => (
          <ServerCard key={s.slug} server={s} />
        ))}
      </div>
    </section>
  );
}
