import { createFileRoute } from "@tanstack/react-router";
import { SERVERS } from "@/lib/servers";

export const Route = createFileRoute("/regras")({
  component: RegrasPage,
  head: () => ({
    meta: [
      { title: "Regras — CS Nostalgia" },
      { name: "description", content: "Regras gerais e por servidor da comunidade CS Nostalgia." },
    ],
  }),
});

function RegrasPage() {
  return (
    <section className="container mx-auto px-4 py-12">
      <p className="text-xs uppercase tracking-[0.3em] text-accent font-semibold">Comunidade</p>
      <h1 className="font-display text-4xl font-bold mt-1">Regras</h1>
      <p className="text-muted-foreground mt-2 max-w-2xl">
        Estas regras valem para todos os servidores. Cada servidor pode ter regras adicionais
        em sua página específica.
      </p>

      <div className="mt-8 rounded-xl border border-border bg-card p-6 shadow-card">
        <h2 className="font-display text-2xl font-bold">Regras gerais</h2>
        <ol className="mt-4 list-decimal list-inside space-y-2 text-sm">
          <li>Proibido qualquer cheat, hack, wallhack, aimbot ou exploit.</li>
          <li>Sem racismo, homofobia, xenofobia ou discurso de ódio.</li>
          <li>Sem flood ou spam no chat e mic.</li>
          <li>Sem propaganda de outros servidores ou comunidades.</li>
          <li>Respeite a decisão dos administradores — ela é final.</li>
          <li>Sem nicks ofensivos ou que se passem por admins.</li>
        </ol>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {SERVERS.filter((s) => !s.comingSoon).map((s) => (
          <div key={s.slug} className="rounded-xl border border-border bg-card p-5 shadow-card">
            <h3 className="font-display text-lg font-bold">{s.flag} {s.name}</h3>
            <ol className="mt-3 list-decimal list-inside space-y-1.5 text-sm text-muted-foreground">
              {s.rules.map((r, i) => <li key={i}>{r}</li>)}
            </ol>
          </div>
        ))}
      </div>
    </section>
  );
}
