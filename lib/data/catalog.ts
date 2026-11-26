import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import type {
  Category,
  ProductSummary,
  ProductWithRelations,
  Size,
  StoreSettings,
} from "@/lib/types";
import { SIZES } from "@/lib/types";
import { db } from "./index";
import { getSettingsUncached } from "./settings";

export const CATALOG_TAG = "catalog";
export const SETTINGS_TAG = "settings";

const sizeRank = (s: Size) => SIZES.indexOf(s);

/** Builds full product objects. `publishedOnly` for the storefront. */
export async function loadProducts(opts: { publishedOnly: boolean; ids?: string[] }) {
  const d = db();
  const [products, categories, images, variants] = await Promise.all([
    d.select("products", {
      ...(opts.publishedOnly ? { eq: { status: "published" } } : {}),
      ...(opts.ids ? { in: { column: "id", values: opts.ids } } : {}),
      order: [{ column: "created_at", ascending: false }],
    }),
    d.select("categories"),
    opts.ids
      ? d.select("product_images", { in: { column: "product_id", values: opts.ids } })
      : d.select("product_images"),
    opts.ids
      ? d.select("product_variants", { in: { column: "product_id", values: opts.ids } })
      : d.select("product_variants"),
  ]);
  const catById = new Map(categories.map((c) => [c.id, c]));
  return products
    .filter((p) => !opts.publishedOnly || catById.get(p.category_id)?.is_active !== false)
    .map<ProductWithRelations>((p) => {
      const c = catById.get(p.category_id);
      return {
        ...p,
        price: Number(p.price),
        discount_value: Number(p.discount_value),
        category: c ? { id: c.id, name: c.name, slug: c.slug } : null,
        images: images
          .filter((i) => i.product_id === p.id)
          .sort((a, b) => a.sort_order - b.sort_order),
        variants: variants
          .filter((v) => v.product_id === p.id)
          .sort((a, b) => sizeRank(a.size) - sizeRank(b.size)),
      };
    });
}

export function toSummary(p: ProductWithRelations): ProductSummary {
  const img = (kind: string) => p.images.find((i) => i.kind === kind) ?? null;
  const front = img("front") ?? p.images[0] ?? null;
  const standard = p.variants.filter((v) => v.size !== "CUSTOM");
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    sku: p.sku,
    category: p.category ? { name: p.category.name, slug: p.category.slug } : null,
    colour: p.colour,
    fabric: p.fabric,
    embroidery_type: p.embroidery_type,
    is_made_to_order: p.is_made_to_order,
    lead_time_days: p.lead_time_days,
    is_new_arrival: p.is_new_arrival,
    created_at: p.created_at,
    price: p.price,
    discount_type: p.discount_type,
    discount_value: p.discount_value,
    discount_starts_at: p.discount_starts_at,
    discount_ends_at: p.discount_ends_at,
    front: front?.url ?? null,
    frontAlt: front?.alt ?? p.name,
    back: img("back")?.url ?? null,
    hanger: img("hanger")?.url ?? null,
    totalStock: standard.reduce((n, v) => n + v.stock, 0),
    sizes: p.variants.map((v) => ({ size: v.size, stock: v.stock })),
    allow_custom_stitching: p.allow_custom_stitching,
  };
}

export async function getSettings(): Promise<StoreSettings> {
  "use cache";
  cacheTag(SETTINGS_TAG);
  cacheLife("hours");
  return getSettingsUncached();
}

export async function getCategories(): Promise<Category[]> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("hours");
  return db().select("categories", {
    eq: { is_active: true },
    order: [{ column: "sort_order", ascending: true }],
  });
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const cats = await getCategories();
  return cats.find((c) => c.slug === slug) ?? null;
}

export async function getPublishedProducts(): Promise<ProductWithRelations[]> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("hours");
  return loadProducts({ publishedOnly: true });
}

export async function getProductSummaries(): Promise<ProductSummary[]> {
  return (await getPublishedProducts()).map(toSummary);
}

export async function getProductBySlug(slug: string): Promise<ProductWithRelations | null> {
  const all = await getPublishedProducts();
  return all.find((p) => p.slug === slug) ?? null;
}

export async function getWardrobeProducts(): Promise<ProductSummary[]> {
  const all = await getPublishedProducts();
  return all
    .filter((p) => p.show_in_wardrobe)
    .sort((a, b) => a.wardrobe_order - b.wardrobe_order)
    .slice(0, 7)
    .map(toSummary);
}

export async function getRelatedProducts(p: ProductWithRelations, limit = 4): Promise<ProductSummary[]> {
  const all = await getPublishedProducts();
  const same = all.filter((x) => x.id !== p.id && x.category_id === p.category_id);
  const others = all.filter((x) => x.id !== p.id && x.category_id !== p.category_id);
  return [...same, ...others].slice(0, limit).map(toSummary);
}

/**
 * Headline for The Craft counter ("120+ hours of hand work per piece"): the median handwork
 * hours across published pieces, rounded down to the nearest 10.
 */
export async function getHandworkHeadline(): Promise<number> {
  const all = await getPublishedProducts();
  const hours = all.map((p) => p.handwork_hours ?? 0).filter((h) => h > 0).sort((a, b) => a - b);
  if (!hours.length) return 120;
  const median = hours[Math.floor(hours.length / 2)];
  return Math.max(10, Math.floor(median / 10) * 10);
}

/**
 * Reference time baked into cached pages (so prices render identically on server and during
 * hydration). Client components switch to the real clock right after hydration.
 */
export async function getRenderTime(): Promise<string> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("minutes");
  return new Date().toISOString();
}
