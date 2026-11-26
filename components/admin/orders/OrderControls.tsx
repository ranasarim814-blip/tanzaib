"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Ban, Phone, Printer } from "lucide-react";
import { blockPhone, unblockPhone, updateOrderMeta, updateOrderStatus } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, NativeSelect, Textarea } from "@/components/ui/input";
import { Checkbox, Dialog, DialogContent } from "@/components/ui/misc";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/types";
import { titleCase, whatsappLink } from "@/lib/utils";

export function StatusChanger({ orderId, status }: { orderId: string; status: OrderStatus }) {
  const router = useRouter();
  const [next, setNext] = useState<OrderStatus>(status);
  const [note, setNote] = useState("");
  const [restock, setRestock] = useState(true);
  const [pending, start] = useTransition();
  const releasing = (next === "cancelled" || next === "returned") && status !== "cancelled" && status !== "returned";
  return (
    <Card>
      <CardHeader><CardTitle>Update status</CardTitle></CardHeader>
      <CardContent>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            start(async () => {
              const res = await updateOrderStatus(orderId, { status: next, note: note || null, restock });
              if (res.ok) {
                toast.success(`Marked as ${next}`);
                setNote("");
                router.refresh();
              } else toast.error(res.error);
            });
          }}
        >
          <NativeSelect value={next} onChange={(e) => setNext(e.target.value as OrderStatus)} aria-label="New status">
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>{titleCase(s)}</option>
            ))}
          </NativeSelect>
          <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note for the history (optional), e.g. Confirmed on call" aria-label="Status note" />
          {releasing && (
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={restock} onCheckedChange={(c) => setRestock(c === true)} /> Return items to stock
            </label>
          )}
          <Button type="submit" className="w-full" disabled={pending || next === status}>Save status</Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function OrderMetaForm({ orderId, initial }: { orderId: string; initial: { admin_notes: string | null; courier: string | null; tracking_number: string | null } }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Card>
      <CardHeader><CardTitle>Courier & notes</CardTitle></CardHeader>
      <CardContent>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            start(async () => {
              const res = await updateOrderMeta(orderId, Object.fromEntries(fd));
              if (res.ok) {
                toast.success("Saved");
                router.refresh();
              } else toast.error(res.error);
            });
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="om-courier">Courier</Label>
              <Input id="om-courier" name="courier" list="couriers" defaultValue={initial.courier ?? ""} />
              <datalist id="couriers">
                {["TCS", "Leopards", "M&P", "Trax", "PostEx", "BlueEx", "Call Courier", "Pakistan Post"].map((c) => <option key={c} value={c} />)}
              </datalist>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="om-track">Tracking number</Label>
              <Input id="om-track" name="tracking_number" defaultValue={initial.tracking_number ?? ""} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="om-notes">Admin notes (private)</Label>
            <Textarea id="om-notes" name="admin_notes" rows={3} defaultValue={initial.admin_notes ?? ""} />
          </div>
          <Button type="submit" variant="outline" className="w-full" disabled={pending}>Save</Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function ContactActions({ orderId, phone, whatsapp, message, isBlocked }: { orderId: string; phone: string; whatsapp: string; message: string; isBlocked: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("Fake / unreachable COD order");
  const [pending, start] = useTransition();
  void whatsapp;
  return (
    <div className="flex flex-wrap gap-2">
      <Button asChild variant="brass"><a href={whatsappLink(phone, message)} target="_blank" rel="noopener noreferrer">WhatsApp customer</a></Button>
      <Button asChild variant="outline"><a href={`tel:${phone}`}><Phone /> Call</a></Button>
      <Button asChild variant="outline"><a href={`/admin/print/orders/${orderId}`} target="_blank" rel="noreferrer"><Printer /> Invoice / packing slip</a></Button>
      {isBlocked ? (
        <Button
          variant="outline"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const r = await unblockPhone(phone);
              if (r.ok) {
                toast.success("Phone unblocked");
                router.refresh();
              } else toast.error(r.error);
            })
          }
        >
          Unblock phone
        </Button>
      ) : (
        <Button variant="outline" className="text-destructive" onClick={() => setOpen(true)}><Ban /> Block this phone</Button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title="Block this phone number?" description={`Future orders from ${phone} will be refused at checkout.`}>
          <div className="space-y-3">
            <Input value={reason} onChange={(e) => setReason(e.target.value)} aria-label="Reason" />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button
                variant="destructive"
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    const r = await blockPhone(phone, reason);
                    if (r.ok) {
                      toast.success("Phone blocked");
                      setOpen(false);
                      router.refresh();
                    } else toast.error(r.error);
                  })
                }
              >
                Block
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
