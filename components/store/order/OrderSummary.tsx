import { ProductImage } from "@/components/store/ProductImage";
import type { CustomerOrderView } from "@/lib/orders/lookup";
import { formatDate, formatPKR } from "@/lib/utils";
import { displayPkPhone } from "@/lib/validation/phone";

export function OrderSummary({ order }: { order: CustomerOrderView }) {
  return (
    <div className="grid gap-10 md:grid-cols-2">
      <div>
        <h2 className="eyebrow text-taupe">Items</h2>
        <ul className="mt-4 divide-y divide-line border-y border-line">
          {order.items.map((it, i) => (
            <li key={i} className="flex gap-4 py-4">
              <div className="relative h-20 w-15 shrink-0 overflow-hidden bg-parchment">
                {it.image_url && <ProductImage src={it.image_url} alt="" fill sizes="60px" className="object-cover" />}
              </div>
              <div className="min-w-0 flex-1 text-sm">
                <p className="font-serif text-lg leading-tight">{it.product_name}</p>
                <p className="text-xs text-taupe">
                  {it.size === "CUSTOM" ? "Custom stitching" : `Size ${it.size}`} · Qty {it.quantity}
                </p>
              </div>
              <p className="text-sm">{formatPKR(it.line_total)}</p>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-1.5 text-sm">
          <div className="flex justify-between"><dt className="text-taupe">Subtotal</dt><dd>{formatPKR(order.subtotal)}</dd></div>
          {order.discount_total > 0 && <div className="flex justify-between text-maroon"><dt>Discount</dt><dd>−{formatPKR(order.discount_total)}</dd></div>}
          <div className="flex justify-between"><dt className="text-taupe">Delivery</dt><dd>{order.delivery_charge ? formatPKR(order.delivery_charge) : "Free"}</dd></div>
          <div className="flex justify-between border-t border-line pt-2 font-serif text-xl"><dt>Total (Cash on Delivery)</dt><dd>{formatPKR(order.total)}</dd></div>
        </dl>
      </div>
      <div>
        <h2 className="eyebrow text-taupe">Delivering to</h2>
        <address className="mt-4 text-sm leading-relaxed not-italic">
          <span className="font-serif text-lg">{order.customer_name}</span>
          <br />
          {order.address}
          <br />
          {[order.area, order.city].filter(Boolean).join(", ")}
          <br />
          {displayPkPhone(order.phone)}
        </address>
        <p className="mt-6 text-xs text-taupe">Placed {formatDate(order.created_at, true)}</p>
        {order.courier && (
          <p className="mt-2 text-sm">
            {order.courier} {order.tracking_number && <>· Tracking <span className="font-medium">{order.tracking_number}</span></>}
          </p>
        )}
      </div>
    </div>
  );
}
