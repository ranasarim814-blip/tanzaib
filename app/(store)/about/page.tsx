import type { Metadata } from "next";
import Link from "next/link";
import { ProductImage } from "@/components/store/ProductImage";
import { PageHeader } from "@/components/store/PageHeader";
import { Reveal } from "@/components/motion/Reveal";
import { ThreadDivider } from "@/components/motion/ThreadDraw";
import { Counter } from "@/components/motion/Counter";
import { getHandworkHeadline } from "@/lib/data/catalog";

export const metadata: Metadata = {
  title: "Our Story — The Tanzaib atelier",
  description: "Tanzaib (تنزیب) is a Pakistani atelier making hand-embroidered heirlooms with master karigars.",
  alternates: { canonical: "/about" },
};

export default async function AboutPage() {
  const hours = await getHandworkHeadline();
  return (
    <>
      <PageHeader eyebrow="Our Story" title="Made slowly, to be kept" urdu="ہاتھ سے بنی، دل سے پہنی" />
      <section className="container-luxe grid items-center gap-12 pb-24 lg:grid-cols-12">
        <Reveal className="lg:col-span-6">
          <div className="relative aspect-[4/5] overflow-hidden bg-parchment">
            <ProductImage src="/dummy/noor-e-sahar/detail-1.svg" alt="Close-up of antique zardozi embroidery" fill sizes="(min-width: 1024px) 45vw, 92vw" className="object-cover" />
          </div>
        </Reveal>
        <Reveal delay={0.1} className="lg:col-span-5 lg:col-start-8">
          <p className="font-serif text-3xl leading-snug font-light">
            <em>Tanzaib</em> is an old word for the finest muslin — so fine it was said to be woven from air. We chose it because it speaks of patience.
          </p>
          <p className="mt-6 leading-relaxed text-ink/80">
            Our pieces begin in a small atelier in Lahore, where designers sketch motifs drawn from Mughal jaalis, garden tiles and the trunks of family heirlooms. Each design is traced onto fabric by hand and stretched on the wooden adda, where master karigars spend days — sometimes months — stitching zardozi, tilla, dabka and resham.
          </p>
          <p className="mt-4 leading-relaxed text-ink/80">
            We make in small numbers, pay our artisans fairly, and finish every piece by hand. Nothing is printed to look embroidered. Nothing is rushed.
          </p>
          <div className="mt-10 grid grid-cols-2 gap-6 border-t border-line pt-8">
            <div>
              <Counter to={hours} suffix="+" className="display text-5xl text-brass-deep" />
              <p className="mt-1 text-xs tracking-wide text-taupe">hours of hand work per piece</p>
            </div>
            <div>
              <Counter to={40} suffix="+" className="display text-5xl text-brass-deep" />
              <p className="mt-1 text-xs tracking-wide text-taupe">karigars in our circle</p>
            </div>
          </div>
        </Reveal>
      </section>
      <ThreadDivider />
      <section className="container-luxe max-w-3xl py-20 text-center">
        <p className="eyebrow text-brass-deep">Our promise</p>
        <p className="display mt-6 text-4xl leading-tight sm:text-5xl">
          “An heirloom is not bought. It is made, worn, loved — and passed on.”
        </p>
        <Link href="/shop" className="btn btn-outline mt-12">Explore the collection</Link>
      </section>
    </>
  );
}
