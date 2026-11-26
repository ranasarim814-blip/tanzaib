"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Controller, useForm, useWatch, type FieldPath } from "react-hook-form";
import { toast } from "sonner";
import { ArrowLeft, Copy, Eye } from "lucide-react";
import { duplicateProduct, saveProduct, setProductsStatus } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, Badge } from "@/components/ui/card";
import { FieldError, Input, Label, NativeSelect, Textarea } from "@/components/ui/input";
import { Switch, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/misc";
import { ProductImage } from "@/components/store/ProductImage";
import { ImageManager, type ImageItem } from "./ImageManager";
import { getEffectivePrice } from "@/lib/pricing";
import { useNow } from "@/lib/now";
import { EMBROIDERY_TYPES, STANDARD_SIZES, type Category, type ProductWithRelations, type Size } from "@/lib/types";
import type { ProductFormInput } from "@/lib/validation/schemas";
import { cn, formatPKR, slugify, titleCase } from "@/lib/utils";

/** ISO → value for <input type="datetime-local"> in the admin's own timezone. */
function toLocalInput(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
const fromLocalInput = (v: string | null | undefined) => (v ? new Date(v).toISOString() : null);

type FormValues = Omit<ProductFormInput, "variants" | "images"> & {
  stock: Record<string, string>;
  offered: Record<string, boolean>;
};

const TAB_FIELDS: Record<string, string[]> = {
  basic: ["name", "slug", "sku", "category_id", "short_description", "description", "fabric", "embroidery_type", "pieces", "colour", "handwork_hours"],
  pricing: ["price", "discount_type", "discount_value", "discount_starts_at", "discount_ends_at"],
  images: ["images"],
  stock: ["variants", "lead_time_days"],
  visibility: ["status", "wardrobe_order"],
  seo: ["seo_title", "seo_description"],
};

export function ProductForm({ product, categories }: { product: ProductWithRelations | null; categories: Category[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [tab, setTab] = useState("basic");
  const [images, setImages] = useState<ImageItem[]>(product?.images.map((i) => ({ id: i.id, url: i.url, kind: i.kind, alt: i.alt })) ?? []);
  const [slugTouched, setSlugTouched] = useState(Boolean(product));
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});

  const variantMap = new Map(product?.variants.map((v) => [v.size, v.stock]) ?? []);
  const defaults: FormValues = {
    name: product?.name ?? "",
    slug: product?.slug ?? "",
    sku: product?.sku ?? "",
    category_id: product?.category_id ?? categories[0]?.id ?? "",
    short_description: product?.short_description ?? "",
    description: product?.description ?? "",
    fabric: product?.fabric ?? "",
    embroidery_type: product?.embroidery_type ?? null,
    pieces: product?.pieces ?? "",
    colour: product?.colour ?? "",
    handwork_hours: product?.handwork_hours ?? null,
    price: product?.price ?? 0,
    discount_type: product?.discount_type ?? "none",
    discount_value: product?.discount_value ?? 0,
    discount_starts_at: toLocalInput(product?.discount_starts_at),
    discount_ends_at: toLocalInput(product?.discount_ends_at),
    is_made_to_order: product?.is_made_to_order ?? false,
    lead_time_days: product?.lead_time_days ?? null,
    allow_custom_stitching: product?.allow_custom_stitching ?? true,
    show_in_wardrobe: product?.show_in_wardrobe ?? false,
    wardrobe_order: product?.wardrobe_order ?? 0,
    is_featured: product?.is_featured ?? false,
    is_new_arrival: product?.is_new_arrival ?? true,
    status: product?.status ?? "draft",
    seo_title: product?.seo_title ?? "",
    seo_description: product?.seo_description ?? "",
    stock: Object.fromEntries(STANDARD_SIZES.map((s) => [s, String(variantMap.get(s) ?? 0)])),
    offered: Object.fromEntries(STANDARD_SIZES.map((s) => [s, product ? variantMap.has(s) : true])),
  };

  const { register, control, handleSubmit, setValue, formState } = useForm<FormValues>({ defaultValues: defaults });
  const v = useWatch({ control }) as FormValues;
  const nowDate = useNow();
  const err = (path: string) => serverErrors[path] ?? (formState.errors as Record<string, { message?: string }>)[path]?.message;

  const preview = useMemo(
    () =>
      getEffectivePrice(
        {
          price: Number(v.price) || 0,
          discount_type: v.discount_type ?? "none",
          discount_value: Number(v.discount_value) || 0,
          discount_starts_at: fromLocalInput(v.discount_starts_at),
          discount_ends_at: fromLocalInput(v.discount_ends_at),
        },
        nowDate,
      ),
    [v.price, v.discount_type, v.discount_value, v.discount_starts_at, v.discount_ends_at, nowDate],
  );
  const discountState = (() => {
    if (v.discount_type === "none") return null;
    const now = nowDate.getTime();
    const s = v.discount_starts_at ? new Date(v.discount_starts_at).getTime() : null;
    const e = v.discount_ends_at ? new Date(v.discount_ends_at).getTime() : null;
    if (s && now < s) return { label: "Scheduled — starts later", variant: "info" as const };
    if (e && now > e) return { label: "Expired — not shown to customers", variant: "default" as const };
    return { label: "Active now", variant: "success" as const };
  })();

  const front = images.find((i) => i.kind === "front") ?? images[0];
  const category = categories.find((c) => c.id === v.category_id);

  const onSubmit = handleSubmit((values) => {
    setServerErrors({});
    const variants: { size: Size; stock: number }[] = STANDARD_SIZES.filter((s) => values.offered[s]).map((s) => ({
      size: s,
      stock: Math.max(0, Math.floor(Number(values.stock[s]) || 0)),
    }));
    if (values.allow_custom_stitching) variants.push({ size: "CUSTOM", stock: 0 });
    const payload: ProductFormInput = {
      ...values,
      discount_starts_at: fromLocalInput(values.discount_starts_at),
      discount_ends_at: fromLocalInput(values.discount_ends_at),
      embroidery_type: values.embroidery_type || null,
      handwork_hours: values.handwork_hours === null || (values.handwork_hours as unknown) === "" ? null : values.handwork_hours,
      lead_time_days: values.lead_time_days === null || (values.lead_time_days as unknown) === "" ? null : values.lead_time_days,
      variants,
      images: images.map((i) => ({ id: i.id, url: i.url, kind: i.kind, alt: i.alt })),
    };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { stock, offered, ...clean } = payload as ProductFormInput & Partial<FormValues>;
    start(async () => {
      const res = await saveProduct(product?.id ?? null, clean as ProductFormInput);
      if (res.ok) {
        toast.success(product ? "Product saved" : "Product created");
        if (!product) router.replace(`/admin/products/${res.data.id}`);
        else router.refresh();
      } else {
        toast.error(res.error);
        const fe = res.fieldErrors ?? {};
        setServerErrors(fe);
        const firstTab = Object.entries(TAB_FIELDS).find(([, fields]) => Object.keys(fe).some((k) => fields.some((f) => k === f || k.startsWith(`${f}.`))));
        if (firstTab) setTab(firstTab[0]);
      }
    });
  });

  const tabHasError = (t: string) => Object.keys(serverErrors).some((k) => TAB_FIELDS[t].some((f) => k === f || k.startsWith(`${f}.`)));

  const text = (name: FieldPath<FormValues>, label: string, props: React.ComponentProps<typeof Input> = {}, hint?: string) => (
    <div className="space-y-1.5">
      <Label htmlFor={`pf-${name}`}>{label}</Label>
      <Input id={`pf-${name}`} aria-invalid={Boolean(err(name))} {...props} {...register(name)} />
      {hint && !err(name) && <p className="text-xs text-muted-foreground">{hint}</p>}
      <FieldError>{err(name)}</FieldError>
    </div>
  );
  const toggle = (name: FieldPath<FormValues>, label: string, hint?: string) => (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <label className="flex items-start justify-between gap-4 rounded-lg border border-border p-4">
          <span>
            <span className="block text-sm font-medium">{label}</span>
            {hint && <span className="mt-0.5 block text-xs text-muted-foreground">{hint}</span>}
          </span>
          <Switch checked={Boolean(field.value)} onCheckedChange={field.onChange} />
        </label>
      )}
    />
  );

  return (
    <form onSubmit={onSubmit} noValidate>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon"><Link href="/admin/products" aria-label="Back to products"><ArrowLeft /></Link></Button>
          <div>
            <h1 className="font-serif text-3xl font-light">{product ? product.name : "New product"}</h1>
            {product && (
              <p className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant={product.status === "published" ? "success" : product.status === "draft" ? "warning" : "default"} className="capitalize">{product.status}</Badge>
                {product.sku}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {product && (
            <>
              <Button type="button" variant="outline" asChild><a href={`/product/${product.slug}`} target="_blank" rel="noreferrer"><Eye /> View</a></Button>
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    const r = await duplicateProduct(product.id);
                    if (r.ok) {
                      toast.success("Duplicated as a draft");
                      router.push(`/admin/products/${r.data.id}`);
                    } else toast.error(r.error);
                  })
                }
              >
                <Copy /> Duplicate
              </Button>
              {product.status !== "archived" && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={pending}
                  onClick={() =>
                    start(async () => {
                      const r = await setProductsStatus([product.id], "archived");
                      if (r.ok) {
                        toast.success("Archived");
                        router.refresh();
                      } else toast.error(r.error);
                    })
                  }
                >
                  Archive
                </Button>
              )}
            </>
          )}
          <Button type="submit" disabled={pending}>{pending ? "Saving…" : product ? "Save changes" : "Create product"}</Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          {[
            ["basic", "Basic"],
            ["pricing", "Pricing & Discount"],
            ["images", `Images (${images.length})`],
            ["stock", "Sizes & Stock"],
            ["visibility", "Visibility"],
            ["seo", "SEO"],
          ].map(([k, l]) => (
            <TabsTrigger key={k} value={k}>
              {l}
              {tabHasError(k) && <span className="size-1.5 rounded-full bg-destructive" aria-label="has errors" />}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ----------------------------------------------------------- basic */}
        <TabsContent value="basic">
          <Card>
            <CardContent className="grid gap-5 md:grid-cols-2">
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="pf-name">Name</Label>
                <Input
                  id="pf-name"
                  aria-invalid={Boolean(err("name"))}
                  {...register("name", { onChange: (e) => !slugTouched && setValue("slug", slugify(e.target.value)) })}
                />
                <FieldError>{err("name")}</FieldError>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pf-slug">URL slug</Label>
                <div className="flex items-center rounded-md border border-border bg-muted/50 pl-3 text-sm text-muted-foreground focus-within:border-brass">
                  /product/
                  <Input id="pf-slug" className="border-0 bg-transparent pl-1 shadow-none focus-visible:ring-0" aria-invalid={Boolean(err("slug"))} {...register("slug", { onChange: () => setSlugTouched(true) })} />
                </div>
                <FieldError>{err("slug")}</FieldError>
              </div>
              {text("sku", "SKU", { className: "font-mono uppercase" }, "Unique code, e.g. TZ-BRI-013")}
              <div className="space-y-1.5">
                <Label htmlFor="pf-category">Category</Label>
                <NativeSelect id="pf-category" {...register("category_id")}>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}{c.is_active ? "" : " (hidden)"}</option>
                  ))}
                </NativeSelect>
                <FieldError>{err("category_id")}</FieldError>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pf-emb">Embroidery type</Label>
                <NativeSelect id="pf-emb" {...register("embroidery_type")}>
                  <option value="">—</option>
                  {EMBROIDERY_TYPES.map((e) => (
                    <option key={e} value={e}>{titleCase(e)}</option>
                  ))}
                </NativeSelect>
              </div>
              {text("fabric", "Fabric", {}, "e.g. Raw silk shirt, organza dupatta")}
              {text("pieces", "Pieces", {}, "e.g. 3-Piece: Shirt, Dupatta, Trouser")}
              {text("colour", "Colour")}
              {text("handwork_hours", "Hand-work hours", { type: "number", min: 0 }, "Shown on the product page and The Craft counter")}
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="pf-short">Short description</Label>
                <Textarea id="pf-short" rows={2} maxLength={300} {...register("short_description")} />
                <FieldError>{err("short_description")}</FieldError>
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="pf-desc">Full description</Label>
                <Textarea id="pf-desc" rows={8} {...register("description")} />
                <p className="text-xs text-muted-foreground">Leave a blank line between paragraphs.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --------------------------------------------------------- pricing */}
        <TabsContent value="pricing">
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <Card>
              <CardContent className="grid gap-5 sm:grid-cols-2">
                {text("price", "Price (Rs.)", { type: "number", min: 0, step: 1 })}
                <div className="space-y-1.5">
                  <Label htmlFor="pf-dtype">Discount</Label>
                  <NativeSelect id="pf-dtype" {...register("discount_type")}>
                    <option value="none">No discount</option>
                    <option value="percentage">Percentage off</option>
                    <option value="flat">Flat amount off</option>
                  </NativeSelect>
                </div>
                {v.discount_type !== "none" && (
                  <>
                    {text("discount_value", v.discount_type === "percentage" ? "Percent off (max 90%)" : "Rupees off", { type: "number", min: 0, max: v.discount_type === "percentage" ? 90 : undefined })}
                    <div />
                    {text("discount_starts_at", "Starts (optional)", { type: "datetime-local" }, "Leave empty to start immediately")}
                    {text("discount_ends_at", "Ends (optional)", { type: "datetime-local" }, "Leave empty to run until removed")}
                  </>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Live preview</CardTitle>{discountState && <Badge variant={discountState.variant}>{discountState.label}</Badge>}</CardHeader>
              <CardContent>
                <div className="relative aspect-[3/4] overflow-hidden rounded bg-parchment">
                  {front && <ProductImage src={front.url} alt="" fill sizes="320px" className="object-cover" />}
                  {preview.isOnSale && <span className="absolute top-3 left-3 bg-maroon px-2.5 py-1 text-[0.6rem] font-semibold tracking-[0.2em] text-ivory uppercase">Sale −{preview.savedPercent}%</span>}
                </div>
                <p className="mt-3 font-serif text-xl">{v.name || "Product name"}</p>
                <p className="text-xs text-muted-foreground">{category?.name}</p>
                <div className="mt-2 flex flex-wrap items-baseline gap-x-3">
                  <span className="text-lg font-medium">{formatPKR(preview.final)}</span>
                  {preview.isOnSale && <s className="text-sm text-muted-foreground">{formatPKR(preview.original)}</s>}
                </div>
                {preview.isOnSale && <p className="mt-1 text-xs text-maroon">You save {formatPKR(preview.savedAmount)}</p>}
                <p className="mt-3 text-xs text-muted-foreground">Exactly what customers see on cards, the product page, bag and checkout.</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ---------------------------------------------------------- images */}
        <TabsContent value="images">
          <Card>
            <CardContent>
              <ImageManager value={images} onChange={setImages} slug={v.slug || ""} productName={v.name || ""} />
              <FieldError>{err("images")}</FieldError>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ----------------------------------------------------------- stock */}
        <TabsContent value="stock">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Sizes & stock</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {STANDARD_SIZES.map((s) => (
                  <div key={s} className={cn("flex items-center gap-4 rounded-md border border-border px-3 py-2", !v.offered?.[s] && "opacity-50")}>
                    <Controller control={control} name={`offered.${s}`} render={({ field }) => <Switch checked={Boolean(field.value)} onCheckedChange={field.onChange} aria-label={`Offer size ${s}`} />} />
                    <span className="w-10 font-medium">{s}</span>
                    <Input type="number" min={0} className="w-28" disabled={!v.offered?.[s] || v.is_made_to_order} aria-label={`Stock for ${s}`} {...register(`stock.${s}`)} />
                    <span className="text-xs text-muted-foreground">{v.is_made_to_order ? "made to order" : Number(v.stock?.[s]) <= 2 && v.offered?.[s] ? "low stock" : "in stock"}</span>
                  </div>
                ))}
                <p className="pt-2 text-xs text-muted-foreground">Unstitched or one-size pieces: offer a single size (e.g. M) — customers then see “One size”.</p>
              </CardContent>
            </Card>
            <div className="space-y-4">
              {toggle("allow_custom_stitching", "Allow Custom Stitching", "Customers can enter their measurements (made to order, stock not tracked).")}
              {toggle("is_made_to_order", "Made to order", "Stock isn't tracked; the product shows a lead time.")}
              {v.is_made_to_order && text("lead_time_days", "Lead time (days)", { type: "number", min: 0 }, "Shown as weeks, e.g. 21 days → 3–4 weeks")}
            </div>
          </div>
        </TabsContent>

        {/* ------------------------------------------------------ visibility */}
        <TabsContent value="visibility">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardContent className="space-y-3">
                <Label htmlFor="pf-status">Status</Label>
                <NativeSelect id="pf-status" {...register("status")}>
                  <option value="draft">Draft — hidden from the store</option>
                  <option value="published">Published — visible in the store</option>
                  <option value="archived">Archived — hidden, kept for records</option>
                </NativeSelect>
                <FieldError>{err("images")}</FieldError>
              </CardContent>
            </Card>
            <div className="space-y-4">
              {toggle("show_in_wardrobe", "Show in the Wardrobe hero", "Hangs in the almari on the homepage (best with a transparent “hanger” image).")}
              {v.show_in_wardrobe && text("wardrobe_order", "Wardrobe position", { type: "number", min: 0 }, "Lower numbers hang first (left). The first 7 are shown.")}
              {toggle("is_featured", "Featured")}
              {toggle("is_new_arrival", "New arrival", "Shown in “New Arrivals” with a New badge.")}
            </div>
          </div>
        </TabsContent>

        {/* ------------------------------------------------------------- seo */}
        <TabsContent value="seo">
          <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
            <Card>
              <CardContent className="space-y-5">
                {text("seo_title", `SEO title (${(v.seo_title ?? "").length}/70)`, { maxLength: 70, placeholder: `${v.name || "Product"} — Hand-embroidered | Tanzaib` })}
                <div className="space-y-1.5">
                  <Label htmlFor="pf-seodesc">SEO description ({(v.seo_description ?? "").length}/170)</Label>
                  <Textarea id="pf-seodesc" rows={3} maxLength={170} placeholder={v.short_description ?? ""} {...register("seo_description")} />
                </div>
              </CardContent>
            </Card>
            <Card className="overflow-hidden">
              <CardHeader><CardTitle>Share preview</CardTitle></CardHeader>
              <div className="relative aspect-[1.91/1] bg-parchment">
                {front && <ProductImage src={front.url} alt="" fill sizes="420px" className="object-cover object-top" />}
              </div>
              <div className="space-y-1 border-t border-border p-4">
                <p className="text-xs text-muted-foreground uppercase">tanzaib.pk/product/{v.slug}</p>
                <p className="line-clamp-1 font-medium">{v.seo_title || `${v.name || "Product"} | Tanzaib`}</p>
                <p className="line-clamp-2 text-sm text-muted-foreground">{v.seo_description || v.short_description}</p>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </form>
  );
}
