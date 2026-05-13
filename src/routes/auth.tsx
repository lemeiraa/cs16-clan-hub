import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  head: () => ({ meta: [{ title: "Entrar — CS Nostalgia" }] }),
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nick, setNick] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted && data.session?.user) navigate({ to: "/" });
    });
    return () => { mounted = false; };
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { nick },
          },
        });
        if (error) throw error;
        toast.success("Conta criada!", { description: "Verifique seu email para confirmar." });
      } else {
        const timeout = new Promise<never>((_, reject) => {
          window.setTimeout(() => reject(new Error("Tempo esgotado. Tente novamente.")), 12000);
        });
        const { error } = await Promise.race([
          supabase.auth.signInWithPassword({ email, password }),
          timeout,
        ]);
        if (error) throw error;
        toast.success("Bem-vindo!");
        navigate({ to: "/" });
      }
    } catch (err) {
      toast.error("Erro", { description: err instanceof Error ? err.message : String(err) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="container mx-auto px-4 py-16 max-w-md">
      <h1 className="font-display text-3xl font-bold text-center">
        {mode === "login" ? "Entrar" : "Criar conta"}
      </h1>
      <form onSubmit={submit} className="mt-6 space-y-4 rounded-xl border border-border bg-card p-6 shadow-card">
        {mode === "signup" && (
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Nick</label>
            <input
              value={nick}
              onChange={(e) => setNick(e.target.value)}
              required
              className="w-full mt-1 rounded-md border border-border bg-input px-3 py-2"
            />
          </div>
        )}
        <div>
          <label className="text-xs uppercase tracking-wider text-muted-foreground">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full mt-1 rounded-md border border-border bg-input px-3 py-2"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wider text-muted-foreground">Senha</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full mt-1 rounded-md border border-border bg-input px-3 py-2"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2.5 text-sm font-bold uppercase tracking-wider rounded-md bg-gradient-brand text-brand-foreground disabled:opacity-50"
        >
          {loading ? "..." : mode === "login" ? "Entrar" : "Criar conta"}
        </button>
        <button
          type="button"
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
          className="w-full text-sm text-muted-foreground hover:text-accent"
        >
          {mode === "login" ? "Não tem conta? Criar" : "Já tem conta? Entrar"}
        </button>
      </form>
    </section>
  );
}
