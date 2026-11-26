import { getEffectivePrice } from "@/lib/pricing";
import { EMBROIDERY_TYPES, STANDARD_SIZES, type EmbroideryType, type ProductSummary } from "@/lib/types";

export const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "discount", label: "Biggest discount" },
] as const;
export type SortValue = (typeof SORTS)[number]["value"];

export const PRICE_BANDS = [
  { value: "0-20000", label: "Under Rs. 20,000", min: 0, max: 20000 },
  { value: "20000-40000", label: "Rs. 20,000 – 40,000", min: 20000, max: 40000 },
  { value: "40000-70000", label: "Rs. 40,000 – 70,000", min: 40000, max: 70000 },
  { value: "70000-", label: "Rs. 70,000 and above", min: 70000, max: Infinity },
] as const;

/** Fabric keywords recognised inside the free-text `fabric` field. */
export const FABRICS = ["silk", "raw silk", "chiffon", "organza", "velvet", "net", "lawn", "khaddi", "cotton", "jamawar"] as const;

export interface ShopFilters {
  category?: string;
  price?: string;
  fabric?: string[];
  embroidery?: EmbroideryType[];
  size?: string[];
  inStock?: boolean;
  sale?: boolean;
  sort: SortValue;
  q?: string;
}

type Raw = Record<string, string | string[] | undefined>;
const list = (v: string | string[] | undefined) =>
  (Array.isArray(v) ? v : v ? v.split(",") : []).map((s) => s.trim()).filter(Boolean);

export function parseFilters(raw: Raw): ShopFilters {
  const sort = (SORTS.find((s) => s.value === raw.sort)?.value ?? "newest") as SortValue;
  const embroidery = list(raw.embroidery).filter((e): e is EmbroideryType =>
    (EMBROIDERY_TYPES as readonly string[]).includes(e),
  );
  return {
    category: typeof raw.category === "string" ? raw.category : undefined,
    price: PRICE_BANDS.some((b) => b.value === raw.price) ? (raw.price as string) : undefined,
    fabric: list(raw.fabric).filter((f) => (FABRICS as readonly string[]).includes(f)),
    embroidery,
    size: list(raw.size).filter((s) => (STANDARD_SIZES as readonly string[]).includes(s)),
    inStock: raw.instock === "1",
    sale: raw.sale === "1",
    sort,
    q: typeof raw.q === "string" && raw.q.trim() ? raw.q.trim().slice(0, 60) : undefined,
  };
}

export function applyFilters(products: ProductSummary[], f: ShopFilters, now: Date): ProductSummary[] {
  const band = PRICE_BANDS.find((b) => b.value === f.price);
  const priced = products.map((p) => ({ p, price: getEffectivePrice(p, now) }));
  const out = priced.filter(({ p, price }) => {
    if (f.category && p.category?.slug !== f.category) return false;
    if (band && (price.final < band.min || price.final >= band.max)) return false;
    if (f.fabric?.length) {
      const fab = (p.fabric ?? "").toLowerCase();
      if (!f.fabric.some((x) => fab.includes(x))) return false;
    }
    if (f.embroidery?.length && (!p.embroidery_type || !f.embroidery.includes(p.embroidery_type))) return false;
    if (f.size?.length) {
      const ok = p.sizes.some((s) => f.size!.includes(s.size) && (p.is_made_to_order || s.stock > 0));
      if (!ok) return false;
    }
    if (f.inStock && !p.is_made_to_order && p.totalStock <= 0) return false;
    if (f.sale && !price.isOnSale) return false;
    if (f.q) {
      const hay = `${p.name} ${p.colour ?? ""} ${p.fabric ?? ""} ${p.embroidery_type ?? ""} ${p.category?.name ?? ""}`.toLowerCase();
      if (!f.q.toLowerCase().split(/\s+/).every((w) => hay.includes(w))) return false;
    }
    return true;
  });
  out.sort((a, b) => {
    switch (f.sort) {
      case "price-asc":
        return a.price.final - b.price.final;
      case "price-desc":
        return b.price.final - a.price.final;
      case "discount":
        return b.price.savedPercent - a.price.savedPercent || b.price.savedAmount - a.price.savedAmount;
      default:
        return b.p.created_at.localeCompare(a.p.created_at);
    }
  });
  return out.map((x) => x.p);
}

export function activeFilterCount(f: ShopFilters, includeCategory = true) {
  return (
    (includeCategory && f.category ? 1 : 0) +
    (f.price ? 1 : 0) +
    (f.fabric?.length ?? 0) +
    (f.embroidery?.length ?? 0) +
    (f.size?.length ?? 0) +
    (f.inStock ? 1 : 0) +
    (f.sale ? 1 : 0)
  );
}
