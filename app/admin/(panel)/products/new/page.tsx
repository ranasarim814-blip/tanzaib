import { ProductForm } from "@/components/admin/products/ProductForm";
import { requireAdmin } from "@/lib/admin/auth";
import { listAllCategories } from "@/lib/admin/queries";

export const metadata = { title: "New product" };

export default async function NewProductPage() {
  await requireAdmin();
  const categories = await listAllCategories();
  return <ProductForm product={null} categories={categories} />;
}
