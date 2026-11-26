"use client";

import { useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { trackOrderAction } from "@/app/actions/store";
import type { CustomerOrderView } from "@/lib/orders/lookup";
import { OrderSummary } from "./OrderSummary";
import { StatusTimeline } from "./StatusTimeline";

export function TrackForm() {
  const sp = useSearchParams();
  const [order, setOrder] = useState<CustomerOrderView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <div>
      <form
        className="mx-auto grid max-w-2xl gap-6 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          setError(null);
          start(async () => {
            const res = await trackOrderAction({ orderNumber: fd.get("orderNumber"), phone: fd.get("phone") });
            if (res.ok) setOrder(res.order);
            else {
              setOrder(null);
              setError(res.message);
            }
          });
        }}
      >
        <div>
          <label htmlFor="tr-order" className="field-label">Order number</label>
          <input id="tr-order" name="orderNumber" required defaultValue={sp.get("order") ?? ""} placeholder="TZ-2026-00001" className="field uppercase" autoComplete="off" />
        </div>
        <div>
          <label htmlFor="tr-phone" className="field-label">Phone used for the order</label>
          <input id="tr-phone" name="phone" required inputMode="tel" placeholder="03XX XXXXXXX" className="field" autoComplete="tel" />
        </div>
        <button type="submit" disabled={pending} className="btn btn-ink">{pending ? "Finding…" : "Track"}</button>
      </form>
      <div aria-live="polite">
        {error && <p className="mx-auto mt-6 max-w-2xl text-sm text-maroon">{error}</p>}
        {order && (
          <div className="mx-auto mt-16 grid max-w-5xl gap-14 lg:grid-cols-[minmax(0,320px)_1fr]">
            <div>
              <p className="eyebrow text-brass-deep">Order {order.order_number}</p>
              <h2 className="display mt-3 mb-8 text-4xl capitalize">{order.status === "pending" ? "Received" : order.status}</h2>
              <StatusTimeline status={order.status} history={order.history} />
            </div>
            <OrderSummary order={order} />
          </div>
        )}
      </div>
    </div>
  );
}
