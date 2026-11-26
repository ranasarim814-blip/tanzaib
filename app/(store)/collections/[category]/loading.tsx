import { ShopSkeleton } from "@/components/store/shop/ShopResults";

export default function LoadingCollection() {
  return (
    <div className="container-luxe pt-20 pb-28">
      <div className="mx-auto mb-16 flex max-w-md flex-col items-center gap-4">
        <div className="skeleton h-3 w-24" />
        <div className="skeleton h-16 w-64" />
      </div>
      <ShopSkeleton />
    </div>
  );
}
