"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { placeOrderAction, quoteBag } from "@/app/actions/store";
import type { Quote } from "@/lib/orders/service";
import { useCart } from "@/lib/store/cart";
import { useHydrated } from "@/lib/hooks";
import { checkoutFormSchema, type CheckoutFormData, type CheckoutFormInput } from "@/lib/validation/schemas";
import { ProductImage } from "@/components/store/ProductImage";
import { FreeDeliveryProgress } from "@/components/store/BagLines";
import { CityCombobox } from "./CityCombobox";
import { cn, formatPKR } from "@/lib/utils";
import { t } from "@/lib/i18n";

type FieldName = keyof CheckoutFormInput;

export function Checkout({ freeThreshold }: { freeThreshold: number }) {
  const hydrated = useHydrated();
  const router = useRouter();
  const lines = useCart((s) => s.lines);
  const clear = useCart((s) => s.clear);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoting, startQuote] = useTransition();
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const payload = useMemo(
    () => lines.map((l) => ({ productId: l.productId, size: l.size, quantity: l.quantity, measurements: l.measurements })),
    [lines],
  );

  useEffect(() => {
    if (!hydrated || payload.length === 0) return;
    startQuote(async () => setQuote(await quoteBag(payload)));
  }, [hydrated, payload]);

  const { register, handleSubmit, control, setError, formState } = useForm<CheckoutFormInput, unknown, CheckoutFormData>({
    resolver: zodResolver(checkoutFormSchema),
    mode: "onTouched",
    defaultValues: { city: "", website: "" },
  });
  const errors = formState.errors;
  const city = useWatch({ control, name: "city" });

  const onSubmit = handleSubmit(async (customer) => {
    setFormError(null);
    setSubmitting(true);
    try {
      const res = await placeOrderAction({ customer, lines: payload });
      if (res.ok) {
        try {
          sessionStorage.setItem("tanzaib-last-order", JSON.stringify({ number: res.orderNumber, total: quote?.totals.total ?? 0, items: quote?.lines.map((l) => ({ id: l.sku, name: l.name, price: l.unitFinal, quantity: l.quantity })) ?? [] }));
        } catch {}
        router.push(`/order/${res.orderNumber}?t=${res.token}`);
        clear();
        return;
      }
      setFormError(res.error);
      if (res.quote) setQuote(res.quote);
      for (const [k, msg] of Object.entries(res.fieldErrors ?? {})) {
        if (k in checkoutFormSchema.shape) setError(k as FieldName, { message: msg });
      }
      setSubmitting(false);
    } catch {
      setFormError("We couldn't reach the server. Please check your connection and try again.");
      setSubmitting(false);
    }
  });

  if (!hydrated) return <CheckoutSkeleton />;
  if (lines.length === 0 && !submitting) {
    return (
      <div className="flex flex-col items-center py-24 text-center">
        <p className="display text-4xl">{t.bag.empty}</p>
        <p className="mt-3 text-sm text-taupe">{t.bag.emptyBody}</p>
        <Link href="/shop" className="btn btn-outline mt-8">{t.common.continueShopping}</Link>
      </div>
    );
  }

  const field = (name: FieldName, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}, optional = false) => (
    <div>
      <label htmlFor={`co-${name}`} className="field-label">
        {label} {optional && <span className="normal-case tracking-normal text-taupe-light">(optional)</span>}
      </label>
      <input
        id={`co-${name}`}
        className="field"
        aria-invalid={Boolean(errors[name])}
        aria-describedby={errors[name] ? `co-${name}-err` : undefined}
        {...props}
        {...register(name)}
      />
      {errors[name] && <p id={`co-${name}-err`} className="field-error" role="alert">{errors[name]?.message as string}</p>}
    </div>
  );

  const problems = quote?.lines.filter((l) => l.problem) ?? [];
  const canSubmit = !submitting && !quoting && quote?.ok;

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-12 lg:grid-cols-12 lg:gap-16">
      <div className="space-y-12 lg:col-span-7">
        <section aria-labelledby="co-h-contact">
          <h2 id="co-h-contact" className="font-serif text-3xl font-light">1. {t.checkout.contact}</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <div className="sm:col-span-2">{field("customer_name", "Full name", { autoComplete: "name" })}</div>
            {field("phone", "Mobile number", { autoComplete: "tel", inputMode: "tel", placeholder: "03XX XXXXXXX" })}
            {field("alt_phone", "Alternate number", { autoComplete: "tel", inputMode: "tel" }, true)}
            <div className="sm:col-span-2">{field("email", "Email", { autoComplete: "email", type: "email" }, true)}</div>
          </div>
        </section>

        <section aria-labelledby="co-h-address">
          <h2 id="co-h-address" className="font-serif text-3xl font-light">2. {t.checkout.delivery}</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="co-city" className="field-label">City</label>
              <Controller
                control={control}
                name="city"
                render={({ field: f }) => (
                  <CityCombobox id="co-city" value={f.value ?? ""} onChange={f.onChange} invalid={Boolean(errors.city)} describedBy={errors.city ? "co-city-err" : undefined} />
                )}
              />
              {errors.city && <p id="co-city-err" className="field-error" role="alert">{errors.city.message}</p>}
            </div>
            {city === "Other" ? field("other_city", "Your city") : <div className="hidden sm:block" />}
            {field("area", "Area / sector", { autoComplete: "address-level3", placeholder: "e.g. DHA Phase 5, G-11/2" })}
            {field("postal_code", "Postal code", { autoComplete: "postal-code", inputMode: "numeric" }, true)}
            <div className="sm:col-span-2">{field("address", "Full address", { autoComplete: "street-address", placeholder: "House, street, block, landmark" })}</div>
            <div className="sm:col-span-2">
              <label htmlFor="co-notes" className="field-label">Order notes <span className="normal-case tracking-normal text-taupe-light">(optional)</span></label>
              <textarea id="co-notes" rows={2} className="field resize-none" placeholder="Anything we should know — gift wrapping, delivery timing…" {...register("notes")} />
            </div>
          </div>
          {/* honeypot */}
          <div aria-hidden className="absolute -left-[9999px] h-0 overflow-hidden">
            <label htmlFor="co-website">Website</label>
            <input id="co-website" tabIndex={-1} autoComplete="off" {...register("website")} />
          </div>
        </section>

        <section aria-labelledby="co-h-payment">
          <h2 id="co-h-payment" className="font-serif text-3xl font-light">3. {t.checkout.payment}</h2>
          <label className="mt-6 flex items-start gap-4 border border-ink p-5">
            <input type="radio" name="payment" checked readOnly className="mt-1 accent-[var(--ink)]" />
            <span>
              <span className="block text-sm font-semibold tracking-wide">{t.checkout.cod}</span>
              <span className="mt-1 block text-sm text-taupe">{t.checkout.codNote}. {t.checkout.confirmNote}</span>
            </span>
          </label>
        </section>
      </div>

      <aside aria-labelledby="co-h-summary" className="lg:col-span-5">
        <div className="bg-parchment p-6 sm:p-8 lg:sticky lg:top-28">
          <h2 id="co-h-summary" className="font-serif text-3xl font-light">{t.checkout.summary}</h2>
          {!quote ? (
            <div className="mt-6 space-y-4" aria-busy>
              <div className="skeleton h-20" />
              <div className="skeleton h-20" />
            </div>
          ) : (
            <>
              <ul className={cn("mt-6 divide-y divide-line transition-opacity", quoting && "opacity-60")}>
                {quote.lines.map((l, i) => (
                  <li key={`${l.productId}-${l.size}-${i}`} className="flex gap-4 py-4">
                    <div className="relative h-20 w-15 shrink-0 overflow-hidden bg-ivory">
                      {l.image && <ProductImage src={l.image} alt="" fill sizes="60px" className="object-cover" />}
                      <span className="absolute -top-0 -right-0 grid size-5 place-items-center bg-ink text-[0.6rem] text-ivory">{l.quantity}</span>
                    </div>
                    <div className="min-w-0 flex-1 text-sm">
                      <p className="font-serif text-lg leading-tight">{l.name}</p>
                      <p className="text-xs text-taupe">{l.size === "CUSTOM" ? "Custom stitching" : `Size ${l.size}`}{l.madeToOrder ? " · Made to order" : ""}</p>
                      {l.problem && <p className="mt-1 text-xs text-maroon">{l.problem}</p>}
                    </div>
                    <div className="text-right text-sm">
                      <p>{formatPKR(l.lineTotal)}</p>
                      {l.unitOriginal > l.unitFinal && <s className="text-xs text-taupe">{formatPKR(l.unitOriginal * l.quantity)}</s>}
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-2">
                <FreeDeliveryProgress itemsTotal={quote.totals.itemsTotal} remaining={quote.totals.remainingForFreeDelivery} threshold={freeThreshold} />
              </div>
              <dl className="mt-6 space-y-2 border-t border-line pt-5 text-sm">
                <div className="flex justify-between"><dt className="text-taupe">{t.bag.subtotal}</dt><dd>{formatPKR(quote.totals.subtotal)}</dd></div>
                {quote.totals.discountTotal > 0 && (
                  <div className="flex justify-between text-maroon"><dt>{t.bag.discount}</dt><dd>−{formatPKR(quote.totals.discountTotal)}</dd></div>
                )}
                <div className="flex justify-between"><dt className="text-taupe">{t.bag.delivery}</dt><dd>{quote.totals.deliveryCharge === 0 ? t.bag.free : formatPKR(quote.totals.deliveryCharge)}</dd></div>
                <div className="flex justify-between border-t border-line pt-3 font-serif text-2xl"><dt>{t.bag.total}</dt><dd>{formatPKR(quote.totals.total)}</dd></div>
              </dl>
              <p className="mt-2 text-xs text-taupe">To pay in cash on delivery.</p>
            </>
          )}

          {problems.length > 0 && (
            <p className="mt-5 border border-maroon/40 p-3 text-xs text-maroon">
              Some items need your attention. <Link href="/cart" className="underline">Update your bag</Link>.
            </p>
          )}
          {formError && <p className="mt-5 border border-maroon/40 bg-ivory p-3 text-sm text-maroon" role="alert">{formError}</p>}

          <button type="submit" disabled={!canSubmit} className="btn btn-ink mt-6 w-full">
            {submitting ? t.checkout.placing : `${t.checkout.placeOrder} · ${quote ? formatPKR(quote.totals.total) : ""}`}
          </button>
          <p className="mt-4 text-center text-xs text-taupe">
            By placing your order you agree to our <Link href="/policies/terms" className="underline">terms</Link> and{" "}
            <Link href="/policies/exchange" className="underline">exchange policy</Link>.
          </p>
        </div>
      </aside>
    </form>
  );
}

export function CheckoutSkeleton() {
  return (
    <div className="grid gap-12 lg:grid-cols-12 lg:gap-16" aria-busy aria-label="Loading checkout">
      <div className="space-y-6 lg:col-span-7">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton h-12" />
        ))}
      </div>
      <div className="skeleton h-96 lg:col-span-5" />
    </div>
  );
}
