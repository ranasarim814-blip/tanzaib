import { getAdmin } from "@/lib/admin/auth";
import { listAdminOrders, type OrderListParams } from "@/lib/admin/queries";
import { db } from "@/lib/data";
import { toCsv } from "@/lib/utils";

export async function GET(request: Request) {
  if (!(await getAdmin())) return new Response("Not authorised", { status: 403 });
  const sp = new URL(request.url).searchParams;
  const params: OrderListParams = {
    q: sp.get("q") ?? undefined,
    status: (sp.get("status") as OrderListParams["status"]) ?? undefined,
    city: sp.get("city") ?? undefined,
    from: sp.get("from") ?? undefined,
    to: sp.get("to") ?? undefined,
  };
  const { items } = await listAdminOrders(params, { all: true });
  const lines = items.length ? await db().select("order_items", { in: { column: "order_id", values: items.map((o) => o.id) } }) : [];
  const byOrder = new Map<string, string[]>();
  for (const l of lines) {
    const list = byOrder.get(l.order_id) ?? [];
    list.push(`${l.product_name} [${l.sku}] ${l.size} x${l.quantity}`);
    byOrder.set(l.order_id, list);
  }
  const csv = toCsv(
    ["Order number", "Placed at", "Status", "Customer", "Phone", "Alt phone", "Email", "City", "Area", "Address", "Postal code", "Items", "Subtotal", "Discount", "Delivery", "Total (COD)", "Courier", "Tracking", "Customer notes", "Admin notes"],
    items.map((o) => [o.order_number, o.created_at, o.status, o.customer_name, o.phone, o.alt_phone, o.email, o.city, o.area, o.address, o.postal_code, (byOrder.get(o.id) ?? []).join("; "), o.subtotal, o.discount_total, o.delivery_charge, o.total, o.courier, o.tracking_number, o.notes, o.admin_notes]),
  );
  return new Response("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="tanzaib-orders-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
