import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Crown, Shield, Star, Zap, Package, Copy, CheckCircle2, Loader2, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { createPixOrder, checkOrderPayment } from "@/lib/mercadopago.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/loja")({
  component: LojaPage,
  head: () => ({
    meta: [
      { title: "Loja VIP & Ammo Packs — CS Nostalgia" },
      { name: "description", content: "Compre VIP, ADMIN, MASTER, SUPREMO ou Ammo Packs para os servidores CS Nostalgia. Pagamento via PIX ou WhatsApp." },
    ],
  }),
});

const PLAN_ICONS: Record<string, React.ReactNode> = {
  vip: <Star className="h-6 w-6" />,
  admin: <Shield className="h-6 w-6" />,
  master: <Zap className="h-6 w-6" />,
  supremo: <Crown className="h-6 w-6" />,
};

type Plan = { id: string; tier: string; label: string; price_brl: number; perks: string[]; highlight: boolean };
type Server = { slug: string; name: string; short: string };
type WaAdmin = { id: string; name: string; phone: string; display: string };
type AmmoCfg = { price_per_1000: number; min_qty: number; max_qty: number; step_qty: number; forced_server_slug: string | null };
type PaymentMethods = { pix: boolean; whatsapp: boolean };
type Skin = { id: string; server_slug: string; name: string; category: string; price_brl: number; image_url: string | null; description: string };

const SHOP_TIMEOUT_MS = 12000;

async function withTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      window.setTimeout(() => reject(new Error(`${label} demorou demais para responder.`)), SHOP_TIMEOUT_MS);
    }),
  ]);
}

function LojaPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<"plans" | "ammo" | "skins">("plans");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [servers, setServers] = useState<Server[]>([]);
  const [waAdmins, setWaAdmins] = useState<WaAdmin[]>([]);
  const [ammo, setAmmo] = useState<AmmoCfg | null>(null);
  const [methods, setMethods] = useState<PaymentMethods>({ pix: true, whatsapp: true });
  const [skins, setSkins] = useState<Skin[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [p, s, w, a, m] = await withTimeout(Promise.all([
          supabase.from("plans").select("*").eq("active", true).order("sort_order"),
          supabase.from("servers").select("slug,name,short").eq("coming_soon", false).order("sort_order"),
          supabase.from("whatsapp_admins").select("*").eq("active", true).order("sort_order"),
          supabase.from("ammo_settings").select("*").eq("id", 1).single(),
          supabase.from("payment_methods").select("*"),
        ]), "Loja");
        const error = p.error ?? s.error ?? w.error ?? a.error ?? m.error;
        if (error) throw error;
        setPlans((p.data ?? []) as any);
        setServers((s.data ?? []) as any);
        setWaAdmins((w.data ?? []) as any);
        setAmmo((a.data ?? null) as any);
        const mm: PaymentMethods = { pix: true, whatsapp: true };
        (m.data ?? []).forEach((x: any) => { (mm as any)[x.id] = x.enabled; });
        setMethods(mm);
        setLoadError(null);
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : "Não foi possível carregar a loja.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="container mx-auto px-4 py-12">{t("common.loading")}</div>;
  if (loadError) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-5">
          <h1 className="font-display text-2xl font-bold">{t("shop.unavailable")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{loadError}</p>
          <button onClick={() => window.location.reload()} className="mt-4 rounded-md bg-gradient-brand px-4 py-2 text-sm font-bold uppercase tracking-wider text-brand-foreground">
            {t("shop.reload")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <section className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.3em] text-accent font-semibold">{t("shop.eyebrow")}</p>
        <h1 className="font-display text-4xl font-bold mt-1">{t("shop.title")}</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          {t("shop.sub")}
        </p>
      </div>

      <div className="border-b border-border flex gap-1 mb-8">
        <button onClick={() => setTab("plans")} className={cn("px-4 py-3 text-sm font-semibold uppercase tracking-wider border-b-2 transition",
          tab === "plans" ? "border-accent text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}>
          {t("shop.tabPlans")}
        </button>
        <button onClick={() => setTab("ammo")} className={cn("px-4 py-3 text-sm font-semibold uppercase tracking-wider border-b-2 transition",
          tab === "ammo" ? "border-accent text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}>
          {t("shop.tabAmmo")}
        </button>
      </div>

      {tab === "plans"
        ? <PlansGrid plans={plans} servers={servers} waAdmins={waAdmins} methods={methods} />
        : ammo && <AmmoCalculator ammo={ammo} servers={servers} waAdmins={waAdmins} methods={methods} />}
    </section>
  );
}

function PlansGrid({ plans, servers, waAdmins, methods }: { plans: Plan[]; servers: Server[]; waAdmins: WaAdmin[]; methods: PaymentMethods }) {
  const { t } = useTranslation();
  return (
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
      {plans.map((plan) => (
        <div key={plan.id} className={cn("relative rounded-xl border bg-card p-6 shadow-card",
          plan.highlight ? "border-accent shadow-glow" : "border-border")}>
          {plan.highlight && (
            <span className="absolute -top-3 left-6 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-gradient-brand text-brand-foreground">
              {t("shop.mostPopular")}
            </span>
          )}
          <div className="text-accent">{PLAN_ICONS[plan.tier] ?? <Star className="h-6 w-6" />}</div>
          <h3 className="font-display text-2xl font-bold mt-3">{plan.label}</h3>
          <p className="mt-1">
            <span className="font-display text-3xl font-bold text-gradient">R$ {Number(plan.price_brl).toFixed(2).replace(".", ",")}</span>
            <span className="text-sm text-muted-foreground"> {t("shop.perMonth")}</span>
          </p>
          <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground">
            {(plan.perks ?? []).map((p) => <li key={p} className="flex gap-2"><span className="text-accent">✓</span>{p}</li>)}
          </ul>
          <CheckoutForm
            productType="plan" planTier={plan.tier} amount={Number(plan.price_brl)}
            label={t("shop.buy", { label: plan.label })}
            servers={servers} waAdmins={waAdmins} methods={methods}
          />
        </div>
      ))}
    </div>
  );
}

function AmmoCalculator({ ammo, servers, waAdmins, methods }: { ammo: AmmoCfg; servers: Server[]; waAdmins: WaAdmin[]; methods: PaymentMethods }) {
  const { t } = useTranslation();
  const [qty, setQty] = useState(Math.max(ammo.min_qty, 10_000));
  const safeQty = Math.max(ammo.min_qty, Math.min(ammo.max_qty, Math.round(qty / ammo.step_qty) * ammo.step_qty));
  const price = (safeQty / 1000) * Number(ammo.price_per_1000);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr,400px]">
      <div className="rounded-xl border border-border bg-card p-6 shadow-card">
        <div className="flex items-center gap-3">
          <Package className="h-7 w-7 text-accent" />
          <div>
            <h2 className="font-display text-2xl font-bold">{t("shop.ammoTitle")}</h2>
            <p className="text-sm text-muted-foreground">
              {t("shop.ammoSub", { price: Number(ammo.price_per_1000).toFixed(2), max: ammo.max_qty.toLocaleString("pt-BR") })}
            </p>
          </div>
        </div>
        <div className="mt-6">
          <label className="text-xs uppercase tracking-wider text-muted-foreground">{t("shop.quantity")}</label>
          <input type="range" min={ammo.min_qty} max={ammo.max_qty} step={ammo.step_qty}
            value={safeQty} onChange={(e) => setQty(parseInt(e.target.value, 10))} className="w-full mt-2 accent-accent" />
          <div className="flex items-center gap-3 mt-3">
            <input type="number" min={ammo.min_qty} max={ammo.max_qty} step={ammo.step_qty}
              value={qty} onChange={(e) => setQty(parseInt(e.target.value || "0", 10))}
              className="flex-1 rounded-md border border-border bg-input px-3 py-2 font-mono" />
            <span className="text-muted-foreground text-sm">{t("shop.ammoUnit")}</span>
          </div>
        </div>
        <div className="mt-6 rounded-lg bg-gradient-brand p-5 text-brand-foreground">
          <p className="text-xs uppercase tracking-wider opacity-80">{t("shop.totalToPay")}</p>
          <p className="font-display text-4xl font-bold mt-1">R$ {price.toFixed(2).replace(".", ",")}</p>
          <p className="text-sm mt-1 opacity-80">{safeQty.toLocaleString("pt-BR")} {t("shop.ammoUnit")}</p>
        </div>
      </div>
      <CheckoutForm
        productType="ammo_packs" ammoPacks={safeQty} amount={price} label={t("shop.buyAmmo")}
        forcedServerSlug={ammo.forced_server_slug ?? "zombie-plague-brasil"}
        servers={servers} waAdmins={waAdmins} methods={methods}
      />
    </div>
  );
}

function CheckoutForm({
  productType, planTier, ammoPacks, amount, label, forcedServerSlug, servers, waAdmins, methods,
}: {
  productType: "plan" | "ammo_packs";
  planTier?: string;
  ammoPacks?: number;
  amount: number;
  label: string;
  forcedServerSlug?: string;
  servers: Server[];
  waAdmins: WaAdmin[];
  methods: PaymentMethods;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pix, setPix] = useState<{ orderId: string; qrCode: string | null; qrCodeBase64: string | null; ticketUrl: string | null; amount: number } | null>(null);
  const defaultMethod: "pix" | "whatsapp" = methods.pix ? "pix" : "whatsapp";
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "whatsapp">(defaultMethod);
  const [form, setForm] = useState({
    nick: "", contact_email: "", contact_whatsapp: "", steamid: "",
    server_slug: forcedServerSlug ?? servers[0]?.slug ?? "",
  });

  const createPix = useServerFn(createPixOrder);

  const productLabel = productType === "plan"
    ? `Cargo ${planTier?.toUpperCase()}`
    : `${ammoPacks?.toLocaleString("pt-BR")} Ammo Packs`;
  const serverName = servers.find((s) => s.slug === form.server_slug)?.name ?? form.server_slug;

  const waMessage = encodeURIComponent(
    `Olá! Quero comprar:\n\n• Produto: ${productLabel}\n• Servidor: ${serverName}\n• Nick: ${form.nick}\n• Email: ${form.contact_email}${form.steamid ? `\n• SteamID: ${form.steamid}` : ""}\n• Total: R$ ${amount.toFixed(2).replace(".", ",")}\n\nComo faço o pagamento?`,
  );

  if (pix) return <PixPanel pix={pix} onClose={() => { setPix(null); setOpen(false); }} />;

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="w-full mt-5 px-4 py-2.5 text-sm font-bold uppercase tracking-wider rounded-md bg-gradient-brand text-brand-foreground hover:opacity-90 transition">
        {label}
      </button>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nick || !form.contact_email) { toast.error(t("shop.fillAll")); return; }
    if (!form.contact_whatsapp || form.contact_whatsapp.replace(/\D/g, "").length < 10) {
      toast.error(t("shop.fillWa")); return;
    }
    setLoading(true);
    try {
      const payload = productType === "plan"
        ? { product_type: "plan" as const, plan_tier: planTier!, ...form, steamid: form.steamid || null, contact_whatsapp: form.contact_whatsapp }
        : { product_type: "ammo_packs" as const, ammo_packs: ammoPacks!, ...form, steamid: form.steamid || null, contact_whatsapp: form.contact_whatsapp };
      const result = await createPix({ data: payload });
      setPix({ orderId: result.orderId, qrCode: result.qrCode, qrCodeBase64: result.qrCodeBase64, ticketUrl: result.ticketUrl, amount: result.amount });
      toast.success(t("shop.pixGenerated"));
    } catch (err) {
      toast.error(t("shop.pixError"), { description: err instanceof Error ? err.message : String(err) });
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={submit} className="mt-5 space-y-3 rounded-lg border border-accent/40 bg-secondary/30 p-4">
      <Field label={t("shop.nick")} value={form.nick} onChange={(v) => setForm({ ...form, nick: v })} />
      <Field label={t("shop.email")} type="email" value={form.contact_email} onChange={(v) => setForm({ ...form, contact_email: v })} />
      <Field label={t("shop.whatsapp")} value={form.contact_whatsapp} onChange={(v) => setForm({ ...form, contact_whatsapp: v })} />
      <Field label={t("shop.steamid")} value={form.steamid} onChange={(v) => setForm({ ...form, steamid: v })} />
      {!forcedServerSlug && (
        <div>
          <label className="text-xs uppercase tracking-wider text-muted-foreground">{t("shop.server")}</label>
          <select value={form.server_slug} onChange={(e) => setForm({ ...form, server_slug: e.target.value })}
            className="w-full mt-1 rounded-md border border-border bg-input px-3 py-2">
            {servers.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}
          </select>
        </div>
      )}
      {(methods.pix || methods.whatsapp) && (
        <div>
          <label className="text-xs uppercase tracking-wider text-muted-foreground">{t("shop.paymentMethod")}</label>
          <div className="mt-1 grid grid-cols-2 gap-2">
            {methods.pix && (
              <button type="button" onClick={() => setPaymentMethod("pix")}
                className={cn("px-3 py-2 text-xs font-bold uppercase tracking-wider rounded-md border transition",
                  paymentMethod === "pix" ? "border-accent bg-accent/10 text-foreground" : "border-border text-muted-foreground hover:bg-secondary")}>
                {t("shop.pixAuto")}
              </button>
            )}
            {methods.whatsapp && waAdmins.length > 0 && (
              <button type="button" onClick={() => setPaymentMethod("whatsapp")}
                className={cn("px-3 py-2 text-xs font-bold uppercase tracking-wider rounded-md border transition",
                  paymentMethod === "whatsapp" ? "border-accent bg-accent/10 text-foreground" : "border-border text-muted-foreground hover:bg-secondary")}>
                {t("shop.whatsappOption")}
              </button>
            )}
          </div>
        </div>
      )}

      <div className="text-sm">
        {t("shop.total")} <span className="font-display text-lg font-bold text-gradient">R$ {amount.toFixed(2).replace(".", ",")}</span>
      </div>

      {paymentMethod === "pix" && methods.pix ? (
        <>
          <div className="flex gap-2">
            <button type="button" onClick={() => setOpen(false)} className="px-3 py-2 text-sm rounded-md border border-border hover:bg-secondary transition">{t("common.cancel")}</button>
            <button type="submit" disabled={loading} className="flex-1 px-3 py-2 text-sm font-bold uppercase tracking-wider rounded-md bg-gradient-brand text-brand-foreground disabled:opacity-50 transition">
              {loading ? t("shop.generatingPix") : t("shop.generatePix")}
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground">{t("shop.pixHint")}</p>
        </>
      ) : (
        <>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">{t("shop.waHint")}</p>
            {waAdmins.map((a) => {
              const canSend = form.nick && form.contact_email && form.contact_whatsapp && form.contact_whatsapp.replace(/\D/g, "").length >= 10;
              return (
                <a key={a.phone} href={canSend ? `https://wa.me/${a.phone}?text=${waMessage}` : undefined}
                  target="_blank" rel="noopener noreferrer"
                  onClick={(e) => { if (!canSend) { e.preventDefault(); toast.error(t("shop.fillBefore")); } }}
                  className={cn("flex items-center justify-between gap-2 px-3 py-2.5 rounded-md border transition",
                    canSend ? "border-accent/50 bg-accent/5 hover:bg-accent/10" : "border-border opacity-60 cursor-not-allowed")}>
                  <span className="text-sm font-semibold">{a.name}</span>
                  <span className="text-xs font-mono text-accent">{a.display}</span>
                </a>
              );
            })}
          </div>
          <button type="button" onClick={() => setOpen(false)} className="w-full px-3 py-2 text-sm rounded-md border border-border hover:bg-secondary transition">{t("common.cancel")}</button>
          <p className="text-[11px] text-muted-foreground">{t("shop.waHint2")}</p>
        </>
      )}
    </form>
  );
}

function PixPanel({ pix, onClose }: { pix: { orderId: string; qrCode: string | null; qrCodeBase64: string | null; ticketUrl: string | null; amount: number }; onClose: () => void }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState<string>("pending");
  const checkFn = useServerFn(checkOrderPayment);

  useEffect(() => {
    if (status === "paid" || status === "delivered") return;
    const id = setInterval(async () => {
      try { const r = await checkFn({ data: { orderId: pix.orderId } }); if (r.status) setStatus(r.status); } catch { /* */ }
    }, 5000);
    return () => clearInterval(id);
  }, [pix.orderId, status, checkFn]);

  const copy = async () => {
    if (!pix.qrCode) return;
    await navigator.clipboard.writeText(pix.qrCode);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const paid = status === "paid" || status === "delivered";

  return (
    <div className="mt-5 rounded-lg border border-accent/40 bg-secondary/30 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-display text-lg font-bold">{paid ? t("shop.paid") : t("shop.payWithPix")}</h4>
        <span className={cn("px-2 py-0.5 text-[10px] uppercase rounded", paid ? "bg-success/20 text-success" : "bg-secondary")}>
          {paid ? t("shop.paidLabel") : t("shop.waiting")}
        </span>
      </div>
      {paid ? (
        <div className="text-center py-6">
          <CheckCircle2 className="mx-auto h-14 w-14 text-success" />
          <p className="mt-3 text-sm">{t("shop.paidText")}</p>
          <p className="mt-2 text-xs text-muted-foreground font-mono">{t("shop.orderLabel")} {pix.orderId.slice(0, 8)}</p>
        </div>
      ) : (
        <>
          {pix.qrCodeBase64 && (
            <div className="flex justify-center bg-white rounded-md p-3">
              <img src={`data:image/png;base64,${pix.qrCodeBase64}`} alt="QR Code PIX" className="w-48 h-48" />
            </div>
          )}
          {pix.qrCode && (
            <div>
              <label className="text-xs uppercase tracking-wider text-muted-foreground">{t("shop.pixCopy")}</label>
              <div className="mt-1 flex gap-2">
                <input readOnly value={pix.qrCode} className="flex-1 rounded-md border border-border bg-input px-3 py-2 text-xs font-mono" />
                <button type="button" onClick={copy} className="px-3 py-2 text-xs rounded-md border border-border hover:bg-secondary transition">
                  {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" /> {t("shop.checking")}
          </div>
          <div className="text-sm">{t("shop.total")} <span className="font-display text-lg font-bold text-gradient">R$ {pix.amount.toFixed(2).replace(".", ",")}</span></div>
          {pix.ticketUrl && (
            <a href={pix.ticketUrl} target="_blank" rel="noopener noreferrer" className="block text-center text-xs text-accent hover:underline">
              {t("shop.openTicket")}
            </a>
          )}
        </>
      )}
      <button type="button" onClick={onClose} className="w-full px-3 py-2 text-sm rounded-md border border-border hover:bg-secondary transition">{t("common.close")}</button>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full mt-1 rounded-md border border-border bg-input px-3 py-2 text-sm" />
    </div>
  );
}
