import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Crown, Shield, Star, Zap, Package, Copy, CheckCircle2, Loader2 } from "lucide-react";
import {
  PLANS_PRICES,
  AMMO_PACK_MIN,
  AMMO_PACK_MAX,
  AMMO_PACK_STEP,
  AMMO_PACK_PRICE_PER_1000,
  SERVERS,
  type PlanTier,
} from "@/lib/servers";
import { createPixOrder, checkOrderPayment } from "@/lib/mercadopago.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/loja")({
  component: LojaPage,
  head: () => ({
    meta: [
      { title: "Loja VIP & Ammo Packs — CS Nostalgia" },
      {
        name: "description",
        content:
          "Compre VIP, ADMIN, MASTER, SUPREMO ou Ammo Packs para os servidores CS Nostalgia. Pagamento via PIX.",
      },
    ],
  }),
});

const PLAN_INFO: Record<
  PlanTier,
  { label: string; icon: React.ReactNode; perks: string[]; highlight?: boolean }
> = {
  vip: {
    label: "VIP",
    icon: <Star className="h-6 w-6" />,
    perks: [
      "Tag [VIP] no nome",
      "Reserva de slot",
      "+15% HP inicial",
      "Acesso a armas exclusivas",
    ],
  },
  admin: {
    label: "ADMIN",
    icon: <Shield className="h-6 w-6" />,
    perks: [
      "Tudo do VIP",
      "Slay/Slap em troll",
      "Kick básico",
      "Tag [ADMIN] dourada",
    ],
  },
  master: {
    label: "MASTER",
    icon: <Zap className="h-6 w-6" />,
    perks: [
      "Tudo do ADMIN",
      "Ban temporário",
      "Mute/Gag",
      "Comandos avançados",
    ],
    highlight: true,
  },
  supremo: {
    label: "SUPREMO",
    icon: <Crown className="h-6 w-6" />,
    perks: [
      "Tudo do MASTER",
      "Ban permanente",
      "Acesso ao changelevel",
      "Tag personalizada",
      "Prioridade de suporte",
    ],
  },
};

const SERVER_OPTIONS = SERVERS.filter((s) => !s.comingSoon);

function LojaPage() {
  const [tab, setTab] = useState<"plans" | "ammo">("plans");
  return (
    <section className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.3em] text-accent font-semibold">
          Apoie a comunidade
        </p>
        <h1 className="font-display text-4xl font-bold mt-1">Loja Oficial</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Pagamento via PIX. Após confirmação, um admin aplica o benefício no
          servidor em até 24 horas.
        </p>
      </div>

      <div className="border-b border-border flex gap-1 mb-8">
        <button
          onClick={() => setTab("plans")}
          className={cn(
            "px-4 py-3 text-sm font-semibold uppercase tracking-wider border-b-2 transition",
            tab === "plans"
              ? "border-accent text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          Cargos / VIP
        </button>
        <button
          onClick={() => setTab("ammo")}
          className={cn(
            "px-4 py-3 text-sm font-semibold uppercase tracking-wider border-b-2 transition",
            tab === "ammo"
              ? "border-accent text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          Ammo Packs (Zombie Plague)
        </button>
      </div>

      {tab === "plans" ? <PlansGrid /> : <AmmoCalculator />}
    </section>
  );
}

function PlansGrid() {
  return (
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
      {(Object.keys(PLANS_PRICES) as PlanTier[]).map((tier) => {
        const info = PLAN_INFO[tier];
        return (
          <div
            key={tier}
            className={cn(
              "relative rounded-xl border bg-card p-6 shadow-card",
              info.highlight
                ? "border-accent shadow-glow"
                : "border-border",
            )}
          >
            {info.highlight && (
              <span className="absolute -top-3 left-6 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-gradient-brand text-brand-foreground">
                Mais popular
              </span>
            )}
            <div className="text-accent">{info.icon}</div>
            <h3 className="font-display text-2xl font-bold mt-3">
              {info.label}
            </h3>
            <p className="mt-1">
              <span className="font-display text-3xl font-bold text-gradient">
                R$ {PLANS_PRICES[tier]}
              </span>
              <span className="text-sm text-muted-foreground"> /mês</span>
            </p>
            <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground">
              {info.perks.map((p) => (
                <li key={p} className="flex gap-2">
                  <span className="text-accent">✓</span>
                  {p}
                </li>
              ))}
            </ul>
            <CheckoutForm
              productType="plan"
              planTier={tier}
              amount={PLANS_PRICES[tier]}
              label={`Comprar ${info.label}`}
            />
          </div>
        );
      })}
    </div>
  );
}

function AmmoCalculator() {
  const [qty, setQty] = useState(10_000);
  const safeQty = Math.max(
    AMMO_PACK_MIN,
    Math.min(AMMO_PACK_MAX, Math.round(qty / AMMO_PACK_STEP) * AMMO_PACK_STEP),
  );
  const price = (safeQty / 1000) * AMMO_PACK_PRICE_PER_1000;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr,400px]">
      <div className="rounded-xl border border-border bg-card p-6 shadow-card">
        <div className="flex items-center gap-3">
          <Package className="h-7 w-7 text-accent" />
          <div>
            <h2 className="font-display text-2xl font-bold">Ammo Packs</h2>
            <p className="text-sm text-muted-foreground">
              R$ {AMMO_PACK_PRICE_PER_1000} a cada 1.000 ammo packs · máx 500.000
              por compra
            </p>
          </div>
        </div>

        <div className="mt-6">
          <label className="text-xs uppercase tracking-wider text-muted-foreground">
            Quantidade
          </label>
          <input
            type="range"
            min={AMMO_PACK_MIN}
            max={AMMO_PACK_MAX}
            step={AMMO_PACK_STEP}
            value={safeQty}
            onChange={(e) => setQty(parseInt(e.target.value, 10))}
            className="w-full mt-2 accent-accent"
          />
          <div className="flex items-center gap-3 mt-3">
            <input
              type="number"
              min={AMMO_PACK_MIN}
              max={AMMO_PACK_MAX}
              step={AMMO_PACK_STEP}
              value={qty}
              onChange={(e) => setQty(parseInt(e.target.value || "0", 10))}
              className="flex-1 rounded-md border border-border bg-input px-3 py-2 font-mono"
            />
            <span className="text-muted-foreground text-sm">ammo packs</span>
          </div>
          <div className="grid grid-cols-4 gap-2 mt-3">
            {[10_000, 50_000, 100_000, 500_000].map((v) => (
              <button
                key={v}
                onClick={() => setQty(v)}
                className="px-2 py-1.5 text-xs uppercase tracking-wider rounded border border-border hover:bg-secondary transition"
              >
                {v.toLocaleString("pt-BR")}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 rounded-lg bg-gradient-brand p-5 text-brand-foreground">
          <p className="text-xs uppercase tracking-wider opacity-80">
            Total a pagar
          </p>
          <p className="font-display text-4xl font-bold mt-1">
            R$ {price.toFixed(2).replace(".", ",")}
          </p>
          <p className="text-sm mt-1 opacity-80">
            {safeQty.toLocaleString("pt-BR")} ammo packs
          </p>
        </div>
      </div>

      <CheckoutForm
        productType="ammo_packs"
        ammoPacks={safeQty}
        amount={price}
        label="Comprar Ammo Packs"
        forcedServerSlug="zombie-plague-brasil"
      />
    </div>
  );
}

function CheckoutForm({
  productType,
  planTier,
  ammoPacks,
  amount,
  label,
  forcedServerSlug,
}: {
  productType: "plan" | "ammo_packs";
  planTier?: PlanTier;
  ammoPacks?: number;
  amount: number;
  label: string;
  forcedServerSlug?: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nick: "",
    contact_email: "",
    contact_whatsapp: "",
    steamid: "",
    server_slug: forcedServerSlug ?? SERVER_OPTIONS[0]?.slug ?? "",
  });

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full mt-5 px-4 py-2.5 text-sm font-bold uppercase tracking-wider rounded-md bg-gradient-brand text-brand-foreground hover:opacity-90 transition"
      >
        {label}
      </button>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nick || !form.contact_email) {
      toast.error("Preencha nick e email.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("orders").insert({
      product_type: productType,
      plan_tier: planTier ?? null,
      ammo_packs: ammoPacks ?? null,
      amount_brl: amount,
      nick: form.nick,
      contact_email: form.contact_email,
      contact_whatsapp: form.contact_whatsapp || null,
      steamid: form.steamid || null,
      server_slug: form.server_slug,
      status: "pending",
    });
    setLoading(false);
    if (error) {
      toast.error("Erro ao criar pedido", { description: error.message });
      return;
    }
    toast.success("Pedido criado!", {
      description:
        "Entraremos em contato com as instruções de pagamento via PIX.",
    });
    setOpen(false);
    setForm({
      nick: "",
      contact_email: "",
      contact_whatsapp: "",
      steamid: "",
      server_slug: forcedServerSlug ?? SERVER_OPTIONS[0]?.slug ?? "",
    });
  };

  return (
    <form
      onSubmit={submit}
      className="mt-5 space-y-3 rounded-lg border border-accent/40 bg-secondary/30 p-4"
    >
      <Field
        label="Nick no jogo *"
        value={form.nick}
        onChange={(v) => setForm({ ...form, nick: v })}
      />
      <Field
        label="Email *"
        type="email"
        value={form.contact_email}
        onChange={(v) => setForm({ ...form, contact_email: v })}
      />
      <Field
        label="WhatsApp (opcional)"
        value={form.contact_whatsapp}
        onChange={(v) => setForm({ ...form, contact_whatsapp: v })}
      />
      <Field
        label="SteamID (opcional)"
        value={form.steamid}
        onChange={(v) => setForm({ ...form, steamid: v })}
      />
      {!forcedServerSlug && (
        <div>
          <label className="text-xs uppercase tracking-wider text-muted-foreground">
            Servidor
          </label>
          <select
            value={form.server_slug}
            onChange={(e) => setForm({ ...form, server_slug: e.target.value })}
            className="w-full mt-1 rounded-md border border-border bg-input px-3 py-2"
          >
            {SERVER_OPTIONS.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="text-sm">
        Total:{" "}
        <span className="font-display text-lg font-bold text-gradient">
          R$ {amount.toFixed(2).replace(".", ",")}
        </span>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-3 py-2 text-sm rounded-md border border-border hover:bg-secondary transition"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-3 py-2 text-sm font-bold uppercase tracking-wider rounded-md bg-gradient-brand text-brand-foreground disabled:opacity-50 transition"
        >
          {loading ? "Enviando..." : "Enviar pedido"}
        </button>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Após enviar, entraremos em contato pelo email/WhatsApp informado com a
        chave PIX e instruções. O benefício é aplicado em até 24h após
        confirmação.
      </p>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full mt-1 rounded-md border border-border bg-input px-3 py-2 text-sm"
      />
    </div>
  );
}

