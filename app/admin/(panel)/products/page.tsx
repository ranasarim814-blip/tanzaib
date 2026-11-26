import Link from "next/link";
import { Plus } from "lucide-react";
import { PageTitle } from "@/components/admin/AdminShell";
import { ListToolbar, Pagination } from "@/components/admin/ListToolbar";
import { ProductsTable, type ProductRow } from "@/components/admin/products/ProductsTable";
import { Button } from "@/components/ui/button";
import { Card, EmptyState } from "@/components/ui/card";
import { requireAdmin } from "@/lib/admin/auth";
import { listAdminProducts, listAllCategories, type ProductListParams } from "@/lib/admin/queries";
import { isDiscountWindowOpen } from "@/lib/pricing";

export const metadata = { title: "Products" };

export default async function AdminProductsPage(props: PageProps<"/admin/products">) {
  await requireAdmin();
  const sp = await props.searchParams;
  const str = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const params: ProductListParams = {
    q: str("q"),
    status: (str("status") as ProductListParams["status"]) ?? undefined,
    category: str("category"),
    sort: (str("sort") as ProductListParams["sort"]) ?? "newest",
    page: Number(str("page") ?? 1) || 1,
  };
  const [{ items, total, page, pages }, categories] = await Promise.all([listAdminProducts(params), listAllCategories()]);
  const now = new Date();
  const rows: ProductRow[] = items.map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    slug: p.slug,
    category: p.category?.name ?? null,
    price: p.price,
    final: p.effective.final,
    savedPercent: p.effective.savedPercent,
    isOnSale: p.effective.isOnSale,
    discountType: p.discount_type,
    discountScheduled: p.discount_type !== "none" && !isDiscountWindowOpen(p, now) && Boolean(p.discount_starts_at && new Date(p.discount_starts_at) > now),
    totalStock: p.totalStock,
    madeToOrder: p.is_made_to_order,
    status: p.status,
    wardrobe: p.show_in_wardrobe,
    wardrobeOrder: p.wardrobe_order,
    thumb: p.thumb,
  }));

  return (
    <>
      <PageTitle title="Products" description="Add, edit and organise your pieces.">
        <Button asChild>
          <Link href="/admin/products/new"><Plus /> Add product</Link>
        </Button>
      </PageTitle>
      <Card>
        <div className="border-b border-border p-4">
          <ListToolbar
            placeholder="Search name, SKU, colour…"
            filters={[
              { key: "status", label: "Status", options: [{ value: "", label: "Active (draft + published)" }, { value: "published", label: "Published" }, { value: "draft", label: "Drafts" }, { value: "archived", label: "Archived" }, { value: "all", label: "All" }] },
              { key: "category", label: "Category", options: [{ value: "", label: "All categories" }, ...categories.map((c) => ({ value: c.id, label: c.name }))] },
              { key: "sort", label: "Sort", options: [{ value: "newest", label: "Newest" }, { value: "oldest", label: "Oldest" }, { value: "name", label: "Name A–Z" }, { value: "price-asc", label: "Price ↑" }, { value: "price-desc", label: "Price ↓" }, { value: "stock", label: "Lowest stock" }] },
            ]}
          />
        </div>
        {rows.length === 0 ? (
          <EmptyState title="No products found" body="Try a different search or filter, or add your first piece.">
            <Button asChild><Link href="/admin/products/new">Add product</Link></Button>
          </EmptyState>
        ) : (
          <>
            <ProductsTable rows={rows} />
            <Pagination page={page} pages={pages} total={total} />
          </>
        )}
      </Card>
    </>
  );
}
