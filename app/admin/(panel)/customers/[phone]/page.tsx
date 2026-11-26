import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { StatusBadge } from "@/components/admin/format";
import { BlockToggle } from "@/components/admin/BlockToggle";
import { Button } from "@/components/ui/button";
import { Card, Table, Td, Th } from "@/components/ui/card";
import { requireAdmin } from "@/lib/admin/auth";
import { customerOrders, listBlockedPhones } from "@/lib/admin/queries";
import { formatDate, formatPKR, whatsappLink } from "@/lib/utils";
import { displayPkPhone } from "@/lib/validation/phone";

export const metadata = { title: "Customer" };

export default async function CustomerPage(props: PageProps<"/admin/customers/[phone]">) {
  await requireAdmin();
  const phone = decodeURIComponent((await props.params).phone);
  const [orders, blocked] = await Promise.all([customerOrders(phone), listBlockedPhones()]);
  if (!orders.length) notFound();
  const isBlocked = blocked.some((b) => b.phone === phone);
  const spent = orders.filter((o) => o.status !== "cancelled" && o.status !== "returned").reduce((n, o) => n + Number(o.total), 0);
  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Button asChild variant="ghost" size="icon"><Link href="/admin/customers" aria-label="Back"><ArrowLeft /></Link></Button>
          <div>
            <h1 className="font-serif text-3xl font-light">{orders[0].customer_name}</h1>
            <p className="text-sm text-muted-foreground">{displayPkPhone(phone)} · {orders[0].city} · {orders.length} orders · {formatPKR(spent)}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="brass"><a href={whatsappLink(phone, `Assalam o Alaikum ${orders[0].customer_name.split(" ")[0]}! This is Tanzaib.`)} target="_blank" rel="noreferrer">WhatsApp</a></Button>
          <BlockToggle phone={phone} blocked={isBlocked} />
        </div>
      </div>
      <Card>
        <Table>
          <thead><tr><Th>Order</Th><Th>Placed</Th><Th>Total</Th><Th>Status</Th><Th>Address</Th></tr></thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <Td><Link className="font-medium hover:underline" href={`/admin/orders/${o.id}`}>{o.order_number}</Link></Td>
                <Td className="text-xs text-muted-foreground">{formatDate(o.created_at, true)}</Td>
                <Td className="tabular-nums">{formatPKR(Number(o.total))}</Td>
                <Td><StatusBadge status={o.status} /></Td>
                <Td className="max-w-xs truncate text-xs">{o.address}, {o.city}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </>
  );
}
