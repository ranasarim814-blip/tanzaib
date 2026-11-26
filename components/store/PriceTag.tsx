"use client";

import { getEffectivePrice } from "@/lib/pricing";
import { useNow } from "@/lib/now";
import type { Priceable } from "@/lib/types";
import { cn, formatPKR } from "@/lib/utils";

/**
 * Renders the customer price. Computed on the client from the raw discount fields so a
 * scheduled discount starts/ends on time even when the page itself is cached.
 */
export function PriceTag({
  product,
  size = "md",
  tone = "ink",
  showSaving = false,
  className,
}: {
  product: Priceable;
  size?: "sm" | "md" | "lg";
  tone?: "ink" | "ivory";
  showSaving?: boolean;
  className?: string;
}) {
  const now = useNow();
  const p = getEffectivePrice(product, now);
  const main = size === "lg" ? "text-2xl" : size === "sm" ? "text-sm" : "text-base";
  return (
    <div className={cn("flex flex-wrap items-baseline gap-x-3 gap-y-1", className)}>
      <span className={cn(main, "font-medium tracking-wide", tone === "ivory" ? "text-ivory" : "text-ink")}>
        <span className="sr-only">{p.isOnSale ? "Sale price " : "Price "}</span>
        {formatPKR(p.final)}
      </span>
      {p.isOnSale && (
        <>
          <s className={cn(size === "lg" ? "text-base" : "text-xs", tone === "ivory" ? "text-ivory/55" : "text-taupe")}>
            <span className="sr-only">Original price </span>
            {formatPKR(p.original)}
          </s>
          <span
            className={cn(
              "px-2 py-0.5 text-[0.625rem] font-semibold tracking-[0.18em] uppercase",
              tone === "ivory" ? "bg-brass-soft text-ink" : "bg-maroon text-ivory",
            )}
          >
            −{p.savedPercent}%
          </span>
          {showSaving && (
            <span className={cn("w-full text-xs tracking-wide", tone === "ivory" ? "text-brass-soft" : "text-maroon")}>
              You save {formatPKR(p.savedAmount)}
            </span>
          )}
        </>
      )}
    </div>
  );
}

export function SaleBadge({ product, className }: { product: Priceable; className?: string }) {
  const now = useNow();
  const p = getEffectivePrice(product, now);
  if (!p.isOnSale) return null;
  return (
    <span className={cn("bg-maroon px-2.5 py-1 text-[0.625rem] font-semibold tracking-[0.2em] text-ivory uppercase", className)}>
      Sale −{p.savedPercent}%
    </span>
  );
}
