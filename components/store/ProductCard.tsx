"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Heart } from "lucide-react";
import { ProductImage } from "./ProductImage";
import { PriceTag, SaleBadge } from "./PriceTag";
import { useWishlist } from "@/lib/store/wishlist";
import { addToBag } from "@/lib/store/add-to-bag";
import { useHydrated } from "@/lib/hooks";
import type { ProductSummary } from "@/lib/types";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";

export function ProductCard({ product, priority = false, sizes = "(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 46vw" }: { product: ProductSummary; priority?: boolean; sizes?: string }) {
  const hydrated = useHydrated();
  const wished = useWishlist((s) => s.slugs.includes(product.slug));
  const toggle = useWishlist((s) => s.toggle);
  const imgRef = useRef<HTMLDivElement>(null);
  const [quickOpen, setQuickOpen] = useState(false);

  const standard = product.sizes.filter((s) => s.size !== "CUSTOM");
  const soldOut = !product.is_made_to_order && product.totalStock <= 0;
  const quickSizes = product.is_made_to_order ? standard : standard.filter((s) => s.stock > 0);
  const lowStock = !product.is_made_to_order && product.totalStock > 0 && product.totalStock <= 2;
  const href = `/product/${product.slug}`;

  const add = (size: (typeof standard)[number]) => {
    addToBag(
      {
        id: product.id,
        slug: product.slug,
        name: product.name,
        sku: product.sku,
        image: product.front,
        category: product.category?.name ?? null,
        madeToOrder: product.is_made_to_order,
        price: product.price,
        discount_type: product.discount_type,
        discount_value: product.discount_value,
        discount_starts_at: product.discount_starts_at,
        discount_ends_at: product.discount_ends_at,
      },
      { size: size.size, quantity: 1, stock: size.stock, sourceRect: imgRef.current?.getBoundingClientRect() },
    );
    setQuickOpen(false);
  };

  return (
    <article className="group relative" onMouseLeave={() => setQuickOpen(false)}>
      <div ref={imgRef} className="relative aspect-[3/4] overflow-hidden bg-parchment shadow-[0_24px_40px_-30px_rgba(28,26,23,0.45)]">
        <Link href={href} aria-label={product.name} data-cursor="view" className="absolute inset-0 block">
          {product.front && (
            <ProductImage
              src={product.front}
              alt={product.frontAlt ?? product.name}
              fill
              sizes={sizes}
              preload={priority}
              className="object-cover transition-[opacity,transform] duration-[900ms] ease-[var(--ease-luxe)] group-hover:scale-[1.02]"
            />
          )}
          {product.back && (
            <ProductImage
              src={product.back}
              alt=""
              aria-hidden
              fill
              sizes={sizes}
              className="object-cover opacity-0 transition-opacity duration-[900ms] ease-[var(--ease-luxe)] group-hover:opacity-100"
            />
          )}
        </Link>

        <div className="pointer-events-none absolute top-3 left-3 flex flex-col items-start gap-1.5">
          <SaleBadge product={product} />
          {product.is_new_arrival && <span className="bg-ivory/90 px-2.5 py-1 text-[0.6rem] font-semibold tracking-[0.2em] uppercase">{t.common.new}</span>}
        </div>

        <button
          type="button"
          onClick={() => toggle(product.slug)}
          aria-pressed={hydrated ? wished : false}
          aria-label={hydrated && wished ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
          className="absolute top-2 right-2 grid size-10 place-items-center text-ink"
        >
          <Heart strokeWidth={1.25} className={cn("size-[18px] transition-colors", hydrated && wished && "fill-maroon text-maroon")} />
        </button>

        {/* quick add */}
        {!soldOut && (
          <div
            className={cn(
              "absolute inset-x-0 bottom-0 translate-y-full bg-ivory/95 backdrop-blur transition-transform duration-500 ease-[var(--ease-luxe)]",
              "group-focus-within:translate-y-0 group-hover:translate-y-0 max-lg:hidden",
              quickOpen && "translate-y-0",
            )}
          >
            {quickOpen ? (
              <div className="p-3">
                <p className="eyebrow mb-2 text-center text-[0.58rem] text-taupe">Choose size</p>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {quickSizes.map((s) => (
                    <button key={s.size} type="button" onClick={() => add(s)} className="min-w-10 border border-line px-2 py-2 text-xs hover:border-ink">
                      {s.size}
                    </button>
                  ))}
                  {product.allow_custom_stitching && (
                    <Link href={`${href}#size`} className="border border-line px-2 py-2 text-xs hover:border-ink">
                      Custom
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => (quickSizes.length === 1 && !product.allow_custom_stitching ? add(quickSizes[0]) : setQuickOpen(true))}
                className="eyebrow w-full py-3.5 text-[0.62rem] hover:text-brass-deep"
              >
                + Quick add to bag
              </button>
            )}
          </div>
        )}
        {soldOut && (
          <div className="absolute inset-x-0 bottom-0 bg-ink/80 py-2.5 text-center text-[0.62rem] tracking-[0.2em] text-ivory uppercase">{t.common.soldOut}</div>
        )}
      </div>

      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-[0.6rem] font-semibold tracking-[0.2em] text-brass-deep uppercase">
            <span aria-hidden className="inline-block h-px w-4 bg-brass" />
            {t.common.handEmbroidered}
          </p>
          <h3 className="mt-1.5 truncate font-serif text-[1.4rem] leading-tight">
            <Link href={href} className="hover:text-brass-deep">
              {product.name}
            </Link>
          </h3>
          <p className="mt-0.5 text-xs text-taupe">
            {product.category?.name}
            {product.is_made_to_order ? " · Made to order" : lowStock ? ` · Only ${product.totalStock} left` : ""}
          </p>
        </div>
      </div>
      <PriceTag product={product} size="sm" className="mt-2" />
    </article>
  );
}
