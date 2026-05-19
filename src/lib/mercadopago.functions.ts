import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { createPixPayment, getPayment } from "./mercadopago.server";

const baseSchema = z.object({
  nick: z.string().min(1).max(64),
  contact_email: z.string().email().max(255),
  contact_whatsapp: z.string().max(40).optional().nullable(),
  steamid: z.string().max(64).optional().nullable(),
  server_slug: z.string().min(1).max(64),
});

const planSchema = baseSchema.extend({
  product_type: z.literal("plan"),
  plan_tier: z.string().min(1).max(32),
});

const ammoSchema = baseSchema.extend({
  product_type: z.literal("ammo_packs"),
  ammo_packs: z.number().int().min(1).max(10_000_000),
});

const skinSchema = baseSchema.extend({
  product_type: z.literal("skin"),
  skin_id: z.string().uuid(),
});

const inputSchema = z.discriminatedUnion("product_type", [planSchema, ammoSchema, skinSchema]);

export const createPixOrder = createServerFn({ method: "POST" })
  .inputValidator((input) => inputSchema.parse(input))
  .handler(async ({ data }) => {
    // Validate server exists and is not coming soon
    const { data: srv } = await supabaseAdmin
      .from("servers")
      .select("slug, short, coming_soon")
      .eq("slug", data.server_slug)
      .maybeSingle();
    if (!srv || srv.coming_soon) throw new Error("Servidor inválido");

    // Check PIX is enabled
    const { data: pixMethod } = await supabaseAdmin
      .from("payment_methods").select("enabled").eq("id", "pix").maybeSingle();
    if (!pixMethod?.enabled) throw new Error("Pagamento via PIX está desativado");

    let amount: number;
    let description: string;
    let ammoPacks: number | null = null;
    let planTier: string | null = null;

    let notes: string | null = null;

    if (data.product_type === "plan") {
      const { data: plan } = await supabaseAdmin
        .from("plans").select("tier, label, price_brl, active").eq("tier", data.plan_tier).maybeSingle();
      if (!plan || !plan.active) throw new Error("Cargo inválido ou inativo");
      amount = Number(plan.price_brl);
      planTier = plan.tier;
      description = `Cargo ${plan.label} - ${srv.short} (${data.nick})`;
    } else if (data.product_type === "ammo_packs") {
      const { data: ammo } = await supabaseAdmin
        .from("ammo_settings").select("*").eq("id", 1).single();
      if (!ammo) throw new Error("Configuração de Ammo Packs indisponível");
      const qty = Math.round(data.ammo_packs / ammo.step_qty) * ammo.step_qty;
      if (qty < ammo.min_qty || qty > ammo.max_qty) {
        throw new Error("Quantidade de Ammo Packs inválida");
      }
      ammoPacks = qty;
      amount = (qty / 1000) * Number(ammo.price_per_1000);
      description = `${qty.toLocaleString("pt-BR")} Ammo Packs - ${srv.short} (${data.nick})`;
    } else {
      const { data: skin } = await supabaseAdmin
        .from("skins" as any).select("id, name, price_brl, server_slug, active").eq("id", data.skin_id).maybeSingle();
      const s = skin as any;
      if (!s || !s.active) throw new Error("Skin inválida ou inativa");
      if (s.server_slug !== data.server_slug) throw new Error("Skin não pertence a este servidor");
      amount = Number(s.price_brl);
      description = `Skin ${s.name} - ${srv.short} (${data.nick})`;
      notes = `skin_id=${s.id}; skin_name=${s.name}`;
    }

    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .insert({
        product_type: data.product_type,
        plan_tier: planTier,
        ammo_packs: ammoPacks,
        amount_brl: amount,
        nick: data.nick,
        contact_email: data.contact_email,
        contact_whatsapp: data.contact_whatsapp || null,
        steamid: data.steamid || null,
        server_slug: data.server_slug,
        status: "pending",
        payment_provider: "mercadopago",
        notes,
      })
      .select("id")
      .single();

    if (error || !order) throw new Error(error?.message ?? "Falha ao criar pedido");

    const origin =
      process.env.PUBLIC_BASE_URL ||
      `https://project--${process.env.LOVABLE_PROJECT_ID || "3193e7e7-c2ec-4d95-8650-b70a5001cc95"}.lovable.app`;

    let payment;
    try {
      payment = await createPixPayment({
        amountBrl: amount,
        description,
        payerEmail: data.contact_email,
        payerName: data.nick,
        externalReference: order.id,
        notificationUrl: `${origin}/api/public/mp-webhook`,
      });
    } catch (err) {
      await supabaseAdmin
        .from("orders")
        .update({ status: "cancelled", notes: `MP error: ${(err as Error).message}` })
        .eq("id", order.id);
      throw err;
    }

    await supabaseAdmin
      .from("orders")
      .update({ payment_reference: String(payment.id) })
      .eq("id", order.id);

    const td = payment.point_of_interaction?.transaction_data;
    return {
      orderId: order.id,
      paymentId: payment.id,
      amount,
      description,
      qrCode: td?.qr_code ?? null,
      qrCodeBase64: td?.qr_code_base64 ?? null,
      ticketUrl: td?.ticket_url ?? null,
      expiresAt: payment.date_of_expiration ?? null,
    };
  });

export const checkOrderPayment = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ orderId: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("id, status, payment_reference")
      .eq("id", data.orderId)
      .maybeSingle();
    if (!order) return { status: "not_found" as const };
    if (order.status === "paid" || order.status === "delivered") {
      return { status: order.status };
    }
    if (!order.payment_reference) return { status: order.status };
    try {
      const payment = await getPayment(order.payment_reference);
      if (payment.status === "approved" && order.status !== "paid") {
        await supabaseAdmin
          .from("orders")
          .update({ status: "paid", paid_at: new Date().toISOString() })
          .eq("id", order.id);
        return { status: "paid" as const };
      }
      return { status: order.status, mpStatus: payment.status };
    } catch {
      return { status: order.status };
    }
  });
