// Helpers Mercado Pago — uso APENAS server-side.
// Não importar este arquivo em código de cliente.

const MP_API = "https://api.mercadopago.com";

export type MpPixPayment = {
  id: number;
  status: string;
  status_detail?: string;
  point_of_interaction?: {
    transaction_data?: {
      qr_code?: string;
      qr_code_base64?: string;
      ticket_url?: string;
    };
  };
  date_of_expiration?: string;
};

export async function createPixPayment(args: {
  amountBrl: number;
  description: string;
  payerEmail: string;
  payerName: string;
  externalReference: string;
  notificationUrl?: string;
}): Promise<MpPixPayment> {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) throw new Error("MP_ACCESS_TOKEN não configurado");

  const body = {
    transaction_amount: Number(args.amountBrl.toFixed(2)),
    description: args.description,
    payment_method_id: "pix",
    external_reference: args.externalReference,
    notification_url: args.notificationUrl,
    payer: {
      email: args.payerEmail,
      first_name: args.payerName.slice(0, 50) || "Jogador",
    },
  };

  const res = await fetch(`${MP_API}/v1/payments`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": args.externalReference,
    },
    body: JSON.stringify(body),
  });

  const json = (await res.json()) as MpPixPayment & { message?: string };
  if (!res.ok) {
    throw new Error(json.message || `Mercado Pago erro ${res.status}`);
  }
  return json;
}

export async function getPayment(id: string | number): Promise<MpPixPayment> {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) throw new Error("MP_ACCESS_TOKEN não configurado");
  const res = await fetch(`${MP_API}/v1/payments/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = (await res.json()) as MpPixPayment & { message?: string };
  if (!res.ok) throw new Error(json.message || `MP erro ${res.status}`);
  return json;
}
