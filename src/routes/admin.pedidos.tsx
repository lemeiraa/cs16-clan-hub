import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { SERVERS } from "@/lib/servers";

export const Route = createFileRoute("/admin/pedidos")({
  component: AdminOrdersPage,
  head: () => ({ meta: [{ title: "Pedidos — Admin" }] }),
});

function AdminOrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Tables<"orders">[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        navigate({ to: "/auth" });
        return;
      }
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userData.user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (!roleData) {
        toast.error("Acesso restrito a administradores.");
        navigate({ to: "/" });
        return;
      }
      setIsAdmin(true);
      const { data: ord, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) toast.error(error.message);
      setOrders(ord ?? []);
      setLoading(false);
    })();
  }, [navigate]);

  const updateStatus = async (id: string, status: string) => {
    const updates: Partial<Tables<"orders">> = { status };
    if (status === "paid") updates.paid_at = new Date().toISOString();
    if (status === "delivered") updates.delivered_at = new Date().toISOString();
    const { error } = await supabase.from("orders").update(updates).eq("id", id);
    if (error) return toast.error(error.message);
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...updates } as Tables<"orders"> : o)));
    toast.success("Atualizado");
  };

  if (!isAdmin || loading) {
    return <div className="container mx-auto px-4 py-12">Carregando...</div>;
  }

  return (
    <section className="container mx-auto px-4 py-12">
      <h1 className="font-display text-3xl font-bold">Pedidos</h1>
      <p className="text-muted-foreground mt-1">Gerencie pedidos da loja.</p>

      <div className="mt-6 overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">Data</th>
              <th className="px-3 py-2 text-left">Nick</th>
              <th className="px-3 py-2 text-left">Servidor</th>
              <th className="px-3 py-2 text-left">Produto</th>
              <th className="px-3 py-2 text-right">Valor</th>
              <th className="px-3 py-2 text-left">Contato</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Ações</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => {
              const srv = SERVERS.find((s) => s.slug === o.server_slug);
              return (
                <tr key={o.id} className="border-t border-border align-top">
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {new Date(o.created_at).toLocaleString("pt-BR")}
                  </td>
                  <td className="px-3 py-2 font-mono">{o.nick}</td>
                  <td className="px-3 py-2">{srv?.short ?? o.server_slug}</td>
                  <td className="px-3 py-2">
                    {o.product_type === "plan"
                      ? `Cargo ${o.plan_tier?.toUpperCase()}`
                      : `${(o.ammo_packs ?? 0).toLocaleString("pt-BR")} APs`}
                  </td>
                  <td className="px-3 py-2 text-right font-mono">
                    R$ {Number(o.amount_brl).toFixed(2).replace(".", ",")}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    <div>{o.contact_email}</div>
                    {o.contact_whatsapp && <div className="text-muted-foreground">{o.contact_whatsapp}</div>}
                    {o.steamid && <div className="text-muted-foreground">{o.steamid}</div>}
                  </td>
                  <td className="px-3 py-2">
                    <span className="px-2 py-0.5 text-[10px] uppercase rounded bg-secondary">
                      {o.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 space-x-1">
                    {o.status === "pending" && (
                      <button
                        onClick={() => updateStatus(o.id, "paid")}
                        className="px-2 py-1 text-xs rounded bg-success/20 text-success hover:bg-success/30"
                      >
                        Marcar pago
                      </button>
                    )}
                    {o.status !== "delivered" && (
                      <button
                        onClick={() => updateStatus(o.id, "delivered")}
                        className="px-2 py-1 text-xs rounded bg-accent/20 text-accent hover:bg-accent/30"
                      >
                        Entregue
                      </button>
                    )}
                    {o.status !== "cancelled" && (
                      <button
                        onClick={() => updateStatus(o.id, "cancelled")}
                        className="px-2 py-1 text-xs rounded bg-destructive/20 text-destructive hover:bg-destructive/30"
                      >
                        Cancelar
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {orders.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-muted-foreground">
                  Nenhum pedido ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
