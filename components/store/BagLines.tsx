"use client";

import Link from "next/link";
import { Minus, Plus } from "lucide-react";
import { ProductImage } from "./ProductImage";
import { useCart, type CartLine } from "@/lib/store/cart";
import { getEffectivePrice, computeOrderTotals, type DeliveryRules } from "@/lib/pricing";
import { useNow } from "@/lib/now";
import { MAX_QTY_PER_LINE } from "@/lib/validation/schemas";
import { cn, formatPKR } from "@/lib/utils";
import { t } from "@/lib/i18n";

export function BagLine({ line, compact = false, onNavigate }: { line: CartLine; compact?: boolean; onNavigate?: () => void }) {
  const now = useNow();
  const { setQuantity, remove } = useCart();
  const price = getEffectivePrice(line, now);
  const max = Math.min(MAX_QTY_PER_LINE, line.maxStock ?? MAX_QTY_PER_LINE);
  return (
    <li className="flex gap-4 py-5">
      <Link href={`/product/${line.slug}`} onClick={onNavigate} className={cn("relative shrink-0 overflow-hidden bg-parchment", compact ? "h-28 w-21" : "h-36 w-27")}>
        {line.image && <ProductImage src={line.image} alt={line.name} fill sizes="120px" className="object-cover" />}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {line.category && <p className="eyebrow text-[0.6rem] text-taupe">{line.category}</p>}
            <Link href={`/product/${line.slug}`} onClick={onNavigate} className="mt-1 block truncate font-serif text-xl leading-tight">
              {line.name}
            </Link>
            <p className="mt-1 text-xs text-taupe">
              Size: {line.size === "CUSTOM" ? "Custom stitching" : line.size}
              {line.madeToOrder || line.size === "CUSTOM" ? " · Made to order" : ""}
            </p>
          </div>
          <div className="text-right text-sm">
            <p className="font-medium">{formatPKR(price.final * line.quantity)}</p>
            {price.isOnSale && <s className="text-xs text-taupe">{formatPKR(price.original * line.quantity)}</s>}
          </div>
        </div>
        <div className="mt-auto flex items-center justify-between pt-3">
          <div className="flex items-center border border-line" role="group" aria-label={`Quantity for ${line.name}`}>
            <button type="button" className="grid size-9 place-items-center disabled:opacity-30" onClick={() => setQuantity(line.key, line.quantity - 1)} disabled={line.quantity <= 1} aria-label="Decrease quantity">
              <Minus className="size-3" strokeWidth={1.5} />
            </button>
            <span className="w-8 text-center text-sm tabular-nums" aria-live="polite">{line.quantity}</span>
            <button type="button" className="grid size-9 place-items-center disabled:opacity-30" onClick={() => setQuantity(line.key, line.quantity + 1)} disabled={line.quantity >= max} aria-label="Increase quantity">
              <Plus className="size-3" strokeWidth={1.5} />
            </button>
          </div>
          <button type="button" onClick={() => remove(line.key)} className="link-underline text-[0.65rem] tracking-[0.18em] text-taupe uppercase">
            {t.bag.remove}
          </button>
        </div>
      </div>
    </li>
  );
}

export function useBagTotals(lines: CartLine[], rules: DeliveryRules) {
  const now = useNow();
  return computeOrderTotals(
    lines.map((l) => {
      const p = getEffectivePrice(l, now);
      return { unitOriginal: p.original, unitFinal: p.final, quantity: l.quantity };
    }),
    rules,
  );
}

export function FreeDeliveryProgress({ itemsTotal, remaining, threshold }: { itemsTotal: number; remaining: number; threshold: number }) {
  if (threshold <= 0) return null;
  const pct = Math.min(100, Math.round((itemsTotal / threshold) * 100));
  return (
    <div>
      <p className="text-xs tracking-wide text-taupe">
        {remaining > 0 ? t.bag.freeDeliveryProgress(formatPKR(remaining)) : t.bag.freeDeliveryUnlocked}
      </p>
      <div className="mt-2 h-px w-full bg-line" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label="Progress to free delivery">
        <div className="h-px bg-brass transition-[width] duration-700 ease-[var(--ease-luxe)]" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
