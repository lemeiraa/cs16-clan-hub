import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_AVATARS, avatarUrlFor } from "@/lib/avatars";
import { User, Lock, ImageIcon, LogOut } from "lucide-react";

export const Route = createFileRoute("/conta")({
  component: AccountPage,
  head: () => ({ meta: [{ title: "Minha conta — CS Nostalgia" }] }),
});

function AccountPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [nick, setNick] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [savingNick, setSavingNick] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async (uid: string) => {
      const { data } = await supabase
        .from("profiles")
        .select("nick, email, avatar_url")
        .eq("id", uid)
        .maybeSingle();
      if (!mounted) return;
      setNick(data?.nick ?? "");
      setEmail(data?.email ?? "");
      setAvatarUrl(data?.avatar_url ?? null);
      setLoading(false);
    };
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const uid = data.session?.user?.id;
      if (!uid) {
        navigate({ to: "/auth" });
        return;
      }
      setUserId(uid);
      setEmail(data.session!.user.email ?? "");
      load(uid);
    });
    return () => { mounted = false; };
  }, [navigate]);

  const saveNick = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setSavingNick(true);
    const { error } = await supabase.from("profiles").update({ nick }).eq("id", userId);
    setSavingNick(false);
    if (error) toast.error(t("common.error"), { description: error.message });
    else toast.success(t("account.nameUpdated"));
  };

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error(t("account.pwdShort"), { description: t("account.pwdShortText") });
      return;
    }
    setSavingPwd(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPwd(false);
    if (error) toast.error(t("common.error"), { description: error.message });
    else { toast.success(t("account.pwdUpdated")); setNewPassword(""); }
  };

  const pickAvatar = async (url: string) => {
    if (!userId) return;
    setSavingAvatar(url);
    const { error } = await supabase.from("profiles").update({ avatar_url: url }).eq("id", userId);
    setSavingAvatar(null);
    if (error) toast.error(t("common.error"), { description: error.message });
    else { setAvatarUrl(url); toast.success(t("account.avatarUpdated")); }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  if (loading) {
    return <section className="container mx-auto px-4 py-16 text-center text-muted-foreground">{t("common.loading")}</section>;
  }

  const currentAvatar = avatarUrlFor(nick || email, avatarUrl ?? undefined);

  return (
    <section className="container mx-auto px-4 py-12 max-w-3xl">
      <header className="flex items-center gap-4 mb-8">
        <img src={currentAvatar} alt="Avatar" className="h-20 w-20 rounded-xl ring-2 ring-accent bg-card" />
        <div className="flex-1">
          <h1 className="font-display text-3xl font-bold">{nick || t("account.noNick")}</h1>
          <p className="text-sm text-muted-foreground">{email}</p>
        </div>
        <button onClick={logout} className="px-3 py-2 text-xs font-bold uppercase tracking-wider rounded-md border border-border hover:bg-secondary inline-flex items-center gap-1.5">
          <LogOut className="h-3.5 w-3.5" /> {t("account.logout")}
        </button>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <form onSubmit={saveNick} className="rounded-xl border border-border bg-card p-6 shadow-card">
          <div className="flex items-center gap-2 mb-4">
            <User className="h-4 w-4 text-accent" />
            <h2 className="font-display uppercase tracking-wider text-sm">{t("account.changeName")}</h2>
          </div>
          <input
            value={nick}
            onChange={(e) => setNick(e.target.value)}
            required
            maxLength={32}
            className="w-full rounded-md border border-border bg-input px-3 py-2"
          />
          <button disabled={savingNick} className="mt-4 w-full px-4 py-2 text-sm font-bold uppercase tracking-wider rounded-md bg-gradient-brand text-brand-foreground disabled:opacity-50">
            {savingNick ? t("common.saving") : t("account.saveName")}
          </button>
        </form>

        <form onSubmit={savePassword} className="rounded-xl border border-border bg-card p-6 shadow-card">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="h-4 w-4 text-accent" />
            <h2 className="font-display uppercase tracking-wider text-sm">{t("account.changePassword")}</h2>
          </div>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={6}
            placeholder={t("account.newPassword")}
            className="w-full rounded-md border border-border bg-input px-3 py-2"
          />
          <button disabled={savingPwd} className="mt-4 w-full px-4 py-2 text-sm font-bold uppercase tracking-wider rounded-md bg-gradient-brand text-brand-foreground disabled:opacity-50">
            {savingPwd ? t("common.saving") : t("account.updatePassword")}
          </button>
        </form>
      </div>

      <div className="mt-6 rounded-xl border border-border bg-card p-6 shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <ImageIcon className="h-4 w-4 text-accent" />
          <h2 className="font-display uppercase tracking-wider text-sm">{t("account.pickAvatar")}</h2>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
          {DEFAULT_AVATARS.map((a) => {
            const selected = avatarUrl === a.url;
            return (
              <button
                key={a.id}
                onClick={() => pickAvatar(a.url)}
                disabled={savingAvatar !== null}
                className={
                  "aspect-square rounded-xl bg-secondary/50 p-1 transition ring-2 " +
                  (selected ? "ring-accent shadow-glow" : "ring-transparent hover:ring-border")
                }
              >
                <img src={a.url} alt={a.id} className="w-full h-full rounded-lg" />
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
