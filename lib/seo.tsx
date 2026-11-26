import { BRAND } from "@/lib/config";
import { getEffectivePrice } from "@/lib/pricing";
import type { ProductWithRelations, StoreSettings } from "@/lib/types";
import { siteUrl } from "@/lib/utils";

export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify + escaping "<" prevents breaking out of the script tag
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

export function organizationJsonLd(s: StoreSettings) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: BRAND.name,
    alternateName: BRAND.urdu,
    url: siteUrl("/"),
    logo: siteUrl("/logo.svg"),
    sameAs: [s.instagram, s.facebook, s.tiktok].filter(Boolean),
    contactPoint: {
      "@type": "ContactPoint",
      telephone: s.whatsapp_number,
      contactType: "customer service",
      areaServed: "PK",
      availableLanguage: ["English", "Urdu"],
    },
  };
}

const toAbs = (u: string) => (u.startsWith("http") ? u : siteUrl(u));

export function productJsonLd(p: ProductWithRelations, now: Date) {
  const price = getEffectivePrice(p, now);
  const inStock = p.is_made_to_order || p.variants.some((v) => v.size !== "CUSTOM" && v.stock > 0);
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    sku: p.sku,
    description: p.short_description ?? p.description ?? undefined,
    image: p.images.filter((i) => i.kind !== "hanger").map((i) => toAbs(i.url)),
    brand: { "@type": "Brand", name: BRAND.name },
    category: p.category?.name,
    color: p.colour ?? undefined,
    material: p.fabric ?? undefined,
    offers: {
      "@type": "Offer",
      url: siteUrl(`/product/${p.slug}`),
      priceCurrency: "PKR",
      price: price.final,
      ...(price.isOnSale && price.validUntil ? { priceValidUntil: price.validUntil.slice(0, 10) } : {}),
      availability: p.is_made_to_order
        ? "https://schema.org/PreOrder"
        : inStock
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: BRAND.name },
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: siteUrl(it.path),
    })),
  };
}
