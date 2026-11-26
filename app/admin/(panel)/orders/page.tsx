import Link from "next/link";
import { Download } from "lucide-react";
import { PageTitle } from "@/components/admin/AdminShell";
import { ListToolbar, Pagination } from "@/components/admin/ListToolbar";
import { StatusBadge } from "@/components/admin/format";
import { Button } from "@/components/ui/button";
import { Card, EmptyState, Table, Td, Th } from "@/components/ui/card";
import { requireAdmin } from "@/lib/admin/auth";
import { listAdminOrders, orderCities, type OrderListParams } from "@/lib/admin/queries";
import { ORDER_STATUSES } from "@/lib/types";
import { formatDate, formatPKR, titleCase } from "@/lib/utils";
import { displayPkPhone } from "@/lib/validation/phone";

export const metadata = { title: "Orders" };

export default async function AdminOrdersPage(props: PageProps<"/admin/orders">) {
  await requireAdmin();
  const sp = await props.searchParams;
  const str = (k: string) => (typeof sp[k] === "string" && sp[k] ? (sp[k] as string) : undefined);
  const params: OrderListParams = {
    q: str("q"),
    status: str("status") as OrderListParams["status"],
    city: str("city"),
    from: str("from"),
    to: str("to"),
    page: Number(str("page") ?? 1) || 1,
  };
  const [{ items, total, page, pages }, cities] = await Promise.all([listAdminOrders(params), orderCities()]);
  const qs = new URLSearchParams(Object.entries(params).filter(([k, v]) => v && k !== "page") as [string, string][]).toString();

  return (
    <>
      <PageTitle title="Orders" description="Cash on Delivery orders — confirm by phone/WhatsApp before dispatch.">
        <Button asChild variant="outline">
          <a href={`/api/admin/export/orders${qs ? `?${qs}` : ""}`}><Download /> Export CSV</a>
        </Button>
      </PageTitle>
      <Card>
        <div className="border-b border-border p-4">
          <ListToolbar
            placeholder="Order number, name or phone…"
            dates
            filters={[
              { key: "status", label: "Status", options: [{ value: "", label: "All statuses" }, ...ORDER_STATUSES.map((s) => ({ value: s, label: titleCase(s) }))] },
              { key: "city", label: "City", options: [{ value: "", label: "All cities" }, ...cities.map((c) => ({ value: c, label: c }))] },
            ]}
          />
        </div>
        {items.length === 0 ? (
          <EmptyState title="No orders match" body="Adjust the filters or search." />
        ) : (
          <>
            <Table>
              <thead>
                <tr><Th>Order</Th><Th>Customer</Th><Th>City</Th><Th>Total</Th><Th>Status</Th><Th>Placed</Th></tr>
              </thead>
              <tbody>
                {items.map((o) => (
                  <tr key={o.id} className="hover:bg-muted/40">
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
            <Pagination page={page} pages={pages} total={total} />
          </>
        )}
      </Card>
    </>
  );
}
