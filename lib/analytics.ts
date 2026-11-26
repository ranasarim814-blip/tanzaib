"use client";

/** Env-driven analytics hooks. No-ops unless NEXT_PUBLIC_GA_ID / NEXT_PUBLIC_META_PIXEL_ID are set. */
type Item = { id: string; name: string; price: number; quantity?: number; category?: string | null };

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

export function trackViewContent(item: Item) {
  window.gtag?.("event", "view_item", { currency: "PKR", value: item.price, items: [toGa(item)] });
  window.fbq?.("track", "ViewContent", { content_ids: [item.id], content_name: item.name, value: item.price, currency: "PKR", content_type: "product" });
}

export function trackAddToCart(item: Item) {
  window.gtag?.("event", "add_to_cart", { currency: "PKR", value: item.price * (item.quantity ?? 1), items: [toGa(item)] });
  window.fbq?.("track", "AddToCart", { content_ids: [item.id], value: item.price * (item.quantity ?? 1), currency: "PKR", content_type: "product" });
}

export function trackPurchase(orderNumber: string, total: number, items: Item[]) {
  window.gtag?.("event", "purchase", { transaction_id: orderNumber, currency: "PKR", value: total, items: items.map(toGa) });
  window.fbq?.("track", "Purchase", { value: total, currency: "PKR", content_ids: items.map((i) => i.id), content_type: "product" });
}

const toGa = (i: Item) => ({ item_id: i.id, item_name: i.name, price: i.price, quantity: i.quantity ?? 1, item_category: i.category ?? undefined });
