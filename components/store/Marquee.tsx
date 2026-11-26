import { t } from "@/lib/i18n";

export function Marquee({ items = t.marquee as readonly string[] }: { items?: readonly string[] }) {
  const row = [...items, ...items, ...items];
  return (
    <div className="overflow-hidden border-y border-line bg-parchment py-4" aria-label={items.join(", ")}>
      <div className="animate-marquee flex w-max items-center motion-reduce:animate-none" aria-hidden>
        {[0, 1].map((k) => (
          <div key={k} className="flex shrink-0 items-center">
            {row.map((item, i) => (
              <span key={`${k}-${i}`} className="flex items-center">
                <span className="px-8 font-serif text-lg font-light tracking-[0.12em] text-ink italic sm:text-xl">{item}</span>
                <span className="text-brass">✦</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
