import { Link, useRouterState } from "@tanstack/react-router";
import logo from "@/assets/logo-csnostalgia.jpg";
import { Menu, X, Shield, User as UserIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { avatarUrlFor } from "@/lib/avatars";
import { LanguageSwitcher } from "@/components/language-switcher";

const NAV_KEYS = [
  { to: "/", key: "home" },
  { to: "/servidores", key: "servers" },
  { to: "/loja", key: "shop" },
  { to: "/regras", key: "rules" },
  { to: "/reportar", key: "report" },
] as const;

export function SiteHeader() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<{ id: string; nick: string | null; avatar_url: string | null; email: string } | null>(null);
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    let mounted = true;
    const check = async (uid: string | undefined, email: string | undefined) => {
      if (!mounted) return;
      if (!uid) { setIsAdmin(false); setUser(null); return; }
      const [{ data: roleData }, { data: profile }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", uid).eq("role", "admin").maybeSingle(),
        supabase.from("profiles").select("nick, avatar_url").eq("id", uid).maybeSingle(),
      ]);
      if (!mounted) return;
      setIsAdmin(!!roleData);
      setUser({ id: uid, nick: profile?.nick ?? null, avatar_url: profile?.avatar_url ?? null, email: email ?? "" });
    };
    supabase.auth.getSession().then(({ data }) => check(data.session?.user?.id, data.session?.user?.email));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      window.setTimeout(() => check(session?.user?.id, session?.user?.email), 0);
    });
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-3 group">
          <img
            src={logo}
            alt="CS Nostalgia"
            className="h-10 w-10 rounded-md object-cover ring-1 ring-border group-hover:ring-accent transition"
          />
          <div className="hidden sm:flex flex-col leading-none">
            <span className="font-display text-lg font-bold tracking-wide text-foreground">
              CS NOSTALGIA
            </span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Counter-Strike 1.6
            </span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {NAV_KEYS.map((n) => {
            const active =
              n.to === "/" ? path === "/" : path.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={
                  "px-4 py-2 text-sm font-medium uppercase tracking-wider rounded-md transition " +
                  (active
                    ? "text-foreground bg-secondary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50")
                }
              >
                {t(`nav.${n.key}` as const)}
              </Link>
            );
          })}
          {isAdmin && (
            <Link to="/admin" className="ml-2 px-3 py-2 text-xs font-bold uppercase tracking-wider rounded-md border border-accent text-accent hover:bg-accent/10 transition inline-flex items-center gap-1">
              <Shield className="h-3.5 w-3.5" /> {t("nav.admin")}
            </Link>
          )}
          <div className="ml-2">
            <LanguageSwitcher />
          </div>
          {user ? (
            <Link
              to="/conta"
              className="ml-2 inline-flex items-center gap-2 px-2.5 py-1.5 rounded-md border border-border hover:bg-secondary transition"
            >
              <img
                src={avatarUrlFor(user.nick || user.email, user.avatar_url ?? undefined)}
                alt=""
                className="h-7 w-7 rounded-md bg-card"
              />
              <span className="text-sm font-semibold max-w-[120px] truncate">{user.nick || t("nav.account")}</span>
            </Link>
          ) : (
            <Link
              to="/auth"
              className="ml-2 px-4 py-2 text-sm font-semibold uppercase tracking-wider rounded-md bg-gradient-brand text-brand-foreground shadow-glow hover:opacity-90 transition"
            >
              {t("nav.login")}
            </Link>
          )}
        </nav>

        <div className="md:hidden flex items-center gap-2">
          <LanguageSwitcher compact />
          <button
            className="p-2 text-foreground"
            onClick={() => setOpen((o) => !o)}
            aria-label="Menu"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-border/60 bg-background">
          <div className="container mx-auto flex flex-col px-4 py-3 gap-1">
            {NAV_KEYS.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className="px-3 py-3 text-sm uppercase tracking-wider rounded-md hover:bg-secondary"
              >
                {t(`nav.${n.key}` as const)}
              </Link>
            ))}
            {user ? (
              <Link
                to="/conta"
                onClick={() => setOpen(false)}
                className="px-3 py-3 text-sm font-semibold uppercase tracking-wider rounded-md border border-border text-center mt-2 inline-flex items-center justify-center gap-2"
              >
                <UserIcon className="h-4 w-4" /> {user.nick || t("nav.account")}
              </Link>
            ) : (
              <Link
                to="/auth"
                onClick={() => setOpen(false)}
                className="px-3 py-3 text-sm font-semibold uppercase tracking-wider rounded-md bg-gradient-brand text-brand-foreground text-center mt-2"
              >
                {t("nav.login")}
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export function SiteFooter() {
  const { t } = useTranslation();
  return (
    <footer className="border-t border-border/60 bg-card/40 mt-20">
      <div className="container mx-auto px-4 py-10 grid gap-8 md:grid-cols-3 text-sm">
        <div>
          <div className="flex items-center gap-3">
            <img src={logo} alt="" className="h-10 w-10 rounded-md" />
            <div>
              <p className="font-display text-lg font-bold">CS NOSTALGIA</p>
              <p className="text-xs text-muted-foreground">{t("footer.tagline")}</p>
            </div>
          </div>
          <p className="mt-4 text-muted-foreground max-w-sm">{t("footer.about")}</p>
        </div>

        <div>
          <p className="font-display uppercase tracking-wider text-foreground mb-3">
            {t("footer.nav")}
          </p>
          <ul className="space-y-2 text-muted-foreground">
            {NAV_KEYS.map((n) => (
              <li key={n.to}>
                <Link to={n.to} className="hover:text-foreground transition">
                  {t(`nav.${n.key}` as const)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="font-display uppercase tracking-wider text-foreground mb-3">
            {t("footer.contact")}
          </p>
          <p className="text-muted-foreground mb-4">{t("footer.contactText")}</p>
          <ul className="space-y-2">
            <li>
              <a
                href="https://chat.whatsapp.com/JTiBGthp19X24XDRJmQVef"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition"
              >
                <span className="h-8 w-8 rounded-md bg-[#25D366]/15 text-[#25D366] flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 0 1 8.413 3.488 11.824 11.824 0 0 1 3.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
                </span>
                <span className="text-sm font-medium">WhatsApp</span>
              </a>
            </li>
            <li>
              <a
                href="http://dsc.gg/csnostalgia"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition"
              >
                <span className="h-8 w-8 rounded-md bg-[#5865F2]/15 text-[#5865F2] flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
                </span>
                <span className="text-sm font-medium">Discord</span>
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} CS Nostalgia — {t("footer.rights")}
      </div>
    </footer>
  );
}
