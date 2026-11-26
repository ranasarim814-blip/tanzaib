import { Reveal } from "@/components/motion/Reveal";
import { t } from "@/lib/i18n";

const ICONS = [
  <path key="0" d="M8 32 C14 18 26 14 32 22 C38 14 50 18 56 32 M20 40 L32 52 L44 40" />,
  <path key="1" d="M10 22 H54 V46 H10 Z M10 30 H54 M18 40 H28" />,
  <path key="2" d="M6 40 H40 V20 H50 L58 30 V40 H54 M14 44 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0 M42 44 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0" />,
  <path key="3" d="M14 28 A18 18 0 0 1 48 22 M50 36 A18 18 0 0 1 16 42 M44 16 L48 22 L42 26 M20 48 L16 42 L22 38" />,
];

export function OurPromise() {
  return (
    <section aria-labelledby="promise-title" className="border-y border-line bg-parchment py-24">
      <div className="container-luxe">
        <div className="mb-14 text-center">
          <p className="eyebrow text-brass-deep">{t.home.promiseEyebrow}</p>
          <h2 id="promise-title" className="display mt-4 text-4xl sm:text-5xl">{t.home.promiseTitle}</h2>
        </div>
        <ul className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0 lg:divide-x lg:divide-line">
          {t.promise.map((p, i) => (
            <Reveal as="li" key={p.title} delay={i * 0.08} className="px-6 text-center">
              <svg viewBox="0 0 64 64" className="mx-auto size-12 text-brass" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden>
                {ICONS[i]}
              </svg>
              <h3 className="mt-5 font-serif text-2xl">{p.title}</h3>
              <p className="mx-auto mt-2 max-w-[16rem] text-sm leading-relaxed text-taupe">{p.body}</p>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
