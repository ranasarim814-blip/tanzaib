import "server-only";
import { db } from "@/lib/data";
import { loadProducts } from "@/lib/data/catalog";
import { getEffectivePrice } from "@/lib/pricing";
import type { Order, OrderStatus, ProductStatus, ProductWithRelations } from "@/lib/types";
import type { OrderRow } from "@/lib/data/db";

export const PAGE_SIZE = 20;
export const LOW_STOCK = 2;

const startOfDayPk = (d = new Date()) => {
  // Midnight in Asia/Karachi (UTC+5, no DST)
  const pk = new Date(d.getTime() + 5 * 3600_000);
  pk.setUTCHours(0, 0, 0, 0);
  return new Date(pk.getTime() - 5 * 3600_000);
};

export async function dashboardStats() {
  const d = db();
  const today = startOfDayPk();
  const week = new Date(today.getTime() - 6 * 86400_000);
  const [ordersToday, ordersWeek, pending, delivered, latest, variants, products] = await Promise.all([
    d.count("orders", { gte: { created_at: today.toISOString() } }),
    d.count("orders", { gte: { created_at: week.toISOString() } }),
    d.count("orders", { eq: { status: "pending" } }),
    d.select("orders", { eq: { status: "delivered" } }),
    d.select("orders", { order: [{ column: "created_at", ascending: false }], limit: 10 }),
    d.select("product_variants"),
    d.select("products", { in: { column: "status", values: ["published", "draft"] } }),
  ]);
  const productById = new Map(products.map((p) => [p.id, p]));
  const lowStock = variants
    .filter((v) => v.size !== "CUSTOM" && v.stock <= LOW_STOCK)
    .map((v) => ({ ...v, product: productById.get(v.product_id) }))
    .filter((v) => v.product && !v.product.is_made_to_order && v.product.category_id)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 12);
  const revenue = delivered.reduce((n, o) => n + Number(o.total), 0);
  const weekRevenue = delivered.filter((o) => o.created_at >= week.toISOString()).reduce((n, o) => n + Number(o.total), 0);
  return { ordersToday, ordersWeek, pending, revenue, weekRevenue, deliveredCount: delivered.length, latest, lowStock };
}

/* ------------------------------- products ------------------------------- */

export interface ProductListParams {
  q?: string;
  status?: ProductStatus | "all";
  category?: string;
  sort?: "newest" | "oldest" | "name" | "price-asc" | "price-desc" | "stock";
  page?: number;
}

export async function listAdminProducts(p: ProductListParams) {
  const all = await loadProducts({ publishedOnly: false });
  const now = new Date();
  let rows = all.filter((x) => {
    if (p.status && p.status !== "all" && x.status !== p.status) return false;
    if (!p.status && x.status === "archived") return false;
    if (p.category && x.category_id !== p.category) return false;
    if (p.q) {
      const q = p.q.toLowerCase();
      if (!`${x.name} ${x.sku} ${x.colour ?? ""}`.toLowerCase().includes(q)) return false;
    }
    return true;
  });
  const stock = (x: ProductWithRelations) => x.variants.filter((v) => v.size !== "CUSTOM").reduce((n, v) => n + v.stock, 0);
  rows = [...rows].sort((a, b) => {
    switch (p.sort) {
      case "oldest":
        return a.created_at.localeCompare(b.created_at);
      case "name":
        return a.name.localeCompare(b.name);
      case "price-asc":
        return a.price - b.price;
      case "price-desc":
        return b.price - a.price;
      case "stock":
        return stock(a) - stock(b);
      default:
        return b.created_at.localeCompare(a.created_at);
    }
  });
  const total = rows.length;
  const page = Math.max(1, p.page ?? 1);
  const items = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((x) => ({
    ...x,
    totalStock: stock(x),
    effective: getEffectivePrice(x, now),
    thumb: x.images.find((i) => i.kind === "front")?.url ?? x.images[0]?.url ?? null,
  }));
  return { items, total, page, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export async function getAdminProduct(id: string) {
  const [p] = await loadProducts({ publishedOnly: false, ids: [id] });
  return p ?? null;
}

export async function listAllCategories() {
  return db().select("categories", { order: [{ column: "sort_order", ascending: true }] });
}

/* -------------------------------- orders -------------------------------- */

export interface OrderListParams {
  q?: string;
  status?: OrderStatus | "all";
  city?: string;
  from?: string;
  to?: string;
  page?: number;
}

export async function listAdminOrders(p: OrderListParams, opts: { all?: boolean } = {}) {
  const d = db();
  const query = {
    ...(p.status && p.status !== "all" ? { eq: { status: p.status } } : {}),
    ...(p.from || p.to
      ? {
          gte: p.from ? { created_at: new Date(`${p.from}T00:00:00+05:00`).toISOString() } : undefined,
          lte: p.to ? { created_at: new Date(`${p.to}T23:59:59+05:00`).toISOString() } : undefined,
        }
      : {}),
    ...(p.q ? { search: { columns: ["order_number", "customer_name", "phone", "alt_phone"] as (keyof OrderRow & string)[], term: p.q.replace(/^0(?=3)/, "+92") } } : {}),
  };
  if (query.gte === undefined) delete query.gte;
  if (query.lte === undefined) delete query.lte;
  let rows = await d.select("orders", { ...query, order: [{ column: "created_at", ascending: false }] });
  if (p.city) rows = rows.filter((o) => o.city.toLowerCase() === p.city!.toLowerCase());
  const total = rows.length;
  const page = Math.max(1, p.page ?? 1);
  const items = opts.all ? rows : rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  return { items, total, page, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export async function getAdminOrder(id: string) {
  const d = db();
  const [order] = await d.select("orders", { eq: { id } });
  if (!order) return null;
  const [items, history, blocked, previous] = await Promise.all([
    d.select("order_items", { eq: { order_id: id } }),
    d.select("order_status_history", { eq: { order_id: id }, order: [{ column: "created_at", ascending: false }] }),
    d.select("blocked_phones", { eq: { phone: order.phone } }),
    d.count("orders", { eq: { phone: order.phone } }),
  ]);
  return { order, items, history, isBlocked: blocked.length > 0, customerOrderCount: previous };
}

export async function orderCities() {
  const rows = await db().select("orders");
  return [...new Set(rows.map((o) => o.city))].sort();
}

/* ------------------------------- customers ------------------------------ */

export interface CustomerRow {
  phone: string;
  name: string;
  city: string;
  orders: number;
  totalSpent: number;
  lastOrder: string;
  blocked: boolean;
}

export async function listCustomers(q?: string): Promise<CustomerRow[]> {
  const d = db();
  const [orders, blocked] = await Promise.all([
    d.select("orders", { order: [{ column: "created_at", ascending: false }] }),
    d.select("blocked_phones"),
  ]);
  const blockedSet = new Set(blocked.map((b) => b.phone));
  const map = new Map<string, CustomerRow>();
  for (const o of orders as Order[]) {
    const c = map.get(o.phone);
    const spent = o.status === "cancelled" || o.status === "returned" ? 0 : Number(o.total);
    if (!c) {
      map.set(o.phone, { phone: o.phone, name: o.customer_name, city: o.city, orders: 1, totalSpent: spent, lastOrder: o.created_at, blocked: blockedSet.has(o.phone) });
    } else {
      c.orders += 1;
      c.totalSpent += spent;
    }
  }
  let rows = [...map.values()];
  if (q) {
    const t = q.toLowerCase();
    rows = rows.filter((r) => `${r.name} ${r.phone} ${r.city}`.toLowerCase().includes(t));
  }
  return rows;
}

export async function customerOrders(phone: string) {
  return db().select("orders", { eq: { phone }, order: [{ column: "created_at", ascending: false }] });
}

export async function listBlockedPhones() {
  return db().select("blocked_phones", { order: [{ column: "created_at", ascending: false }] });
}
