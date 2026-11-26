import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { serviceClient } from "@/lib/supabase/clients";
import { OutOfStockError, type Db, type Query, type TableName } from "./db";

export const STORAGE_BUCKET = "products";

type Builder = ReturnType<ReturnType<SupabaseClient["from"]>["select"]>;

function applyFilters<B extends Builder>(b: B, q?: Query<Record<string, unknown>>): B {
  if (!q) return b;
  let x = b as Builder;
  if (q.eq)
    for (const [k, v] of Object.entries(q.eq)) x = v === null ? x.is(k, null) : x.eq(k, v as string);
  if (q.in) x = x.in(q.in.column, q.in.values);
  if (q.gte) for (const [k, v] of Object.entries(q.gte)) x = x.gte(k, v as string);
  if (q.lte) for (const [k, v] of Object.entries(q.lte)) x = x.lte(k, v as string);
  if (q.search?.term) {
    const term = q.search.term.replace(/[%,()*\\]/g, " ").trim();
    if (term) x = x.or(q.search.columns.map((c) => `${c}.ilike.%${term}%`).join(","));
  }
  return x as B;
}

function check<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

export const supabaseDb: Db = {
  kind: "supabase",

  async select(table: TableName, q) {
    let b = applyFilters(serviceClient().from(table).select("*"), q as never);
    for (const o of q?.order ?? []) b = b.order(o.column, { ascending: o.ascending !== false });
    if (q?.limit !== undefined) b = b.range(q.offset ?? 0, (q.offset ?? 0) + q.limit - 1);
    return check(await b) as never;
  },

  async count(table, q) {
    const b = applyFilters(serviceClient().from(table).select("*", { count: "exact", head: true }), q as never);
    const res = await b;
    if (res.error) throw new Error(res.error.message);
    return res.count ?? 0;
  },

  async insert(table, rows) {
    return check(await serviceClient().from(table).insert(rows as never).select("*")) as never;
  },

  async update(table, match, patch) {
    const b = applyFilters(serviceClient().from(table).update(patch as never).select("*") as unknown as Builder, match as never);
    return check(await b) as never;
  },

  async remove(table, match) {
    const b = applyFilters(serviceClient().from(table).delete() as unknown as Builder, match as never);
    const res = await b;
    if (res.error) throw new Error(res.error.message);
  },

  async upsert(table, rows, onConflict) {
    return check(await serviceClient().from(table).upsert(rows as never, { onConflict }).select("*")) as never;
  },

  async placeOrder(order, items) {
    const res = await serviceClient().rpc("place_order", { p_order: order, p_items: items });
    if (res.error) {
      const m = /OUT_OF_STOCK:(.*)/.exec(res.error.message);
      if (m) throw new OutOfStockError(m[1]);
      throw new Error(res.error.message);
    }
    const row = Array.isArray(res.data) ? res.data[0] : res.data;
    return row as { id: string; order_number: string; public_token: string };
  },

  async uploadFile(path, body, contentType) {
    const storage = serviceClient().storage.from(STORAGE_BUCKET);
    const res = await storage.upload(path, body, { contentType, upsert: false, cacheControl: "31536000" });
    if (res.error) throw new Error(res.error.message);
    return storage.getPublicUrl(path).data.publicUrl;
  },

  async deleteFiles(urls) {
    const marker = `/storage/v1/object/public/${STORAGE_BUCKET}/`;
    const paths = urls
      .map((u) => (u.includes(marker) ? decodeURIComponent(u.split(marker)[1]) : null))
      .filter((p): p is string => Boolean(p));
    if (paths.length) await serviceClient().storage.from(STORAGE_BUCKET).remove(paths);
  },
};
