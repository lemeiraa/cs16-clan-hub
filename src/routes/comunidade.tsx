import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { searchUsersByNick, getProfilesByIds, type PublicMiniProfile } from "@/lib/community.functions";
import { avatarUrlFor } from "@/lib/avatars";
import {
  UserPlus, UserCheck, UserX, Users, MessageCircle, Send, Shield, Crown,
  LogOut, Trash2, Search, Plus, Inbox, Loader2, ChevronUp, ChevronDown,
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/comunidade")({
  component: ComunidadePage,
  head: () => ({ meta: [{ title: "Comunidade — CS Nostalgia" }] }),
});

type FriendshipRow = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: "pending" | "accepted" | "blocked";
  created_at: string;
};

type ClanRow = {
  id: string;
  name: string;
  tag: string;
  description: string;
  avatar_url: string | null;
  owner_id: string;
  created_at: string;
};

type ClanMemberRow = {
  id: string;
  clan_id: string;
  user_id: string;
  role: "leader" | "officer" | "member";
  joined_at: string;
};

type ClanInviteRow = {
  id: string;
  clan_id: string;
  inviter_id: string;
  invitee_id: string;
  status: "pending" | "accepted" | "declined";
  created_at: string;
};

type DM = {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
};

type ClanMessage = {
  id: string;
  clan_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

type Me = { id: string; nick: string | null; avatar_url: string | null; email: string };

function useMe() {
  const [me, setMe] = useState<Me | null | undefined>(undefined);
  useEffect(() => {
    let alive = true;
    const load = async (uid?: string, email?: string) => {
      if (!uid) { if (alive) setMe(null); return; }
      const { data } = await supabase.from("profiles").select("nick, avatar_url").eq("id", uid).maybeSingle();
      if (!alive) return;
      setMe({ id: uid, nick: data?.nick ?? null, avatar_url: data?.avatar_url ?? null, email: email ?? "" });
    };
    supabase.auth.getSession().then(({ data }) => load(data.session?.user?.id, data.session?.user?.email));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setTimeout(() => load(session?.user?.id, session?.user?.email), 0);
    });
    return () => { alive = false; sub.subscription.unsubscribe(); };
  }, []);
  return me;
}

function useProfileCache() {
  const [cache, setCache] = useState<Record<string, PublicMiniProfile>>({});
  const ensure = useCallback(async (ids: string[]) => {
    const missing = ids.filter((id) => id && !cache[id]);
    if (missing.length === 0) return;
    const uniq = Array.from(new Set(missing));
    const rows = await getProfilesByIds({ data: { ids: uniq } });
    setCache((c) => {
      const next = { ...c };
      for (const r of rows) next[r.id] = r;
      return next;
    });
  }, [cache]);
  return { cache, ensure };
}

function ComunidadePage() {
  const me = useMe();
  const [tab, setTab] = useState<"friends" | "messages" | "clans">("friends");

  if (me === undefined) {
    return <div className="container mx-auto px-4 py-16 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }
  if (me === null) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-md text-center">
        <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-2xl font-display font-bold mb-2">Comunidade</h1>
        <p className="text-muted-foreground mb-6">Entre na sua conta para conversar com outros jogadores, fazer amigos e participar de clans.</p>
        <Link to="/auth" className="inline-block px-6 py-3 rounded-md bg-gradient-brand text-brand-foreground font-semibold uppercase tracking-wider">Entrar</Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-6xl">
      <header className="mb-8">
        <p className="text-xs uppercase tracking-[0.3em] text-accent mb-2">Comunidade</p>
        <h1 className="font-display text-4xl font-bold">Amigos, clans e mensagens</h1>
        <p className="text-muted-foreground mt-2">Conecte-se com outros jogadores da CS Nostalgia.</p>
      </header>

      <div className="flex flex-wrap gap-2 mb-6 border-b border-border/60">
        {([
          ["friends", "Amigos", Users],
          ["messages", "Mensagens", MessageCircle],
          ["clans", "Clans", Shield],
        ] as const).map(([key, label, Icon]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={
              "px-4 py-2.5 -mb-px text-sm font-semibold uppercase tracking-wider border-b-2 transition inline-flex items-center gap-2 " +
              (tab === key
                ? "border-accent text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground")
            }
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {tab === "friends" && <FriendsPanel me={me} />}
      {tab === "messages" && <MessagesPanel me={me} />}
      {tab === "clans" && <ClansPanel me={me} />}
    </div>
  );
}

/* =================== FRIENDS =================== */
function FriendsPanel({ me }: { me: Me }) {
  const [friendships, setFriendships] = useState<FriendshipRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { cache, ensure } = useProfileCache();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PublicMiniProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("friendships")
      .select("*")
      .or(`requester_id.eq.${me.id},addressee_id.eq.${me.id}`)
      .order("created_at", { ascending: false });
    if (error) { toast.error(error.message); setLoading(false); return; }
    setFriendships(data ?? []);
    const ids = (data ?? []).flatMap((f) => [f.requester_id, f.addressee_id]).filter((i) => i !== me.id);
    await ensure(ids);
    setLoading(false);
  }, [me.id, ensure]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const ch = supabase
      .channel(`friendships:${me.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "friendships" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [me.id, load]);

  // Debounced search
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) { setResults([]); return; }
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const rows = await searchUsersByNick({ data: { q, excludeId: me.id } });
        setResults(rows);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erro");
      } finally { setSearching(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [query, me.id]);

  const accepted = friendships.filter((f) => f.status === "accepted");
  const incoming = friendships.filter((f) => f.status === "pending" && f.addressee_id === me.id);
  const outgoing = friendships.filter((f) => f.status === "pending" && f.requester_id === me.id);

  const otherId = (f: FriendshipRow) => f.requester_id === me.id ? f.addressee_id : f.requester_id;

  const sendRequest = async (toId: string) => {
    const { error } = await supabase.from("friendships").insert({ requester_id: me.id, addressee_id: toId });
    if (error) { toast.error(error.code === "23505" ? "Vocês já têm uma relação de amizade" : error.message); return; }
    toast.success("Pedido enviado!");
    setQuery(""); setResults([]);
  };
  const accept = async (id: string) => {
    const { error } = await supabase.from("friendships").update({ status: "accepted" }).eq("id", id);
    if (error) toast.error(error.message); else toast.success("Amizade aceita!");
  };
  const remove = async (id: string) => {
    const { error } = await supabase.from("friendships").delete().eq("id", id);
    if (error) toast.error(error.message);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        {/* Search */}
        <section className="rounded-lg border border-border/60 bg-card/40 p-5">
          <h2 className="font-display text-lg font-semibold mb-3 flex items-center gap-2"><Search className="h-4 w-4" /> Buscar jogadores</h2>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Digite o nick (mín. 2 letras)"
            className="w-full px-3 py-2 rounded-md bg-background border border-border focus:border-accent outline-none"
          />
          {searching && <div className="mt-3 text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="h-3 w-3 animate-spin" /> Buscando...</div>}
          {results.length > 0 && (
            <ul className="mt-4 divide-y divide-border/60">
              {results.map((u) => {
                const existing = friendships.find((f) => otherId(f) === u.id);
                return (
                  <li key={u.id} className="py-2 flex items-center gap-3">
                    <img src={avatarUrlFor(u.nick, u.avatar_url ?? undefined)} alt="" className="h-9 w-9 rounded-md" />
                    <Link to="/jogadores/$id" params={{ id: u.id }} className="flex-1 font-semibold hover:text-accent">{u.nick}</Link>
                    {existing ? (
                      <span className="text-xs text-muted-foreground italic">
                        {existing.status === "accepted" ? "amigo" : existing.requester_id === me.id ? "pedido enviado" : "pediu sua amizade"}
                      </span>
                    ) : (
                      <button onClick={() => sendRequest(u.id)} className="px-3 py-1.5 text-xs rounded-md bg-accent/15 text-accent hover:bg-accent/25 inline-flex items-center gap-1 font-semibold">
                        <UserPlus className="h-3.5 w-3.5" /> Adicionar
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Friends list */}
        <section className="rounded-lg border border-border/60 bg-card/40 p-5">
          <h2 className="font-display text-lg font-semibold mb-3 flex items-center gap-2"><Users className="h-4 w-4" /> Meus amigos ({accepted.length})</h2>
          {loading ? <div className="text-muted-foreground text-sm">Carregando...</div> : accepted.length === 0 ? (
            <p className="text-sm text-muted-foreground">Você ainda não tem amigos. Use a busca acima para encontrar jogadores.</p>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2">
              {accepted.map((f) => {
                const p = cache[otherId(f)];
                if (!p) return null;
                return (
                  <li key={f.id} className="flex items-center gap-3 p-2 rounded-md border border-border/60 bg-background/50">
                    <img src={avatarUrlFor(p.nick, p.avatar_url ?? undefined)} alt="" className="h-9 w-9 rounded-md" />
                    <Link to="/jogadores/$id" params={{ id: p.id }} className="flex-1 font-semibold truncate hover:text-accent">{p.nick}</Link>
                    <button title="Mensagem" onClick={() => navigate({ to: "/comunidade" }).then(() => { /* navigation handled via tab + dm */ })} className="hidden" />
                    <button title="Conversar" onClick={() => {
                      window.dispatchEvent(new CustomEvent("open-dm", { detail: { userId: p.id } }));
                    }} className="p-1.5 rounded-md hover:bg-accent/15 text-accent"><MessageCircle className="h-4 w-4" /></button>
                    <button title="Remover" onClick={() => { if (confirm(`Remover ${p.nick} dos amigos?`)) remove(f.id); }} className="p-1.5 rounded-md hover:bg-destructive/15 text-destructive"><UserX className="h-4 w-4" /></button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {/* Requests sidebar */}
      <aside className="space-y-4">
        <section className="rounded-lg border border-border/60 bg-card/40 p-4">
          <h3 className="font-display text-sm uppercase tracking-wider mb-3 flex items-center gap-2"><Inbox className="h-4 w-4" /> Recebidos ({incoming.length})</h3>
          {incoming.length === 0 ? <p className="text-xs text-muted-foreground">Nenhum pedido pendente.</p> : (
            <ul className="space-y-2">
              {incoming.map((f) => {
                const p = cache[f.requester_id];
                if (!p) return null;
                return (
                  <li key={f.id} className="flex items-center gap-2">
                    <img src={avatarUrlFor(p.nick, p.avatar_url ?? undefined)} alt="" className="h-8 w-8 rounded-md" />
                    <span className="flex-1 text-sm truncate font-medium">{p.nick}</span>
                    <button onClick={() => accept(f.id)} title="Aceitar" className="p-1 rounded text-accent hover:bg-accent/15"><UserCheck className="h-4 w-4" /></button>
                    <button onClick={() => remove(f.id)} title="Recusar" className="p-1 rounded text-destructive hover:bg-destructive/15"><UserX className="h-4 w-4" /></button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
        <section className="rounded-lg border border-border/60 bg-card/40 p-4">
          <h3 className="font-display text-sm uppercase tracking-wider mb-3">Enviados ({outgoing.length})</h3>
          {outgoing.length === 0 ? <p className="text-xs text-muted-foreground">Nenhum pedido enviado.</p> : (
            <ul className="space-y-2">
              {outgoing.map((f) => {
                const p = cache[f.addressee_id];
                if (!p) return null;
                return (
                  <li key={f.id} className="flex items-center gap-2">
                    <img src={avatarUrlFor(p.nick, p.avatar_url ?? undefined)} alt="" className="h-8 w-8 rounded-md" />
                    <span className="flex-1 text-sm truncate">{p.nick}</span>
                    <button onClick={() => remove(f.id)} title="Cancelar" className="p-1 rounded text-muted-foreground hover:bg-secondary"><UserX className="h-4 w-4" /></button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </aside>
    </div>
  );
}

/* =================== MESSAGES =================== */
function MessagesPanel({ me }: { me: Me }) {
  const [friends, setFriends] = useState<PublicMiniProfile[]>([]);
  const [openWith, setOpenWith] = useState<string | null>(null);
  const { cache, ensure } = useProfileCache();

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("friendships")
      .select("requester_id, addressee_id")
      .eq("status", "accepted")
      .or(`requester_id.eq.${me.id},addressee_id.eq.${me.id}`);
    const ids = (data ?? []).map((f) => f.requester_id === me.id ? f.addressee_id : f.requester_id);
    await ensure(ids);
    setFriends(ids.map((id) => cache[id]).filter(Boolean) as PublicMiniProfile[]);
  }, [me.id, cache, ensure]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const handler = (e: Event) => {
      const userId = (e as CustomEvent<{ userId: string }>).detail.userId;
      setOpenWith(userId);
    };
    window.addEventListener("open-dm", handler);
    return () => window.removeEventListener("open-dm", handler);
  }, []);

  return (
    <div className="grid gap-4 md:grid-cols-[260px_1fr]">
      <aside className="rounded-lg border border-border/60 bg-card/40 p-3 max-h-[600px] overflow-y-auto">
        <h3 className="font-display text-sm uppercase tracking-wider mb-3 px-2">Conversas</h3>
        {friends.length === 0 ? (
          <p className="text-xs text-muted-foreground px-2">Adicione amigos para começar a conversar.</p>
        ) : (
          <ul className="space-y-1">
            {friends.map((f) => (
              <li key={f.id}>
                <button
                  onClick={() => setOpenWith(f.id)}
                  className={"w-full flex items-center gap-2 p-2 rounded-md text-left transition " + (openWith === f.id ? "bg-accent/15" : "hover:bg-secondary/50")}
                >
                  <img src={avatarUrlFor(f.nick, f.avatar_url ?? undefined)} alt="" className="h-8 w-8 rounded-md" />
                  <span className="text-sm font-medium truncate">{f.nick}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>
      <div className="rounded-lg border border-border/60 bg-card/40 min-h-[500px] flex flex-col">
        {openWith ? <DMThread me={me} otherId={openWith} other={cache[openWith]} /> : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
            Selecione um amigo para conversar.
          </div>
        )}
      </div>
    </div>
  );
}

function DMThread({ me, otherId, other }: { me: Me; otherId: string; other?: PublicMiniProfile }) {
  const [msgs, setMsgs] = useState<DM[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("direct_messages")
      .select("*")
      .or(`and(sender_id.eq.${me.id},recipient_id.eq.${otherId}),and(sender_id.eq.${otherId},recipient_id.eq.${me.id})`)
      .order("created_at", { ascending: true })
      .limit(200);
    if (error) { toast.error(error.message); return; }
    setMsgs(data ?? []);
  }, [me.id, otherId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const ch = supabase
      .channel(`dm:${me.id}:${otherId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "direct_messages" }, (payload) => {
        const m = payload.new as DM;
        if ((m.sender_id === me.id && m.recipient_id === otherId) || (m.sender_id === otherId && m.recipient_id === me.id)) {
          setMsgs((prev) => prev.some((x) => x.id === m.id) ? prev : [...prev, m]);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [me.id, otherId]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs.length]);

  const send = async () => {
    const content = text.trim();
    if (!content || sending) return;
    setSending(true);
    const { error } = await supabase.from("direct_messages").insert({
      sender_id: me.id, recipient_id: otherId, content,
    });
    setSending(false);
    if (error) { toast.error(error.message); return; }
    setText("");
  };

  return (
    <>
      <header className="px-4 py-3 border-b border-border/60 flex items-center gap-3">
        {other && <img src={avatarUrlFor(other.nick, other.avatar_url ?? undefined)} alt="" className="h-9 w-9 rounded-md" />}
        <div className="flex-1">
          <p className="font-semibold">{other?.nick ?? "..."}</p>
          <p className="text-xs text-muted-foreground">Conversa privada</p>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-[420px]">
        {msgs.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-10">Sem mensagens ainda. Mande a primeira!</p>
        ) : msgs.map((m) => {
          const mine = m.sender_id === me.id;
          return (
            <div key={m.id} className={"flex " + (mine ? "justify-end" : "justify-start")}>
              <div className={"max-w-[75%] px-3 py-2 rounded-2xl text-sm " + (mine ? "bg-accent text-accent-foreground rounded-br-sm" : "bg-secondary rounded-bl-sm")}>
                <p className="whitespace-pre-wrap break-words">{m.content}</p>
                <p className={"text-[10px] mt-1 opacity-60"}>{new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      <form onSubmit={(e) => { e.preventDefault(); send(); }} className="border-t border-border/60 p-3 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={2000}
          placeholder="Escreva uma mensagem..."
          className="flex-1 px-3 py-2 rounded-md bg-background border border-border focus:border-accent outline-none text-sm"
        />
        <button type="submit" disabled={!text.trim() || sending} className="px-4 py-2 rounded-md bg-accent text-accent-foreground font-semibold disabled:opacity-50 inline-flex items-center gap-2">
          <Send className="h-4 w-4" />
        </button>
      </form>
    </>
  );
}

/* =================== CLANS =================== */
function ClansPanel({ me }: { me: Me }) {
  const [myMembership, setMyMembership] = useState<ClanMemberRow | null | undefined>(undefined);

  const load = useCallback(async () => {
    const { data } = await supabase.from("clan_members").select("*").eq("user_id", me.id).maybeSingle();
    setMyMembership(data ?? null);
  }, [me.id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const ch = supabase.channel(`me-clan:${me.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "clan_members", filter: `user_id=eq.${me.id}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [me.id, load]);

  if (myMembership === undefined) return <div className="text-muted-foreground text-sm">Carregando...</div>;
  if (myMembership) return <MyClanView me={me} membership={myMembership} />;
  return <NoClanView me={me} />;
}

function NoClanView({ me }: { me: Me }) {
  const [clans, setClans] = useState<(ClanRow & { member_count: number })[]>([]);
  const [invites, setInvites] = useState<ClanInviteRow[]>([]);
  const [inviteClans, setInviteClans] = useState<Record<string, ClanRow>>({});
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", tag: "", description: "" });

  const load = useCallback(async () => {
    const [{ data: cs }, { data: inv }] = await Promise.all([
      supabase.from("clans").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("clan_invites").select("*").eq("invitee_id", me.id).eq("status", "pending"),
    ]);
    setClans((cs ?? []).map((c) => ({ ...c, member_count: 0 })));
    setInvites(inv ?? []);
    if (inv && inv.length) {
      const { data: clanRows } = await supabase.from("clans").select("*").in("id", inv.map((i) => i.clan_id));
      const map: Record<string, ClanRow> = {};
      for (const c of clanRows ?? []) map[c.id] = c;
      setInviteClans(map);
    }
    // counts
    if (cs && cs.length) {
      const { data: members } = await supabase.from("clan_members").select("clan_id").in("clan_id", cs.map((c) => c.id));
      const counts: Record<string, number> = {};
      for (const m of members ?? []) counts[m.clan_id] = (counts[m.clan_id] ?? 0) + 1;
      setClans(cs.map((c) => ({ ...c, member_count: counts[c.id] ?? 0 })));
    }
  }, [me.id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const ch = supabase.channel(`invites:${me.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "clan_invites", filter: `invitee_id=eq.${me.id}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [me.id, load]);

  const createClan = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = form.name.trim();
    const tag = form.tag.trim().toUpperCase();
    if (name.length < 2 || tag.length < 2) { toast.error("Nome e tag muito curtos"); return; }
    setCreating(true);
    const { error } = await supabase.from("clans").insert({
      name, tag, description: form.description.trim(), owner_id: me.id,
    });
    setCreating(false);
    if (error) { toast.error(error.code === "23505" ? "Nome ou tag já em uso" : error.message); return; }
    toast.success("Clan criado!");
    setForm({ name: "", tag: "", description: "" });
  };

  const acceptInvite = async (id: string) => {
    const { error } = await supabase.rpc("accept_clan_invite", { _invite_id: id });
    if (error) toast.error(error.message); else toast.success("Você entrou no clan!");
  };
  const declineInvite = async (id: string) => {
    const { error } = await supabase.from("clan_invites").update({ status: "declined" }).eq("id", id);
    if (error) toast.error(error.message);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <section className="rounded-lg border border-border/60 bg-card/40 p-5">
          <h2 className="font-display text-lg font-semibold mb-3 flex items-center gap-2"><Plus className="h-4 w-4" /> Criar um clan</h2>
          <form onSubmit={createClan} className="grid gap-3 sm:grid-cols-[1fr_140px]">
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Nome do clan" maxLength={40} className="px-3 py-2 rounded-md bg-background border border-border" />
            <input value={form.tag} onChange={(e) => setForm((f) => ({ ...f, tag: e.target.value }))} placeholder="TAG" maxLength={8} className="px-3 py-2 rounded-md bg-background border border-border uppercase" />
            <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Descrição (opcional)" maxLength={500} rows={2} className="sm:col-span-2 px-3 py-2 rounded-md bg-background border border-border resize-none" />
            <button type="submit" disabled={creating} className="sm:col-span-2 px-4 py-2 rounded-md bg-gradient-brand text-brand-foreground font-semibold uppercase tracking-wider disabled:opacity-50">
              {creating ? "Criando..." : "Criar clan"}
            </button>
          </form>
        </section>

        <section className="rounded-lg border border-border/60 bg-card/40 p-5">
          <h2 className="font-display text-lg font-semibold mb-3">Clans da comunidade</h2>
          {clans.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum clan ainda. Seja o primeiro!</p> : (
            <ul className="grid gap-2 sm:grid-cols-2">
              {clans.map((c) => (
                <li key={c.id} className="p-3 rounded-md border border-border/60 bg-background/40">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded bg-accent/15 text-accent text-xs font-bold font-mono">[{c.tag}]</span>
                    <span className="font-semibold truncate">{c.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{c.description || "Sem descrição."}</p>
                  <p className="text-[10px] text-muted-foreground mt-2 uppercase tracking-wider">{c.member_count} membro(s)</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <aside className="rounded-lg border border-border/60 bg-card/40 p-4 h-fit">
        <h3 className="font-display text-sm uppercase tracking-wider mb-3 flex items-center gap-2"><Inbox className="h-4 w-4" /> Convites ({invites.length})</h3>
        {invites.length === 0 ? <p className="text-xs text-muted-foreground">Nenhum convite pendente.</p> : (
          <ul className="space-y-3">
            {invites.map((i) => {
              const c = inviteClans[i.clan_id];
              return (
                <li key={i.id} className="p-2 rounded-md border border-border/60">
                  <p className="font-semibold text-sm">[{c?.tag}] {c?.name}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{c?.description}</p>
                  <div className="flex gap-2">
                    <button onClick={() => acceptInvite(i.id)} className="flex-1 px-2 py-1 text-xs rounded bg-accent text-accent-foreground font-semibold">Aceitar</button>
                    <button onClick={() => declineInvite(i.id)} className="flex-1 px-2 py-1 text-xs rounded bg-secondary text-foreground font-semibold">Recusar</button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </aside>
    </div>
  );
}

function MyClanView({ me, membership }: { me: Me; membership: ClanMemberRow }) {
  const [clan, setClan] = useState<ClanRow | null>(null);
  const [members, setMembers] = useState<ClanMemberRow[]>([]);
  const { cache, ensure } = useProfileCache();
  const [showInvite, setShowInvite] = useState(false);

  const load = useCallback(async () => {
    const [{ data: c }, { data: ms }] = await Promise.all([
      supabase.from("clans").select("*").eq("id", membership.clan_id).maybeSingle(),
      supabase.from("clan_members").select("*").eq("clan_id", membership.clan_id).order("role"),
    ]);
    setClan(c ?? null);
    setMembers(ms ?? []);
    await ensure((ms ?? []).map((m) => m.user_id));
  }, [membership.clan_id, ensure]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const ch = supabase.channel(`clan:${membership.clan_id}:members`)
      .on("postgres_changes", { event: "*", schema: "public", table: "clan_members", filter: `clan_id=eq.${membership.clan_id}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [membership.clan_id, load]);

  const canInvite = membership.role === "leader" || membership.role === "officer";
  const isLeader = membership.role === "leader";

  const leave = async () => {
    if (isLeader) { toast.error("Líder não pode sair. Exclua o clan ou transfira a liderança."); return; }
    if (!confirm("Sair do clan?")) return;
    const { error } = await supabase.from("clan_members").delete().eq("id", membership.id);
    if (error) toast.error(error.message);
  };
  const kick = async (m: ClanMemberRow) => {
    if (!confirm("Remover este membro?")) return;
    const { error } = await supabase.from("clan_members").delete().eq("id", m.id);
    if (error) toast.error(error.message);
  };
  const promote = async (m: ClanMemberRow) => {
    const next = m.role === "member" ? "officer" : "member";
    const { error } = await supabase.from("clan_members").update({ role: next }).eq("id", m.id);
    if (error) toast.error(error.message);
  };
  const deleteClan = async () => {
    if (!confirm(`Excluir clan ${clan?.name}? Esta ação não pode ser desfeita.`)) return;
    const { error } = await supabase.from("clans").delete().eq("id", membership.clan_id);
    if (error) toast.error(error.message); else toast.success("Clan excluído.");
  };

  if (!clan) return <div className="text-muted-foreground text-sm">Carregando...</div>;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <section className="rounded-lg border border-border/60 bg-card/40 p-5">
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 rounded-lg bg-accent/15 text-accent flex items-center justify-center font-mono font-bold text-lg">[{clan.tag}]</div>
            <div className="flex-1">
              <h2 className="font-display text-2xl font-bold">{clan.name}</h2>
              <p className="text-sm text-muted-foreground mt-1">{clan.description || "Sem descrição."}</p>
              <p className="text-xs text-muted-foreground mt-2">{members.length} membro(s) · Criado em {new Date(clan.created_at).toLocaleDateString()}</p>
            </div>
            <div className="flex flex-col gap-2">
              {!isLeader && (
                <button onClick={leave} className="px-3 py-1.5 text-xs rounded-md border border-border hover:bg-destructive/15 hover:text-destructive inline-flex items-center gap-1">
                  <LogOut className="h-3.5 w-3.5" /> Sair
                </button>
              )}
              {isLeader && (
                <button onClick={deleteClan} className="px-3 py-1.5 text-xs rounded-md border border-destructive/40 text-destructive hover:bg-destructive/15 inline-flex items-center gap-1">
                  <Trash2 className="h-3.5 w-3.5" /> Excluir
                </button>
              )}
            </div>
          </div>
        </section>

        <ClanChat me={me} clanId={clan.id} memberProfiles={cache} />
      </div>

      <aside className="space-y-4">
        <section className="rounded-lg border border-border/60 bg-card/40 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-sm uppercase tracking-wider flex items-center gap-2"><Users className="h-4 w-4" /> Membros</h3>
            {canInvite && (
              <button onClick={() => setShowInvite((v) => !v)} className="p-1 rounded text-accent hover:bg-accent/15" title="Convidar">
                <UserPlus className="h-4 w-4" />
              </button>
            )}
          </div>
          {showInvite && canInvite && <InviteMemberForm me={me} clanId={clan.id} onDone={() => setShowInvite(false)} />}
          <ul className="space-y-2 mt-3">
            {members.map((m) => {
              const p = cache[m.user_id];
              if (!p) return null;
              return (
                <li key={m.id} className="flex items-center gap-2">
                  <img src={avatarUrlFor(p.nick, p.avatar_url ?? undefined)} alt="" className="h-8 w-8 rounded-md" />
                  <div className="flex-1 min-w-0">
                    <Link to="/jogadores/$id" params={{ id: p.id }} className="text-sm font-medium truncate hover:text-accent block">{p.nick}</Link>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      {m.role === "leader" && <Crown className="h-3 w-3 text-amber-400" />}
                      {m.role === "officer" && <Shield className="h-3 w-3 text-accent" />}
                      {m.role}
                    </p>
                  </div>
                  {isLeader && m.user_id !== me.id && (
                    <>
                      <button onClick={() => promote(m)} title={m.role === "member" ? "Promover" : "Rebaixar"} className="p-1 rounded text-accent hover:bg-accent/15"><Shield className="h-3.5 w-3.5" /></button>
                      <button onClick={() => kick(m)} title="Remover" className="p-1 rounded text-destructive hover:bg-destructive/15"><UserX className="h-3.5 w-3.5" /></button>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      </aside>
    </div>
  );
}

function InviteMemberForm({ me, clanId, onDone }: { me: Me; clanId: string; onDone: () => void }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<PublicMiniProfile[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) { setResults([]); return; }
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const rows = await searchUsersByNick({ data: { q: term, excludeId: me.id } });
        setResults(rows);
      } finally { setSearching(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [q, me.id]);

  const invite = async (userId: string) => {
    const { error } = await supabase.from("clan_invites").insert({
      clan_id: clanId, inviter_id: me.id, invitee_id: userId,
    });
    if (error) {
      toast.error(error.code === "23505" ? "Convite já enviado" : error.message);
      return;
    }
    toast.success("Convite enviado!");
    onDone();
  };

  return (
    <div className="p-2 rounded-md bg-background/60 border border-border/60 space-y-2">
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nick do jogador" className="w-full px-2 py-1.5 text-sm rounded bg-background border border-border" />
      {searching && <div className="text-xs text-muted-foreground">Buscando...</div>}
      {results.length > 0 && (
        <ul className="space-y-1">
          {results.map((u) => (
            <li key={u.id} className="flex items-center gap-2">
              <img src={avatarUrlFor(u.nick, u.avatar_url ?? undefined)} alt="" className="h-6 w-6 rounded" />
              <span className="text-xs flex-1 truncate">{u.nick}</span>
              <button onClick={() => invite(u.id)} className="text-[10px] px-2 py-1 rounded bg-accent text-accent-foreground font-semibold uppercase">Convidar</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ClanChat({ me, clanId, memberProfiles }: { me: Me; clanId: string; memberProfiles: Record<string, PublicMiniProfile> }) {
  const [msgs, setMsgs] = useState<ClanMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("clan_messages")
      .select("*")
      .eq("clan_id", clanId)
      .order("created_at", { ascending: true })
      .limit(200);
    if (error) { toast.error(error.message); return; }
    setMsgs(data ?? []);
  }, [clanId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const ch = supabase
      .channel(`clan-chat:${clanId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "clan_messages", filter: `clan_id=eq.${clanId}` }, (payload) => {
        const m = payload.new as ClanMessage;
        setMsgs((prev) => prev.some((x) => x.id === m.id) ? prev : [...prev, m]);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [clanId]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs.length]);

  const send = async () => {
    const content = text.trim();
    if (!content || sending) return;
    setSending(true);
    const { error } = await supabase.from("clan_messages").insert({ clan_id: clanId, sender_id: me.id, content });
    setSending(false);
    if (error) toast.error(error.message); else setText("");
  };

  return (
    <section className="rounded-lg border border-border/60 bg-card/40 flex flex-col min-h-[400px]">
      <header className="px-4 py-3 border-b border-border/60 flex items-center gap-2">
        <MessageCircle className="h-4 w-4 text-accent" />
        <h2 className="font-display font-semibold">Chat do clan</h2>
      </header>
      <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[400px]">
        {msgs.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-10">Sem mensagens. Comece a conversa!</p>
        ) : msgs.map((m) => {
          const p = memberProfiles[m.sender_id];
          const mine = m.sender_id === me.id;
          return (
            <div key={m.id} className="flex items-start gap-2">
              <img src={avatarUrlFor(p?.nick ?? "p", p?.avatar_url ?? undefined)} alt="" className="h-8 w-8 rounded-md flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs">
                  <span className={"font-semibold " + (mine ? "text-accent" : "text-foreground")}>{p?.nick ?? "..."}</span>
                  <span className="text-muted-foreground ml-2">{new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </p>
                <p className="text-sm whitespace-pre-wrap break-words mt-0.5">{m.content}</p>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      <form onSubmit={(e) => { e.preventDefault(); send(); }} className="border-t border-border/60 p-3 flex gap-2">
        <input value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} placeholder="Mensagem para o clan..." className="flex-1 px-3 py-2 rounded-md bg-background border border-border focus:border-accent outline-none text-sm" />
        <button type="submit" disabled={!text.trim() || sending} className="px-4 py-2 rounded-md bg-accent text-accent-foreground font-semibold disabled:opacity-50 inline-flex items-center gap-2">
          <Send className="h-4 w-4" />
        </button>
      </form>
    </section>
  );
}
