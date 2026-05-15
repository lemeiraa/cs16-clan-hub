import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Megaphone, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export type Announcement = {
  id: string;
  title: string;
  message: string;
  tag: string;
  color: "accent" | "primary" | "success" | "warning" | "destructive" | "info";
  effect: "none" | "pulse" | "glow" | "marquee" | "blink";
  dismissible: boolean;
  sort_order: number;
};

const COLOR_MAP: Record<Announcement["color"], { wrap: string; tag: string; icon: string; halo: string }> = {
  accent: {
    wrap: "border-accent/40 from-accent/15 via-primary/10 to-accent/15",
    tag: "text-accent",
    icon: "bg-accent/20 text-accent",
    halo: "bg-accent/40",
  },
  primary: {
    wrap: "border-primary/40 from-primary/15 via-accent/10 to-primary/15",
    tag: "text-primary",
    icon: "bg-primary/20 text-primary",
    halo: "bg-primary/40",
  },
  success: {
    wrap: "border-success/40 from-success/15 via-success/5 to-success/15",
    tag: "text-success",
    icon: "bg-success/20 text-success",
    halo: "bg-success/40",
  },
  warning: {
    wrap: "border-yellow-500/40 from-yellow-500/15 via-yellow-500/5 to-yellow-500/15",
    tag: "text-yellow-400",
    icon: "bg-yellow-500/20 text-yellow-400",
    halo: "bg-yellow-500/40",
  },
  destructive: {
    wrap: "border-destructive/40 from-destructive/15 via-destructive/5 to-destructive/15",
    tag: "text-destructive",
    icon: "bg-destructive/20 text-destructive",
    halo: "bg-destructive/40",
  },
  info: {
    wrap: "border-sky-500/40 from-sky-500/15 via-sky-500/5 to-sky-500/15",
    tag: "text-sky-400",
    icon: "bg-sky-500/20 text-sky-400",
    halo: "bg-sky-500/40",
  },
};

const dismissKey = (id: string) => `announcement-dismissed:${id}`;
const EMPTY_ITEMS: Announcement[] = [];

export function AnnouncementsBanner() {
  const { data } = useQuery({
    queryKey: ["announcements", "active"],
    queryFn: async (): Promise<Announcement[]> => {
      const { data, error } = await supabase
        .from("announcements")
        .select("id,title,message,tag,color,effect,dismissible,sort_order")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Announcement[];
    },
    staleTime: 60_000,
  });
  const items = data ?? EMPTY_ITEMS;

  const itemsKey = items.map((a) => a.id).join(",");
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const next = new Set<string>();
      for (const a of items) {
        if (a.dismissible && localStorage.getItem(dismissKey(a.id)) === "1") next.add(a.id);
      }
      setDismissed(next);
    } catch {
      /* noop */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsKey]);

  const visible = items.filter((a) => !dismissed.has(a.id));
  if (visible.length === 0) return null;

  const dismiss = (id: string) => {
    try { localStorage.setItem(dismissKey(id), "1"); } catch { /* noop */ }
    setDismissed((prev) => new Set(prev).add(id));
  };

  return (
    <div className="flex flex-col">
      {visible.map((a) => {
        const c = COLOR_MAP[a.color] ?? COLOR_MAP.accent;
        const isMarquee = a.effect === "marquee";
        return (
          <div
            key={a.id}
            className={cn(
              "border-b bg-gradient-to-r",
              c.wrap,
              a.effect === "pulse" && "animate-pulse",
              a.effect === "blink" && "animate-[pulse_1.2s_ease-in-out_infinite]",
              a.effect === "glow" && "shadow-[0_0_30px_-5px_currentColor]",
            )}
          >
            <div className="container mx-auto px-4 py-3 flex items-center gap-3">
              <span className={cn("hidden sm:inline-flex relative h-9 w-9 shrink-0 items-center justify-center rounded-md", c.icon)}>
                {a.effect === "pulse" || a.effect === "glow" ? (
                  <span className={cn("absolute inset-0 rounded-md animate-ping", c.halo)} />
                ) : null}
                <Megaphone className="relative h-5 w-5" />
              </span>

              {isMarquee ? (
                <div className="flex-1 min-w-0 overflow-hidden">
                  <div className="flex gap-12 whitespace-nowrap animate-[marquee_18s_linear_infinite]">
                    {[0, 1].map((i) => (
                      <div key={i} className="flex items-baseline gap-2 shrink-0">
                        {a.tag && (
                          <span className={cn("text-[10px] font-bold uppercase tracking-[0.25em]", c.tag)}>
                            {a.tag}
                          </span>
                        )}
                        {a.title && (
                          <span className="font-display text-sm md:text-base font-bold text-foreground">
                            {a.title}
                          </span>
                        )}
                        {a.message && (
                          <span className="text-sm text-muted-foreground">{a.message}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex-1 min-w-0 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  {a.tag && (
                    <span className={cn("text-[10px] font-bold uppercase tracking-[0.25em]", c.tag)}>
                      {a.tag}
                    </span>
                  )}
                  {a.title && (
                    <span className="font-display text-sm md:text-base font-bold text-foreground">
                      {a.title}
                    </span>
                  )}
                  {a.message && (
                    <span className="text-sm text-muted-foreground">{a.message}</span>
                  )}
                </div>
              )}

              {a.dismissible && (
                <button
                  type="button"
                  onClick={() => dismiss(a.id)}
                  aria-label="Fechar aviso"
                  className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
