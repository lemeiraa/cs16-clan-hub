import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/403")({
  component: ForbiddenPage,
  head: () => ({
    meta: [
      { title: "403 — Acesso negado | CS Nostalgia" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function ForbiddenPage() {
  const { t } = useTranslation();
  const router = useRouter();

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
        <p className="mt-2 text-xs text-muted-foreground">
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
