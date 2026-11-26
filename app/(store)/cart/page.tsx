import type { Metadata } from "next";
import { CartView } from "@/components/store/CartView";
import { getSettings } from "@/lib/data/catalog";

export const metadata: Metadata = { title: "Your Bag", robots: { index: false } };

export default async function CartPage() {
  const s = await getSettings();
  return (
    <div className="container-luxe pt-12 pb-28">
      <h1 className="display mb-10 text-5xl sm:text-6xl">Your Bag</h1>
      <CartView rules={{ delivery_charge: s.delivery_charge, free_delivery_threshold: s.free_delivery_threshold }} />
    </div>
  );
}
