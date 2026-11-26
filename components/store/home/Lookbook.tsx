import Link from "next/link";
import { ProductImage } from "@/components/store/ProductImage";
import { Reveal } from "@/components/motion/Reveal";
import { t } from "@/lib/i18n";

export const LOOKS = Array.from({ length: 8 }, (_, i) => ({
  src: `/dummy/lookbook/look-${i + 1}.svg`,
  alt: `Tanzaib lookbook — look ${i + 1}`,
}));

export function LookbookGrid({ instagram }: { instagram: string }) {
  const looks = LOOKS.slice(0, 6);
  return (
    <section aria-labelledby="lookbook-title" className="container-luxe py-24 lg:py-32">
      <div className="mb-12 flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:items-end sm:text-left">
        <div>
          <p className="eyebrow text-brass-deep">{t.home.lookbookEyebrow}</p>
          <h2 id="lookbook-title" className="display mt-4 text-4xl sm:text-5xl">{t.home.lookbookTitle}</h2>
        </div>
        <div className="flex gap-6">
          <Link href="/lookbook" className="link-underline eyebrow text-[0.62rem]">View lookbook</Link>
          {instagram && (
            <a href={instagram} target="_blank" rel="noopener noreferrer" className="link-underline eyebrow text-[0.62rem]">Follow on Instagram</a>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-6">
        {looks.map((l, i) => (
          <Reveal key={l.src} delay={(i % 6) * 0.06} className={i % 3 === 1 ? "lg:translate-y-10" : ""}>
            <div className="relative aspect-[4/5] overflow-hidden bg-parchment">
              <ProductImage src={l.src} alt={l.alt} fill sizes="(min-width: 1024px) 16vw, 46vw" className="object-cover transition-transform duration-[1200ms] hover:scale-105" />
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
