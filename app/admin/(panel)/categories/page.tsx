import { PageTitle } from "@/components/admin/AdminShell";
import { CategoriesManager } from "@/components/admin/CategoriesManager";
import { requireAdmin } from "@/lib/admin/auth";
import { listAllCategories } from "@/lib/admin/queries";
import { db } from "@/lib/data";

export const metadata = { title: "Categories" };

export default async function CategoriesPage() {
  await requireAdmin();
  const [categories, products] = await Promise.all([listAllCategories(), db().select("products")]);
  const counts: Record<string, number> = {};
  for (const p of products) counts[p.category_id] = (counts[p.category_id] ?? 0) + 1;
  return (
    <>
      <PageTitle title="Categories" description="Collections shown in the navigation and shop filters." />
      <CategoriesManager categories={categories} counts={counts} />
    </>
  );
}
