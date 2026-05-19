import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Globe, Check } from "lucide-react";
import { changeLang, type Lang } from "@/i18n";

const OPTIONS: { code: Lang; flag: string; label: string }[] = [
  { code: "pt", flag: "🇧🇷", label: "PT" },
  { code: "es", flag: "🇪🇸", label: "ES" },
  { code: "en", flag: "🇺🇸", label: "EN" },
];

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { i18n, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = (i18n.language?.slice(0, 2) as Lang) || "pt";
  const currentOpt = OPTIONS.find((o) => o.code === current) ?? OPTIONS[0];

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={
          "inline-flex items-center gap-1.5 rounded-md border border-border hover:bg-secondary transition " +
          (compact ? "px-2 py-1.5 text-xs" : "px-2.5 py-1.5 text-xs font-semibold")
        }
        aria-label={t("langSwitcher.label")}
      >
        <Globe className="h-3.5 w-3.5 text-muted-foreground" />
        <span>{currentOpt.flag}</span>
        <span className="font-mono">{currentOpt.label}</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-40 rounded-md border border-border bg-card shadow-lg z-50 overflow-hidden">
          <p className="px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border">
            {t("langSwitcher.label")}
          </p>
          {OPTIONS.map((opt) => {
            const active = opt.code === current;
            return (
              <button
                key={opt.code}
                onClick={() => {
                  changeLang(opt.code);
                  setOpen(false);
                }}
                className={
                  "w-full flex items-center justify-between gap-2 px-3 py-2 text-sm hover:bg-secondary transition " +
                  (active ? "text-accent font-semibold" : "text-foreground")
                }
              >
                <span className="flex items-center gap-2">
                  <span>{opt.flag}</span>
                  <span>{t(`langSwitcher.${opt.code}` as const)}</span>
                </span>
                {active && <Check className="h-3.5 w-3.5" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
