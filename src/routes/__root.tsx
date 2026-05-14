import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useServerFn } from "@tanstack/react-start";
import { Toaster } from "@/components/ui/sonner";

import appCss from "../styles.css?url";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { ScrollToTop } from "@/components/scroll-to-top";
import "@/i18n";
import { changeLang, hasUserChosen, type Lang, SUPPORTED } from "@/i18n";
import { getSuggestedLocale } from "@/lib/geo.functions";

function NotFoundComponent() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <h1 className="font-display text-7xl font-bold text-gradient">404</h1>
          <h2 className="mt-4 text-xl font-semibold">{t("notFound.title")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t("notFound.text")}</p>
          <div className="mt-6">
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-md bg-gradient-brand px-4 py-2 text-sm font-medium text-brand-foreground hover:opacity-90 transition"
            >
              {t("common.backHome")}
            </Link>
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  const { t } = useTranslation();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          {t("errorPage.title")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition"
          >
            {t("common.retry")}
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent transition"
          >
            {t("nav.home")}
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "CS Nostalgia — Servidores de Counter-Strike 1.6" },
      {
        name: "description",
        content:
          "Comunidade CS Nostalgia: 7 servidores brasileiros e venezuelanos de Counter-Strike 1.6. 4Fun, Fy Pool Day, Zombie Plague, Pregame e mais.",
      },
      { property: "og:title", content: "CS Nostalgia — Servidores de Counter-Strike 1.6" },
      {
        property: "og:description",
        content:
          "Servidores 24/7 de CS 1.6 com loja de VIP e Ammo Packs. Conecte-se agora.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "CS Nostalgia — Servidores de Counter-Strike 1.6" },
      { name: "description", content: "Counter Strike Hub is a website for managing Counter Strike 1.6 servers, displaying player counts, maps, and server-specific pages." },
      { property: "og:description", content: "Counter Strike Hub is a website for managing Counter Strike 1.6 servers, displaying player counts, maps, and server-specific pages." },
      { name: "twitter:description", content: "Counter Strike Hub is a website for managing Counter Strike 1.6 servers, displaying player counts, maps, and server-specific pages." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/2634fa99-3024-46f5-a370-2563edd6aa79/id-preview-83aa8b79--3193e7e7-c2ec-4d95-8650-b70a5001cc95.lovable.app-1778675989948.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/2634fa99-3024-46f5-a370-2563edd6aa79/id-preview-83aa8b79--3193e7e7-c2ec-4d95-8650-b70a5001cc95.lovable.app-1778675989948.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const detectLocale = useServerFn(getSuggestedLocale);

  // On first visit (no saved preference), auto-detect language by IP location
  useEffect(() => {
    if (hasUserChosen()) return;
    let cancelled = false;
    detectLocale()
      .then((res) => {
        if (cancelled) return;
        if (res?.locale && SUPPORTED.includes(res.locale as Lang)) {
          changeLang(res.locale as Lang, false);
        }
      })
      .catch(() => { /* keep default */ });
    return () => { cancelled = true; };
  }, [detectLocale]);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen flex flex-col scanline">
        <SiteHeader />
        <main className="flex-1">
          <Outlet />
        </main>
        <SiteFooter />
      </div>
      <ScrollToTop />
      <Toaster />
    </QueryClientProvider>
  );
}
