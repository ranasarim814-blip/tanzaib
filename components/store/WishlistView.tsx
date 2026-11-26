"use client";

import Link from "next/link";
import { useWishlist } from "@/lib/store/wishlist";
import { useHydrated } from "@/lib/hooks";
import type { ProductSummary } from "@/lib/types";
import { ProductCard } from "./ProductCard";

export function WishlistView({ products }: { products: ProductSummary[] }) {
  const hydrated = useHydrated();
  const slugs = useWishlist((s) => s.slugs);
  if (!hydrated) return <div className="skeleton h-80" aria-busy />;
  const items = slugs.map((s) => products.find((p) => p.slug === s)).filter((p): p is ProductSummary => Boolean(p));
  if (!items.length) {
    return (
      <div className="flex flex-col items-center py-20 text-center">
        <p className="display text-4xl">Nothing saved yet</p>
        <p className="mt-3 max-w-sm text-sm text-taupe">Tap the heart on any piece to keep it here. Your wishlist is saved on this device.</p>
        <Link href="/shop" className="btn btn-outline mt-8">Browse the collection</Link>
      </div>
    );
  }
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-8">
      {items.map((p) => (
        <li key={p.id}><ProductCard product={p} /></li>
      ))}
    </ul>
  );
}
