"use client";

import Link from "next/link";
import { Dialog } from "radix-ui";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { useCart } from "@/lib/store/cart";
import { useUi } from "@/lib/store/ui";
import { useHydrated } from "@/lib/hooks";
import type { DeliveryRules } from "@/lib/pricing";
import { formatPKR } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { BagLine, FreeDeliveryProgress, useBagTotals } from "./BagLines";

export function CartDrawer({ rules }: { rules: DeliveryRules }) {
  const open = useUi((s) => s.bagOpen);
  const close = useUi((s) => s.closeBag);
  const lines = useCart((s) => s.lines);
  const hydrated = useHydrated();
  const totals = useBagTotals(lines, rules);

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && close()}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-[60] bg-ink/40 backdrop-blur-[2px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount aria-describedby={undefined}>
              <motion.aside
                className="fixed inset-y-0 right-0 z-[61] flex w-full max-w-md flex-col bg-ivory shadow-2xl outline-none"
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                data-lenis-prevent
              >
                <div className="flex items-center justify-between border-b border-line px-6 py-5">
                  <Dialog.Title className="font-serif text-2xl font-light">
                    {t.bag.title} {hydrated && lines.length > 0 && <span className="text-base text-taupe">({lines.reduce((n, l) => n + l.quantity, 0)})</span>}
                  </Dialog.Title>
                  <Dialog.Close className="-mr-2 p-2" aria-label="Close bag">
                    <X className="size-5" strokeWidth={1.25} />
                  </Dialog.Close>
                </div>

                {!hydrated || lines.length === 0 ? (
                  <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
                    <p className="font-serif text-3xl font-light">{t.bag.empty}</p>
                    <p className="mt-3 text-sm text-taupe">{t.bag.emptyBody}</p>
                    <Link href="/shop" onClick={close} className="btn btn-outline mt-8">
                      {t.common.continueShopping}
                    </Link>
                  </div>
                ) : (
                  <>
                    <div className="px-6 pt-5">
                      <FreeDeliveryProgress itemsTotal={totals.itemsTotal} remaining={totals.remainingForFreeDelivery} threshold={rules.free_delivery_threshold} />
                    </div>
                    <ul className="flex-1 divide-y divide-line overflow-y-auto px-6">
                      {lines.map((l) => (
                        <BagLine key={l.key} line={l} compact onNavigate={close} />
                      ))}
                    </ul>
                    <div className="space-y-4 border-t border-line px-6 py-6">
                      <dl className="space-y-2 text-sm">
                        {totals.discountTotal > 0 && (
                          <div className="flex justify-between text-maroon">
                            <dt>{t.bag.discount}</dt>
                            <dd>−{formatPKR(totals.discountTotal)}</dd>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <dt className="text-taupe">{t.bag.delivery}</dt>
                          <dd>{totals.deliveryCharge === 0 ? t.bag.free : formatPKR(totals.deliveryCharge)}</dd>
                        </div>
                        <div className="flex justify-between font-serif text-xl">
                          <dt>{t.bag.total}</dt>
                          <dd>{formatPKR(totals.total)}</dd>
                        </div>
                      </dl>
                      <p className="text-xs text-taupe">Cash on Delivery · pay when your parcel arrives</p>
                      <div className="grid gap-3">
                        <Link href="/checkout" onClick={close} className="btn btn-ink w-full">
                          {t.bag.checkout}
                        </Link>
                        <Link href="/cart" onClick={close} className="btn btn-outline w-full">
                          {t.bag.viewBag}
                        </Link>
                      </div>
                    </div>
                  </>
                )}
              </motion.aside>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
