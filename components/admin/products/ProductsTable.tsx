"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Copy, MoreHorizontal, Sparkles } from "lucide-react";
import { DropdownMenu } from "radix-ui";
import { Badge, Table, Td, Th } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox, Dialog, DialogContent } from "@/components/ui/misc";
import { Input, Label, NativeSelect } from "@/components/ui/input";
import { ProductImage } from "@/components/store/ProductImage";
import { applyBulkDiscount, deleteProducts, duplicateProduct, setProductsStatus } from "@/app/admin/actions";
import type { DiscountType, ProductStatus } from "@/lib/types";
import { formatPKR } from "@/lib/utils";

export interface ProductRow {
  id: string;
  name: string;
  sku: string;
  slug: string;
  category: string | null;
  price: number;
  final: number;
  savedPercent: number;
  isOnSale: boolean;
  discountType: DiscountType;
  discountScheduled: boolean;
  totalStock: number;
  madeToOrder: boolean;
  status: ProductStatus;
  wardrobe: boolean;
  wardrobeOrder: number;
  thumb: string | null;
}

const STATUS_BADGE = { published: "success", draft: "warning", archived: "default" } as const;

export function ProductsTable({ rows }: { rows: ProductRow[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [pending, start] = useTransition();
  const [discountOpen, setDiscountOpen] = useState(false);
  const [deleteIds, setDeleteIds] = useState<string[] | null>(null);
  const all = rows.length > 0 && selected.length === rows.length;

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, success: string) =>
    start(async () => {
      const res = await fn();
      if (res.ok) {
        toast.success(success);
        setSelected([]);
        router.refresh();
      } else toast.error(res.error ?? "Something went wrong");
    });

  return (
    <>
      {selected.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-b border-border bg-[#fbf3e2] px-4 py-2.5 text-sm">
          <span className="mr-2 font-medium">{selected.length} selected</span>
          <Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => setProductsStatus(selected, "published"), "Published")}>Publish</Button>
          <Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => setProductsStatus(selected, "draft"), "Moved to drafts")}>Unpublish</Button>
          <Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => setProductsStatus(selected, "archived"), "Archived")}>Archive</Button>
          <Button size="sm" variant="outline" disabled={pending} onClick={() => setDiscountOpen(true)}>Apply discount</Button>
          <Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => applyBulkDiscount({ ids: selected, discount_type: "none", discount_value: 0 }), "Discount removed")}>Remove discount</Button>
          <Button size="sm" variant="destructive" disabled={pending} onClick={() => setDeleteIds(selected)}>Delete</Button>
        </div>
      )}
      <Table>
        <thead>
          <tr>
            <Th className="w-10">
              <Checkbox
                aria-label="Select all"
                checked={all ? true : selected.length ? "indeterminate" : false}
                onCheckedChange={() => setSelected(all ? [] : rows.map((r) => r.id))}
              />
            </Th>
            <Th>Product</Th>
            <Th>SKU</Th>
            <Th>Category</Th>
            <Th>Price</Th>
            <Th>Stock</Th>
            <Th>Status</Th>
            <Th>Wardrobe</Th>
            <Th className="w-10"><span className="sr-only">Actions</span></Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="hover:bg-muted/40" data-selected={selected.includes(r.id)}>
              <Td>
                <Checkbox
                  aria-label={`Select ${r.name}`}
                  checked={selected.includes(r.id)}
                  onCheckedChange={(c) => setSelected((s) => (c ? [...s, r.id] : s.filter((x) => x !== r.id)))}
                />
              </Td>
              <Td>
                <Link href={`/admin/products/${r.id}`} className="flex items-center gap-3">
                  <span className="relative h-12 w-9 shrink-0 overflow-hidden rounded bg-muted">
                    {r.thumb && <ProductImage src={r.thumb} alt="" fill sizes="36px" className="object-cover" />}
                  </span>
                  <span className="font-medium hover:underline">{r.name}</span>
                </Link>
              </Td>
              <Td className="font-mono text-xs">{r.sku}</Td>
              <Td>{r.category ?? "—"}</Td>
              <Td className="whitespace-nowrap tabular-nums">
                {r.isOnSale ? (
                  <div className="flex items-center gap-2">
                    <span>{formatPKR(r.final)}</span>
                    <s className="text-xs text-muted-foreground">{formatPKR(r.price)}</s>
                    <Badge variant="danger">−{r.savedPercent}%</Badge>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {formatPKR(r.price)}
                    {r.discountType !== "none" && <Badge variant="default" title="Discount configured but not active right now">{r.discountScheduled ? "Scheduled" : "Expired"}</Badge>}
                  </div>
                )}
              </Td>
              <Td className="tabular-nums">
                {r.madeToOrder ? <Badge variant="info">Made to order</Badge> : <span className={r.totalStock <= 2 ? "font-medium text-destructive" : ""}>{r.totalStock}</span>}
              </Td>
              <Td><Badge variant={STATUS_BADGE[r.status]} className="capitalize">{r.status}</Badge></Td>
              <Td>{r.wardrobe ? <Badge variant="brass"><Sparkles className="size-3" /> #{r.wardrobeOrder}</Badge> : <span className="text-muted-foreground">—</span>}</Td>
              <Td>
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger className="rounded-md p-1.5 hover:bg-muted" aria-label={`Actions for ${r.name}`}>
                    <MoreHorizontal className="size-4" />
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Content align="end" className="z-50 min-w-44 rounded-md border border-border bg-white p-1 text-sm shadow-lg">
                      <DropdownMenu.Item asChild className="cursor-pointer rounded px-2 py-1.5 outline-none data-[highlighted]:bg-muted">
                        <Link href={`/admin/products/${r.id}`}>Edit</Link>
                      </DropdownMenu.Item>
                      <DropdownMenu.Item asChild className="cursor-pointer rounded px-2 py-1.5 outline-none data-[highlighted]:bg-muted">
                        <a href={`/product/${r.slug}`} target="_blank" rel="noreferrer">View in store</a>
                      </DropdownMenu.Item>
                      <DropdownMenu.Item
                        className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 outline-none data-[highlighted]:bg-muted"
                        onSelect={() =>
                          start(async () => {
                            const res = await duplicateProduct(r.id);
                            if (res.ok) {
                              toast.success("Duplicated as a draft");
                              router.push(`/admin/products/${res.data.id}`);
                            } else toast.error(res.error);
                          })
                        }
                      >
                        <Copy className="size-3.5" /> Duplicate
                      </DropdownMenu.Item>
                      <DropdownMenu.Item className="cursor-pointer rounded px-2 py-1.5 outline-none data-[highlighted]:bg-muted" onSelect={() => run(() => setProductsStatus([r.id], r.status === "archived" ? "draft" : "archived"), r.status === "archived" ? "Restored to drafts" : "Archived")}>
                        {r.status === "archived" ? "Unarchive" : "Archive"}
                      </DropdownMenu.Item>
                      <DropdownMenu.Separator className="my-1 h-px bg-border" />
                      <DropdownMenu.Item className="cursor-pointer rounded px-2 py-1.5 text-destructive outline-none data-[highlighted]:bg-[#f8e3e1]" onSelect={() => setDeleteIds([r.id])}>
                        Delete permanently
                      </DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu.Root>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>

      <BulkDiscountDialog open={discountOpen} onOpenChange={setDiscountOpen} ids={selected} onDone={() => { setSelected([]); router.refresh(); }} />

      <Dialog open={deleteIds !== null} onOpenChange={(o) => !o && setDeleteIds(null)}>
        <DialogContent title={`Delete ${deleteIds?.length === 1 ? "this product" : `${deleteIds?.length} products`} permanently?`} description="This removes the product, its sizes and its images from storage. Past orders keep their item names. This cannot be undone — consider archiving instead.">
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteIds(null)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={pending}
              onClick={() => {
                const ids = deleteIds ?? [];
                setDeleteIds(null);
                run(() => deleteProducts(ids), "Deleted");
              }}
            >
              Delete permanently
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function BulkDiscountDialog({ open, onOpenChange, ids, onDone }: { open: boolean; onOpenChange: (o: boolean) => void; ids: string[]; onDone: () => void }) {
  const [type, setType] = useState<"percentage" | "flat">("percentage");
  const [value, setValue] = useState("10");
  const [starts, setStarts] = useState("");
  const [ends, setEnds] = useState("");
  const [pending, start] = useTransition();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={`Apply a discount to ${ids.length} product(s)`} description="Replaces any existing discount on the selected products.">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            start(async () => {
              const res = await applyBulkDiscount({ ids, discount_type: type, discount_value: value, discount_starts_at: starts || null, discount_ends_at: ends || null });
              if (res.ok) {
                toast.success("Discount applied");
                onOpenChange(false);
                onDone();
              } else toast.error(res.error);
            });
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="bd-type">Type</Label>
              <NativeSelect id="bd-type" value={type} onChange={(e) => setType(e.target.value as "percentage" | "flat")}>
                <option value="percentage">Percentage</option>
                <option value="flat">Flat (Rs.)</option>
              </NativeSelect>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bd-value">{type === "percentage" ? "Percent off (max 90)" : "Rupees off"}</Label>
              <Input id="bd-value" type="number" min={1} max={type === "percentage" ? 90 : undefined} value={value} onChange={(e) => setValue(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bd-start">Starts (optional)</Label>
              <Input id="bd-start" type="datetime-local" value={starts} onChange={(e) => setStarts(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bd-end">Ends (optional)</Label>
              <Input id="bd-end" type="datetime-local" value={ends} onChange={(e) => setEnds(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={pending}>Apply discount</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
