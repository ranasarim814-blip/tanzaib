"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Search } from "lucide-react";
import { Input, NativeSelect } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface ToolbarFilter {
  key: string;
  label: string;
  options: { value: string; label: string }[];
}

/** Search box + select filters bound to URL search params (debounced). */
export function ListToolbar({ filters = [], placeholder = "Search…", dates = false }: { filters?: ToolbarFilter[]; placeholder?: string; dates?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [pending, start] = useTransition();

  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    start(() => router.replace(`${pathname}?${next.toString()}`));
  };

  useEffect(() => {
    const id = setTimeout(() => {
      if ((params.get("q") ?? "") !== q) set("q", q.trim());
    }, 350);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div className={cn("flex flex-wrap items-center gap-2 transition-opacity", pending && "opacity-60")}>
      <div className="relative min-w-56 flex-1 sm:max-w-xs">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} className="pl-8" aria-label="Search" />
      </div>
      {filters.map((f) => (
        <NativeSelect key={f.key} value={params.get(f.key) ?? ""} onChange={(e) => set(f.key, e.target.value)} className="w-auto" aria-label={f.label}>
          {f.options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </NativeSelect>
      ))}
      {dates && (
        <>
          <Input type="date" aria-label="From date" value={params.get("from") ?? ""} onChange={(e) => set("from", e.target.value)} className="w-auto" />
          <span className="text-xs text-muted-foreground">to</span>
          <Input type="date" aria-label="To date" value={params.get("to") ?? ""} onChange={(e) => set("to", e.target.value)} className="w-auto" />
        </>
      )}
    </div>
  );
}

export function Pagination({ page, pages, total }: { page: number; pages: number; total: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const go = (p: number) => {
    const next = new URLSearchParams(params.toString());
    next.set("page", String(p));
    router.push(`${pathname}?${next.toString()}`);
  };
  return (
    <div className="flex items-center justify-between px-4 py-3 text-xs text-muted-foreground">
      <span>{total} total</span>
      <div className="flex items-center gap-2">
        <button type="button" className="rounded-md border border-border px-2.5 py-1 disabled:opacity-40" disabled={page <= 1} onClick={() => go(page - 1)}>Previous</button>
        <span>Page {page} of {pages}</span>
        <button type="button" className="rounded-md border border-border px-2.5 py-1 disabled:opacity-40" disabled={page >= pages} onClick={() => go(page + 1)}>Next</button>
      </div>
    </div>
  );
}
