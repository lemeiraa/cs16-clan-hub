import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
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

const PC_LINKS = [
  {
    label: "CS 1.6 Full (Torrent — recomendado)",
    url: "https://gamestracker.org/load/cs_1_6_full/9-1-0-1",
  },
  {
    label: "CS 1.6 Full (Mirror direto)",
    url: "https://csbots.eu/download/cs16_full.exe",
  },
  {
    label: "Cliente CS 1.6 (Mega.nz)",
    url: "https://mega.nz/file/cs16",
  },
];

const MOBILE_VIDEO_ID = "M9c6e3HSr2A"; // tutorial CS 1.6 Android

function DownloadsPage() {
  const [platform, setPlatform] = useState<Platform | null>(null);

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="text-center mb-10">
        <p className="text-xs uppercase tracking-[0.3em] text-accent mb-3">
          Counter-Strike 1.6
        </p>
        <h1 className="font-display text-4xl md:text-5xl font-bold mb-3">
          Downloads
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Escolha a sua plataforma para baixar o jogo e ver o tutorial de
          instalação para conectar aos servidores da CS Nostalgia.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-10">
        <PlatformCard
          icon={<Monitor className="h-10 w-10" />}
          title="CS 1.6 — PC"
          desc="Windows · versão clássica completa"
          active={platform === "pc"}
          onClick={() => setPlatform("pc")}
        />
        <PlatformCard
          icon={<Smartphone className="h-10 w-10" />}
          title="CS 1.6 — Mobile"
          desc="Android · com tutorial em vídeo"
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
      onClick={onClick}
      className={cn(
        "group text-left rounded-xl border-2 p-6 transition-all hover:scale-[1.02]",
        active
          ? "border-accent bg-accent/10 shadow-[0_0_30px_rgba(var(--accent-rgb,250,204,21),0.15)]"
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
  const steps = [
    "Baixe o instalador clicando em um dos links abaixo.",
    "Extraia o arquivo .rar / .zip em uma pasta de sua preferência (ex.: C:\\Games\\CS 1.6).",
    "Execute o arquivo cstrike.exe (ou hl.exe).",
    "Dentro do jogo, vá em Find Servers → Favorites → Add a Server.",
    "Cole o IP de um dos nossos servidores (veja em /servidores) e clique em Connect.",
  ];

  return (
    <section className="rounded-xl border border-border bg-card/60 p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h3 className="font-display text-xl font-bold mb-4 flex items-center gap-2">
        <Download className="h-5 w-5 text-accent" /> Links de download
      </h3>
      <ul className="space-y-2 mb-8">
        {PC_LINKS.map((link) => (
          <li key={link.url}>
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background/50 px-4 py-3 hover:border-accent hover:bg-accent/5 transition group"
            >
              <span className="text-sm font-medium">{link.label}</span>
              <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-accent" />
            </a>
          </li>
        ))}
      </ul>

      <h3 className="font-display text-xl font-bold mb-4">Tutorial de instalação</h3>
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
        <p className="text-sm text-muted-foreground">
          Pronto! Agora é só entrar no servidor e jogar. Em caso de dúvidas,
          fale com a gente no Discord ou WhatsApp.
        </p>
      </div>
    </section>
  );
}

function MobileSection() {
  const steps = [
    "Abra a Play Store e baixe o app Xash3D FWGS (gratuito).",
    "Baixe o pacote de dados do CS 1.6 para Android (link abaixo).",
    "Extraia o pacote e copie a pasta valve e cstrike para Android/data/in.celest.xash3d.hl/files/xash/",
    "Abra o Xash3D, escolha o mod Counter-Strike e toque em Iniciar.",
    "No menu do jogo, vá em Find Servers, adicione o IP do servidor CS Nostalgia e conecte.",
  ];

  const dataUrl = "https://www.moddb.com/games/counter-strike/downloads/cs-16-android-full";
  const apkUrl = "https://play.google.com/store/apps/details?id=in.celest.xash3d.hl";

  return (
    <section className="rounded-xl border border-border bg-card/60 p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      <div>
        <h3 className="font-display text-xl font-bold mb-4 flex items-center gap-2">
          <Smartphone className="h-5 w-5 text-accent" /> Vídeo tutorial
        </h3>
        <div className="aspect-video w-full rounded-lg overflow-hidden border border-border bg-black">
          <iframe
            className="w-full h-full"
            src={`https://www.youtube.com/embed/${MOBILE_VIDEO_ID}`}
            title="Como instalar CS 1.6 no Android"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>

      <div>
        <h3 className="font-display text-xl font-bold mb-4">Downloads necessários</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <a
            href={apkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background/50 px-4 py-3 hover:border-accent hover:bg-accent/5 transition group"
          >
            <span className="text-sm font-medium">Xash3D FWGS (Play Store)</span>
            <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-accent" />
          </a>
          <a
            href={dataUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background/50 px-4 py-3 hover:border-accent hover:bg-accent/5 transition group"
          >
            <span className="text-sm font-medium">Pacote de dados CS 1.6</span>
            <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-accent" />
          </a>
        </div>
      </div>

      <div>
        <h3 className="font-display text-xl font-bold mb-4">Passo a passo</h3>
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
        <p className="text-sm text-muted-foreground">
          O Xash3D é o motor open-source que roda CS 1.6 no Android. É legal e gratuito.
        </p>
      </div>
    </section>
  );
}
