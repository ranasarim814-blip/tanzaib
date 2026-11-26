"use client";

import Link from "next/link";
import { useCart } from "@/lib/store/cart";
import { useHydrated } from "@/lib/hooks";
import type { DeliveryRules } from "@/lib/pricing";
import { formatPKR } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { BagLine, FreeDeliveryProgress, useBagTotals } from "./BagLines";

export function CartView({ rules }: { rules: DeliveryRules }) {
  const hydrated = useHydrated();
  const lines = useCart((s) => s.lines);
  const totals = useBagTotals(lines, rules);
  if (!hydrated) return <div className="skeleton h-64" aria-busy />;
  if (!lines.length) {
    return (
      <div className="flex flex-col items-center border-y border-line py-24 text-center">
        <p className="display text-4xl">{t.bag.empty}</p>
        <p className="mt-3 text-sm text-taupe">{t.bag.emptyBody}</p>
        <Link href="/shop" className="btn btn-outline mt-8">{t.common.continueShopping}</Link>
      </div>
    );
  }
  return (
    <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
      <ul className="divide-y divide-line border-y border-line lg:col-span-8">
        {lines.map((l) => (
          <BagLine key={l.key} line={l} />
        ))}
      </ul>
      <aside className="lg:col-span-4">
        <div className="bg-parchment p-6 sm:p-8 lg:sticky lg:top-28">
          <FreeDeliveryProgress itemsTotal={totals.itemsTotal} remaining={totals.remainingForFreeDelivery} threshold={rules.free_delivery_threshold} />
          <dl className="mt-6 space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-taupe">{t.bag.subtotal}</dt><dd>{formatPKR(totals.subtotal)}</dd></div>
            {totals.discountTotal > 0 && <div className="flex justify-between text-maroon"><dt>{t.bag.discount}</dt><dd>−{formatPKR(totals.discountTotal)}</dd></div>}
            <div className="flex justify-between"><dt className="text-taupe">{t.bag.delivery}</dt><dd>{totals.deliveryCharge ? formatPKR(totals.deliveryCharge) : t.bag.free}</dd></div>
            <div className="flex justify-between border-t border-line pt-3 font-serif text-2xl"><dt>{t.bag.total}</dt><dd>{formatPKR(totals.total)}</dd></div>
          </dl>
          <Link href="/checkout" className="btn btn-ink mt-6 w-full">{t.bag.checkout}</Link>
          <p className="mt-4 text-center text-xs text-taupe">Cash on Delivery · pay when your parcel arrives</p>
        </div>
      </aside>
    </div>
  );
}
