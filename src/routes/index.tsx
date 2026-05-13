import { createFileRoute, Link } from "@tanstack/react-router";
import { SERVERS } from "@/lib/servers";
import { ServerCard } from "@/components/server-card";
import heroBg from "@/assets/hero-bg.jpg";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "CS Nostalgia — Servidores Counter-Strike 1.6" },
      {
        name: "description",
        content:
          "7 servidores 24/7 de Counter-Strike 1.6: 4Fun, Fy Pool Day, Zombie Plague, Pregame e mais. Conecte-se agora.",
      },
    ],
  }),
});

function Index() {
  return (
    <>
      <section
        className="relative overflow-hidden border-b border-border"
        style={{
          backgroundImage: `linear-gradient(180deg, oklch(0.16 0.05 255 / 0.85), oklch(0.18 0.05 255 / 0.95)), url(${heroBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="container mx-auto px-4 py-20 md:py-32 text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-accent mb-4 font-semibold">
            Counter-Strike 1.6 — Brasil & Venezuela
          </p>
          <h1 className="font-display text-5xl md:text-7xl font-bold leading-none">
            <span className="text-gradient">CS NOSTALGIA</span>
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground">
            Reviva o clássico. {SERVERS.filter((s) => !s.comingSoon).length}{" "}
            servidores ativos, comunidade unida, gameplay nostálgico do CS 1.6
            como deve ser.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            <Link
              to="/servidores"
              className="px-6 py-3 text-sm font-bold uppercase tracking-wider rounded-md bg-gradient-brand text-brand-foreground shadow-glow hover:opacity-90 transition"
            >
              Ver Servidores
            </Link>
            <Link
              to="/loja"
              className="px-6 py-3 text-sm font-bold uppercase tracking-wider rounded-md border border-border hover:bg-secondary transition"
            >
              Loja VIP
            </Link>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <div className="flex items-end justify-between mb-8 flex-wrap gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-accent font-semibold">
              Status ao vivo
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-bold mt-1">
              Nossos Servidores
            </h2>
          </div>
          <Link
            to="/servidores"
            className="text-sm uppercase tracking-wider text-muted-foreground hover:text-accent transition"
          >
            Ver todos →
          </Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SERVERS.map((s) => (
            <ServerCard key={s.slug} server={s} />
          ))}
        </div>
      </section>
    </>
  );
}
