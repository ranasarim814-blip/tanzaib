"use client";

import { useCart } from "./cart";
import { useUi } from "./ui";
import { trackAddToCart } from "@/lib/analytics";
import { getEffectivePrice } from "@/lib/pricing";
import type { CustomMeasurements, Priceable, Size } from "@/lib/types";

export interface AddableProduct extends Priceable {
  id: string;
  slug: string;
  name: string;
  sku: string;
  image: string | null;
  category: string | null;
  madeToOrder: boolean;
}

export function addToBag(
  p: AddableProduct,
  opts: { size: Size; quantity: number; stock: number | null; measurements?: CustomMeasurements; sourceRect?: DOMRect | null },
) {
  useCart.getState().add({
    productId: p.id,
    slug: p.slug,
    name: p.name,
    sku: p.sku,
    image: p.image,
    category: p.category,
    size: opts.size,
    quantity: opts.quantity,
    maxStock: p.madeToOrder || opts.size === "CUSTOM" ? null : opts.stock,
    measurements: opts.measurements,
    madeToOrder: p.madeToOrder || opts.size === "CUSTOM",
    price: p.price,
    discount_type: p.discount_type,
    discount_value: p.discount_value,
    discount_starts_at: p.discount_starts_at,
    discount_ends_at: p.discount_ends_at,
  });
  const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (p.image && opts.sourceRect && !reduce) useUi.getState().flyToBag(p.image, opts.sourceRect);
  else useUi.getState().openBag();
  trackAddToCart({ id: p.sku, name: p.name, price: getEffectivePrice(p, new Date()).final, quantity: opts.quantity, category: p.category });
}
