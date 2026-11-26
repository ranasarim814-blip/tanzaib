import type { Metadata } from "next";
import { ProductImage } from "@/components/store/ProductImage";
import { PageHeader } from "@/components/store/PageHeader";
import { Reveal } from "@/components/motion/Reveal";
import { LOOKS } from "@/components/store/home/Lookbook";

export const metadata: Metadata = {
  title: "Lookbook",
  description: "The Tanzaib lookbook — hand-embroidered pieces, styled.",
  alternates: { canonical: "/lookbook" },
};

export default function LookbookPage() {
  return (
    <>
      <PageHeader eyebrow="Spring Atelier" title="Lookbook" urdu="جھلکیاں" body="Placeholder looks — replace with your own photography (see README)." />
      <div className="container-luxe columns-1 gap-6 pb-28 sm:columns-2 lg:columns-3">
        {LOOKS.map((l, i) => (
          <Reveal key={l.src} delay={(i % 3) * 0.08} className="mb-6 break-inside-avoid">
            <figure>
              <div className={`relative overflow-hidden bg-parchment ${i % 3 === 1 ? "aspect-[3/4]" : "aspect-[4/5]"}`}>
                <ProductImage src={l.src} alt={l.alt} fill sizes="(min-width: 1024px) 30vw, (min-width: 640px) 46vw, 92vw" className="object-cover" />
              </div>
              <figcaption className="eyebrow mt-3 text-[0.6rem] text-taupe">Look {String(i + 1).padStart(2, "0")}</figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
    </>
  );
}
