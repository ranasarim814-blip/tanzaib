import "server-only";
import { randomBytes, randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { DEFAULT_SETTINGS } from "@/lib/config";
import { buildDemoSeed } from "@/lib/demo/seed-data";
import {
  OutOfStockError,
  type Db,
  type PlaceOrderItem,
  type PlaceOrderPayload,
  type Query,
  type TableName,
  type Tables,
} from "./db";

/**
 * In-memory database used in demo mode (no Supabase env vars).
 * Data lives until the server process restarts.
 */
type Store = { [K in TableName]: Tables[K][] } & { orderSeq: number };

const g = globalThis as unknown as { __tanzaibStore?: Store };

function initStore(): Store {
  const seed = buildDemoSeed();
  return {
    ...seed,
    settings: Object.entries(DEFAULT_SETTINGS).map(([key, value]) => ({ key, value })),
    admins: [],
    blocked_phones: [],
    newsletter_subscribers: [],
    contact_messages: [],
    orderSeq: seed.orders.length,
  };
}

function store(): Store {
  if (!g.__tanzaibStore) g.__tanzaibStore = initStore();
  return g.__tanzaibStore;
}

/** Test helper: reset demo data. */
export function resetMemoryStore() {
  g.__tanzaibStore = initStore();
}

export const DEMO_UPLOAD_DIR = join(tmpdir(), "tanzaib-demo-uploads");

const clone = <T>(v: T): T => structuredClone(v);

function matches<T>(row: T, q?: Query<T>): boolean {
  if (!q) return true;
  const r = row as Record<string, unknown>;
  if (q.eq) for (const [k, v] of Object.entries(q.eq)) if (r[k] !== v) return false;
  if (q.in && !q.in.values.includes(r[q.in.column] as string | number)) return false;
  if (q.gte) for (const [k, v] of Object.entries(q.gte)) if ((r[k] as string | number) < (v as string | number)) return false;
  if (q.lte) for (const [k, v] of Object.entries(q.lte)) if ((r[k] as string | number) > (v as string | number)) return false;
  if (q.search && q.search.term) {
    const term = q.search.term.toLowerCase();
    if (!q.search.columns.some((c) => String(r[c] ?? "").toLowerCase().includes(term))) return false;
  }
  return true;
}

function applyQuery<T>(rows: T[], q?: Query<T>): T[] {
  let out = rows.filter((r) => matches(r, q));
  if (q?.order?.length) {
    out = [...out].sort((a, b) => {
      for (const o of q.order!) {
        const av = (a as Record<string, unknown>)[o.column] as string | number;
        const bv = (b as Record<string, unknown>)[o.column] as string | number;
        if (av === bv) continue;
        const cmp = av > bv ? 1 : -1;
        return o.ascending === false ? -cmp : cmp;
      }
      return 0;
    });
  }
  const start = q?.offset ?? 0;
  return q?.limit !== undefined ? out.slice(start, start + q.limit) : out.slice(start);
}

const now = () => new Date().toISOString();

const PK: Partial<Record<TableName, string>> = { settings: "key", blocked_phones: "phone", admins: "user_id" };

export const memoryDb: Db = {
  kind: "memory",

  async select(table, q) {
    return clone(applyQuery(store()[table] as never[], q as never)) as never;
  },

  async count(table, q) {
    return (store()[table] as unknown[]).filter((r) => matches(r, q as never)).length;
  },

  async insert(table, rows) {
    const s = store();
    const pk = PK[table];
    const created = rows.map((r) => {
      const row = { ...(pk ? {} : { id: randomUUID() }), created_at: now(), ...r } as Record<string, unknown>;
      if (table === "products" || table === "orders") row.updated_at ??= now();
      // unique constraints that matter
      if (table === "products") {
        const list = s.products;
        if (list.some((p) => p.slug === row.slug)) throw new Error("duplicate key value violates unique constraint \"products_slug_key\"");
        if (list.some((p) => p.sku === row.sku)) throw new Error("duplicate key value violates unique constraint \"products_sku_key\"");
      }
      if (table === "newsletter_subscribers" && s.newsletter_subscribers.some((n) => n.email === row.email)) {
        throw new Error("duplicate key value violates unique constraint");
      }
      if (pk && (s[table] as unknown as Record<string, unknown>[]).some((x) => x[pk] === row[pk])) {
        throw new Error("duplicate key value violates unique constraint");
      }
      return row;
    });
    (s[table] as unknown[]).push(...created);
    return clone(created) as never;
  },

  async update(table, match, patch) {
    const s = store();
    const out: unknown[] = [];
    for (const row of s[table] as unknown as Record<string, unknown>[]) {
      if (matches(row, match as never)) {
        if (table === "products" && typeof (patch as Record<string, unknown>).slug === "string") {
          const clash = s.products.find((p) => p.slug === (patch as Record<string, unknown>).slug && p.id !== row.id);
          if (clash) throw new Error("duplicate key value violates unique constraint \"products_slug_key\"");
        }
        if (table === "products" && typeof (patch as Record<string, unknown>).sku === "string") {
          const clash = s.products.find((p) => p.sku === (patch as Record<string, unknown>).sku && p.id !== row.id);
          if (clash) throw new Error("duplicate key value violates unique constraint \"products_sku_key\"");
        }
        Object.assign(row, patch);
        if ("updated_at" in row) row.updated_at = now();
        out.push(row);
      }
    }
    return clone(out) as never;
  },

  async remove(table, match) {
    const s = store();
    (s as Record<string, unknown>)[table] = (s[table] as unknown[]).filter((r) => !matches(r, match as never));
    if (table === "products") {
      const ids = new Set(s.products.map((p) => p.id));
      s.product_images = s.product_images.filter((i) => ids.has(i.product_id));
      s.product_variants = s.product_variants.filter((v) => ids.has(v.product_id));
    }
    if (table === "orders") {
      const ids = new Set(s.orders.map((o) => o.id));
      s.order_items = s.order_items.filter((i) => ids.has(i.order_id));
      s.order_status_history = s.order_status_history.filter((h) => ids.has(h.order_id));
    }
  },

  async upsert(table, rows, onConflict) {
    const s = store();
    const keys = onConflict.split(",").map((k) => k.trim());
    const out: unknown[] = [];
    for (const r of rows as Record<string, unknown>[]) {
      const existing = (s[table] as unknown as Record<string, unknown>[]).find((x) => keys.every((k) => x[k] === r[k]));
      if (existing) {
        Object.assign(existing, r);
        if ("updated_at" in existing) existing.updated_at = now();
        out.push(existing);
      } else {
        out.push(...(await memoryDb.insert(table, [r as never])));
      }
    }
    return clone(out) as never;
  },

  async placeOrder(order: PlaceOrderPayload, items: PlaceOrderItem[]) {
    const s = store();
    // check everything first so the operation is all-or-nothing
    for (const it of items) {
      if (!it.decrement) continue;
      const v = s.product_variants.find((x) => x.product_id === it.product_id && x.size === it.size);
      const reserved = items
        .filter((o) => o.decrement && o.product_id === it.product_id && o.size === it.size)
        .reduce((n, o) => n + o.quantity, 0);
      if (!v || v.stock < reserved) throw new OutOfStockError(it.product_name);
    }
    for (const it of items) {
      if (!it.decrement) continue;
      const v = s.product_variants.find((x) => x.product_id === it.product_id && x.size === it.size)!;
      v.stock -= it.quantity;
    }
    s.orderSeq += 1;
    const year = new Intl.DateTimeFormat("en", { year: "numeric", timeZone: "Asia/Karachi" }).format(new Date());
    const order_number = `TZ-${year}-${String(s.orderSeq).padStart(5, "0")}`;
    const id = randomUUID();
    const ts = now();
    s.orders.push({
      ...order,
      id,
      order_number,
      status: "pending",
      admin_notes: null,
      tracking_number: null,
      courier: null,
      created_at: ts,
      updated_at: ts,
    });
    for (const it of items) {
      s.order_items.push({
        id: randomUUID(),
        order_id: id,
        product_id: it.product_id,
        product_name: it.product_name,
        sku: it.sku,
        size: it.size as never,
        quantity: it.quantity,
        unit_price: it.unit_price,
        unit_discount: it.unit_discount,
        line_total: it.line_total,
        custom_measurements: it.custom_measurements as never,
        image_url: it.image_url,
      });
    }
    s.order_status_history.push({
      id: randomUUID(),
      order_id: id,
      status: "pending",
      note: "Order placed (Cash on Delivery)",
      changed_by: null,
      created_at: ts,
    });
    return { id, order_number, public_token: order.public_token };
  },

  async uploadFile(path, body) {
    const name = `${randomBytes(4).toString("hex")}-${path.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    mkdirSync(DEMO_UPLOAD_DIR, { recursive: true });
    writeFileSync(join(DEMO_UPLOAD_DIR, name), body);
    return `/api/demo-uploads/${name}`;
  },

  async deleteFiles(urls) {
    for (const u of urls) {
      const m = /^\/api\/demo-uploads\/([a-zA-Z0-9._-]+)$/.exec(u);
      if (m) rmSync(join(DEMO_UPLOAD_DIR, m[1]), { force: true });
    }
  },
};
