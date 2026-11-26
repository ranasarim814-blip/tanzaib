import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Gallery } from "@/components/store/product/Gallery";
import { ProductPurchase } from "@/components/store/product/ProductPurchase";
import { ProductAccordions } from "@/components/store/product/Accordions";
import { ProductCard } from "@/components/store/ProductCard";
import { ThreadDivider } from "@/components/motion/ThreadDraw";
import {
  getProductBySlug,
  getPublishedProducts,
  getRelatedProducts,
  getRenderTime,
  getSettings,
} from "@/lib/data/catalog";
import { JsonLd, breadcrumbJsonLd, productJsonLd } from "@/lib/seo";
import { siteUrl, titleCase } from "@/lib/utils";
import { t } from "@/lib/i18n";

export async function generateStaticParams() {
  const products = await getPublishedProducts();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(props: PageProps<"/product/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const p = await getProductBySlug(slug);
  if (!p) return { title: "Piece not found" };
  const front = p.images.find((i) => i.kind === "front") ?? p.images[0];
  return {
    title: p.seo_title ?? `${p.name} — ${p.category?.name ?? "Tanzaib"}`,
    description: p.seo_description ?? p.short_description ?? undefined,
    alternates: { canonical: `/product/${p.slug}` },
    openGraph: {
      title: p.name,
      description: p.short_description ?? undefined,
      images: front ? [{ url: front.url, alt: front.alt ?? p.name }] : undefined,
    },
  };
}

const weeks = (days: number | null) => (days ? `${Math.max(1, Math.round(days / 7))}–${Math.max(2, Math.round(days / 7) + 1)} weeks` : null);

export default async function ProductPage(props: PageProps<"/product/[slug]">) {
  const { slug } = await props.params;
  const [p, settings, renderTime] = await Promise.all([getProductBySlug(slug), getSettings(), getRenderTime()]);
  if (!p) notFound();
  const related = await getRelatedProducts(p, 4);
  const front = p.images.find((i) => i.kind === "front") ?? p.images[0];
  const leadTime = p.is_made_to_order ? (weeks(p.lead_time_days) ?? settings.made_to_order_weeks) : null;

  const details: [string, string | null][] = [
    ["Fabric", p.fabric],
    ["Embroidery", p.embroidery_type ? titleCase(p.embroidery_type) : null],
    ["Pieces", p.pieces],
    ["Colour", p.colour],
    ["Hand work", p.handwork_hours ? `Approximately ${p.handwork_hours} hours` : null],
    ["SKU", p.sku],
  ];

  return (
    <>
      <JsonLd data={productJsonLd(p, new Date(renderTime))} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          ...(p.category ? [{ name: p.category.name, path: `/collections/${p.category.slug}` }] : []),
          { name: p.name, path: `/product/${p.slug}` },
        ])}
      />
      <div className="container-luxe pt-6 pb-20 lg:pt-10">
        <nav aria-label="Breadcrumb" className="mb-6 text-[0.65rem] tracking-[0.16em] text-taupe uppercase">
          <ol className="flex flex-wrap items-center gap-2">
            <li><Link href="/" className="hover:text-ink">Home</Link></li>
            <li aria-hidden>/</li>
            {p.category && (
              <>
                <li><Link href={`/collections/${p.category.slug}`} className="hover:text-ink">{p.category.name}</Link></li>
                <li aria-hidden>/</li>
              </>
            )}
            <li aria-current="page" className="text-ink">{p.name}</li>
          </ol>
        </nav>

        <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <Gallery slug={p.slug} name={p.name} images={p.images} />
          </div>

          <div className="lg:col-span-5">
            <p className="flex items-center gap-3 text-[0.62rem] font-semibold tracking-[0.22em] text-brass-deep uppercase">
              <span aria-hidden className="h-px w-6 bg-brass" />
              {p.category?.name} · {t.common.handEmbroidered}
            </p>
            <h1 className="display mt-4 text-5xl sm:text-6xl">{p.name}</h1>
            {p.short_description && <p className="mt-4 max-w-md text-[0.95rem] leading-relaxed text-taupe">{p.short_description}</p>}
            <div className="mt-8">
              <ProductPurchase
                whatsapp={settings.whatsapp_number}
                url={siteUrl(`/product/${p.slug}`)}
                product={{
                  id: p.id,
                  slug: p.slug,
                  name: p.name,
                  sku: p.sku,
                  category: p.category?.name ?? null,
                  image: front?.url ?? null,
                  madeToOrder: p.is_made_to_order,
                  leadTime,
                  allowCustom: p.allow_custom_stitching,
                  variants: p.variants.map((v) => ({ size: v.size, stock: v.stock })),
                  price: p.price,
                  discount_type: p.discount_type,
                  discount_value: p.discount_value,
                  discount_starts_at: p.discount_starts_at,
                  discount_ends_at: p.discount_ends_at,
                }}
              />
            </div>

            <div className="mt-12">
              <ProductAccordions
                items={[
                  {
                    id: "description",
                    title: t.product.description,
                    content: (p.description ?? p.short_description ?? "").split(/\n{2,}/).map((para, i) => (
                      <p key={i} className={i ? "mt-3" : ""}>{para}</p>
                    )),
                  },
                  {
                    id: "fabric",
                    title: t.product.fabricEmbroidery,
                    content: (
                      <dl className="grid grid-cols-[110px_1fr] gap-y-2">
                        {details.filter(([, v]) => v).map(([k, v]) => (
                          <div key={k} className="contents">
                            <dt className="text-taupe">{k}</dt>
                            <dd>{v}</dd>
                          </div>
                        ))}
                      </dl>
                    ),
                  },
                  {
                    id: "delivery",
                    title: t.product.deliveryCod,
                    content: (
                      <ul className="list-disc space-y-1.5 pl-4 marker:text-brass">
                        <li>Cash on Delivery across Pakistan — pay when your parcel arrives.</li>
                        <li>Ready-to-wear dispatches in {settings.ready_to_wear_days}; made-to-order and custom pieces in {leadTime ?? settings.made_to_order_weeks}.</li>
                        <li>Flat delivery charge of Rs. {settings.delivery_charge}; free on orders of Rs. {settings.free_delivery_threshold.toLocaleString("en-PK")} and above.</li>
                        <li>We confirm every order by phone or WhatsApp before dispatch.</li>
                      </ul>
                    ),
                  },
                  {
                    id: "care",
                    title: t.product.care,
                    content: (
                      <ul className="list-disc space-y-1.5 pl-4 marker:text-brass">
                        <li>Dry clean only. Never machine wash hand-embroidered pieces.</li>
                        <li>Iron on the reverse on low heat, with a cloth between the iron and the embroidery.</li>
                        <li>Store folded in a muslin cloth, away from damp; avoid plastic covers for zardozi and tilla.</li>
                        <li>Spray perfume before dressing, never directly on embroidery.</li>
                      </ul>
                    ),
                  },
                  {
                    id: "exchange",
                    title: t.product.exchange,
                    content: (
                      <p>
                        Ready-to-wear pieces can be exchanged for another size or piece within 7 days of delivery, unworn and with tags. Custom-stitched and made-to-order pieces are final sale. Read the full{" "}
                        <Link href="/policies/exchange" className="link-underline text-ink">exchange policy</Link>.
                      </p>
                    ),
                  },
                ]}
              />
            </div>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section aria-labelledby="related" className="container-luxe pb-28">
          <ThreadDivider />
          <h2 id="related" className="display mt-6 mb-12 text-center text-4xl sm:text-5xl">{t.product.youMayAlsoLike}</h2>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-12 lg:grid-cols-4 lg:gap-x-8">
            {related.map((r) => (
              <li key={r.id}><ProductCard product={r} /></li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
