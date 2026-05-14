import { useInfiniteQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { Loader2, UserPlus } from "lucide-react";
import { getRecentUsers, type RecentUser } from "@/lib/users.functions";
import { csAvatarFor } from "@/lib/cs-avatars";

const PAGE_SIZE = 20;


function formatRelative(iso: string, lang: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.max(1, Math.floor(diffMs / 60000));
  const rtf = new Intl.RelativeTimeFormat(
    lang === "en" ? "en" : lang === "es" ? "es" : "pt-BR",
    { numeric: "auto" },
  );
  if (mins < 60) return rtf.format(-mins, "minute");
  const hours = Math.floor(mins / 60);
  if (hours < 24) return rtf.format(-hours, "hour");
  const days = Math.floor(hours / 24);
  return rtf.format(-days, "day");
}

function UserChip({ user, lang }: { user: RecentUser; lang: string }) {
  const fallback = csAvatarFor(user.id);
  const hasCustomAvatar =
    typeof user.avatar_url === "string" && user.avatar_url.trim().length > 0;
  const initialSrc = hasCustomAvatar ? (user.avatar_url as string) : fallback.src;
  return (
    <Link
      to="/jogadores/$id"
      params={{ id: user.id }}
      className="flex items-center gap-3 rounded-full border border-border bg-card/70 backdrop-blur-sm px-4 py-2 shrink-0 hover:border-accent hover:bg-card transition"
    >
      <img
        src={initialSrc}
        alt={`${user.nick} — ${fallback.side} ${fallback.name}`}
        className="h-8 w-8 rounded-full object-cover border border-border bg-card"
        loading="lazy"
        width={32}
        height={32}
        onError={(e) => {
          const img = e.currentTarget;
          if (img.src !== fallback.src) img.src = fallback.src;
        }}
      />
      <span
        className={`text-[8px] font-bold uppercase px-1 rounded-sm ${
          fallback.side === "CT" ? "bg-blue-600 text-white" : "bg-amber-600 text-white"
        }`}
        aria-hidden
      >
        {fallback.side}
      </span>
      <div className="leading-tight">
        <p className="text-sm font-semibold">{user.nick}</p>
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {formatRelative(user.created_at, lang)}
        </p>
      </div>
    </Link>
  );
}

export function RecentUsersMarquee() {
  const { t, i18n } = useTranslation();
  const fetchUsers = useServerFn(getRecentUsers);
  const {
    data,
    isLoading,
    fetchNextPage,
    isFetchingNextPage,
    hasNextPage,
  } = useInfiniteQuery({
    queryKey: ["recent-users"],
    queryFn: ({ pageParam = 0 }) =>
      fetchUsers({ data: { limit: PAGE_SIZE, offset: pageParam } }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length < PAGE_SIZE ? undefined : allPages.length * PAGE_SIZE,
    staleTime: 60_000,
    refetchInterval: 120_000,
  });

  const users: RecentUser[] = (data?.pages ?? []).flat();

  if (!isLoading && users.length === 0) return null;

  // Duplicate for seamless infinite loop
  const loop = users.length > 0 ? [...users, ...users] : [];

  return (
    <section className="border-y border-border bg-card/30">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-accent font-semibold flex items-center gap-2">
              <UserPlus className="h-3.5 w-3.5" /> {t("home.newUsersEyebrow")}
            </p>
            <h2 className="font-display text-xl md:text-2xl font-bold mt-1">
              {t("home.newUsersTitle")}
              {users.length > 0 && (
                <span className="ml-2 text-xs font-normal text-muted-foreground tabular-nums">
                  ({users.length})
                </span>
              )}
            </h2>
          </div>
          <p className="text-xs text-muted-foreground">
            {t("home.newUsersHint")}
          </p>
        </div>

        {isLoading ? (
          <div className="flex gap-3 overflow-hidden">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-12 w-44 rounded-full border border-border bg-card animate-pulse shrink-0"
              />
            ))}
          </div>
        ) : (
          <div
            className="relative overflow-hidden"
            style={{
              maskImage:
                "linear-gradient(to right, transparent, black 5%, black 95%, transparent)",
              WebkitMaskImage:
                "linear-gradient(to right, transparent, black 5%, black 95%, transparent)",
            }}
          >
            <div className="flex gap-3 w-max animate-marquee">
              {loop.map((u, i) => (
                <UserChip key={`${u.id}-${i}`} user={u} lang={i18n.language} />
              ))}
            </div>
          </div>
        )}

        {hasNextPage && (
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 backdrop-blur-sm px-4 py-2 text-xs uppercase tracking-wider font-semibold hover:border-accent hover:bg-card transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isFetchingNextPage && (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              )}
              {isFetchingNextPage
                ? t("common.loading")
                : t("home.newUsersLoadMore")}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
