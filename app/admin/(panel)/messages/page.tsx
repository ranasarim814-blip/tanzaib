import { Download } from "lucide-react";
import { PageTitle } from "@/components/admin/AdminShell";
import { MessageRow } from "@/components/admin/MessageRow";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, EmptyState } from "@/components/ui/card";
import { requireAdmin } from "@/lib/admin/auth";
import { db } from "@/lib/data";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Messages & newsletter" };

export default async function MessagesPage() {
  await requireAdmin();
  const [messages, subscribers] = await Promise.all([
    db().select("contact_messages", { order: [{ column: "created_at", ascending: false }] }),
    db().select("newsletter_subscribers", { order: [{ column: "created_at", ascending: false }] }),
  ]);
  const unread = messages.filter((m) => !m.is_read).length;
  return (
    <>
      <PageTitle title="Messages & newsletter" description={`${unread} unread message(s) · ${subscribers.length} subscriber(s)`} />
      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader><CardTitle>Contact messages</CardTitle></CardHeader>
          {messages.length === 0 ? <EmptyState title="No messages yet" body="Messages from the contact page appear here." /> : (
            <ul className="divide-y divide-border">{messages.map((m) => <MessageRow key={m.id} m={m} />)}</ul>
          )}
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Newsletter</CardTitle>
            <Button size="sm" variant="outline" asChild><a href="/api/admin/export/newsletter"><Download /> CSV</a></Button>
          </CardHeader>
          {subscribers.length === 0 ? <p className="p-5 text-sm text-muted-foreground">No subscribers yet.</p> : (
            <ul className="max-h-[60vh] divide-y divide-border overflow-y-auto">
              {subscribers.map((s) => (
                <li key={s.id} className="flex justify-between px-5 py-2.5 text-sm"><span className="truncate">{s.email}</span><span className="shrink-0 text-xs text-muted-foreground">{formatDate(s.created_at)}</span></li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
