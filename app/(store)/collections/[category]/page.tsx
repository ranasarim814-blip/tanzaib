import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ShopResults, ShopSkeleton } from "@/components/store/shop/ShopResults";
import { PageHeader } from "@/components/store/PageHeader";
import { getCategories, getCategoryBySlug } from "@/lib/data/catalog";
import { JsonLd, breadcrumbJsonLd } from "@/lib/seo";

const URDU: Record<string, string> = {
  bridal: "عروسی",
  formal: "رسمی",
  "luxury-pret": "پریٹ",
  festive: "تہوار",
  unstitched: "ان سلا",
};

export async function generateStaticParams() {
  const cats = await getCategories();
  return cats.map((c) => ({ category: c.slug }));
}

export async function generateMetadata(props: PageProps<"/collections/[category]">): Promise<Metadata> {
  const { category } = await props.params;
  const c = await getCategoryBySlug(category);
  if (!c) return { title: "Collection not found" };
  return {
    title: `${c.name} — Hand-embroidered ${c.name} Collection`,
    description: c.description ?? undefined,
    alternates: { canonical: `/collections/${c.slug}` },
    openGraph: c.cover_image ? { images: [{ url: c.cover_image }] } : undefined,
  };
}

export default async function CollectionPage(props: PageProps<"/collections/[category]">) {
  const { category } = await props.params;
  const c = await getCategoryBySlug(category);
  if (!c) notFound();
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Shop", path: "/shop" }, { name: c.name, path: `/collections/${c.slug}` }])} />
      <PageHeader eyebrow="Collection" title={c.name} urdu={URDU[c.slug]} body={c.description ?? undefined} />
      <div className="container-luxe pb-28">
        <Suspense fallback={<ShopSkeleton />}>
          <ShopResults searchParams={props.searchParams} category={c.slug} />
        </Suspense>
      </div>
    </>
  );
}
