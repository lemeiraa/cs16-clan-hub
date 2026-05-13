import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { createPixPayment, getPayment } from "./mercadopago.server";
import {
  AMMO_PACK_MAX,
  AMMO_PACK_MIN,
  AMMO_PACK_PRICE_PER_1000,
  AMMO_PACK_STEP,
  PLANS_PRICES,
  SERVERS,
} from "./servers";

const baseSchema = z.object({
  nick: z.string().min(1).max(64),
  contact_email: z.string().email().max(255),
  contact_whatsapp: z.string().max(40).optional().nullable(),
  steamid: z.string().max(64).optional().nullable(),
  server_slug: z.string().min(1).max(64),
});

const planSchema = baseSchema.extend({
  product_type: z.literal("plan"),
  plan_tier: z.enum(["vip", "admin", "master", "supremo"]),
});

const ammoSchema = baseSchema.extend({
  product_type: z.literal("ammo_packs"),
  ammo_packs: z.number().int().min(AMMO_PACK_MIN).max(AMMO_PACK_MAX),
});

const inputSchema = z.discriminatedUnion("product_type", [planSchema, ammoSchema]);

export const createPixOrder = createServerFn({ method: "POST" })
  .inputValidator((input) => inputSchema.parse(input))
  .handler(async ({ data }) => {
    // Validate server exists and is not coming soon
    const srv = SERVERS.find((s) => s.slug === data.server_slug && !s.comingSoon);
    if (!srv) throw new Error("Servidor inválido");

    let amount: number;
    let description: string;
    let ammoPacks: number | null = null;
    let planTier: string | null = null;

    if (data.product_type === "plan") {
      amount = PLANS_PRICES[data.plan_tier];
      planTier = data.plan_tier;
      description = `Cargo ${data.plan_tier.toUpperCase()} - ${srv.short} (${data.nick})`;
    } else {
      // recompute server-side to prevent tampering
      const qty =
        Math.round(data.ammo_packs / AMMO_PACK_STEP) * AMMO_PACK_STEP;
      if (qty < AMMO_PACK_MIN || qty > AMMO_PACK_MAX) {
        throw new Error("Quantidade de Ammo Packs inválida");
      }
      if (srv.slug !== "zombie-plague-brasil" && srv.slug !== "zombie-plague-venezuela") {
        throw new Error("Ammo Packs disponíveis apenas em servidores Zombie Plague");
      }
      ammoPacks = qty;
      amount = (qty / 1000) * AMMO_PACK_PRICE_PER_1000;
      description = `${qty.toLocaleString("pt-BR")} Ammo Packs - ${srv.short} (${data.nick})`;
    }

    // Insert order (admin client bypasses RLS — we already validated input)
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
      })
      .select("id")
      .single();

    if (error || !order) throw new Error(error?.message ?? "Falha ao criar pedido");

    // Build webhook URL (public route)
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
      // mark order failed so we don't leave dangling pendings without PIX
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
