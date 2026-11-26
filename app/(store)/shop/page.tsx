import type { Metadata } from "next";
import { Suspense } from "react";
import { ShopResults, ShopSkeleton } from "@/components/store/shop/ShopResults";
import { PageHeader } from "@/components/store/PageHeader";

export const metadata: Metadata = {
  title: "Shop All — Hand-embroidered eastern wear",
  description: "Browse every Tanzaib piece: bridal, formal, luxury pret, festive and unstitched — all hand-embroidered in Pakistan.",
  alternates: { canonical: "/shop" },
};

export default function ShopPage(props: PageProps<"/shop">) {
  return (
    <>
      <PageHeader eyebrow="The Collection" title="Shop all pieces" urdu="تمام ملبوسات" />
      <div className="container-luxe pb-28">
        <Suspense fallback={<ShopSkeleton />}>
          <ShopResults searchParams={props.searchParams} />
        </Suspense>
      </div>
    </>
  );
}
