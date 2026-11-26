import Link from "next/link";
import { ProductImage } from "@/components/store/ProductImage";
import { Reveal } from "@/components/motion/Reveal";
import type { Category } from "@/lib/types";
import { t } from "@/lib/i18n";

export function Collections({ categories }: { categories: Category[] }) {
  const tiles = ["bridal", "formal", "luxury-pret"]
    .map((s) => categories.find((c) => c.slug === s))
    .filter((c): c is Category => Boolean(c));
  return (
    <section aria-labelledby="collections-title" className="container-luxe py-24 lg:py-32">
      <div className="mb-14 flex flex-col items-center text-center">
        <p className="eyebrow text-brass-deep">{t.home.collectionsEyebrow}</p>
        <h2 id="collections-title" className="display mt-4 text-5xl sm:text-6xl">{t.home.collectionsTitle}</h2>
        <p lang="ur" className="urdu mt-2 text-xl text-brass-deep">{t.home.collectionsUrdu}</p>
      </div>
      <div className="grid gap-6 md:grid-cols-3 md:gap-8">
        {tiles.map((c, i) => (
          <Reveal key={c.id} delay={i * 0.12} className={i === 1 ? "md:mt-16" : ""}>
            <Link href={`/collections/${c.slug}`} className="group block" data-cursor="view">
              <div className="relative aspect-[3/4] overflow-hidden bg-parchment">
                {c.cover_image && (
                  <ProductImage
                    src={c.cover_image}
                    alt={`${c.name} collection`}
                    fill
                    sizes="(min-width: 768px) 30vw, 92vw"
                    className="object-cover transition-transform duration-[1400ms] ease-[var(--ease-luxe)] group-hover:scale-[1.04]"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-ink/55 via-transparent to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6 text-ivory">
                  <p className="eyebrow text-brass-soft">0{i + 1}</p>
                  <h3 className="display mt-2 text-4xl">{c.name}</h3>
                </div>
              </div>
              <p className="mt-4 max-w-xs text-sm text-taupe">{c.description}</p>
              <span className="link-underline eyebrow mt-3 inline-block text-[0.62rem]">Explore {c.name}</span>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
