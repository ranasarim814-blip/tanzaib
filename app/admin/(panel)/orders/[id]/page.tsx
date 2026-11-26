import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { StatusBadge } from "@/components/admin/format";
import { ContactActions, OrderMetaForm, StatusChanger } from "@/components/admin/orders/OrderControls";
import { MeasurementsTable } from "@/components/admin/orders/Measurements";
import { ProductImage } from "@/components/store/ProductImage";
import { Button } from "@/components/ui/button";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/admin/auth";
import { getAdminOrder } from "@/lib/admin/queries";
import { getSettings } from "@/lib/data/catalog";
import { formatDate, formatPKR } from "@/lib/utils";
import { displayPkPhone } from "@/lib/validation/phone";

export const metadata = { title: "Order" };

export default async function AdminOrderPage(props: PageProps<"/admin/orders/[id]">) {
  await requireAdmin();
  const { id } = await props.params;
  const [data, settings] = await Promise.all([getAdminOrder(id), getSettings()]);
  if (!data) notFound();
  const { order, items, history, isBlocked, customerOrderCount } = data;
  const message = `Assalam o Alaikum ${order.customer_name.split(" ")[0]}! This is Tanzaib. Thank you for your order ${order.order_number} — ${items.map((i) => `${i.product_name} (${i.size === "CUSTOM" ? "custom" : i.size}) ×${i.quantity}`).join(", ")}. Total Rs. ${Number(order.total).toLocaleString("en-PK")} (Cash on Delivery) to ${order.address}, ${order.city}. Please reply YES to confirm your order.`;

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Button asChild variant="ghost" size="icon"><Link href="/admin/orders" aria-label="Back to orders"><ArrowLeft /></Link></Button>
          <div>
            <h1 className="flex items-center gap-3 font-serif text-3xl font-light">{order.order_number} <StatusBadge status={order.status} /></h1>
            <p className="mt-1 text-xs text-muted-foreground">Placed {formatDate(order.created_at, true)} · Cash on Delivery</p>
          </div>
        </div>
        <ContactActions orderId={order.id} phone={order.phone} whatsapp={settings.whatsapp_number} message={message} isBlocked={isBlocked} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card>
            <CardHeader><CardTitle>Items</CardTitle></CardHeader>
            <ul className="divide-y divide-border">
              {items.map((it) => (
                <li key={it.id} className="flex gap-4 px-5 py-4">
                  <span className="relative h-20 w-15 shrink-0 overflow-hidden rounded bg-muted">
                    {it.image_url && <ProductImage src={it.image_url} alt="" fill sizes="60px" className="object-cover" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{it.product_id ? <Link className="hover:underline" href={`/admin/products/${it.product_id}`}>{it.product_name}</Link> : it.product_name}</p>
                        <p className="text-xs text-muted-foreground">SKU {it.sku} · Size {it.size === "CUSTOM" ? "Custom stitching" : it.size} · Qty {it.quantity}</p>
                      </div>
                      <div className="text-right text-sm tabular-nums">
                        <p>{formatPKR(Number(it.line_total))}</p>
                        {Number(it.unit_discount) > 0 && <p className="text-xs text-muted-foreground">{formatPKR(Number(it.unit_price))} − {formatPKR(Number(it.unit_discount))} each</p>}
                      </div>
                    </div>
                    {it.custom_measurements && <MeasurementsTable m={it.custom_measurements} />}
                  </div>
                </li>
              ))}
            </ul>
            <CardContent className="border-t border-border">
              <dl className="ml-auto max-w-xs space-y-1.5 text-sm">
                <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd className="tabular-nums">{formatPKR(Number(order.subtotal))}</dd></div>
                {Number(order.discount_total) > 0 && <div className="flex justify-between"><dt className="text-muted-foreground">Discount</dt><dd className="tabular-nums text-destructive">−{formatPKR(Number(order.discount_total))}</dd></div>}
                <div className="flex justify-between"><dt className="text-muted-foreground">Delivery</dt><dd className="tabular-nums">{Number(order.delivery_charge) ? formatPKR(Number(order.delivery_charge)) : "Free"}</dd></div>
                <div className="flex justify-between border-t border-border pt-2 font-semibold"><dt>COD total</dt><dd className="tabular-nums">{formatPKR(Number(order.total))}</dd></div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Status history</CardTitle></CardHeader>
            <CardContent>
              <ol className="space-y-4">
                {history.map((h) => (
                  <li key={h.id} className="flex gap-3 text-sm">
                    <span className="mt-1.5 size-2 shrink-0 rounded-full bg-brass" aria-hidden />
                    <div>
                      <p><StatusBadge status={h.status} /> <span className="ml-1 text-xs text-muted-foreground">{formatDate(h.created_at, true)}{h.changed_by ? ` · ${h.changed_by}` : ""}</span></p>
                      {h.note && <p className="mt-1 text-muted-foreground">{h.note}</p>}
                    </div>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
              {isBlocked && <Badge variant="danger">Blocked</Badge>}
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p className="font-medium">{order.customer_name}</p>
              <p><a href={`tel:${order.phone}`} className="hover:underline">{displayPkPhone(order.phone)}</a>{order.alt_phone && <span className="text-muted-foreground"> · alt {displayPkPhone(order.alt_phone)}</span>}</p>
              {order.email && <p className="text-muted-foreground">{order.email}</p>}
              <p className="pt-2">{order.address}</p>
              <p>{[order.area, order.city, order.postal_code].filter(Boolean).join(", ")}</p>
              {order.notes && <p className="mt-3 rounded-md bg-muted p-2 text-xs"><span className="font-medium">Customer note:</span> {order.notes}</p>}
              <p className="pt-3 text-xs text-muted-foreground">
                <Link href={`/admin/customers/${encodeURIComponent(order.phone)}`} className="hover:underline">{customerOrderCount} order(s) from this number</Link>
              </p>
            </CardContent>
          </Card>
          <StatusChanger orderId={order.id} status={order.status} />
          <OrderMetaForm orderId={order.id} initial={{ admin_notes: order.admin_notes, courier: order.courier, tracking_number: order.tracking_number }} />
        </div>
      </div>
    </>
  );
}
