import type { Metadata } from "next";
import { Checkout } from "@/components/store/checkout/Checkout";
import { getSettings } from "@/lib/data/catalog";
import { t } from "@/lib/i18n";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default async function CheckoutPage() {
  const settings = await getSettings();
  return (
    <div className="container-luxe pt-12 pb-28">
      <p className="eyebrow text-brass-deep">Cash on Delivery</p>
      <h1 className="display mt-3 mb-12 text-5xl sm:text-6xl">{t.checkout.title}</h1>
      <Checkout freeThreshold={settings.free_delivery_threshold} />
    </div>
  );
}
