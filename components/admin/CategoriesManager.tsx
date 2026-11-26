"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { deleteCategory, saveCategory, uploadProductImage } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Badge, Card, Table, Td, Th } from "@/components/ui/card";
import { FieldError, Input, Label, Textarea } from "@/components/ui/input";
import { Dialog, DialogContent, Switch } from "@/components/ui/misc";
import { ProductImage } from "@/components/store/ProductImage";
import type { Category } from "@/lib/types";
import { slugify } from "@/lib/utils";

type Draft = Omit<Category, "id"> & { id: string | null };

export function CategoriesManager({ categories, counts }: { categories: Category[]; counts: Record<string, number> }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, start] = useTransition();

  const open = (c?: Category) =>
    setDraft(c ? { ...c } : { id: null, name: "", slug: "", description: "", cover_image: null, sort_order: categories.length + 1, is_active: true });

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => open()}><Plus /> Add category</Button>
      </div>
      <Card>
        <Table>
          <thead><tr><Th>Cover</Th><Th>Name</Th><Th>Slug</Th><Th>Products</Th><Th>Order</Th><Th>Visible</Th><Th /></tr></thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id}>
                <Td><span className="relative block h-12 w-9 overflow-hidden rounded bg-muted">{c.cover_image && <ProductImage src={c.cover_image} alt="" fill sizes="36px" className="object-cover" />}</span></Td>
                <Td className="font-medium">{c.name}</Td>
                <Td className="font-mono text-xs">/collections/{c.slug}</Td>
                <Td>{counts[c.id] ?? 0}</Td>
                <Td>{c.sort_order}</Td>
                <Td>{c.is_active ? <Badge variant="success">Visible</Badge> : <Badge>Hidden</Badge>}</Td>
                <Td className="text-right whitespace-nowrap">
                  <Button size="sm" variant="ghost" onClick={() => open(c)}>Edit</Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    disabled={pending}
                    onClick={() => {
                      if (!confirm(`Delete the ${c.name} category?`)) return;
                      start(async () => {
                        const r = await deleteCategory(c.id);
                        if (r.ok) {
                          toast.success("Deleted");
                          router.refresh();
                        } else toast.error(r.error);
                      });
                    }}
                  >
                    Delete
                  </Button>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>

      <Dialog open={draft !== null} onOpenChange={(o) => !o && setDraft(null)}>
        {draft && (
          <DialogContent title={draft.id ? `Edit ${draft.name}` : "New category"} className="w-[min(94vw,560px)]">
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                setErrors({});
                start(async () => {
                  const { id, ...rest } = draft;
                  const r = await saveCategory(id, rest);
                  if (r.ok) {
                    toast.success("Saved");
                    setDraft(null);
                    router.refresh();
                  } else {
                    toast.error(r.error);
                    setErrors(r.fieldErrors ?? {});
                  }
                });
              }}
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="cat-name">Name</Label>
                  <Input id="cat-name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value, slug: draft.id ? draft.slug : slugify(e.target.value) })} required />
                  <FieldError>{errors.name}</FieldError>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cat-slug">Slug</Label>
                  <Input id="cat-slug" value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} required />
                  <FieldError>{errors.slug}</FieldError>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cat-desc">Description</Label>
                <Textarea id="cat-desc" rows={2} value={draft.description ?? ""} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cat-cover">Cover image</Label>
                <div className="flex items-center gap-3">
                  <span className="relative h-16 w-12 shrink-0 overflow-hidden rounded bg-muted">{draft.cover_image && <ProductImage src={draft.cover_image} alt="" fill sizes="48px" className="object-cover" />}</span>
                  <Input
                    id="cat-cover"
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      const fd = new FormData();
                      fd.set("file", f);
                      fd.set("slug", `category-${draft.slug || "cover"}`);
                      const r = await uploadProductImage(fd);
                      if (r.ok) setDraft((d) => (d ? { ...d, cover_image: r.data.url } : d));
                      else toast.error(r.error);
                    }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 items-end gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="cat-order">Sort order</Label>
                  <Input id="cat-order" type="number" min={0} value={draft.sort_order} onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })} />
                </div>
                <label className="flex h-9 items-center gap-3 text-sm">
                  <Switch checked={draft.is_active} onCheckedChange={(v) => setDraft({ ...draft, is_active: v })} /> Visible in store
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setDraft(null)}>Cancel</Button>
                <Button type="submit" disabled={pending}>Save</Button>
              </div>
            </form>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
