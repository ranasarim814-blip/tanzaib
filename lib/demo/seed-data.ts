import { createHash } from "node:crypto";
import { getEffectivePrice, computeOrderTotals } from "@/lib/pricing";
import { DEFAULT_SETTINGS } from "@/lib/config";
import type { Order, OrderItem, OrderStatusHistory, OrderStatus } from "@/lib/types";
import {
  DEMO_CATEGORIES,
  DEMO_IMAGES,
  DEMO_ORDERS,
  DEMO_PRODUCTS,
  DEMO_VARIANTS,
} from "./catalog";

const pad = (n: number) => String(n).padStart(12, "0");
const det = (s: string) => createHash("sha256").update(s).digest("hex").slice(0, 32);

const FLOW: OrderStatus[] = ["pending", "confirmed", "processing", "dispatched", "delivered"];

/** Full demo dataset (catalogue + 3 sample orders), deterministic apart from dates. */
export function buildDemoSeed(now = new Date()) {
  const orders: (Order & { public_token: string })[] = [];
  const order_items: OrderItem[] = [];
  const order_status_history: OrderStatusHistory[] = [];

  DEMO_ORDERS.forEach((o, i) => {
    const id = `e0000000-0000-4000-8000-${pad(i + 1)}`;
    const created = new Date(now.getTime() - o.daysAgo * 86400000 - 3 * 3600000);
    const lines = o.items.map((it) => {
      const p = DEMO_PRODUCTS[it.n - 1];
      const price = getEffectivePrice(p, created);
      return { p, it, price };
    });
    const totals = computeOrderTotals(
      lines.map((l) => ({ unitOriginal: l.price.original, unitFinal: l.price.final, quantity: l.it.qty })),
      DEFAULT_SETTINGS,
    );
    orders.push({
      id,
      order_number: o.number,
      public_token: det(o.number),
      customer_name: o.name,
      phone: o.phone,
      alt_phone: null,
      email: null,
      city: o.city,
      area: o.area,
      address: o.address,
      postal_code: null,
      notes: null,
      subtotal: totals.subtotal,
      discount_total: totals.discountTotal,
      delivery_charge: totals.deliveryCharge,
      total: totals.total,
      payment_method: "COD",
      status: o.status,
      admin_notes: null,
      tracking_number: o.status === "dispatched" || o.status === "delivered" ? `TCS-77${4410 + i}` : null,
      courier: o.status === "dispatched" || o.status === "delivered" ? "TCS" : null,
      ip_hash: null,
      user_agent: "seed",
      created_at: created.toISOString(),
      updated_at: created.toISOString(),
    });
    lines.forEach((l, k) => {
      order_items.push({
        id: `f0000000-0000-4000-8000-${pad((i + 1) * 10 + k)}`,
        order_id: id,
        product_id: l.p.id,
        product_name: l.p.name,
        sku: l.p.sku,
        size: l.it.size,
        quantity: l.it.qty,
        unit_price: l.price.original,
        unit_discount: l.price.savedAmount,
        line_total: l.price.final * l.it.qty,
        custom_measurements: null,
        image_url: `/dummy/${l.p.slug}/front.svg`,
      });
    });
    const steps = FLOW.slice(0, FLOW.indexOf(o.status as OrderStatus) + 1);
    steps.forEach((st, k) => {
      order_status_history.push({
        id: `90000000-0000-4000-8000-${pad((i + 1) * 10 + k)}`,
        order_id: id,
        status: st,
        note: k === 0 ? "Order placed (Cash on Delivery)" : null,
        changed_by: k === 0 ? null : "seed",
        created_at: new Date(created.getTime() + k * 86400000 * 0.6).toISOString(),
      });
    });
  });

  return {
    categories: structuredClone(DEMO_CATEGORIES),
    products: structuredClone(DEMO_PRODUCTS),
    product_images: structuredClone(DEMO_IMAGES),
    product_variants: structuredClone(DEMO_VARIANTS),
    orders,
    order_items,
    order_status_history,
  };
}
