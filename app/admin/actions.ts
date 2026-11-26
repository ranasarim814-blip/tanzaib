"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { updateTag } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/data";
import { CATALOG_TAG, SETTINGS_TAG } from "@/lib/data/catalog";
import { isSupabaseConfigured } from "@/lib/config";
import { authClient } from "@/lib/supabase/clients";
import {
  DEMO_COOKIE,
  NotAuthorisedError,
  assertAdmin,
  demoAdminEmail,
  demoAdminPassword,
  signDemoSession,
} from "@/lib/admin/auth";
import {
  bulkDiscountSchema,
  categoryFormSchema,
  orderMetaSchema,
  orderStatusUpdateSchema,
  productFormSchema,
  settingsSchema,
  type ProductFormInput,
} from "@/lib/validation/schemas";
import { normalizePkPhone } from "@/lib/validation/phone";
import { PRODUCT_STATUSES, type OrderStatus, type ProductStatus } from "@/lib/types";
import { slugify } from "@/lib/utils";

export type Result<T = undefined> =
  | ({ ok: true } & (T extends undefined ? object : { data: T }))
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

async function guard<T>(fn: (admin: Awaited<ReturnType<typeof assertAdmin>>) => Promise<T>): Promise<T | { ok: false; error: string }> {
  try {
    const admin = await assertAdmin();
    return await fn(admin);
  } catch (e) {
    if (e instanceof NotAuthorisedError) return { ok: false, error: "Your session has expired. Please sign in again." };
    const msg = e instanceof Error ? e.message : "Unexpected error";
    if (/products_slug_key|slug/.test(msg) && /duplicate|unique/.test(msg)) return { ok: false, error: "That URL slug is already used by another product." };
    if (/products_sku_key|sku/.test(msg) && /duplicate|unique/.test(msg)) return { ok: false, error: "That SKU is already used by another product." };
    console.error("[admin action]", e);
    return { ok: false, error: msg };
  }
}

const refreshCatalog = () => updateTag(CATALOG_TAG);

/* --------------------------------- auth --------------------------------- */

export async function loginAction(_prev: { error?: string; email?: string } | null, form: FormData): Promise<{ error?: string; email?: string } | null> {
  const parsed = z
    .object({ email: z.email().trim().toLowerCase(), password: z.string().min(1).max(200), next: z.string().optional() })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Enter your email and password.", email: String(form.get("email") ?? "") };
  const { email, password } = parsed.data;
  const next = parsed.data.next?.startsWith("/admin") ? parsed.data.next : "/admin";

  if (!isSupabaseConfigured()) {
    const demoPw = demoAdminPassword();
    if (!demoPw) return { error: "Admin is disabled: connect Supabase or set DEMO_ADMIN_PASSWORD.", email };
    if (email !== demoAdminEmail() || password !== demoPw) return { error: "Incorrect email or password.", email };
    const s = signDemoSession(email);
    (await cookies()).set(DEMO_COOKIE, s.value, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: s.maxAge });
    redirect(next);
  }

  const supabase = await authClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { error: "Incorrect email or password.", email };
  const isAdmin = await db().count("admins", { eq: { user_id: data.user.id } });
  if (!isAdmin) {
    await supabase.auth.signOut();
    return { error: "This account doesn't have admin access.", email };
  }
  redirect(next);
}

export async function logoutAction() {
  (await cookies()).delete(DEMO_COOKIE);
  if (isSupabaseConfigured()) {
    const supabase = await authClient();
    await supabase.auth.signOut();
  }
  redirect("/admin/login");
}

/* ------------------------------- products ------------------------------- */

function zodErrors(err: z.ZodError) {
  const out: Record<string, string> = {};
  for (const i of err.issues) out[i.path.join(".")] ??= i.message;
  return out;
}

/** Remove storage files no longer referenced by any product image. */
async function deleteUnreferenced(urls: string[]) {
  if (!urls.length) return;
  const still = await db().select("product_images", { in: { column: "url", values: urls } });
  const used = new Set(still.map((i) => i.url));
  await db().deleteFiles(urls.filter((u) => !used.has(u)));
}

export async function saveProduct(id: string | null, input: ProductFormInput): Promise<Result<{ id: string }>> {
  return guard(async () => {
    const parsed = productFormSchema.safeParse(input);
    if (!parsed.success) return { ok: false as const, error: "Please fix the highlighted fields.", fieldErrors: zodErrors(parsed.error) };
    const { variants, images, ...fields } = parsed.data;
    const d = db();

    let productId = id;
    if (productId) {
      const updated = await d.update("products", { eq: { id: productId } }, fields);
      if (!updated.length) return { ok: false as const, error: "Product not found." };
    } else {
      const [created] = await d.insert("products", [fields]);
      productId = created.id;
    }

    // variants: upsert listed sizes, remove the rest
    const sizes = variants.map((v) => v.size);
    if (variants.length) {
      await d.upsert(
        "product_variants",
        variants.map((v) => ({ product_id: productId!, size: v.size, stock: v.stock })),
        "product_id,size",
      );
    }
    const existingVariants = await d.select("product_variants", { eq: { product_id: productId } });
    const toRemove = existingVariants.filter((v) => !sizes.includes(v.size)).map((v) => v.id);
    if (toRemove.length) await d.remove("product_variants", { in: { column: "id", values: toRemove } });

    // images: replace rows in the given order
    const before = await d.select("product_images", { eq: { product_id: productId } });
    await d.remove("product_images", { eq: { product_id: productId } });
    if (images.length) {
      await d.insert(
        "product_images",
        images.map((img, i) => ({ product_id: productId!, url: img.url, kind: img.kind, alt: img.alt, sort_order: i })),
      );
    }
    const keep = new Set(images.map((i) => i.url));
    await deleteUnreferenced(before.map((b) => b.url).filter((u) => !keep.has(u)));

    refreshCatalog();
    return { ok: true as const, data: { id: productId! } };
  }) as Promise<Result<{ id: string }>>;
}

export async function duplicateProduct(id: string): Promise<Result<{ id: string }>> {
  return guard(async () => {
    const d = db();
    const [p] = await d.select("products", { eq: { id } });
    if (!p) return { ok: false as const, error: "Product not found." };
    const all = await d.select("products");
    let n = 1;
    let slug = `${p.slug}-copy`;
    let sku = `${p.sku}-C`;
    while (all.some((x) => x.slug === slug || x.sku === sku)) {
      n += 1;
      slug = `${p.slug}-copy-${n}`;
      sku = `${p.sku}-C${n}`;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _omit, created_at, updated_at, ...rest } = p;
    const [copy] = await d.insert("products", [{ ...rest, name: `${p.name} (copy)`, slug, sku, status: "draft", show_in_wardrobe: false }]);
    const [images, variants] = await Promise.all([
      d.select("product_images", { eq: { product_id: id } }),
      d.select("product_variants", { eq: { product_id: id } }),
    ]);
    if (images.length) await d.insert("product_images", images.map((i) => ({ product_id: copy.id, url: i.url, kind: i.kind, alt: i.alt, sort_order: i.sort_order })));
    if (variants.length) await d.insert("product_variants", variants.map((v) => ({ product_id: copy.id, size: v.size, stock: v.stock })));
    void created_at;
    void updated_at;
    refreshCatalog();
    return { ok: true as const, data: { id: copy.id } };
  }) as Promise<Result<{ id: string }>>;
}

export async function setProductsStatus(ids: string[], status: ProductStatus): Promise<Result> {
  return guard(async () => {
    if (!PRODUCT_STATUSES.includes(status) || !ids.length) return { ok: false as const, error: "Nothing to update." };
    if (status === "published") {
      const imgs = await db().select("product_images", { in: { column: "product_id", values: ids }, eq: { kind: "front" } });
      const withFront = new Set(imgs.map((i) => i.product_id));
      const missing = ids.filter((i) => !withFront.has(i));
      if (missing.length) return { ok: false as const, error: `${missing.length} product(s) need a front image before publishing.` };
    }
    await db().update("products", { in: { column: "id", values: ids } }, { status });
    refreshCatalog();
    return { ok: true as const };
  }) as Promise<Result>;
}

export async function deleteProducts(ids: string[]): Promise<Result> {
  return guard(async () => {
    const d = db();
    const images = await d.select("product_images", { in: { column: "product_id", values: ids } });
    await d.remove("products", { in: { column: "id", values: ids } });
    await deleteUnreferenced([...new Set(images.map((i) => i.url))]);
    refreshCatalog();
    return { ok: true as const };
  }) as Promise<Result>;
}

export async function applyBulkDiscount(input: unknown): Promise<Result> {
  return guard(async () => {
    const parsed = bulkDiscountSchema.safeParse(input);
    if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid discount" };
    const { ids, ...discount } = parsed.data;
    if (discount.discount_type === "flat") {
      const rows = await db().select("products", { in: { column: "id", values: ids } });
      const tooBig = rows.filter((r) => Number(r.price) < discount.discount_value);
      if (tooBig.length) return { ok: false as const, error: `The flat discount is larger than the price of ${tooBig.map((r) => r.name).join(", ")}.` };
    }
    await db().update(
      "products",
      { in: { column: "id", values: ids } },
      discount.discount_type === "none"
        ? { discount_type: "none", discount_value: 0, discount_starts_at: null, discount_ends_at: null }
        : discount,
    );
    refreshCatalog();
    return { ok: true as const };
  }) as Promise<Result>;
}

const IMAGE_TYPES = ["image/webp", "image/jpeg", "image/png", "image/avif"];

export async function uploadProductImage(form: FormData): Promise<Result<{ url: string }>> {
  return guard(async () => {
    const file = form.get("file");
    if (!(file instanceof File)) return { ok: false as const, error: "No file received." };
    if (!IMAGE_TYPES.includes(file.type)) return { ok: false as const, error: "Use a WebP, JPEG, PNG or AVIF image." };
    if (file.size > 6 * 1024 * 1024) return { ok: false as const, error: "Image is larger than 6 MB." };
    const bytes = new Uint8Array(await file.arrayBuffer());
    const base = slugify(String(form.get("slug") || "product")) || "product";
    const ext = file.type.split("/")[1].replace("jpeg", "jpg");
    const path = `${base}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const url = await db().uploadFile(path, bytes, file.type);
    return { ok: true as const, data: { url } };
  }) as Promise<Result<{ url: string }>>;
}

/* -------------------------------- orders -------------------------------- */

export async function updateOrderStatus(orderId: string, input: { status: OrderStatus; note?: string | null; restock?: boolean }): Promise<Result> {
  return guard(async (admin) => {
    const parsed = orderStatusUpdateSchema.safeParse(input);
    if (!parsed.success) return { ok: false as const, error: "Invalid status." };
    const d = db();
    const [order] = await d.select("orders", { eq: { id: orderId } });
    if (!order) return { ok: false as const, error: "Order not found." };
    if (order.status === parsed.data.status) return { ok: false as const, error: "The order already has that status." };

    const wasReleased = order.status === "cancelled" || order.status === "returned";
    const releasing = parsed.data.status === "cancelled" || parsed.data.status === "returned";
    if (releasing && !wasReleased && input.restock !== false) {
      const items = await d.select("order_items", { eq: { order_id: orderId } });
      const productIds = items.map((i) => i.product_id).filter((x): x is string => Boolean(x));
      const products = productIds.length ? await d.select("products", { in: { column: "id", values: productIds } }) : [];
      const mto = new Set(products.filter((p) => p.is_made_to_order).map((p) => p.id));
      for (const it of items) {
        if (!it.product_id || it.size === "CUSTOM" || mto.has(it.product_id)) continue;
        const [v] = await d.select("product_variants", { eq: { product_id: it.product_id, size: it.size } });
        if (v) await d.update("product_variants", { eq: { id: v.id } }, { stock: v.stock + it.quantity });
      }
      refreshCatalog();
    }
    await d.update("orders", { eq: { id: orderId } }, { status: parsed.data.status });
    await d.insert("order_status_history", [{ order_id: orderId, status: parsed.data.status, note: parsed.data.note, changed_by: admin.email }]);
    return { ok: true as const };
  }) as Promise<Result>;
}

export async function updateOrderMeta(orderId: string, input: unknown): Promise<Result> {
  return guard(async () => {
    const parsed = orderMetaSchema.safeParse(input);
    if (!parsed.success) return { ok: false as const, error: "Invalid details." };
    await db().update("orders", { eq: { id: orderId } }, parsed.data);
    return { ok: true as const };
  }) as Promise<Result>;
}

export async function blockPhone(phone: string, reason: string | null): Promise<Result> {
  return guard(async () => {
    const p = normalizePkPhone(phone) ?? phone;
    await db().upsert("blocked_phones", [{ phone: p, reason: reason?.slice(0, 200) || "Fake order" }], "phone");
    return { ok: true as const };
  }) as Promise<Result>;
}

export async function unblockPhone(phone: string): Promise<Result> {
  return guard(async () => {
    await db().remove("blocked_phones", { eq: { phone } });
    return { ok: true as const };
  }) as Promise<Result>;
}

/* ------------------------------ categories ------------------------------ */

export async function saveCategory(id: string | null, input: unknown): Promise<Result> {
  return guard(async () => {
    const parsed = categoryFormSchema.safeParse(input);
    if (!parsed.success) return { ok: false as const, error: "Please fix the highlighted fields.", fieldErrors: zodErrors(parsed.error) };
    const d = db();
    const clash = (await d.select("categories", { eq: { slug: parsed.data.slug } })).find((c) => c.id !== id);
    if (clash) return { ok: false as const, error: "That slug is already used." };
    if (id) await d.update("categories", { eq: { id } }, parsed.data);
    else await d.insert("categories", [parsed.data]);
    refreshCatalog();
    return { ok: true as const };
  }) as Promise<Result>;
}

export async function deleteCategory(id: string): Promise<Result> {
  return guard(async () => {
    const d = db();
    const used = await d.count("products", { eq: { category_id: id } });
    if (used) return { ok: false as const, error: `Move or delete its ${used} product(s) first.` };
    await d.remove("categories", { eq: { id } });
    refreshCatalog();
    return { ok: true as const };
  }) as Promise<Result>;
}

/* ------------------------------- messages ------------------------------- */

export async function setMessageRead(id: string, isRead: boolean): Promise<Result> {
  return guard(async () => {
    await db().update("contact_messages", { eq: { id } }, { is_read: isRead });
    return { ok: true as const };
  }) as Promise<Result>;
}

/* ------------------------------- settings ------------------------------- */

export async function saveSettings(input: unknown): Promise<Result> {
  return guard(async () => {
    const parsed = settingsSchema.safeParse(input);
    if (!parsed.success) return { ok: false as const, error: "Please fix the highlighted fields.", fieldErrors: zodErrors(parsed.error) };
    await db().upsert(
      "settings",
      Object.entries(parsed.data).map(([key, value]) => ({ key, value })),
      "key",
    );
    updateTag(SETTINGS_TAG);
    return { ok: true as const };
  }) as Promise<Result>;
}

