import "server-only";
import { timingSafeEqual } from "node:crypto";
import { db } from "@/lib/data";
import type { OrderStatus, Size, CustomMeasurements } from "@/lib/types";

/** What a customer may see about their own order (no IPs, no admin notes). */
export interface CustomerOrderView {
  order_number: string;
  customer_name: string;
  phone: string;
  city: string;
  area: string | null;
  address: string;
  status: OrderStatus;
  subtotal: number;
  discount_total: number;
  delivery_charge: number;
  total: number;
  courier: string | null;
  tracking_number: string | null;
  created_at: string;
  madeToOrder: boolean;
  items: {
    product_name: string;
    size: Size;
    quantity: number;
    unit_price: number;
    unit_discount: number;
    line_total: number;
    image_url: string | null;
    custom_measurements: CustomMeasurements | null;
  }[];
  history: { status: OrderStatus; created_at: string }[];
}

const safeEq = (a: string, b: string) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

export async function getCustomerOrder(
  orderNumber: string,
  proof: { token: string } | { phone: string },
): Promise<CustomerOrderView | null> {
  const d = db();
  const order = (await d.select("orders", { eq: { order_number: orderNumber.toUpperCase() } }))[0];
  if (!order) return null;
  const ok = "token" in proof ? safeEq(order.public_token, proof.token) : safeEq(order.phone, proof.phone);
  if (!ok) return null;
  const [items, history] = await Promise.all([
    d.select("order_items", { eq: { order_id: order.id } }),
    d.select("order_status_history", { eq: { order_id: order.id }, order: [{ column: "created_at", ascending: true }] }),
  ]);
  const productIds = items.map((i) => i.product_id).filter((x): x is string => Boolean(x));
  const products = productIds.length ? await d.select("products", { in: { column: "id", values: productIds } }) : [];
  return {
    order_number: order.order_number,
    customer_name: order.customer_name,
    phone: order.phone,
    city: order.city,
    area: order.area,
    address: order.address,
    status: order.status,
    subtotal: Number(order.subtotal),
    discount_total: Number(order.discount_total),
    delivery_charge: Number(order.delivery_charge),
    total: Number(order.total),
    courier: order.courier,
    tracking_number: order.tracking_number,
    created_at: order.created_at,
    madeToOrder: items.some((i) => i.size === "CUSTOM") || products.some((p) => p.is_made_to_order),
    items: items.map((i) => ({
      product_name: i.product_name,
      size: i.size,
      quantity: i.quantity,
      unit_price: Number(i.unit_price),
      unit_discount: Number(i.unit_discount),
      line_total: Number(i.line_total),
      image_url: i.image_url,
      custom_measurements: i.custom_measurements,
    })),
    history: history.map((h) => ({ status: h.status, created_at: h.created_at })),
  };
}
