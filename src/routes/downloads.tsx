import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Monitor, Smartphone, Download, ExternalLink, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/downloads")({
  component: DownloadsPage,
  head: () => ({
    meta: [
      { title: "Downloads — CS Nostalgia" },
      {
        name: "description",
        content:
          "Baixe Counter-Strike 1.6 para PC ou Mobile. Tutoriais de instalação e links diretos para começar a jogar nos servidores CS Nostalgia.",
      },
      { property: "og:title", content: "Downloads — CS Nostalgia" },
      {
        property: "og:description",
        content: "Baixe CS 1.6 para PC ou Mobile com tutoriais completos.",
      },
    ],
  }),
});

type Platform = "pc" | "mobile";

const PC_URLS = [
  "https://gamestracker.org/load/cs_1_6_full/9-1-0-1",
  "https://csbots.eu/download/cs16_full.exe",
  "https://mega.nz/file/cs16",
];

const MOBILE_VIDEO_ID = "M9c6e3HSr2A";
const MOBILE_APK_URL = "https://play.google.com/store/apps/details?id=in.celest.xash3d.hl";
const MOBILE_DATA_URL = "https://www.moddb.com/games/counter-strike/downloads/cs-16-android-full";

function DownloadsPage() {
  const { t } = useTranslation();
  const [platform, setPlatform] = useState<Platform | null>(null);

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="text-center mb-10">
        <p className="text-xs uppercase tracking-[0.3em] text-accent mb-3">
          {t("downloads.eyebrow")}
        </p>
        <h1 className="font-display text-4xl md:text-5xl font-bold mb-3">
          {t("downloads.title")}
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          {t("downloads.sub")}
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-10">
        <PlatformCard
          icon={<Monitor className="h-10 w-10" />}
          title={t("downloads.pcTitle")}
          desc={t("downloads.pcDesc")}
          active={platform === "pc"}
          onClick={() => setPlatform("pc")}
        />
        <PlatformCard
          icon={<Smartphone className="h-10 w-10" />}
          title={t("downloads.mobileTitle")}
          desc={t("downloads.mobileDesc")}
          active={platform === "mobile"}
          onClick={() => setPlatform("mobile")}
        />
      </div>

      {platform === "pc" && <PcSection />}
      {platform === "mobile" && <MobileSection />}
    </div>
  );
}

function PlatformCard({
  icon,
  title,
  desc,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "group text-left rounded-xl border-2 p-6 transition-all hover:scale-[1.02] cursor-pointer",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:scale-[1.02] focus-visible:border-accent",
        active
          ? "border-accent bg-accent/10"
          : "border-border bg-card hover:border-accent/50",
      )}
    >
      <div
        className={cn(
          "inline-flex p-3 rounded-lg mb-4 transition-colors",
          active ? "bg-accent text-accent-foreground" : "bg-secondary text-foreground",
        )}
      >
        {icon}
      </div>
      <h2 className="font-display text-2xl font-bold mb-1">{title}</h2>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </button>
  );
}

function PcSection() {
  const { t } = useTranslation();
  const labels = t("downloads.pcLinks", { returnObjects: true }) as string[];
  const steps = t("downloads.pcSteps", { returnObjects: true }) as string[];

  return (
    <section className="rounded-xl border border-border bg-card/60 p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h3 className="font-display text-xl font-bold mb-4 flex items-center gap-2">
        <Download className="h-5 w-5 text-accent" /> {t("downloads.linksTitle")}
      </h3>
      <ul className="space-y-2 mb-8">
        {PC_URLS.map((url, i) => (
          <li key={url}>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background/50 px-4 py-3 hover:border-accent hover:bg-accent/5 transition group"
            >
              <span className="text-sm font-medium">{labels[i]}</span>
              <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-accent" />
            </a>
          </li>
        ))}
      </ul>

      <h3 className="font-display text-xl font-bold mb-4">{t("downloads.tutorialTitle")}</h3>
      <ol className="space-y-3">
        {steps.map((step, i) => (
          <li key={i} className="flex gap-3">
            <span className="flex-shrink-0 h-7 w-7 rounded-full bg-accent text-accent-foreground font-bold text-sm flex items-center justify-center">
              {i + 1}
            </span>
            <p className="text-sm text-foreground/90 pt-0.5">{step}</p>
          </li>
        ))}
      </ol>

      <div className="mt-6 rounded-lg border border-accent/30 bg-accent/5 p-4 flex gap-3">
        <CheckCircle2 className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
        <p className="text-sm text-muted-foreground">{t("downloads.pcNote")}</p>
      </div>
    </section>
  );
}

function MobileSection() {
  const { t } = useTranslation();
  const steps = t("downloads.mobileSteps", { returnObjects: true }) as string[];

  return (
    <section className="rounded-xl border border-border bg-card/60 p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      <div>
        <h3 className="font-display text-xl font-bold mb-4 flex items-center gap-2">
          <Smartphone className="h-5 w-5 text-accent" /> {t("downloads.videoTitle")}
        </h3>
        <div className="aspect-video w-full rounded-lg overflow-hidden border border-border bg-black">
          <iframe
            className="w-full h-full"
            src={`https://www.youtube.com/embed/${MOBILE_VIDEO_ID}`}
            title={t("downloads.videoTitle")}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>

      <div>
        <h3 className="font-display text-xl font-bold mb-4">{t("downloads.downloadsNeeded")}</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <a
            href={MOBILE_APK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background/50 px-4 py-3 hover:border-accent hover:bg-accent/5 transition group"
          >
            <span className="text-sm font-medium">{t("downloads.mobileApk")}</span>
            <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-accent" />
          </a>
          <a
            href={MOBILE_DATA_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background/50 px-4 py-3 hover:border-accent hover:bg-accent/5 transition group"
          >
            <span className="text-sm font-medium">{t("downloads.mobileData")}</span>
            <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-accent" />
          </a>
        </div>
      </div>

      <div>
        <h3 className="font-display text-xl font-bold mb-4">{t("downloads.stepByStep")}</h3>
        <ol className="space-y-3">
          {steps.map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex-shrink-0 h-7 w-7 rounded-full bg-accent text-accent-foreground font-bold text-sm flex items-center justify-center">
                {i + 1}
              </span>
              <p className="text-sm text-foreground/90 pt-0.5">{step}</p>
            </li>
          ))}
        </ol>
      </div>

      <div className="rounded-lg border border-accent/30 bg-accent/5 p-4 flex gap-3">
        <CheckCircle2 className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
        <p className="text-sm text-muted-foreground">{t("downloads.mobileNote")}</p>
      </div>
    </section>
  );
}
