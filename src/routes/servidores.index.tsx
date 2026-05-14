import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ServerCard } from "@/components/server-card";
import { fetchServers } from "@/lib/servers-db";

export const Route = createFileRoute("/servidores/")({
  component: ServidoresPage,
});

function ServidoresPage() {
  const { t } = useTranslation();
  const { data: servers = [], isLoading } = useQuery({
    queryKey: ["servers"],
    queryFn: fetchServers,
    staleTime: 30_000,
  });

  return (
    <section className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.3em] text-accent font-semibold">
          {t("common.community")}
        </p>
        <h1 className="font-display text-4xl font-bold mt-1">{t("servers.listTitle")}</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">{t("servers.listSub")}</p>
      </div>
      {isLoading ? (
        <p className="text-muted-foreground">{t("servers.loading")}</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {servers.map((s) => (
            <ServerCard key={s.slug} server={s} />
          ))}
        </div>
      )}
    </section>
  );
}
