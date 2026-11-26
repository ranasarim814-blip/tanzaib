"use client";

import { useEffect, useRef, useState } from "react";
import { Heart, Minus, Plus, Ruler } from "lucide-react";
import { PriceTag } from "@/components/store/PriceTag";
import { MeasurementsDialog } from "./MeasurementsDialog";
import { SizeChart } from "./SizeChart";
import { addToBag } from "@/lib/store/add-to-bag";
import { useWishlist } from "@/lib/store/wishlist";
import { useHydrated } from "@/lib/hooks";
import { trackViewContent } from "@/lib/analytics";
import { getEffectivePrice } from "@/lib/pricing";
import type { CustomMeasurements, Priceable, Size } from "@/lib/types";
import { MAX_QTY_PER_LINE } from "@/lib/validation/schemas";
import { cn, whatsappLink } from "@/lib/utils";
import { t } from "@/lib/i18n";

export interface PurchaseProduct extends Priceable {
  id: string;
  slug: string;
  name: string;
  sku: string;
  category: string | null;
  image: string | null;
  madeToOrder: boolean;
  leadTime: string | null;
  allowCustom: boolean;
  variants: { size: Size; stock: number }[];
}

export function ProductPurchase({ product, whatsapp, url }: { product: PurchaseProduct; whatsapp: string; url: string }) {
  const hydrated = useHydrated();
  const wished = useWishlist((s) => s.slugs.includes(product.slug));
  const toggleWish = useWishlist((s) => s.toggle);
  const standard = product.variants.filter((v) => v.size !== "CUSTOM");
  const oneSize = standard.length === 1 && !product.allowCustom;
  const [size, setSize] = useState<Size | null>(oneSize ? standard[0].size : null);
  const [qty, setQty] = useState(1);
  const [measurements, setMeasurements] = useState<CustomMeasurements | undefined>();
  const [measureOpen, setMeasureOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    trackViewContent({ id: product.sku, name: product.name, price: getEffectivePrice(product, new Date()).final, category: product.category });
  }, [product]);

  const variant = product.variants.find((v) => v.size === size);
  const stock = size === "CUSTOM" || product.madeToOrder ? null : (variant?.stock ?? 0);
  const maxQty = Math.min(MAX_QTY_PER_LINE, stock ?? MAX_QTY_PER_LINE);
  const allSoldOut = !product.madeToOrder && standard.every((v) => v.stock <= 0) && !product.allowCustom;

  const choose = (s: Size) => {
    setError(null);
    setSize(s);
    setQty(1);
    if (s === "CUSTOM" && !measurements) setMeasureOpen(true);
  };

  const add = () => {
    if (!size) return setError(t.product.chooseSize);
    if (size === "CUSTOM" && !measurements) return setMeasureOpen(true);
    if (stock !== null && stock <= 0) return setError("This size is sold out.");
    addToBag(
      { id: product.id, slug: product.slug, name: product.name, sku: product.sku, image: product.image, category: product.category, madeToOrder: product.madeToOrder, price: product.price, discount_type: product.discount_type, discount_value: product.discount_value, discount_starts_at: product.discount_starts_at, discount_ends_at: product.discount_ends_at },
      { size, quantity: qty, stock, measurements: size === "CUSTOM" ? measurements : undefined, sourceRect: document.querySelector("[data-gallery-main]")?.getBoundingClientRect() ?? buttonRef.current?.getBoundingClientRect() },
    );
  };

  const waMessage = `Assalam o Alaikum Tanzaib! I'd like to order:\n${product.name} (${product.sku})${size ? `\nSize: ${size === "CUSTOM" ? "Custom stitching" : size}` : ""}\nQty: ${qty}\n${url}`;

  return (
    <div>
      <PriceTag product={product} size="lg" showSaving />
      <p className="mt-2 text-xs text-taupe">Inclusive of all taxes · Cash on Delivery</p>

      {product.madeToOrder && (
        <p className="mt-5 inline-flex items-center gap-2 border border-brass/50 px-3 py-2 text-[0.65rem] font-semibold tracking-[0.18em] text-brass-deep uppercase">
          {t.product.shipsIn(product.leadTime ?? "2–4 weeks")}
        </p>
      )}

      {/* size */}
      <fieldset id="size" className="mt-8 scroll-mt-32">
        <div className="flex items-center justify-between">
          <legend className="eyebrow text-[0.62rem]">{oneSize ? "Size · One size" : t.product.size}</legend>
          {!oneSize && <SizeChart />}
        </div>
        {!oneSize && (
          <div className="mt-4 flex flex-wrap gap-2" role="radiogroup" aria-label="Choose size">
            {standard.map((v) => {
              const out = !product.madeToOrder && v.stock <= 0;
              const on = size === v.size;
              return (
                <button
                  key={v.size}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  disabled={out}
                  onClick={() => choose(v.size)}
                  aria-label={`${v.size}${out ? ", sold out" : !product.madeToOrder && v.stock <= 2 ? `, only ${v.stock} left` : ""}`}
                  className={cn(
                    "relative min-w-13 border px-4 py-3 text-sm transition-colors",
                    on ? "border-ink bg-ink text-ivory" : "border-line hover:border-ink",
                    out && "cursor-not-allowed text-taupe-light line-through decoration-taupe-light hover:border-line",
                  )}
                >
                  {v.size}
                </button>
              );
            })}
            {product.allowCustom && (
              <button
                type="button"
                role="radio"
                aria-checked={size === "CUSTOM"}
                onClick={() => choose("CUSTOM")}
                className={cn("flex items-center gap-2 border px-4 py-3 text-sm transition-colors", size === "CUSTOM" ? "border-ink bg-ink text-ivory" : "border-line hover:border-ink")}
              >
                <Ruler className="size-4" strokeWidth={1.25} /> {t.product.customStitching}
              </button>
            )}
          </div>
        )}
        <div className="mt-3 min-h-5 text-xs" aria-live="polite">
          {error ? (
            <span className="text-maroon">{error}</span>
          ) : size === "CUSTOM" ? (
            <span className="text-taupe">
              {measurements ? "Measurements saved. " : t.product.customHelp + " "}
              <button type="button" className="link-underline text-ink" onClick={() => setMeasureOpen(true)}>
                {measurements ? "Edit measurements" : "Add measurements"}
              </button>
            </span>
          ) : stock !== null && size && stock > 0 && stock <= 2 ? (
            <span className="text-maroon">{t.common.onlyLeft(stock)}</span>
          ) : null}
        </div>
      </fieldset>

      {/* quantity + add */}
      <div className="mt-6 flex gap-3">
        <div className="flex items-center border border-line" role="group" aria-label="Quantity">
          <button type="button" className="grid h-12 w-11 place-items-center disabled:opacity-30" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} aria-label="Decrease quantity">
            <Minus className="size-3.5" strokeWidth={1.5} />
          </button>
          <span className="w-8 text-center tabular-nums" aria-live="polite">{qty}</span>
          <button type="button" className="grid h-12 w-11 place-items-center disabled:opacity-30" onClick={() => setQty((q) => Math.min(maxQty, q + 1))} disabled={qty >= maxQty} aria-label="Increase quantity">
            <Plus className="size-3.5" strokeWidth={1.5} />
          </button>
        </div>
        <button ref={buttonRef} type="button" onClick={add} disabled={allSoldOut} className="btn btn-ink flex-1">
          {allSoldOut ? t.common.soldOut : t.common.addToBag}
        </button>
        <button
          type="button"
          onClick={() => toggleWish(product.slug)}
          aria-pressed={hydrated ? wished : false}
          aria-label={hydrated && wished ? "Remove from wishlist" : "Save to wishlist"}
          className="grid size-12 shrink-0 place-items-center border border-line hover:border-ink"
        >
          <Heart className={cn("size-5", hydrated && wished && "fill-maroon text-maroon")} strokeWidth={1.25} />
        </button>
      </div>
      <a href={whatsappLink(whatsapp, waMessage)} target="_blank" rel="noopener noreferrer" className="btn btn-outline mt-3 w-full">
        {t.common.orderOnWhatsApp}
      </a>

      <MeasurementsDialog open={measureOpen} onOpenChange={setMeasureOpen} initial={measurements} onSave={setMeasurements} />
    </div>
  );
}
