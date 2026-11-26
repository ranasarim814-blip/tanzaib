import type { Priceable } from "@/lib/types";

export interface EffectivePrice {
  original: number;
  final: number;
  savedAmount: number;
  savedPercent: number;
  isOnSale: boolean;
  /** ISO date the current discount ends, if any (for JSON-LD priceValidUntil). */
  validUntil: string | null;
}

export const MAX_PERCENT_DISCOUNT = 90;

const round = (n: number) => Math.round(n);

function toTime(v: string | null | undefined): number | null {
  if (!v) return null;
  const t = new Date(v).getTime();
  return Number.isNaN(t) ? null : t;
}

/** True when the discount on `p` is active at `now` (ignores the amount). */
export function isDiscountWindowOpen(p: Priceable, now: Date): boolean {
  if (p.discount_type === "none") return false;
  const start = toTime(p.discount_starts_at);
  const end = toTime(p.discount_ends_at);
  const t = now.getTime();
  if (start !== null && t < start) return false;
  if (end !== null && t > end) return false;
  return true;
}

/**
 * The single source of truth for what a customer pays for one unit.
 * Used by cards, product page, cart, checkout, server order creation and the admin preview.
 */
export function getEffectivePrice(p: Priceable, now: Date = new Date()): EffectivePrice {
  const original = Math.max(0, round(Number(p.price) || 0));
  const value = Math.max(0, Number(p.discount_value) || 0);
  const none: EffectivePrice = {
    original,
    final: original,
    savedAmount: 0,
    savedPercent: 0,
    isOnSale: false,
    validUntil: null,
  };

  if (!isDiscountWindowOpen(p, now) || value <= 0 || original === 0) return none;

  let saved = 0;
  if (p.discount_type === "percentage") {
    const pct = Math.min(value, MAX_PERCENT_DISCOUNT);
    saved = round((original * pct) / 100);
  } else if (p.discount_type === "flat") {
    saved = round(Math.min(value, original));
  }

  if (saved <= 0) return none;
  const final = Math.max(0, original - saved);
  return {
    original,
    final,
    savedAmount: original - final,
    savedPercent: Math.round(((original - final) / original) * 100),
    isOnSale: true,
    validUntil: p.discount_ends_at ?? null,
  };
}

export interface TotalsLine {
  unitOriginal: number;
  unitFinal: number;
  quantity: number;
}

export interface DeliveryRules {
  delivery_charge: number;
  free_delivery_threshold: number;
}

export interface OrderTotals {
  subtotal: number;
  discountTotal: number;
  /** subtotal - discountTotal */
  itemsTotal: number;
  deliveryCharge: number;
  total: number;
  /** Amount still needed for free delivery (0 when already free). */
  remainingForFreeDelivery: number;
  freeDelivery: boolean;
}

/**
 * Order totals. Free delivery applies when the discounted item total reaches the
 * threshold (an order of exactly Rs. 15,000 ships free).
 */
export function computeOrderTotals(lines: TotalsLine[], rules: DeliveryRules): OrderTotals {
  let subtotal = 0;
  let itemsTotal = 0;
  for (const l of lines) {
    const q = Math.max(0, Math.floor(l.quantity));
    subtotal += l.unitOriginal * q;
    itemsTotal += l.unitFinal * q;
  }
  const discountTotal = subtotal - itemsTotal;
  const threshold = Math.max(0, rules.free_delivery_threshold);
  const freeDelivery = itemsTotal > 0 && itemsTotal >= threshold;
  const deliveryCharge = itemsTotal === 0 || freeDelivery ? 0 : Math.max(0, rules.delivery_charge);
  return {
    subtotal,
    discountTotal,
    itemsTotal,
    deliveryCharge,
    total: itemsTotal + deliveryCharge,
    remainingForFreeDelivery: freeDelivery ? 0 : Math.max(0, threshold - itemsTotal),
    freeDelivery,
  };
}
