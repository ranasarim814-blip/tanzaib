import "server-only";
import { formatPKR, siteUrl } from "@/lib/utils";

/** Sends the admin a "new order" email via Resend. Silently skipped when not configured. */
export async function notifyNewOrder(order: {
  orderNumber: string;
  name: string;
  phone: string;
  city: string;
  total: number;
  items: { name: string; size: string; quantity: number }[];
}) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.ADMIN_EMAIL;
  if (!key || !to) return;
  try {
    const { Resend } = await import("resend");
    const resend = new Resend(key);
    const rows = order.items.map((i) => `<li>${esc(i.name)} — ${esc(i.size)} × ${i.quantity}</li>`).join("");
    await resend.emails.send({
      from: process.env.RESEND_FROM || "Tanzaib Orders <onboarding@resend.dev>",
      to,
      subject: `New COD order ${order.orderNumber} — ${formatPKR(order.total)}`,
      html: `<div style="font-family:Georgia,serif;color:#1C1A17">
        <h2 style="font-weight:400">New order ${esc(order.orderNumber)}</h2>
        <p>${esc(order.name)} · ${esc(order.phone)} · ${esc(order.city)}</p>
        <ul>${rows}</ul>
        <p><strong>Total (COD): ${formatPKR(order.total)}</strong></p>
        <p><a href="${siteUrl("/admin/orders")}">Open orders in the admin panel</a></p>
      </div>`,
    });
  } catch (e) {
    console.error("Resend notification failed", e);
  }
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
