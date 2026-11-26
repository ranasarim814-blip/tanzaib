import Link from "next/link";
import { PageTitle } from "@/components/admin/AdminShell";
import { ListToolbar } from "@/components/admin/ListToolbar";
import { BlockToggle } from "@/components/admin/BlockToggle";
import { Badge, Card, EmptyState, Table, Td, Th } from "@/components/ui/card";
import { requireAdmin } from "@/lib/admin/auth";
import { listBlockedPhones, listCustomers } from "@/lib/admin/queries";
import { formatDate, formatPKR } from "@/lib/utils";
import { displayPkPhone } from "@/lib/validation/phone";

export const metadata = { title: "Customers" };

export default async function CustomersPage(props: PageProps<"/admin/customers">) {
  await requireAdmin();
  const sp = await props.searchParams;
  const q = typeof sp.q === "string" ? sp.q : undefined;
  const [rows, blocked] = await Promise.all([listCustomers(q), listBlockedPhones()]);
  const orphanBlocked = blocked.filter((b) => !rows.some((r) => r.phone === b.phone));
  return (
    <>
      <PageTitle title="Customers" description="Built from your orders — no customer accounts needed." />
      <Card>
        <div className="border-b border-border p-4"><ListToolbar placeholder="Name, phone or city…" /></div>
        {rows.length === 0 ? (
          <EmptyState title="No customers yet" />
        ) : (
          <Table>
            <thead><tr><Th>Name</Th><Th>Phone</Th><Th>City</Th><Th>Orders</Th><Th>Total spent</Th><Th>Last order</Th><Th /></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.phone} className="hover:bg-muted/40">
                  <Td><Link className="font-medium hover:underline" href={`/admin/customers/${encodeURIComponent(r.phone)}`}>{r.name}</Link> {r.blocked && <Badge variant="danger">Blocked</Badge>}</Td>
                  <Td>{displayPkPhone(r.phone)}</Td>
                  <Td>{r.city}</Td>
                  <Td className="tabular-nums">{r.orders}</Td>
                  <Td className="tabular-nums">{formatPKR(r.totalSpent)}</Td>
                  <Td className="text-xs text-muted-foreground">{formatDate(r.lastOrder)}</Td>
                  <Td><BlockToggle phone={r.phone} blocked={r.blocked} /></Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
      {orphanBlocked.length > 0 && (
        <Card className="mt-6">
          <div className="border-b border-border px-5 py-3 text-sm font-semibold">Other blocked numbers</div>
          <ul className="divide-y divide-border">
            {orphanBlocked.map((b) => (
              <li key={b.phone} className="flex items-center justify-between px-5 py-2.5 text-sm">
                <span>{displayPkPhone(b.phone)} <span className="text-muted-foreground">· {b.reason}</span></span>
                <BlockToggle phone={b.phone} blocked />
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
