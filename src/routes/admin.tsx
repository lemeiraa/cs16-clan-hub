import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  listUsersAdmin,
  setUserAdmin,
  setUserBanned,
  deleteUserAdmin,
  sendPasswordResetAdmin,
} from "@/lib/admin.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  component: AdminPanel,
  head: () => ({ meta: [{ title: "Painel Admin — CS Nostalgia" }] }),
});

type Tab = "servidores" | "cargos" | "ammo" | "pagamentos" | "whatsapp" | "usuarios";

function AdminPanel() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<Tab>("servidores");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) { navigate({ to: "/auth" }); return; }
      const { data: role } = await supabase
        .from("user_roles").select("role").eq("user_id", data.user.id).eq("role", "admin").maybeSingle();
      if (!role) { toast.error("Acesso restrito a administradores"); navigate({ to: "/" }); return; }
      setReady(true);
    })();
  }, [navigate]);

  if (!ready) return <div className="container mx-auto px-4 py-12">Carregando...</div>;

  const tabs: { id: Tab; label: string }[] = [
    { id: "servidores", label: "Servidores" },
    { id: "cargos", label: "Cargos / VIP" },
    { id: "ammo", label: "Ammo Packs" },
    { id: "pagamentos", label: "Pagamentos" },
    { id: "whatsapp", label: "WhatsApp" },
    { id: "usuarios", label: "Usuários" },
  ];

  return (
    <section className="container mx-auto px-4 py-10">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Painel Admin</h1>
          <p className="text-muted-foreground text-sm mt-1">Gerencie servidores, cargos, valores e usuários.</p>
        </div>
        <Link
          to="/admin/pedidos"
          className="px-4 py-2 text-sm font-bold uppercase tracking-wider rounded-md bg-gradient-brand text-brand-foreground"
        >
          Ver Pedidos →
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap gap-1 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "px-4 py-2.5 text-sm font-semibold uppercase tracking-wider border-b-2 transition",
              tab === t.id
                ? "border-accent text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "servidores" && <ServersAdmin />}
        {tab === "cargos" && <PlansAdmin />}
        {tab === "ammo" && <AmmoAdmin />}
        {tab === "pagamentos" && <PaymentMethodsAdmin />}
        {tab === "whatsapp" && <WhatsappAdminsAdmin />}
        {tab === "usuarios" && <UsersAdmin />}
      </div>
    </section>
  );
}

/* ============== SERVERS ============== */
function ServersAdmin() {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("servers").select("*").order("sort_order");
    if (error) toast.error(error.message);
    setList(data ?? []);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const remove = async (slug: string) => {
    if (!confirm(`Excluir servidor ${slug}?`)) return;
    const { error } = await supabase.from("servers").delete().eq("slug", slug);
    if (error) return toast.error(error.message);
    toast.success("Excluído"); load();
  };

  return (
    <div>
      <div className="flex justify-between mb-4">
        <h2 className="font-display text-xl font-bold">Servidores ({list.length})</h2>
        <button onClick={() => setCreating(true)} className="px-3 py-1.5 text-xs uppercase rounded bg-accent/20 text-accent hover:bg-accent/30">+ Novo</button>
      </div>
      {loading ? "Carregando..." : (
        <div className="grid gap-3">
          {list.map((s) => (
            <div key={s.slug} className="rounded-lg border border-border bg-card p-4 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <p className="font-bold">{s.flag} {s.name} <span className="text-xs text-muted-foreground">({s.slug})</span></p>
                <p className="text-xs text-muted-foreground font-mono">{s.ip}:{s.port} · {s.mode}{s.coming_soon && " · em breve"}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setEditing(s)} className="px-2 py-1 text-xs rounded bg-secondary hover:bg-secondary/70">Editar</button>
                <button onClick={() => remove(s.slug)} className="px-2 py-1 text-xs rounded bg-destructive/20 text-destructive hover:bg-destructive/30">Excluir</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {(editing || creating) && (
        <ServerForm
          initial={editing}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSaved={() => { setEditing(null); setCreating(false); load(); }}
        />
      )}
    </div>
  );
}

function ServerForm({ initial, onClose, onSaved }: { initial: any | null; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({
    slug: initial?.slug ?? "",
    name: initial?.name ?? "",
    short: initial?.short ?? "",
    ip: initial?.ip ?? "0.0.0.0",
    port: initial?.port ?? 27015,
    country: initial?.country ?? "BR",
    flag: initial?.flag ?? "🇧🇷",
    mode: initial?.mode ?? "",
    description: initial?.description ?? "",
    coming_soon: initial?.coming_soon ?? false,
    rules: JSON.stringify(initial?.rules ?? [], null, 2),
    commands: JSON.stringify(initial?.commands ?? [], null, 2),
    sort_order: initial?.sort_order ?? 0,
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        slug: f.slug, name: f.name, short: f.short, ip: f.ip, port: Number(f.port),
        country: f.country, flag: f.flag, mode: f.mode, description: f.description,
        coming_soon: f.coming_soon, rules: JSON.parse(f.rules), commands: JSON.parse(f.commands),
        sort_order: Number(f.sort_order),
      };
      const op = initial
        ? supabase.from("servers").update(payload).eq("slug", initial.slug)
        : supabase.from("servers").insert(payload);
      const { error } = await op;
      if (error) throw error;
      toast.success("Salvo"); onSaved();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  return (
    <Modal title={initial ? "Editar servidor" : "Novo servidor"} onClose={onClose}>
      <div className="grid gap-3 md:grid-cols-2">
        <Input label="Slug *" value={f.slug} onChange={(v) => setF({ ...f, slug: v })} disabled={!!initial} />
        <Input label="Nome *" value={f.name} onChange={(v) => setF({ ...f, name: v })} />
        <Input label="Nome curto" value={f.short} onChange={(v) => setF({ ...f, short: v })} />
        <Input label="Modo" value={f.mode} onChange={(v) => setF({ ...f, mode: v })} />
        <Input label="IP" value={f.ip} onChange={(v) => setF({ ...f, ip: v })} />
        <Input label="Porta" value={String(f.port)} onChange={(v) => setF({ ...f, port: Number(v) })} />
        <Input label="País (BR/VE)" value={f.country} onChange={(v) => setF({ ...f, country: v })} />
        <Input label="Bandeira (emoji)" value={f.flag} onChange={(v) => setF({ ...f, flag: v })} />
        <Input label="Ordem" value={String(f.sort_order)} onChange={(v) => setF({ ...f, sort_order: Number(v) })} />
        <label className="flex items-center gap-2 text-sm mt-6">
          <input type="checkbox" checked={f.coming_soon} onChange={(e) => setF({ ...f, coming_soon: e.target.checked })} />
          Em breve
        </label>
      </div>
      <Textarea label="Descrição" value={f.description} onChange={(v) => setF({ ...f, description: v })} rows={2} />
      <Textarea label='Regras (JSON: ["...","..."])' value={f.rules} onChange={(v) => setF({ ...f, rules: v })} rows={4} mono />
      <Textarea label='Comandos (JSON: [{"cmd":"/menu","desc":"..."}])' value={f.commands} onChange={(v) => setF({ ...f, commands: v })} rows={4} mono />
      <ModalActions onClose={onClose} onSave={save} saving={saving} />
    </Modal>
  );
}

/* ============== PLANS ============== */
function PlansAdmin() {
  const [list, setList] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from("plans").select("*").order("sort_order");
    if (error) toast.error(error.message); setList(data ?? []);
  }, []);
  useEffect(() => { load(); }, [load]);

  const remove = async (id: string) => {
    if (!confirm("Excluir cargo?")) return;
    const { error } = await supabase.from("plans").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <div>
      <div className="flex justify-between mb-4">
        <h2 className="font-display text-xl font-bold">Cargos / VIP ({list.length})</h2>
        <button onClick={() => setCreating(true)} className="px-3 py-1.5 text-xs uppercase rounded bg-accent/20 text-accent hover:bg-accent/30">+ Novo</button>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {list.map((p) => (
          <div key={p.id} className="rounded-lg border border-border bg-card p-4">
            <div className="flex justify-between items-start gap-2">
              <div>
                <p className="font-bold uppercase">{p.label} <span className="text-xs text-muted-foreground">({p.tier})</span></p>
                <p className="font-display text-2xl text-gradient">R$ {Number(p.price_brl).toFixed(2).replace(".", ",")}</p>
                <p className="text-xs text-muted-foreground">{p.active ? "Ativo" : "Inativo"}{p.highlight && " · destaque"}</p>
                <ul className="text-xs text-muted-foreground mt-2 list-disc pl-4">
                  {(p.perks ?? []).map((x: string, i: number) => <li key={i}>{x}</li>)}
                </ul>
              </div>
              <div className="flex flex-col gap-1">
                <button onClick={() => setEditing(p)} className="px-2 py-1 text-xs rounded bg-secondary">Editar</button>
                <button onClick={() => remove(p.id)} className="px-2 py-1 text-xs rounded bg-destructive/20 text-destructive">Excluir</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {(editing || creating) && (
        <PlanForm initial={editing} onClose={() => { setEditing(null); setCreating(false); }}
          onSaved={() => { setEditing(null); setCreating(false); load(); }} />
      )}
    </div>
  );
}

function PlanForm({ initial, onClose, onSaved }: any) {
  const [f, setF] = useState({
    tier: initial?.tier ?? "",
    label: initial?.label ?? "",
    price_brl: initial?.price_brl ?? 0,
    perks: JSON.stringify(initial?.perks ?? [], null, 2),
    highlight: initial?.highlight ?? false,
    active: initial?.active ?? true,
    sort_order: initial?.sort_order ?? 0,
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const payload = { ...f, price_brl: Number(f.price_brl), sort_order: Number(f.sort_order), perks: JSON.parse(f.perks) };
      const op = initial
        ? supabase.from("plans").update(payload).eq("id", initial.id)
        : supabase.from("plans").insert(payload);
      const { error } = await op;
      if (error) throw error;
      toast.success("Salvo"); onSaved();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  return (
    <Modal title={initial ? "Editar cargo" : "Novo cargo"} onClose={onClose}>
      <div className="grid gap-3 md:grid-cols-2">
        <Input label="Tier (id) *" value={f.tier} onChange={(v) => setF({ ...f, tier: v })} disabled={!!initial} />
        <Input label="Label *" value={f.label} onChange={(v) => setF({ ...f, label: v })} />
        <Input label="Preço (R$) *" value={String(f.price_brl)} onChange={(v) => setF({ ...f, price_brl: v })} />
        <Input label="Ordem" value={String(f.sort_order)} onChange={(v) => setF({ ...f, sort_order: Number(v) })} />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.highlight} onChange={(e) => setF({ ...f, highlight: e.target.checked })} /> Destaque</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} /> Ativo</label>
      </div>
      <Textarea label='Benefícios (JSON: ["...","..."])' value={f.perks} onChange={(v) => setF({ ...f, perks: v })} rows={5} mono />
      <ModalActions onClose={onClose} onSave={save} saving={saving} />
    </Modal>
  );
}

/* ============== AMMO ============== */
function AmmoAdmin() {
  const [f, setF] = useState<any>(null);
  const [servers, setServers] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("ammo_settings").select("*").eq("id", 1).single();
      setF(data);
      const { data: s } = await supabase.from("servers").select("slug,name").eq("coming_soon", false);
      setServers(s ?? []);
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("ammo_settings").update({
      price_per_1000: Number(f.price_per_1000),
      min_qty: Number(f.min_qty),
      max_qty: Number(f.max_qty),
      step_qty: Number(f.step_qty),
      forced_server_slug: f.forced_server_slug || null,
    }).eq("id", 1);
    setSaving(false);
    if (error) toast.error(error.message); else toast.success("Salvo");
  };

  if (!f) return <div>Carregando...</div>;
  return (
    <div className="max-w-xl space-y-3">
      <h2 className="font-display text-xl font-bold">Configuração de Ammo Packs</h2>
      <Input label="Preço por 1.000 (R$)" value={String(f.price_per_1000)} onChange={(v) => setF({ ...f, price_per_1000: v })} />
      <Input label="Mínimo" value={String(f.min_qty)} onChange={(v) => setF({ ...f, min_qty: v })} />
      <Input label="Máximo" value={String(f.max_qty)} onChange={(v) => setF({ ...f, max_qty: v })} />
      <Input label="Passo" value={String(f.step_qty)} onChange={(v) => setF({ ...f, step_qty: v })} />
      <div>
        <label className="text-xs uppercase tracking-wider text-muted-foreground">Servidor fixo (opcional)</label>
        <select value={f.forced_server_slug ?? ""} onChange={(e) => setF({ ...f, forced_server_slug: e.target.value })}
          className="w-full mt-1 rounded-md border border-border bg-input px-3 py-2">
          <option value="">— nenhum —</option>
          {servers.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}
        </select>
      </div>
      <button onClick={save} disabled={saving} className="px-4 py-2 text-sm font-bold uppercase rounded-md bg-gradient-brand text-brand-foreground disabled:opacity-50">
        {saving ? "Salvando..." : "Salvar"}
      </button>
    </div>
  );
}

/* ============== PAYMENT METHODS ============== */
function PaymentMethodsAdmin() {
  const [list, setList] = useState<any[]>([]);
  const load = async () => {
    const { data } = await supabase.from("payment_methods").select("*").order("id");
    setList(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const update = async (id: string, fields: any) => {
    const { error } = await supabase.from("payment_methods").update(fields).eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <div className="space-y-3 max-w-2xl">
      <h2 className="font-display text-xl font-bold">Métodos de Pagamento</h2>
      {list.map((m) => (
        <div key={m.id} className="rounded-lg border border-border bg-card p-4 space-y-2">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-bold">{m.label} <span className="text-xs text-muted-foreground">({m.id})</span></p>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={m.enabled} onChange={(e) => update(m.id, { enabled: e.target.checked })} />
              Ativo
            </label>
          </div>
          <Input label="Label" value={m.label} onChange={(v) => update(m.id, { label: v })} />
          <Textarea label="Descrição" value={m.description ?? ""} onChange={(v) => update(m.id, { description: v })} rows={2} />
        </div>
      ))}
    </div>
  );
}

/* ============== WHATSAPP ADMINS ============== */
function WhatsappAdminsAdmin() {
  const [list, setList] = useState<any[]>([]);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  const load = async () => {
    const { data } = await supabase.from("whatsapp_admins").select("*").order("sort_order");
    setList(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const remove = async (id: string) => {
    if (!confirm("Excluir contato?")) return;
    const { error } = await supabase.from("whatsapp_admins").delete().eq("id", id);
    if (error) return toast.error(error.message); load();
  };
  const toggle = async (id: string, active: boolean) => {
    await supabase.from("whatsapp_admins").update({ active }).eq("id", id); load();
  };

  return (
    <div>
      <div className="flex justify-between mb-4">
        <h2 className="font-display text-xl font-bold">Admins WhatsApp ({list.length})</h2>
        <button onClick={() => setCreating(true)} className="px-3 py-1.5 text-xs uppercase rounded bg-accent/20 text-accent">+ Novo</button>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {list.map((w) => (
          <div key={w.id} className="rounded-lg border border-border bg-card p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold">{w.name}</p>
                <p className="text-xs font-mono text-accent">{w.display}</p>
                <p className="text-[10px] text-muted-foreground font-mono">wa.me/{w.phone}</p>
              </div>
              <div className="flex flex-col gap-1">
                <button onClick={() => setEditing(w)} className="px-2 py-1 text-xs rounded bg-secondary">Editar</button>
                <button onClick={() => remove(w.id)} className="px-2 py-1 text-xs rounded bg-destructive/20 text-destructive">Excluir</button>
              </div>
            </div>
            <label className="flex items-center gap-2 text-xs mt-2">
              <input type="checkbox" checked={w.active} onChange={(e) => toggle(w.id, e.target.checked)} /> Ativo
            </label>
          </div>
        ))}
      </div>
      {(creating || editing) && (
        <WaForm initial={editing} onClose={() => { setEditing(null); setCreating(false); }}
          onSaved={() => { setEditing(null); setCreating(false); load(); }} />
      )}
    </div>
  );
}

function WaForm({ initial, onClose, onSaved }: any) {
  const [f, setF] = useState({
    name: initial?.name ?? "",
    phone: initial?.phone ?? "",
    display: initial?.display ?? "",
    sort_order: initial?.sort_order ?? 0,
    active: initial?.active ?? true,
  });
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    const payload = { ...f, sort_order: Number(f.sort_order), phone: f.phone.replace(/\D/g, "") };
    const op = initial
      ? supabase.from("whatsapp_admins").update(payload).eq("id", initial.id)
      : supabase.from("whatsapp_admins").insert(payload);
    const { error } = await op;
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Salvo"); onSaved();
  };
  return (
    <Modal title={initial ? "Editar contato" : "Novo contato"} onClose={onClose}>
      <Input label="Nome *" value={f.name} onChange={(v) => setF({ ...f, name: v })} />
      <Input label="Telefone (só dígitos com DDI/DDD) *" value={f.phone} onChange={(v) => setF({ ...f, phone: v })} />
      <Input label="Exibição (formatada) *" value={f.display} onChange={(v) => setF({ ...f, display: v })} />
      <Input label="Ordem" value={String(f.sort_order)} onChange={(v) => setF({ ...f, sort_order: Number(v) })} />
      <label className="flex items-center gap-2 text-sm mt-2"><input type="checkbox" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} /> Ativo</label>
      <ModalActions onClose={onClose} onSave={save} saving={saving} />
    </Modal>
  );
}

/* ============== USERS ============== */
function UsersAdmin() {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const fnList = useServerFn(listUsersAdmin);
  const fnAdmin = useServerFn(setUserAdmin);
  const fnBan = useServerFn(setUserBanned);
  const fnDel = useServerFn(deleteUserAdmin);
  const fnReset = useServerFn(sendPasswordResetAdmin);

  const load = useCallback(async () => {
    setLoading(true);
    try { setList(await fnList()); } catch (e: any) { toast.error(e.message); }
    setLoading(false);
  }, [fnList]);
  useEffect(() => { load(); }, [load]);

  const filtered = list.filter((u) =>
    !filter || u.email?.toLowerCase().includes(filter.toLowerCase()) || u.nick?.toLowerCase().includes(filter.toLowerCase()),
  );

  const action = async (fn: () => Promise<any>, msg: string) => {
    try { await fn(); toast.success(msg); load(); } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <h2 className="font-display text-xl font-bold">Usuários ({filtered.length})</h2>
        <input
          placeholder="Buscar por email ou nick..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-md border border-border bg-input px-3 py-1.5 text-sm w-64"
        />
      </div>
      {loading ? "Carregando..." : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Nick</th>
                <th className="px-3 py-2 text-left">Email</th>
                <th className="px-3 py-2 text-left">Cadastro</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-t border-border">
                  <td className="px-3 py-2 font-mono">{u.nick}</td>
                  <td className="px-3 py-2">{u.email}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString("pt-BR")}</td>
                  <td className="px-3 py-2 space-x-1">
                    {u.isAdmin && <span className="px-1.5 py-0.5 text-[10px] rounded bg-accent/20 text-accent">ADMIN</span>}
                    {u.banned && <span className="px-1.5 py-0.5 text-[10px] rounded bg-destructive/20 text-destructive">BANIDO</span>}
                    {!u.isAdmin && !u.banned && <span className="text-xs text-muted-foreground">user</span>}
                  </td>
                  <td className="px-3 py-2 space-x-1 whitespace-nowrap">
                    <button onClick={() => action(() => fnAdmin({ data: { userId: u.id, makeAdmin: !u.isAdmin } }), u.isAdmin ? "Admin removido" : "Promovido")}
                      className="px-2 py-0.5 text-[11px] rounded bg-secondary hover:bg-secondary/70">
                      {u.isAdmin ? "Remover admin" : "Tornar admin"}
                    </button>
                    <button onClick={() => action(() => fnBan({ data: { userId: u.id, banned: !u.banned } }), u.banned ? "Desbanido" : "Banido")}
                      className="px-2 py-0.5 text-[11px] rounded bg-destructive/20 text-destructive hover:bg-destructive/30">
                      {u.banned ? "Desbanir" : "Banir"}
                    </button>
                    <button onClick={() => action(() => fnReset({ data: { email: u.email } }), "Email de reset enviado")}
                      className="px-2 py-0.5 text-[11px] rounded bg-secondary hover:bg-secondary/70">
                      Reset senha
                    </button>
                    <button onClick={() => { if (confirm(`Excluir ${u.email}?`)) action(() => fnDel({ data: { userId: u.id } }), "Excluído"); }}
                      className="px-2 py-0.5 text-[11px] rounded bg-destructive/30 text-destructive hover:bg-destructive/50">
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">Nenhum usuário.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ============== UI helpers ============== */
function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-start justify-center overflow-y-auto p-4" onClick={onClose}>
      <div className="bg-card rounded-xl border border-border max-w-2xl w-full p-6 my-8" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-display text-xl font-bold mb-4">{title}</h3>
        <div className="space-y-3">{children}</div>
      </div>
    </div>
  );
}
function ModalActions({ onClose, onSave, saving }: { onClose: () => void; onSave: () => void; saving: boolean }) {
  return (
    <div className="flex gap-2 justify-end mt-4 pt-4 border-t border-border">
      <button onClick={onClose} className="px-3 py-1.5 text-sm rounded border border-border">Cancelar</button>
      <button onClick={onSave} disabled={saving} className="px-4 py-1.5 text-sm font-bold uppercase rounded bg-gradient-brand text-brand-foreground disabled:opacity-50">
        {saving ? "Salvando..." : "Salvar"}
      </button>
    </div>
  );
}
function Input({ label, value, onChange, disabled }: { label: string; value: string; onChange: (v: string) => void; disabled?: boolean }) {
  return (
    <div>
      <label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}
        className="w-full mt-1 rounded-md border border-border bg-input px-3 py-2 text-sm disabled:opacity-50" />
    </div>
  );
}
function Textarea({ label, value, onChange, rows = 3, mono }: { label: string; value: string; onChange: (v: string) => void; rows?: number; mono?: boolean }) {
  return (
    <div>
      <label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows}
        className={cn("w-full mt-1 rounded-md border border-border bg-input px-3 py-2 text-sm", mono && "font-mono text-xs")} />
    </div>
  );
}
