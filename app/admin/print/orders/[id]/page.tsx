import { Suspense } from "react";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { getAdminOrder } from "@/lib/admin/queries";
import { getSettings } from "@/lib/data/catalog";
import { BRAND } from "@/lib/config";
import { formatDate, formatPKR } from "@/lib/utils";
import { displayPkPhone } from "@/lib/validation/phone";
import { PrintButton } from "@/components/admin/PrintButton";
import { MeasurementsTable } from "@/components/admin/orders/Measurements";

export const metadata = { title: "Invoice" };
export const instant = false;

export default function InvoicePage(props: PageProps<"/admin/print/orders/[id]">) {
  return (
    <Suspense fallback={null}>
      <Invoice params={props.params} />
    </Suspense>
  );
}

async function Invoice({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const [data, settings] = await Promise.all([getAdminOrder(id), getSettings()]);
  if (!data) notFound();
  const { order, items } = data;
  return (
    <div className="mx-auto max-w-3xl bg-white p-10 text-[13px] text-black print:p-0">
      <div className="no-print mb-6 flex justify-end"><PrintButton /></div>
      <header className="flex items-start justify-between border-b border-black pb-6">
        <div>
          <p className="font-serif text-3xl tracking-[0.35em]">{BRAND.wordmark}</p>
          <p className="urdu text-lg">{BRAND.urdu}</p>
          <p className="mt-1 text-xs">WhatsApp {settings.whatsapp_number}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold">INVOICE / PACKING SLIP</p>
          <p className="mt-1 font-mono text-base">{order.order_number}</p>
          <p className="text-xs">{formatDate(order.created_at, true)}</p>
          <p className="mt-2 inline-block border border-black px-2 py-0.5 text-xs font-semibold">CASH ON DELIVERY</p>
        </div>
      </header>
      <section className="grid grid-cols-2 gap-8 py-6">
        <div>
          <p className="text-xs font-semibold uppercase">Deliver to</p>
          <p className="mt-1 text-base font-semibold">{order.customer_name}</p>
          <p>{order.address}</p>
          <p>{[order.area, order.city, order.postal_code].filter(Boolean).join(", ")}</p>
          <p className="mt-1 font-semibold">{displayPkPhone(order.phone)}{order.alt_phone ? ` / ${displayPkPhone(order.alt_phone)}` : ""}</p>
        </div>
        <div className="text-right">
          {order.courier && <p>Courier: <strong>{order.courier}</strong></p>}
          {order.tracking_number && <p>Tracking: <strong>{order.tracking_number}</strong></p>}
          {order.notes && <p className="mt-2 text-xs">Note: {order.notes}</p>}
        </div>
      </section>
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-y border-black text-left text-xs uppercase">
            <th className="py-2">Item</th><th>SKU</th><th>Size</th><th className="text-right">Qty</th><th className="text-right">Unit</th><th className="text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <tr key={it.id} className="border-b border-gray-300 align-top">
              <td className="py-2 pr-2">
                {it.product_name}
                {it.custom_measurements && <MeasurementsTable m={it.custom_measurements} />}
              </td>
              <td className="font-mono text-xs">{it.sku}</td>
              <td>{it.size === "CUSTOM" ? "Custom" : it.size}</td>
              <td className="text-right">{it.quantity}</td>
              <td className="text-right">{formatPKR(Number(it.unit_price) - Number(it.unit_discount))}</td>
              <td className="text-right">{formatPKR(Number(it.line_total))}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <dl className="mt-4 ml-auto w-64 space-y-1">
        <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatPKR(Number(order.subtotal))}</dd></div>
        {Number(order.discount_total) > 0 && <div className="flex justify-between"><dt>Discount</dt><dd>−{formatPKR(Number(order.discount_total))}</dd></div>}
        <div className="flex justify-between"><dt>Delivery</dt><dd>{Number(order.delivery_charge) ? formatPKR(Number(order.delivery_charge)) : "Free"}</dd></div>
        <div className="flex justify-between border-t border-black pt-1 text-base font-semibold"><dt>Amount to collect</dt><dd>{formatPKR(Number(order.total))}</dd></div>
      </dl>
      <p className="mt-10 text-center text-xs">Shukriya for choosing {BRAND.name}. Hand-embroidered in Pakistan. Exchanges within 7 days on ready-to-wear pieces.</p>
    </div>
  );
}
