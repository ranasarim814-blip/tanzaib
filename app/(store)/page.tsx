import Link from "next/link";
import { Wardrobe } from "@/components/wardrobe/Wardrobe";
import { Marquee } from "@/components/store/Marquee";
import { ProductCard } from "@/components/store/ProductCard";
import { NewsletterForm } from "@/components/store/NewsletterForm";
import { Collections } from "@/components/store/home/Collections";
import { CraftStory } from "@/components/store/home/CraftStory";
import { OurPromise } from "@/components/store/home/Promise";
import { LookbookGrid } from "@/components/store/home/Lookbook";
import { ThreadDivider } from "@/components/motion/ThreadDraw";
import { Reveal } from "@/components/motion/Reveal";
import {
  getCategories,
  getHandworkHeadline,
  getProductSummaries,
  getSettings,
  getWardrobeProducts,
} from "@/lib/data/catalog";
import { t } from "@/lib/i18n";
import { organizationJsonLd, JsonLd } from "@/lib/seo";

export default async function HomePage() {
  const [settings, wardrobe, categories, products, hours] = await Promise.all([
    getSettings(),
    getWardrobeProducts(),
    getCategories(),
    getProductSummaries(),
    getHandworkHeadline(),
  ]);
  const newArrivals = [...products.filter((p) => p.is_new_arrival), ...products.filter((p) => !p.is_new_arrival)].slice(0, 8);

  return (
    <>
      <JsonLd data={organizationJsonLd(settings)} />
      <Wardrobe
        products={wardrobe}
        eyebrow={settings.hero_eyebrow}
        title={settings.hero_title}
        subtitle={settings.hero_subtitle}
      />
      <Marquee />
      <Collections categories={categories} />
      <ThreadDivider />

      <section aria-labelledby="new-arrivals" className="container-luxe py-20 lg:py-28">
        <div className="mb-12 flex items-end justify-between gap-6">
          <div>
            <p className="eyebrow text-brass-deep">{t.home.newArrivalsEyebrow}</p>
            <h2 id="new-arrivals" className="display mt-4 text-5xl sm:text-6xl">{t.home.newArrivalsTitle}</h2>
          </div>
          <Link href="/shop?sort=newest" className="link-underline eyebrow hidden text-[0.62rem] sm:inline">
            Shop all new
          </Link>
        </div>
        <ul className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-8">
          {newArrivals.map((p, i) => (
            <Reveal as="li" key={p.id} delay={(i % 4) * 0.08}>
              <ProductCard product={p} />
            </Reveal>
          ))}
        </ul>
        <div className="mt-14 text-center sm:hidden">
          <Link href="/shop" className="btn btn-outline">Shop all</Link>
        </div>
      </section>

      <CraftStory hours={hours} />
      <OurPromise />
      <LookbookGrid instagram={settings.instagram} />
      <ThreadDivider />

      <section aria-labelledby="newsletter-title" className="container-luxe pt-12 pb-28 text-center">
        <p lang="ur" className="urdu text-2xl text-brass-deep">خطوط</p>
        <h2 id="newsletter-title" className="display mt-2 text-4xl sm:text-5xl">{t.home.newsletterTitle}</h2>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-taupe">{t.home.newsletterBody}</p>
        <div className="mx-auto mt-8 max-w-md text-left">
          <NewsletterForm id="home-newsletter" />
        </div>
      </section>
    </>
  );
}
