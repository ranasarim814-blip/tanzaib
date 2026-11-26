import type { MetadataRoute } from "next";
import { getCategories, getPublishedProducts } from "@/lib/data/catalog";
import { POLICIES } from "@/lib/content/policies";
import { siteUrl } from "@/lib/utils";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories] = await Promise.all([getPublishedProducts(), getCategories()]);
  const statics = ["/", "/shop", "/about", "/lookbook", "/contact", "/faq", "/track"].map((p) => ({
    url: siteUrl(p),
    changeFrequency: "weekly" as const,
    priority: p === "/" ? 1 : 0.6,
  }));
  return [
    ...statics,
    ...categories.map((c) => ({ url: siteUrl(`/collections/${c.slug}`), changeFrequency: "weekly" as const, priority: 0.8 })),
    ...products.map((p) => ({ url: siteUrl(`/product/${p.slug}`), lastModified: p.updated_at, changeFrequency: "weekly" as const, priority: 0.9 })),
    ...Object.keys(POLICIES).map((s) => ({ url: siteUrl(`/policies/${s}`), changeFrequency: "yearly" as const, priority: 0.2 })),
  ];
}
