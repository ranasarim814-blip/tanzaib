"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Dialog } from "radix-ui";
import { SlidersHorizontal, X } from "lucide-react";
import { FABRICS, PRICE_BANDS, SORTS } from "@/lib/catalog/filter";
import { EMBROIDERY_TYPES, STANDARD_SIZES } from "@/lib/types";
import { cn, titleCase } from "@/lib/utils";

interface Props {
  categories?: { slug: string; name: string }[];
  activeCount: number;
}

function useParamsUpdater() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, start] = useTransition();
  const update = (mut: (p: URLSearchParams) => void) => {
    const next = new URLSearchParams(params.toString());
    mut(next);
    const qs = next.toString();
    start(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  };
  return { params, update, pending };
}

export function SortSelect() {
  const { params, update } = useParamsUpdater();
  return (
    <label className="flex items-center gap-3 text-xs">
      <span className="eyebrow text-[0.6rem] text-taupe">Sort</span>
      <select
        value={params.get("sort") ?? "newest"}
        onChange={(e) => update((p) => (e.target.value === "newest" ? p.delete("sort") : p.set("sort", e.target.value)))}
        className="border-b border-line bg-transparent py-2 pr-6 text-sm outline-none focus:border-brass"
      >
        {SORTS.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="border-t border-line py-6 first:border-t-0 first:pt-0">
      <legend className="eyebrow float-left mb-4 w-full text-[0.62rem] text-ink">{title}</legend>
      <div className="clear-both">{children}</div>
    </fieldset>
  );
}

function Check({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 py-1.5 text-sm text-ink/85 hover:text-ink">
      <input type="checkbox" checked={checked} onChange={onChange} className="peer sr-only" />
      <span
        aria-hidden
        className="grid size-4 place-items-center border border-taupe-light peer-checked:border-ink peer-checked:bg-ink peer-focus-visible:ring-1 peer-focus-visible:ring-brass after:size-1.5 after:bg-ivory after:opacity-0 peer-checked:after:opacity-100"
      />
      {label}
    </label>
  );
}

function FilterPanel({ categories }: { categories?: Props["categories"] }) {
  const { params, update, pending } = useParamsUpdater();
  const multi = (key: string) => (params.get(key) ?? "").split(",").filter(Boolean);
  const toggleMulti = (key: string, value: string) =>
    update((p) => {
      const cur = new Set((p.get(key) ?? "").split(",").filter(Boolean));
      if (cur.has(value)) cur.delete(value);
      else cur.add(value);
      if (cur.size) p.set(key, [...cur].join(","));
      else p.delete(key);
    });
  const setSingle = (key: string, value: string | null) => update((p) => (value ? p.set(key, value) : p.delete(key)));

  return (
    <div className={cn("transition-opacity", pending && "opacity-60")} aria-busy={pending}>
      {categories && (
        <Group title="Category">
          <div className="flex flex-col">
            {[{ slug: "", name: "All pieces" }, ...categories].map((c) => (
              <label key={c.slug} className="flex cursor-pointer items-center gap-3 py-1.5 text-sm">
                <input
                  type="radio"
                  name="category"
                  checked={(params.get("category") ?? "") === c.slug}
                  onChange={() => setSingle("category", c.slug || null)}
                  className="peer sr-only"
                />
                <span aria-hidden className="size-3 rounded-full border border-taupe-light peer-checked:border-[4px] peer-checked:border-ink peer-focus-visible:ring-1 peer-focus-visible:ring-brass" />
                {c.name}
              </label>
            ))}
          </div>
        </Group>
      )}
      <Group title="Availability">
        <Check checked={params.get("instock") === "1"} onChange={() => setSingle("instock", params.get("instock") === "1" ? null : "1")} label="In stock / made to order" />
        <Check checked={params.get("sale") === "1"} onChange={() => setSingle("sale", params.get("sale") === "1" ? null : "1")} label="On sale" />
      </Group>
      <Group title="Price">
        {PRICE_BANDS.map((b) => (
          <Check key={b.value} checked={params.get("price") === b.value} onChange={() => setSingle("price", params.get("price") === b.value ? null : b.value)} label={b.label} />
        ))}
      </Group>
      <Group title="Size">
        <div className="flex flex-wrap gap-2">
          {STANDARD_SIZES.map((s) => {
            const on = multi("size").includes(s);
            return (
              <button key={s} type="button" aria-pressed={on} onClick={() => toggleMulti("size", s)} className={cn("min-w-11 border px-3 py-2 text-xs transition-colors", on ? "border-ink bg-ink text-ivory" : "border-line hover:border-ink")}>
                {s}
              </button>
            );
          })}
        </div>
      </Group>
      <Group title="Embroidery">
        {EMBROIDERY_TYPES.map((e) => (
          <Check key={e} checked={multi("embroidery").includes(e)} onChange={() => toggleMulti("embroidery", e)} label={titleCase(e)} />
        ))}
      </Group>
      <Group title="Fabric">
        {FABRICS.map((f) => (
          <Check key={f} checked={multi("fabric").includes(f)} onChange={() => toggleMulti("fabric", f)} label={titleCase(f)} />
        ))}
      </Group>
    </div>
  );
}

export function ShopFilterSidebar({ categories }: { categories?: Props["categories"] }) {
  return (
    <aside aria-label="Filters" className="hidden lg:block">
      <FilterPanel categories={categories} />
    </aside>
  );
}

export function MobileFilters({ categories, activeCount }: Props) {
  const { update } = useParamsUpdater();
  return (
    <Dialog.Root>
      <Dialog.Trigger className="eyebrow flex items-center gap-2 text-[0.62rem] lg:hidden">
        <SlidersHorizontal className="size-4" strokeWidth={1.25} /> Filter {activeCount > 0 && `(${activeCount})`}
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-ink/40" />
        <Dialog.Content className="fixed inset-y-0 left-0 z-[61] flex w-[88%] max-w-sm flex-col bg-ivory" aria-describedby={undefined} data-lenis-prevent>
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <Dialog.Title className="font-serif text-2xl font-light">Filter</Dialog.Title>
            <Dialog.Close aria-label="Close filters" className="p-2">
              <X className="size-5" strokeWidth={1.25} />
            </Dialog.Close>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-6">
            <FilterPanel categories={categories} />
          </div>
          <div className="grid grid-cols-2 gap-3 border-t border-line p-4">
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => update((p) => ["category", "price", "fabric", "embroidery", "size", "instock", "sale"].forEach((k) => p.delete(k)))}
            >
              Clear
            </button>
            <Dialog.Close className="btn btn-ink">Show results</Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function ClearFilters() {
  const { update } = useParamsUpdater();
  return (
    <button
      type="button"
      onClick={() => update((p) => ["category", "price", "fabric", "embroidery", "size", "instock", "sale", "q"].forEach((k) => p.delete(k)))}
      className="btn btn-outline mt-8"
    >
      Clear all filters
    </button>
  );
}
