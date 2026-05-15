import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useTranslation } from "react-i18next";
import { Calendar, Hash, User as UserIcon } from "lucide-react";
import { getPublicProfile } from "@/lib/users.functions";
import { csAvatarFor } from "@/lib/cs-avatars";
import { RoleBadge } from "@/components/role-badge";

export const Route = createFileRoute("/jogadores/$id")({
  component: PlayerPage,
  head: ({ params }) => ({
    meta: [
      { title: `Jogador — CS Nostalgia` },
      { name: "description", content: `Perfil público do jogador ${params.id}` },
    ],
  }),
  notFoundComponent: NotFoundPlayer,
  errorComponent: ({ error }) => (
    <section className="container mx-auto px-4 py-20 text-center">
      <h1 className="font-display text-2xl font-bold">Erro</h1>
      <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
    </section>
  ),
});

function NotFoundPlayer() {
  const { t } = useTranslation();
  return (
    <section className="container mx-auto px-4 py-20 text-center">
      <p className="font-display text-7xl font-bold text-gradient">404</p>
      <h1 className="mt-3 font-display text-2xl font-bold">
        {t("player.notFoundTitle")}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {t("player.notFoundText")}
      </p>
      <Link
        to="/"
        className="inline-flex mt-6 items-center justify-center rounded-md bg-gradient-brand px-4 py-2 text-sm font-bold uppercase tracking-wider text-brand-foreground hover:opacity-90 transition"
      >
        {t("common.backHome")}
      </Link>
    </section>
  );
}

function initials(nick: string) {
  return nick.trim().slice(0, 2).toUpperCase();
}

function PlayerPage() {
  const { id } = Route.useParams();
  const { t, i18n } = useTranslation();
  const fetchProfile = useServerFn(getPublicProfile);
  const dateLocale = i18n.language === "en" ? "en-US" : i18n.language === "es" ? "es-ES" : "pt-BR";

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ["public-profile", id],
    queryFn: () => fetchProfile({ data: { id } }),
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto h-64 rounded-2xl border border-border bg-card animate-pulse" />
      </section>
    );
  }

  if (error) throw error;
  if (!profile) throw notFound();

  const createdDate = new Date(profile.created_at);
  const memberSince = createdDate.toLocaleDateString(dateLocale, {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const daysSince = Math.max(
    1,
    Math.floor((Date.now() - createdDate.getTime()) / 86400000),
  );

  return (
    <section className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto">
        <Link
          to="/"
          className="text-xs uppercase tracking-wider text-muted-foreground hover:text-accent transition"
        >
          ← {t("common.backHome")}
        </Link>

        <div className="mt-4 rounded-2xl border border-border bg-card overflow-hidden shadow-card">
          <div className="bg-gradient-brand h-24" />
          <div className="px-6 pb-6 -mt-12">
            {(() => {
              const av = csAvatarFor(profile.id);
              const src = profile.avatar_url ?? av.src;
              return (
                <div className="relative inline-block">
                  <img
                    src={src}
                    alt={profile.nick}
                    className="h-24 w-24 rounded-full object-cover border-4 border-card bg-card"
                    width={96}
                    height={96}
                  />
                  {!profile.avatar_url && (
                    <span
                      className={`absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border-2 border-card ${
                        av.side === "CT"
                          ? "bg-blue-600 text-white"
                          : "bg-amber-600 text-white"
                      }`}
                    >
                      {av.side} · {av.name}
                    </span>
                  )}
                </div>
              );
            })()}

            <div className="mt-4 flex items-start justify-between gap-3 flex-wrap">
              <div>
                <h1 className="font-display text-3xl font-bold">{profile.nick}</h1>
                <p className="text-xs uppercase tracking-wider text-muted-foreground mt-1 flex items-center gap-1.5">
                  <UserIcon className="h-3 w-3" />
                  {t("player.publicProfile")}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {profile.roles.length === 0 ? (
                  <span className="px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider bg-secondary text-secondary-foreground font-semibold">
                    {t("player.member")}
                  </span>
                ) : (
                  profile.roles.map((role) => <RoleBadge key={role} role={role} />)
                )}
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <InfoTile
                icon={<Calendar className="h-4 w-4" />}
                label={t("player.memberSince")}
                value={memberSince}
              />
              <InfoTile
                icon={<Hash className="h-4 w-4" />}
                label={t("player.memberNumber")}
                value={`#${profile.memberNumber}`}
              />
              <InfoTile
                icon={<UserIcon className="h-4 w-4" />}
                label={t("player.daysInCommunity")}
                value={String(daysSince)}
              />
            </div>

            <p className="mt-6 text-xs text-muted-foreground">
              {t("player.privacyNote")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function InfoTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-background/40 p-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
        {icon}
        {label}
      </p>
      <p className="mt-1 font-semibold text-sm">{value}</p>
    </div>
  );
}
