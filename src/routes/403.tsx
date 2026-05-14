import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ShieldAlert, User as UserIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/403")({
  component: ForbiddenPage,
  head: () => ({
    meta: [
      { title: "403 — Acesso negado | CS Nostalgia" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

type SessionInfo = {
  loading: boolean;
  signedIn: boolean;
  email?: string;
  nick?: string;
  roles: string[];
};

function ForbiddenPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [info, setInfo] = useState<SessionInfo>({
    loading: true,
    signedIn: false,
    roles: [],
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) {
        if (!cancelled) setInfo({ loading: false, signedIn: false, roles: [] });
        return;
      }
      const [{ data: profile }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("nick").eq("id", user.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", user.id),
      ]);
      if (cancelled) return;
      setInfo({
        loading: false,
        signedIn: true,
        email: user.email ?? undefined,
        nick: profile?.nick ?? undefined,
        roles: (roles ?? []).map((r: { role: string }) => r.role),
      });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const rolesLabel = info.roles.length > 0 ? info.roles.join(", ") : t("forbidden.noRole");

  return (
    <section className="container mx-auto px-4 py-20">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <ShieldAlert className="h-10 w-10" />
        </div>
        <p className="font-display text-7xl font-bold text-gradient">403</p>
        <h1 className="mt-3 font-display text-2xl font-bold">
          {t("forbidden.title")}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {t("forbidden.text")}
        </p>

        {!info.loading && (
          <div className="mt-6 rounded-lg border border-border bg-card p-4 text-left">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
              <UserIcon className="h-3.5 w-3.5" />
              {t("forbidden.sessionLabel")}
            </div>
            {info.signedIn ? (
              <div className="mt-2 space-y-1 text-sm">
                <p>
                  <span className="text-muted-foreground">{t("forbidden.user")}:</span>{" "}
                  <span className="font-semibold">{info.nick ?? "—"}</span>
                  {info.email && (
                    <span className="text-muted-foreground"> ({info.email})</span>
                  )}
                </p>
                <p>
                  <span className="text-muted-foreground">{t("forbidden.role")}:</span>{" "}
                  <span className="font-mono font-semibold">{rolesLabel}</span>
                </p>
              </div>
            ) : (
              <p className="mt-2 text-sm">{t("forbidden.notSignedIn")}</p>
            )}
          </div>
        )}

        <p className="mt-4 text-xs text-muted-foreground">
          {t("forbidden.hint")}
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => router.history.back()}
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-semibold uppercase tracking-wider hover:bg-accent transition"
          >
            ← {t("common.back")}
          </button>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-gradient-brand px-4 py-2 text-sm font-bold uppercase tracking-wider text-brand-foreground hover:opacity-90 transition"
          >
            {t("common.backHome")}
          </Link>
          <Link
            to="/auth"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-semibold uppercase tracking-wider hover:bg-accent transition"
          >
            {t("forbidden.switchAccount")}
          </Link>
        </div>
      </div>
    </section>
  );
}
