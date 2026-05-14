import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AlertTriangle, Upload, Loader2, Lock, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/reportar")({
  component: ReportarPage,
  head: () => ({
    meta: [
      { title: "Reportar — CS Nostalgia" },
      { name: "description", content: "Reporte jogadores trapaceando ou abusos de administradores nos servidores CS Nostalgia. Envie nick, horário e vídeo demonstrativo." },
    ],
  }),
});

function ReportarPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [authChecked, setAuthChecked] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    nick: "",
    reportedNick: "",
    occurredAt: "",
    notes: "",
  });
  const [video, setVideo] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setAuthed(!!data.session);
      setUserId(data.session?.user.id ?? null);
      setUserEmail(data.session?.user.email ?? null);
      setAuthChecked(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setAuthed(!!session);
      setUserId(session?.user.id ?? null);
      setUserEmail(session?.user.email ?? null);
      setAuthChecked(true);
    });
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, []);

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.nick.trim() || !form.reportedNick.trim() || !form.occurredAt.trim()) {
      toast.error(t("report.fillAll"));
      return;
    }
    if (!userId) {
      toast.error(t("report.sessionExpired"));
      return;
    }

    setSubmitting(true);
    let videoUrl = "";
    let videoPath = "";
    try {
      if (video) {
        if (video.size > 100 * 1024 * 1024) {
          toast.error(t("report.videoTooLarge"));
          setSubmitting(false);
          return;
        }
        const ext = video.name.split(".").pop() || "mp4";
        videoPath = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error } = await supabase.storage.from("reports").upload(videoPath, video, {
          contentType: video.type || "video/mp4",
          upsert: false,
        });
        if (error) throw error;
        videoUrl = supabase.storage.from("reports").getPublicUrl(videoPath).data.publicUrl;
      }

      const { error: insErr } = await supabase.from("reports").insert({
        user_id: userId,
        reporter_name: form.name.trim().slice(0, 120),
        reporter_nick: form.nick.trim().slice(0, 64),
        reported_nick: form.reportedNick.trim().slice(0, 64),
        occurred_at: form.occurredAt.trim().slice(0, 120),
        notes: form.notes.trim().slice(0, 2000) || null,
        video_url: videoUrl || null,
        video_path: videoPath || null,
        contact_email: userEmail,
      });
      if (insErr) throw insErr;

      toast.success(t("report.success"));
      setForm({ name: "", nick: "", reportedNick: "", occurredAt: "", notes: "" });
      setVideo(null);
      setSent(true);
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : t("report.sendError"));
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
        <h1 className="font-display text-3xl font-bold mt-4">{t("report.needLogin")}</h1>
        <p className="text-muted-foreground mt-2">
          {t("report.needLoginText")}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            to="/auth"
            className="inline-flex items-center justify-center rounded-md bg-gradient-brand px-4 py-2 text-sm font-semibold text-brand-foreground hover:opacity-90 transition"
          >
            {t("report.enterRegister")}
          </Link>
          <button
            onClick={() => navigate({ to: "/" })}
            className="inline-flex items-center justify-center rounded-md border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-secondary transition"
          >
            {t("common.backHome")}
          </button>
        </div>
      </section>
    );
  }

  if (sent) {
    return (
      <section className="container mx-auto px-4 py-16 max-w-xl text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-accent" />
        <h1 className="font-display text-3xl font-bold mt-4">{t("report.sentTitle")}</h1>
        <p className="text-muted-foreground mt-2">
          {t("report.sentText")}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => setSent(false)}
            className="inline-flex items-center justify-center rounded-md bg-gradient-brand px-4 py-2 text-sm font-semibold text-brand-foreground hover:opacity-90 transition"
          >
            {t("report.sendAnother")}
          </button>
          <button
            onClick={() => navigate({ to: "/" })}
            className="inline-flex items-center justify-center rounded-md border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-secondary transition"
          >
            {t("common.backHome")}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="container mx-auto px-4 py-12 max-w-3xl">
      <p className="text-xs uppercase tracking-[0.3em] text-accent font-semibold">{t("common.community")}</p>
      <h1 className="font-display text-4xl font-bold mt-1 flex items-center gap-3">
        <AlertTriangle className="text-accent" /> {t("report.title")}
      </h1>
      <p className="text-muted-foreground mt-2">
        {t("report.sub")}
      </p>

      <form onSubmit={onSubmit} className="mt-8 rounded-xl border border-border bg-card p-6 shadow-card space-y-4">
        <Field label={t("report.name")} value={form.name} onChange={update("name")} placeholder={t("report.namePh")} />
        <Field label={t("report.nick")} value={form.nick} onChange={update("nick")} placeholder={t("report.nickPh")} />
        <Field label={t("report.reportedNick")} value={form.reportedNick} onChange={update("reportedNick")} placeholder={t("report.reportedNickPh")} />
        <Field label={t("report.occurredAt")} value={form.occurredAt} onChange={update("occurredAt")} placeholder={t("report.occurredAtPh")} />

        <div>
          <label className="block text-sm font-medium mb-1.5">{t("report.notes")}</label>
          <textarea
            value={form.notes}
            onChange={update("notes")}
            rows={4}
            placeholder={t("report.notesPh")}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">{t("report.video")}</label>
          <label className="flex items-center gap-3 cursor-pointer rounded-md border border-dashed border-border bg-background px-4 py-6 text-sm hover:bg-secondary transition">
            <Upload className="h-5 w-5 text-accent" />
            <span className="text-muted-foreground">
              {video ? video.name : t("report.videoPh")}
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
          {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> {t("common.sending")}</> : t("report.submit")}
        </button>

        <p className="text-xs text-muted-foreground text-center">
          {t("report.finalNote")}
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
