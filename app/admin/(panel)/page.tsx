import Link from "next/link";
import { AlertTriangle, Clock, ShoppingBag, Wallet } from "lucide-react";
import { PageTitle } from "@/components/admin/AdminShell";
import { StatusBadge } from "@/components/admin/format";
import { Card, CardContent, CardHeader, CardTitle, EmptyState, Table, Td, Th } from "@/components/ui/card";
import { requireAdmin } from "@/lib/admin/auth";
import { dashboardStats } from "@/lib/admin/queries";
import { formatDate, formatPKR } from "@/lib/utils";
import { displayPkPhone } from "@/lib/validation/phone";

export default async function DashboardPage() {
  await requireAdmin();
  const s = await dashboardStats();
  const tiles = [
    { label: "Orders today", value: s.ordersToday, icon: ShoppingBag, href: "/admin/orders" },
    { label: "Orders this week", value: s.ordersWeek, icon: ShoppingBag, href: "/admin/orders" },
    { label: "Pending confirmation", value: s.pending, icon: Clock, href: "/admin/orders?status=pending", alert: s.pending > 0 },
    { label: "Revenue (delivered)", value: formatPKR(s.revenue), sub: `${formatPKR(s.weekRevenue)} this week · ${s.deliveredCount} orders`, icon: Wallet, href: "/admin/orders?status=delivered" },
  ];
  return (
    <>
      <PageTitle title="Dashboard" description="Your atelier at a glance." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map((t) => (
          <Link key={t.label} href={t.href} className="group">
            <Card className="h-full p-5 transition-shadow group-hover:shadow-md">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">{t.label}</p>
                <t.icon className={t.alert ? "size-4 text-[#b7791f]" : "size-4 text-muted-foreground"} strokeWidth={1.6} />
              </div>
              <p className="mt-3 font-serif text-3xl tabular-nums">{t.value}</p>
              {t.sub && <p className="mt-1 text-xs text-muted-foreground">{t.sub}</p>}
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Latest orders</CardTitle>
            <Link href="/admin/orders" className="text-xs text-muted-foreground hover:text-ink">View all</Link>
          </CardHeader>
          {s.latest.length === 0 ? (
            <EmptyState title="No orders yet" body="New Cash on Delivery orders will appear here." />
          ) : (
            <Table>
              <thead>
                <tr><Th>Order</Th><Th>Customer</Th><Th>City</Th><Th>Total</Th><Th>Status</Th><Th>Placed</Th></tr>
              </thead>
              <tbody>
                {s.latest.map((o) => (
                  <tr key={o.id} className="hover:bg-muted/50">
                    <Td><Link href={`/admin/orders/${o.id}`} className="font-medium hover:underline">{o.order_number}</Link></Td>
                    <Td><div>{o.customer_name}</div><div className="text-xs text-muted-foreground">{displayPkPhone(o.phone)}</div></Td>
                    <Td>{o.city}</Td>
                    <Td className="tabular-nums">{formatPKR(Number(o.total))}</Td>
                    <Td><StatusBadge status={o.status} /></Td>
                    <Td className="text-xs whitespace-nowrap text-muted-foreground">{formatDate(o.created_at, true)}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><AlertTriangle className="size-4 text-[#b7791f]" strokeWidth={1.6} /> Low stock (≤ 2)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {s.lowStock.length === 0 ? (
              <p className="p-5 text-sm text-muted-foreground">All sizes are well stocked.</p>
            ) : (
              <ul className="divide-y divide-border">
                {s.lowStock.map((v) => (
                  <li key={v.id} className="flex items-center justify-between px-5 py-2.5 text-sm">
                    <Link href={`/admin/products/${v.product_id}`} className="hover:underline">{v.product?.name} <span className="text-muted-foreground">· {v.size}</span></Link>
                    <span className={v.stock === 0 ? "font-medium text-destructive" : "text-[#7a5414]"}>{v.stock === 0 ? "Sold out" : `${v.stock} left`}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
