import { connection } from "next/server";
import { ProductCard } from "@/components/store/ProductCard";
import { activeFilterCount, applyFilters, parseFilters } from "@/lib/catalog/filter";
import { getCategories, getProductSummaries } from "@/lib/data/catalog";
import { ClearFilters, MobileFilters, ShopFilterSidebar, SortSelect } from "./ShopControls";

export async function ShopResults({
  searchParams,
  category,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
  category?: string;
}) {
  const raw = await searchParams;
  await connection();
  const filters = parseFilters({ ...raw, ...(category ? { category } : {}) });
  const [products, categories] = await Promise.all([getProductSummaries(), getCategories()]);
  const results = applyFilters(products, filters, new Date());
  const catList = category ? undefined : categories.map((c) => ({ slug: c.slug, name: c.name }));
  const count = activeFilterCount(filters, !category);

  return (
    <div className="grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-14">
      <ShopFilterSidebar categories={catList} />
      <div>
        <div className="mb-8 flex items-center justify-between gap-4 border-b border-line pb-4">
          <p className="text-xs tracking-wide text-taupe" aria-live="polite">
            {results.length} {results.length === 1 ? "piece" : "pieces"}
          </p>
          <div className="flex items-center gap-6">
            <MobileFilters categories={catList} activeCount={count} />
            <SortSelect />
          </div>
        </div>
        {results.length === 0 ? (
          <div className="flex flex-col items-center py-24 text-center">
            <p className="display text-4xl">Nothing in the almari… yet</p>
            <p className="mt-3 max-w-sm text-sm text-taupe">No pieces match these filters. Try removing one or two, or browse everything.</p>
            <ClearFilters />
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 lg:gap-x-7">
            {results.map((p, i) => (
              <li key={p.id}>
                <ProductCard product={p} priority={i < 3} sizes="(min-width: 1280px) 24vw, (min-width: 768px) 30vw, 46vw" />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export function ShopSkeleton() {
  return (
    <div className="grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-14" aria-busy aria-label="Loading pieces">
      <div className="hidden space-y-4 lg:block">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton h-5 w-3/4" />
        ))}
      </div>
      <div>
        <div className="skeleton mb-8 h-8 w-full" />
        <div className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 lg:gap-x-7">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i}>
              <div className="skeleton aspect-[3/4]" />
              <div className="skeleton mt-4 h-5 w-2/3" />
              <div className="skeleton mt-2 h-4 w-1/3" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
