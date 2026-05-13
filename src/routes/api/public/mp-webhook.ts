import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getPayment } from "@/lib/mercadopago.server";

// Webhook do Mercado Pago. Marca o pedido como "paid" quando o PIX for aprovado.
// MP envia { type: "payment", data: { id } } via POST.
export const Route = createFileRoute("/api/public/mp-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let payload: { type?: string; action?: string; data?: { id?: string | number } } = {};
        try {
          payload = await request.json();
        } catch {
          // MP às vezes envia query string apenas
        }
        const url = new URL(request.url);
        const queryId = url.searchParams.get("id") || url.searchParams.get("data.id");
        const paymentId = payload?.data?.id ?? queryId;

        if (!paymentId) return new Response("ok", { status: 200 });

        try {
          const payment = await getPayment(paymentId);
          const externalRef = (payment as unknown as { external_reference?: string })
            .external_reference;
          if (!externalRef) return new Response("ok", { status: 200 });

          if (payment.status === "approved") {
            await supabaseAdmin
              .from("orders")
              .update({ status: "paid", paid_at: new Date().toISOString() })
              .eq("id", externalRef)
              .neq("status", "delivered");
          } else if (payment.status === "cancelled" || payment.status === "rejected") {
            await supabaseAdmin
              .from("orders")
              .update({ status: "cancelled", notes: `MP: ${payment.status_detail ?? payment.status}` })
              .eq("id", externalRef)
              .eq("status", "pending");
          }
        } catch (err) {
          console.error("MP webhook error", err);
        }
        return new Response("ok", { status: 200 });
      },
      GET: async () => new Response("ok", { status: 200 }),
    },
  },
});
