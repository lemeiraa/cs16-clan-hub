import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AlertTriangle, Upload, Loader2, Lock } from "lucide-react";

export const Route = createFileRoute("/reportar")({
  component: ReportarPage,
  head: () => ({
    meta: [
      { title: "Reportar — CS Nostalgia" },
      { name: "description", content: "Reporte jogadores trapaceando ou abusos de administradores nos servidores CS Nostalgia. Envie nick, horário e vídeo demonstrativo." },
    ],
  }),
});

type WaAdmin = { id: string; name: string; phone: string };

function ReportarPage() {
  const navigate = useNavigate();
  const [authChecked, setAuthChecked] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [admins, setAdmins] = useState<WaAdmin[]>([]);
  const [form, setForm] = useState({
    name: "",
    nick: "",
    reportedNick: "",
    occurredAt: "",
    notes: "",
  });
  const [video, setVideo] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setAuthed(!!data.session);
      setAuthChecked(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setAuthed(!!session);
      setAuthChecked(true);
    });
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!authed) return;
    supabase
      .from("whatsapp_admins")
      .select("id,name,phone")
      .eq("active", true)
      .order("sort_order")
      .then(({ data }) => setAdmins(data ?? []));
  }, [authed]);


  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.nick.trim() || !form.reportedNick.trim() || !form.occurredAt.trim()) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }
    if (!admins.length) {
      toast.error("Nenhum admin disponível no momento. Tente mais tarde.");
      return;
    }

    // Abre a janela ANTES de qualquer await (senão o navegador bloqueia)
    const waWindow = window.open("about:blank", "_blank");

    setSubmitting(true);
    let videoUrl = "";
    try {
      if (video) {
        if (video.size > 100 * 1024 * 1024) {
          toast.error("Vídeo muito grande (máx. 100 MB).");
          setSubmitting(false);
          return;
        }
        const ext = video.name.split(".").pop() || "mp4";
        const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error } = await supabase.storage.from("reports").upload(path, video, {
          contentType: video.type || "video/mp4",
          upsert: false,
        });
        if (error) throw error;
        videoUrl = supabase.storage.from("reports").getPublicUrl(path).data.publicUrl;
      }

      const lines = [
        "🚨 *NOVO REPORT — CS Nostalgia*",
        "",
        `*Nome:* ${form.name}`,
        `*Nick no servidor:* ${form.nick}`,
        `*Nick reportado:* ${form.reportedNick}`,
        `*Horário do ocorrido:* ${form.occurredAt}`,
        form.notes ? `*Observações:* ${form.notes}` : null,
        videoUrl ? `*Vídeo:* ${videoUrl}` : "*Vídeo:* (não enviado)",
      ].filter(Boolean).join("\n");

      const text = encodeURIComponent(lines);
      const phone = admins[0].phone.replace(/\D/g, "");
      const waUrl = `https://wa.me/${phone}?text=${text}`;
      toast.success("Abrindo WhatsApp com o report...");
      setForm({ name: "", nick: "", reportedNick: "", occurredAt: "", notes: "" });
      setVideo(null);
      // Navega na mesma aba para evitar bloqueio de pop-up
      window.location.href = waUrl;
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Erro ao preparar report.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!authChecked) {
    return (
      <section className="container mx-auto px-4 py-20 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </section>
    );
  }

  if (!authed) {
    return (
      <section className="container mx-auto px-4 py-12 max-w-xl text-center">
        <Lock className="mx-auto h-10 w-10 text-accent" />
        <h1 className="font-display text-3xl font-bold mt-4">Login necessário</h1>
        <p className="text-muted-foreground mt-2">
          Para enviar uma denúncia você precisa estar logado na sua conta.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            to="/auth"
            className="inline-flex items-center justify-center rounded-md bg-gradient-brand px-4 py-2 text-sm font-semibold text-brand-foreground hover:opacity-90 transition"
          >
            Entrar / Cadastrar
          </Link>
          <button
            onClick={() => navigate({ to: "/" })}
            className="inline-flex items-center justify-center rounded-md border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-secondary transition"
          >
            Voltar ao início
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="container mx-auto px-4 py-12 max-w-3xl">
      <p className="text-xs uppercase tracking-[0.3em] text-accent font-semibold">Comunidade</p>
      <h1 className="font-display text-4xl font-bold mt-1 flex items-center gap-3">
        <AlertTriangle className="text-accent" /> Reportar
      </h1>
      <p className="text-muted-foreground mt-2">
        Denuncie jogadores trapaceando ou abusos de administradores. Sua denúncia será enviada
        diretamente ao admin responsável via WhatsApp.
      </p>

      <form onSubmit={onSubmit} className="mt-8 rounded-xl border border-border bg-card p-6 shadow-card space-y-4">
        <Field label="Seu nome *" value={form.name} onChange={update("name")} placeholder="Como podemos te chamar" />
        <Field label="Seu nick no servidor *" value={form.nick} onChange={update("nick")} placeholder="Nick que você usa" />
        <Field label="Nick do reportado *" value={form.reportedNick} onChange={update("reportedNick")} placeholder="Nick do jogador / admin" />
        <Field label="Horário do ocorrido *" value={form.occurredAt} onChange={update("occurredAt")} placeholder="Ex.: 13/05/2026 às 21h30" />

        <div>
          <label className="block text-sm font-medium mb-1.5">Observações extras</label>
          <textarea
            value={form.notes}
            onChange={update("notes")}
            rows={4}
            placeholder="Descreva o que aconteceu, servidor, mapa, etc."
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Vídeo demonstrativo (opcional, máx. 100 MB)</label>
          <label className="flex items-center gap-3 cursor-pointer rounded-md border border-dashed border-border bg-background px-4 py-6 text-sm hover:bg-secondary transition">
            <Upload className="h-5 w-5 text-accent" />
            <span className="text-muted-foreground">
              {video ? video.name : "Clique para selecionar um vídeo (MP4, MOV, WEBM, MKV)"}
            </span>
            <input
              type="file"
              accept="video/mp4,video/quicktime,video/x-msvideo,video/webm,video/x-matroska"
              className="hidden"
              onChange={(e) => setVideo(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-gradient-brand px-4 py-2.5 text-sm font-semibold text-brand-foreground hover:opacity-90 transition disabled:opacity-50"
        >
          {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Enviando...</> : "Enviar report via WhatsApp"}
        </button>

        <p className="text-xs text-muted-foreground text-center">
          Ao enviar, uma janela do WhatsApp será aberta com sua denúncia já preenchida.
          Toque em <strong>enviar</strong> no WhatsApp para concluir.
        </p>
      </form>
    </section>
  );
}

function Field({ label, value, onChange, placeholder }: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">{label}</label>
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
      />
    </div>
  );
}
