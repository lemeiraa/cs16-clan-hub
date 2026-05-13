import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Shield, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  head: () => ({ meta: [{ title: "Entrar — CS Nostalgia" }] }),
});

function makeCaptcha() {
  const a = Math.floor(Math.random() * 9) + 1;
  const b = Math.floor(Math.random() * 9) + 1;
  return { a, b, answer: a + b };
}

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nick, setNick] = useState("");
  const [loading, setLoading] = useState(false);
  const [captcha, setCaptcha] = useState(() => makeCaptcha());
  const [captchaInput, setCaptchaInput] = useState("");
  const [startTime] = useState(() => Date.now());

  const refreshCaptcha = () => { setCaptcha(makeCaptcha()); setCaptchaInput(""); };

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted && data.session?.user) navigate({ to: "/" });
    });
    return () => { mounted = false; };
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "signup") {
      // Captcha check
      if (parseInt(captchaInput, 10) !== captcha.answer) {
        toast.error("Captcha incorreto", { description: "Resolva a soma corretamente." });
        refreshCaptcha();
        return;
      }
      // Honeypot via tempo: bot que envia em <1.5s
      if (Date.now() - startTime < 1500) {
        toast.error("Tente novamente em alguns segundos.");
        return;
      }
    }
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
      if (mode === "signup") refreshCaptcha();
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
        {/* Honeypot invisível — bots preenchem campos ocultos */}
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          className="hidden"
          aria-hidden="true"
        />

        {mode === "signup" && (
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Nick</label>
            <input
              value={nick}
              onChange={(e) => setNick(e.target.value)}
              required
              maxLength={32}
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

        {mode === "signup" && (
          <div className="rounded-md border border-accent/40 bg-accent/5 p-3">
            <label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-accent" /> Verificação anti-bot
            </label>
            <div className="mt-2 flex items-center gap-2">
              <span className="font-mono font-bold text-lg text-foreground select-none px-3 py-1.5 rounded bg-secondary">
                {captcha.a} + {captcha.b} = ?
              </span>
              <input
                type="number"
                value={captchaInput}
                onChange={(e) => setCaptchaInput(e.target.value)}
                required
                placeholder="?"
                className="flex-1 rounded-md border border-border bg-input px-3 py-2 text-center font-mono"
              />
              <button
                type="button"
                onClick={refreshCaptcha}
                className="p-2 rounded-md border border-border hover:bg-secondary text-muted-foreground"
                aria-label="Atualizar captcha"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2.5 text-sm font-bold uppercase tracking-wider rounded-md bg-gradient-brand text-brand-foreground disabled:opacity-50"
        >
          {loading ? "..." : mode === "login" ? "Entrar" : "Criar conta"}
        </button>
        <button
          type="button"
          onClick={() => { setMode(mode === "login" ? "signup" : "login"); refreshCaptcha(); }}
          className="w-full text-sm text-muted-foreground hover:text-accent"
        >
          {mode === "login" ? "Não tem conta? Criar" : "Já tem conta? Entrar"}
        </button>
      </form>
    </section>
  );
}
