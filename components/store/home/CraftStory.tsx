"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { Counter } from "@/components/motion/Counter";
import { t } from "@/lib/i18n";
import { useMediaQuery, useReducedMotionSafe } from "@/lib/hooks";

const ART = [
  // Design: a sketch of a paisley on paper
  <svg key="d" viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="1"><rect x="30" y="20" width="140" height="160" strokeDasharray="2 4" /><path d="M100 150 C70 145 60 110 75 85 C88 63 118 66 118 88 C118 100 104 103 101 94 C109 108 120 120 110 140 C106 147 103 150 100 150 Z" /><path d="M60 170 L150 40" strokeOpacity=".4" /></svg>,
  // Tracing: dotted pattern
  <svg key="t" viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="1.2" strokeDasharray="1 5" strokeLinecap="round"><path d="M100 160 C60 150 50 100 75 75 C95 55 125 62 122 88 C120 104 102 106 100 94" /><circle cx="100" cy="100" r="70" /><path d="M30 100 H170 M100 30 V170" strokeOpacity=".5" /></svg>,
  // Adda: wooden frame with needle
  <svg key="a" viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="1"><rect x="25" y="45" width="150" height="110" /><rect x="15" y="35" width="170" height="130" strokeOpacity=".5" /><path d="M60 120 C80 90 120 90 140 120" /><path d="M70 120 C85 100 115 100 130 120" strokeDasharray="2 3" /><path d="M150 30 L110 105" strokeWidth="1.4" /><circle cx="151" cy="28" r="2.5" /></svg>,
  // Finishing: box with ribbon
  <svg key="f" viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="1"><rect x="40" y="80" width="120" height="90" /><rect x="34" y="62" width="132" height="22" /><path d="M100 62 V170" /><path d="M100 62 C80 40 65 50 75 60 C82 66 95 64 100 62 C105 64 118 66 125 60 C135 50 120 40 100 62 Z" /></svg>,
];

export function CraftStory({ hours }: { hours: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotionSafe();
  const desktop = useMediaQuery("(min-width: 1024px)", true);
  const horizontal = desktop && !reduce;
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-62%"]);
  const line = useTransform(scrollYProgress, [0, 1], [0, 1]);

  const header = (
    <div className="max-w-md lg:pr-16">
      <p className="eyebrow text-brass-soft">{t.home.craftEyebrow}</p>
      <h2 className="display mt-4 text-5xl text-ivory sm:text-6xl">{t.home.craftTitle}</h2>
      <p lang="ur" className="urdu mt-3 text-2xl text-brass-soft">{t.home.craftUrdu}</p>
      <div className="mt-10 border-t border-line-light pt-6">
        <Counter to={hours} suffix="+" className="display text-6xl text-brass-soft sm:text-7xl" />
        <p className="mt-2 text-sm tracking-wide text-ivory/60">{t.home.craftHoursLabel}</p>
      </div>
    </div>
  );

  const cards = t.craft.map((c, i) => (
    <article key={c.step} className="relative w-full shrink-0 border border-line-light p-8 lg:w-[30vw] lg:max-w-[420px] lg:p-10">
      <div className="flex items-baseline justify-between">
        <span className="font-serif text-5xl font-light text-brass-soft/80">{c.step}</span>
        <span lang="ur" className="urdu text-xl text-brass-soft/70">{c.urdu}</span>
      </div>
      <div className="my-8 h-36 text-brass-soft/70 [&>svg]:h-full [&>svg]:w-full">{ART[i]}</div>
      <h3 className="font-serif text-3xl font-light text-ivory">{c.title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-ivory/65">{c.body}</p>
    </article>
  ));

  if (!horizontal) {
    return (
      <section aria-labelledby="craft" className="bg-ink py-24 text-ivory">
        <div className="container-luxe">
          <div id="craft">{header}</div>
          <div className="no-scrollbar -mx-4 mt-14 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-4">
            {cards.map((c, i) => (
              <div key={i} className="w-[82%] shrink-0 snap-center sm:w-auto">{c}</div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section ref={ref} aria-labelledby="craft" className="relative h-[300vh] bg-ink text-ivory">
      <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden">
        <motion.div style={{ x }} className="flex items-center gap-8 pl-[max(3.5rem,calc((100vw-1440px)/2+3.5rem))]">
          <div id="craft" className="w-[420px] shrink-0">{header}</div>
          {cards}
        </motion.div>
        <div className="container-luxe mt-14">
          <div className="h-px bg-line-light">
            <motion.div className="h-px origin-left bg-brass" style={{ scaleX: line }} />
          </div>
        </div>
      </div>
    </section>
  );
}
