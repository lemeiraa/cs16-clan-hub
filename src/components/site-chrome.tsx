import { Link, useRouterState } from "@tanstack/react-router";
import logo from "@/assets/logo-csnostalgia.jpg";
import { Menu, X, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/servidores", label: "Servidores" },
  { to: "/loja", label: "Loja" },
  { to: "/regras", label: "Regras" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    let mounted = true;
    const check = async (uid: string | undefined) => {
      if (!mounted) return;
      if (!uid) { setIsAdmin(false); return; }
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", uid)
        .eq("role", "admin")
        .maybeSingle();
      if (mounted) setIsAdmin(!!data);
    };
    supabase.auth.getSession().then(({ data }) => check(data.session?.user?.id));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      window.setTimeout(() => check(session?.user?.id), 0);
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
          {NAV.map((n) => {
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
                {n.label}
              </Link>
            );
          })}
          {isAdmin && (
            <Link to="/admin" className="ml-2 px-3 py-2 text-xs font-bold uppercase tracking-wider rounded-md border border-accent text-accent hover:bg-accent/10 transition inline-flex items-center gap-1">
              <Shield className="h-3.5 w-3.5" /> Admin
            </Link>
          )}
          <Link
            to="/auth"
            className="ml-2 px-4 py-2 text-sm font-semibold uppercase tracking-wider rounded-md bg-gradient-brand text-brand-foreground shadow-glow hover:opacity-90 transition"
          >
            Entrar
          </Link>
        </nav>

        <button
          className="md:hidden p-2 text-foreground"
          onClick={() => setOpen((o) => !o)}
          aria-label="Menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-border/60 bg-background">
          <div className="container mx-auto flex flex-col px-4 py-3 gap-1">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className="px-3 py-3 text-sm uppercase tracking-wider rounded-md hover:bg-secondary"
              >
                {n.label}
              </Link>
            ))}
            <Link
              to="/auth"
              onClick={() => setOpen(false)}
              className="px-3 py-3 text-sm font-semibold uppercase tracking-wider rounded-md bg-gradient-brand text-brand-foreground text-center mt-2"
            >
              Entrar
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-card/40 mt-20">
      <div className="container mx-auto px-4 py-10 grid gap-8 md:grid-cols-3 text-sm">
        <div>
          <div className="flex items-center gap-3">
            <img src={logo} alt="" className="h-10 w-10 rounded-md" />
            <div>
              <p className="font-display text-lg font-bold">CS NOSTALGIA</p>
              <p className="text-xs text-muted-foreground">
                Counter-Strike 1.6 — desde sempre
              </p>
            </div>
          </div>
          <p className="mt-4 text-muted-foreground max-w-sm">
            Comunidade de servidores brasileiros e venezuelanos de CS 1.6.
            Reviva o clássico com a galera.
          </p>
        </div>

        <div>
          <p className="font-display uppercase tracking-wider text-foreground mb-3">
            Navegação
          </p>
          <ul className="space-y-2 text-muted-foreground">
            {NAV.map((n) => (
              <li key={n.to}>
                <Link to={n.to} className="hover:text-foreground transition">
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="font-display uppercase tracking-wider text-foreground mb-3">
            Contato
          </p>
          <p className="text-muted-foreground">
            Dúvidas sobre VIP, Ammo Packs ou banimento? Fale com a admin
            através do nosso Discord ou pelos canais da comunidade.
          </p>
        </div>
      </div>
      <div className="border-t border-border/60 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} CS Nostalgia — Todos os direitos reservados.
      </div>
    </footer>
  );
}
