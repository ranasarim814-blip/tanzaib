import type { Metadata } from "next";
import { PageHeader } from "@/components/store/PageHeader";
import { WishlistView } from "@/components/store/WishlistView";
import { getProductSummaries } from "@/lib/data/catalog";

export const metadata: Metadata = { title: "Wishlist", robots: { index: false } };

export default async function WishlistPage() {
  const products = await getProductSummaries();
  return (
    <>
      <PageHeader eyebrow="Saved pieces" title="Your wishlist" urdu="پسندیدہ" />
      <div className="container-luxe pb-28">
        <WishlistView products={products} />
      </div>
    </>
  );
}
