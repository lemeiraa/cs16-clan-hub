import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Video, VideoOff } from "lucide-react";

const VIDEO_ID = "RP1KcZhLPUw";
const STORAGE_KEY = "hero-video-enabled";

function detectLowPower(): boolean {
  if (typeof window === "undefined") return true;
  // Mobile / coarse pointer
  if (window.matchMedia?.("(max-width: 820px)").matches) return true;
  if (window.matchMedia?.("(pointer: coarse)").matches) return true;
  // Reduced motion preference
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return true;
  // Low CPU
  const hc = (navigator as Navigator & { hardwareConcurrency?: number })
    .hardwareConcurrency;
  if (typeof hc === "number" && hc > 0 && hc < 4) return true;
  // Low memory (Chrome)
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  if (typeof mem === "number" && mem > 0 && mem < 4) return true;
  // Save-Data / slow connection
  const conn = (
    navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
    }
  ).connection;
  if (conn?.saveData) return true;
  if (conn?.effectiveType && /^(slow-2g|2g|3g)$/.test(conn.effectiveType))
    return true;
  return false;
}

export function HeroVideo() {
  const { t } = useTranslation();
  const [enabled, setEnabled] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "1") setEnabled(true);
      else if (saved === "0") setEnabled(false);
      else setEnabled(!detectLowPower());
    } catch {
      setEnabled(!detectLowPower());
    }
  }, []);

  const toggle = () => {
    setEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  return (
    <>
      {hydrated && enabled && (
        <div
          className="absolute inset-0 overflow-hidden pointer-events-none"
          aria-hidden
        >
          <iframe
            title="Hero background video"
            src={`https://www.youtube-nocookie.com/embed/${VIDEO_ID}?autoplay=1&mute=1&loop=1&playlist=${VIDEO_ID}&controls=0&showinfo=0&modestbranding=1&rel=0&iv_load_policy=3&playsinline=1&disablekb=1`}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen={false}
            frameBorder={0}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[177.78vh] min-w-full h-[56.25vw] min-h-full"
          />
          {/* Dark overlay for legibility */}
          <div className="absolute inset-0 bg-[oklch(0.16_0.05_255/0.78)]" />
        </div>
      )}

      {hydrated && (
        <button
          type="button"
          onClick={toggle}
          aria-pressed={enabled}
          className="absolute top-4 right-4 z-10 inline-flex items-center gap-2 rounded-full border border-border bg-card/70 backdrop-blur-sm px-3 py-1.5 text-[10px] uppercase tracking-wider font-semibold hover:border-accent hover:bg-card transition"
        >
          {enabled ? (
            <>
              <VideoOff className="h-3.5 w-3.5" />
              {t("home.heroVideoDisable")}
            </>
          ) : (
            <>
              <Video className="h-3.5 w-3.5" />
              {t("home.heroVideoEnable")}
            </>
          )}
        </button>
      )}
    </>
  );
}
