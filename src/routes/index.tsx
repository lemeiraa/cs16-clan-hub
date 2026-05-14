import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ServerCard } from "@/components/server-card";
import { RecentUsersMarquee } from "@/components/recent-users-marquee";
import { HeroVideo } from "@/components/hero-video";
import { fetchServers } from "@/lib/servers-db";
import { getAllServersStatus } from "@/lib/gametracker.functions";
import { supabase } from "@/integrations/supabase/client";
import { Newspaper, Pin, X, Users } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "CS Nostalgia — Servidores Counter-Strike 1.6" },
      {
        name: "description",
        content:
          "Servidores 24/7 de Counter-Strike 1.6: 4Fun, Fy Pool Day, Zombie Plague, Pregame e mais. Conecte-se agora.",
      },
    ],
  }),
});

function Index() {
  const { t } = useTranslation();
  const { data: servers = [] } = useQuery({
    queryKey: ["servers"],
    queryFn: fetchServers,
    staleTime: 30_000,
  });
  const activeCount = servers.filter((s) => !s.comingSoon).length;

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
        <HeroVideo />
        <div className="container mx-auto px-4 py-20 md:py-32 text-center relative z-10">
          <p className="text-xs uppercase tracking-[0.4em] text-accent mb-4 font-semibold">
            {t("home.eyebrow")}
          </p>
          <h1 className="font-display text-5xl md:text-7xl font-bold leading-none">
            <span className="text-gradient">CS NOSTALGIA</span>
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground">
            {t("home.heroSub", { count: activeCount })}
          </p>
          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            <Link
              to="/servidores"
              className="px-6 py-3 text-sm font-bold uppercase tracking-wider rounded-md bg-gradient-brand text-brand-foreground shadow-glow hover:opacity-90 transition"
            >
              {t("home.seeServers")}
            </Link>
            <Link
              to="/loja"
              className="px-6 py-3 text-sm font-bold uppercase tracking-wider rounded-md border border-border hover:bg-secondary transition"
            >
              {t("home.shopVip")}
            </Link>
          </div>
        </div>
      </section>

      

      <section className="container mx-auto px-4 py-16">
        <div className="flex items-end justify-between mb-8 flex-wrap gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-accent font-semibold">
              {t("home.statusLive")}
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-bold mt-1">
              {t("home.ourServers")}
            </h2>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <PlayersCounter />
            <Link
              to="/servidores"
              className="text-sm uppercase tracking-wider text-muted-foreground hover:text-accent transition"
            >
              {t("home.seeAll")}
            </Link>
          </div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {servers.map((s) => (
            <ServerCard key={s.slug} server={s} />
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 pb-20">
        <div className="text-center mb-10">
          <p className="text-xs uppercase tracking-[0.3em] text-accent font-semibold">
            {t("home.joinCommunity")}
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-bold mt-1">
            {t("home.communityTitle")}
          </h2>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
            {t("home.communitySub")}
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <a
            href="https://chat.whatsapp.com/JTiBGthp19X24XDRJmQVef"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 hover:border-accent transition shadow-sm hover:shadow-glow"
          >
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-[#25D366]/15 text-[#25D366] flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7"><path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 0 1 8.413 3.488 11.824 11.824 0 0 1 3.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
              </div>
              <div>
                <p className="font-display text-xl font-bold">{t("home.whatsapp")}</p>
                <p className="text-sm text-muted-foreground">{t("home.whatsappSub")}</p>
              </div>
            </div>
            <p className="mt-4 text-sm uppercase tracking-wider text-accent group-hover:translate-x-1 transition-transform">
              {t("home.joinGroup")}
            </p>
          </a>

          <a
            href="http://dsc.gg/csnostalgia"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 hover:border-accent transition shadow-sm hover:shadow-glow"
          >
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-[#5865F2]/15 text-[#5865F2] flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7"><path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
              </div>
              <div>
                <p className="font-display text-xl font-bold">{t("home.discord")}</p>
                <p className="text-sm text-muted-foreground">{t("home.discordSub")}</p>
              </div>
            </div>
            <p className="mt-4 text-sm uppercase tracking-wider text-accent group-hover:translate-x-1 transition-transform">
              {t("home.joinDiscord")}
            </p>
          </a>

          <a
            href="https://steamcommunity.com/groups/csnostalgiaoficial"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 hover:border-accent transition shadow-sm hover:shadow-glow"
          >
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-[#66c0f4]/15 text-[#66c0f4] flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7"><path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.605 0 11.979 0zM7.54 18.21l-1.473-.61c.262.543.714.999 1.314 1.25 1.297.539 2.793-.076 3.332-1.375.263-.63.264-1.319.005-1.949s-.75-1.121-1.377-1.383c-.624-.26-1.29-.249-1.878-.03l1.523.63c.956.4 1.409 1.5 1.009 2.455-.397.957-1.497 1.41-2.454 1.012H7.54zm11.415-9.303c0-1.662-1.353-3.015-3.015-3.015-1.665 0-3.015 1.353-3.015 3.015 0 1.665 1.35 3.015 3.015 3.015 1.663 0 3.015-1.35 3.015-3.015zm-5.273-.005c0-1.252 1.013-2.266 2.265-2.266 1.249 0 2.266 1.014 2.266 2.266 0 1.251-1.017 2.265-2.266 2.265-1.253 0-2.265-1.014-2.265-2.265z"/></svg>
              </div>
              <div>
                <p className="font-display text-xl font-bold">{t("home.steam")}</p>
                <p className="text-sm text-muted-foreground">{t("home.steamSub")}</p>
              </div>
            </div>
            <p className="mt-4 text-sm uppercase tracking-wider text-accent group-hover:translate-x-1 transition-transform">
              {t("home.joinGroup")}
            </p>
          </a>
        </div>
      </section>

      <NewsSection />
    </>
  );
}

function PlayersCounter() {
  const { t } = useTranslation();
  const fetchAll = useServerFn(getAllServersStatus);
  const { data, isLoading } = useQuery({
    queryKey: ["servers-status-all"],
    queryFn: () => fetchAll(),
    refetchInterval: 30_000,
    staleTime: 25_000,
  });
  const total = (data ?? []).reduce((acc, s) => acc + (s.online ? s.players : 0), 0);
  const max = (data ?? []).reduce((acc, s) => acc + (s.maxPlayers || 0), 0);
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-card/60 backdrop-blur-sm">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full rounded-full bg-success opacity-75 animate-ping" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
      </span>
      <Users className="h-4 w-4 text-accent" />
      <span className="text-sm font-semibold tabular-nums">
        {isLoading ? "…" : `${total}${max ? `/${max}` : ""}`}
      </span>
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
        {t("home.playersOnline")}
      </span>
    </div>
  );
}

type NewsItem = {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  image_url: string | null;
  pinned: boolean;
  created_at: string;
};

function NewsSection() {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === "en" ? "en-US" : i18n.language === "es" ? "es-ES" : "pt-BR";
  const [open, setOpen] = useState<NewsItem | null>(null);
  const { data: news = [], isLoading } = useQuery({
    queryKey: ["news", "home"],
    queryFn: async (): Promise<NewsItem[]> => {
      const { data, error } = await supabase
        .from("news")
        .select("id,title,excerpt,content,category,image_url,pinned,created_at")
        .eq("published", true)
        .order("pinned", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(6);
      if (error) throw error;
      return (data ?? []) as NewsItem[];
    },
    staleTime: 60_000,
  });

  if (!isLoading && news.length === 0) return null;

  return (
    <section className="container mx-auto px-4 pb-20">
      <div className="flex items-end justify-between mb-8 flex-wrap gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-accent font-semibold flex items-center gap-2">
            <Newspaper className="h-3.5 w-3.5" /> {t("home.newsEyebrow")}
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-bold mt-1">
            {t("home.newsTitle")}
          </h2>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-48 rounded-xl border border-border bg-card animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {news.map((n) => (
            <button
              key={n.id}
              onClick={() => setOpen(n)}
              className="group text-left rounded-xl border border-border bg-card overflow-hidden hover:border-accent transition shadow-sm hover:shadow-glow flex flex-col"
            >
              {n.image_url ? (
                <div
                  className="aspect-[16/9] bg-cover bg-center"
                  style={{ backgroundImage: `url(${n.image_url})` }}
                />
              ) : (
                <div className="aspect-[16/9] bg-gradient-brand/30 flex items-center justify-center">
                  <Newspaper className="h-10 w-10 text-accent/60" />
                </div>
              )}
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-accent/15 text-accent font-semibold">
                    {n.category}
                  </span>
                  {n.pinned && (
                    <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-primary/20 text-primary inline-flex items-center gap-1">
                      <Pin className="h-3 w-3" /> {t("home.pinned")}
                    </span>
                  )}
                </div>
                <h3 className="font-display text-lg font-bold mt-2 group-hover:text-accent transition">
                  {n.title}
                </h3>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-3">{n.excerpt}</p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-3">
                  {new Date(n.created_at).toLocaleDateString(dateLocale, {
                    day: "2-digit", month: "long", year: "numeric",
                  })}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center overflow-y-auto p-4"
          onClick={() => setOpen(null)}
        >
          <div
            className="bg-card rounded-xl border border-border max-w-2xl w-full my-8 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {open.image_url && (
              <div
                className="aspect-[16/9] bg-cover bg-center"
                style={{ backgroundImage: `url(${open.image_url})` }}
              />
            )}
            <div className="p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-accent/15 text-accent font-semibold">
                    {open.category}
                  </span>
                  <h3 className="font-display text-2xl font-bold mt-2">{open.title}</h3>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">
                    {new Date(open.created_at).toLocaleDateString(dateLocale, {
                      day: "2-digit", month: "long", year: "numeric",
                    })}
                  </p>
                </div>
                <button
                  onClick={() => setOpen(null)}
                  className="p-2 rounded-md hover:bg-secondary"
                  aria-label={t("common.close")}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="mt-4 text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {open.content || open.excerpt}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
