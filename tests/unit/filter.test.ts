import { describe, expect, it } from "vitest";
import { applyFilters, parseFilters } from "@/lib/catalog/filter";
import { buildDemoSeed } from "@/lib/demo/seed-data";
import type { ProductSummary } from "@/lib/types";

const seed = buildDemoSeed();
const cat = new Map(seed.categories.map((c) => [c.id, c]));
const products: ProductSummary[] = seed.products.map((p) => {
  const variants = seed.product_variants.filter((v) => v.product_id === p.id);
  return {
    ...p,
    category: { name: cat.get(p.category_id)!.name, slug: cat.get(p.category_id)!.slug },
    front: null, back: null, hanger: null, frontAlt: null,
    totalStock: variants.filter((v) => v.size !== "CUSTOM").reduce((n, v) => n + v.stock, 0),
    sizes: variants.map((v) => ({ size: v.size, stock: v.stock })),
  };
});
const now = new Date("2026-11-26T12:00:00Z");

describe("shop filters", () => {
  it("filters on-sale pieces, excluding the expired discount", () => {
    const names = applyFilters(products, parseFilters({ sale: "1" }), now).map((p) => p.name).sort();
    expect(names).toEqual(["Mahtab", "Mehr-un-Nisa", "Shehzadi"]);
  });

  it("filters by category and sorts by price", () => {
    const r = applyFilters(products, parseFilters({ category: "bridal", sort: "price-asc" }), now);
    expect(r.every((p) => p.category?.slug === "bridal")).toBe(true);
    expect(r.map((p) => p.name)).toEqual(["Mehr-un-Nisa", "Laal Pari", "Noor-e-Sahar"]);
  });

  it("ignores unknown filter values", () => {
    const f = parseFilters({ sort: "evil", embroidery: "zardozi,bogus", price: "nope" });
    expect(f).toMatchObject({ sort: "newest", embroidery: ["zardozi"], price: undefined });
  });
});
