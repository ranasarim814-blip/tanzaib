import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/products/ProductForm";
import { requireAdmin } from "@/lib/admin/auth";
import { getAdminProduct, listAllCategories } from "@/lib/admin/queries";

export const metadata = { title: "Edit product" };

export default async function EditProductPage(props: PageProps<"/admin/products/[id]">) {
  await requireAdmin();
  const { id } = await props.params;
  const [product, categories] = await Promise.all([getAdminProduct(id), listAllCategories()]);
  if (!product) notFound();
  return <ProductForm key={product.updated_at} product={product} categories={categories} />;
}
