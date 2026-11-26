import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { GiftBox } from "@/components/store/order/GiftBox";
import { OrderSummary } from "@/components/store/order/OrderSummary";
import { getCustomerOrder } from "@/lib/orders/lookup";
import { getSettings } from "@/lib/data/catalog";
import { whatsappLink } from "@/lib/utils";
import { t } from "@/lib/i18n";

export const metadata: Metadata = { title: "Order placed", robots: { index: false, follow: false } };

export default function OrderPage(props: PageProps<"/order/[orderNumber]">) {
  return (
    <div className="container-luxe pt-12 pb-28">
      <Suspense fallback={<div className="mx-auto h-[600px] max-w-3xl skeleton" aria-busy />}>
        <OrderContent params={props.params} searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}

async function OrderContent({ params, searchParams }: { params: Promise<{ orderNumber: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [{ orderNumber }, sp] = await Promise.all([params, searchParams]);
  const token = typeof sp.t === "string" ? sp.t : "";
  const [order, settings] = await Promise.all([token ? getCustomerOrder(orderNumber, { token }) : null, getSettings()]);

  if (!order) {
    return (
      <div className="mx-auto max-w-lg py-20 text-center">
        <p className="eyebrow text-brass-deep">Order {orderNumber}</p>
        <h1 className="display mt-4 text-4xl">Let&rsquo;s find your order</h1>
        <p className="mt-4 text-sm text-taupe">For your privacy, please confirm your phone number to see the order details.</p>
        <Link href={`/track?order=${encodeURIComponent(orderNumber)}`} className="btn btn-ink mt-8">Track your order</Link>
      </div>
    );
  }

  const expected = order.madeToOrder ? settings.made_to_order_weeks : settings.ready_to_wear_days;
  const wa = whatsappLink(
    settings.whatsapp_number,
    `Assalam o Alaikum Tanzaib! I'd like to confirm my order ${order.order_number} (${order.customer_name}, ${order.city}). Total Rs. ${order.total.toLocaleString("en-PK")} — Cash on Delivery.`,
  );

  return (
    <div className="mx-auto max-w-4xl">
      <div className="text-center">
        <GiftBox name={order.customer_name} orderNumber={order.order_number} />
        <p className="eyebrow mt-8 text-brass-deep">Order {order.order_number}</p>
        <h1 className="display mt-3 text-5xl sm:text-6xl">{t.success.title}</h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-taupe">{t.success.note}</p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-ink">{t.success.confirmWhatsApp}</a>
          <Link href="/shop" className="btn btn-outline">{t.common.continueShopping}</Link>
        </div>
        <dl className="mx-auto mt-12 grid max-w-2xl grid-cols-1 divide-y divide-line border-y border-line text-sm sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <div className="py-5"><dt className="eyebrow text-[0.6rem] text-taupe">{t.success.expected}</dt><dd className="mt-2 font-serif text-xl">{expected}</dd></div>
          <div className="py-5"><dt className="eyebrow text-[0.6rem] text-taupe">Payment</dt><dd className="mt-2 font-serif text-xl">Cash on Delivery</dd></div>
          <div className="py-5"><dt className="eyebrow text-[0.6rem] text-taupe">Track anytime</dt><dd className="mt-2 font-serif text-xl"><Link className="link-underline" href={`/track?order=${order.order_number}`}>Order status</Link></dd></div>
        </dl>
      </div>
      <div className="mt-16">
        <OrderSummary order={order} />
      </div>
    </div>
  );
}
