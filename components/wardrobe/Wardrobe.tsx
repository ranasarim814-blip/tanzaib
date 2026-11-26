"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import { ProductImage } from "@/components/store/ProductImage";
import { PriceTag } from "@/components/store/PriceTag";
import { getEffectivePrice } from "@/lib/pricing";
import type { ProductSummary } from "@/lib/types";
import { cn, formatPKR } from "@/lib/utils";
import { useMediaQuery } from "@/lib/hooks";
import { useNow } from "@/lib/now";

const EASE = [0.22, 1, 0.36, 1] as const;

export interface WardrobeProps {
  products: ProductSummary[];
  eyebrow: string;
  title: string;
  subtitle: string;
}

/** Shared-element id used by the product gallery as well. */
export const productImageLayoutId = (slug: string) => `product-image-${slug}`;

/**
 * The Almari (wardrobe) hero.
 * Left: an arched "display stage" showing the selected suit.
 * Right: a CSS/SVG wardrobe whose doors swing open to reveal suits on a brass rail.
 */
export function Wardrobe({ products, eyebrow, title, subtitle }: WardrobeProps) {
  const router = useRouter();
  const reduce = useReducedMotion() ?? false;
  const isDesktop = useMediaQuery("(min-width: 1024px)", true);
  const sectionRef = useRef<HTMLElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const inView = useInView(sectionRef, { once: true, amount: 0.25 });

  const [selected, setSelected] = useState(0);
  const [active, setActive] = useState<number | null>(null);
  const [doorsOpened, setDoorsOpened] = useState(false);
  const opened = reduce || doorsOpened;
  const lastPointer = useRef<string>("mouse");
  const now = useNow();

  // Door choreography: closed → (400ms) → open.
  useEffect(() => {
    if (reduce || !inView) return;
    const id = setTimeout(() => setDoorsOpened(true), 400);
    return () => clearTimeout(id);
  }, [inView, reduce]);

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const stageY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 90]);
  const cabinetY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 40]);
  const fade = useTransform(scrollYProgress, [0, 0.9], [1, reduce ? 1 : 0.35]);

  const doorDuration = isDesktop ? 1.4 : 0.9;
  const hangerDelay = doorDuration * 0.7;

  const select = useCallback((i: number) => setSelected(i), []);

  const go = useCallback(
    (i: number) => {
      setSelected(i);
      router.push(`/product/${products[i].slug}`);
    },
    [products, router],
  );

  const onHangerPointerDown = (e: PointerEvent) => {
    lastPointer.current = e.pointerType;
  };

  const onHangerClick = (i: number) => {
    // Touch: first tap selects, second tap opens.
    if (lastPointer.current === "touch" && selected !== i) {
      select(i);
      return;
    }
    go(i);
  };

  const onRailKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const keys = ["ArrowRight", "ArrowLeft", "Home", "End"];
    if (!keys.includes(e.key)) return;
    e.preventDefault();
    const n = products.length;
    const cur = active ?? selected;
    const next =
      e.key === "Home" ? 0 : e.key === "End" ? n - 1 : (cur + (e.key === "ArrowRight" ? 1 : -1) + n) % n;
    const btn = railRef.current?.querySelectorAll<HTMLButtonElement>("[data-hanger]")[next];
    btn?.focus();
    btn?.scrollIntoView({ block: "nearest", inline: "center", behavior: reduce ? "auto" : "smooth" });
  };

  if (products.length === 0) return null;
  const current = products[Math.min(selected, products.length - 1)];
  const few = products.length < 3;

  return (
    <section
      ref={sectionRef}
      aria-labelledby="wardrobe-title"
      className="relative isolate overflow-hidden bg-ink text-ivory"
    >
      {/* ambient night light */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 50% at 30% 30%, rgba(176,141,87,0.16), transparent 70%), radial-gradient(40% 40% at 80% 20%, rgba(217,196,160,0.08), transparent 70%)",
        }}
      />
      <div className="container-luxe grid min-h-[calc(100svh-4rem)] grid-cols-1 items-center gap-10 py-10 lg:min-h-[calc(100svh-7.5rem)] lg:grid-cols-12 lg:gap-6 lg:py-12">
        {/* ------------------------------------------------ Display stage */}
        <motion.div style={{ y: stageY, opacity: fade }} className="relative z-10 lg:col-span-7">
          <div className="grid items-end gap-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:gap-10">
            <div className="relative mx-auto w-full max-w-[400px] sm:max-w-none">
              <Stage product={current} reduce={reduce} />
              {/* preload the next display image */}
              {products[1] && products[1].front && (
                <div className="sr-only" aria-hidden>
                  <ProductImage src={products[1].front} alt="" width={10} height={13} preload />
                </div>
              )}
            </div>

            <div className="pb-2 sm:pb-10">
              <p className="eyebrow text-brass-soft">{eyebrow}</p>
              <h1 id="wardrobe-title" className="display mt-4 text-[2.6rem] leading-[1] sm:text-5xl xl:text-6xl">
                {title}
              </h1>
              <p className="mt-5 max-w-sm text-sm leading-relaxed text-ivory/65">{subtitle}</p>

              <div className="mt-10 border-t border-line-light pt-6" aria-live="polite" aria-atomic="true">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={current.id}
                    initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
                    transition={{ duration: 0.45, ease: EASE }}
                  >
                    <p className="eyebrow text-[0.62rem] text-ivory/55">
                      {current.category?.name ?? "Atelier"}
                      {current.is_made_to_order ? " · Made to order" : ""}
                    </p>
                    <p className="mt-2 font-serif text-4xl font-light">{current.name}</p>
                    <PriceTag product={current} tone="ivory" className="mt-3" />
                  </motion.div>
                </AnimatePresence>
                <Link
                  href={`/product/${current.slug}`}
                  className="btn btn-light mt-7"
                  aria-label={`View piece: ${current.name}`}
                >
                  View Piece
                </Link>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ------------------------------------------------ The wardrobe */}
        <motion.div style={{ y: cabinetY }} className="relative px-[6%] sm:px-[10%] lg:col-span-5 lg:pr-0 lg:pl-[12%]">
          <Cabinet opened={opened} reduce={reduce} duration={doorDuration}>
            <div
              ref={railRef}
              role="group"
              aria-label="Pieces in the wardrobe. Use the arrow keys to browse."
              onKeyDown={onRailKeyDown}
              onMouseLeave={() => setActive(null)}
              className={cn(
                "no-scrollbar relative flex h-full items-start",
                // mobile: horizontal scroll-snap carousel; desktop: all on the rail
                "snap-x snap-mandatory gap-1 overflow-x-auto overflow-y-hidden px-[22%] lg:snap-none lg:overflow-visible lg:px-[3%]",
                few ? "justify-center gap-4 lg:gap-6" : "lg:gap-0",
              )}
              data-lenis-prevent-touch
            >
              {products.map((p, i) => {
                const price = getEffectivePrice(p, now);
                return (
                  <Hanger
                    key={p.id}
                    product={p}
                    index={i}
                    count={products.length}
                    opened={opened}
                    reduce={reduce}
                    delay={hangerDelay + i * 0.11}
                    isActive={active === i}
                    isDimmed={active !== null && active !== i}
                    isSelected={selected === i}
                    tabIndex={i === (active ?? selected) ? 0 : -1}
                    ariaLabel={`${p.name}, ${p.category?.name ?? ""}, ${formatPKR(price.final)}${price.isOnSale ? `, ${price.savedPercent}% off` : ""}`}
                    onActivate={() => {
                      setActive(i);
                      if (lastPointer.current !== "touch") select(i);
                    }}
                    onDeactivate={() => setActive((a) => (a === i ? null : a))}
                    onPointerDown={onHangerPointerDown}
                    onClick={() => onHangerClick(i)}
                  />
                );
              })}
            </div>
          </Cabinet>
          <p className="mt-4 text-center text-[0.62rem] tracking-[0.22em] text-ivory/45 uppercase">
            <span className="hidden lg:inline">Hover a piece to view · click to open</span>
            <span className="lg:hidden">Tap a piece to view · tap again to open</span>
          </p>
        </motion.div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */

function Stage({ product, reduce }: { product: ProductSummary; reduce: boolean }) {
  return (
    <div className="relative aspect-[3/4] w-full">
      {/* arched mirror frame */}
      <div
        aria-hidden
        className="absolute inset-0 rounded-t-[999px] border border-brass/45"
        style={{
          background:
            "radial-gradient(70% 55% at 50% 22%, rgba(255,228,184,0.20), rgba(255,228,184,0.04) 55%, transparent 75%), linear-gradient(160deg, rgba(247,243,236,0.07), rgba(247,243,236,0.01) 40%, rgba(247,243,236,0.05) 60%, transparent)",
        }}
      />
      <div aria-hidden className="absolute inset-[10px] rounded-t-[999px] border border-brass/20" />
      {/* floor light */}
      <div
        aria-hidden
        className="absolute inset-x-[12%] bottom-0 h-10 rounded-[50%] blur-xl"
        style={{ background: "rgba(176,141,87,0.25)" }}
      />
      <div className="absolute inset-[6%] overflow-hidden rounded-t-[999px]">
        <AnimatePresence initial={false}>
          <motion.div
            key={product.id}
            className="absolute inset-0"
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
          >
            {product.front && (
              <motion.div layoutId={productImageLayoutId(product.slug)} className="absolute inset-0">
                <ProductImage
                  src={product.front}
                  alt={product.frontAlt ?? product.name}
                  fill
                  sizes="(min-width: 1024px) 32vw, 90vw"
                  className="object-cover"
                  preload
                />
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function Cabinet({
  opened,
  reduce,
  duration,
  children,
}: {
  opened: boolean;
  reduce: boolean;
  duration: number;
  children: React.ReactNode;
}) {
  const doorTransition = { duration: reduce ? 0 : duration, ease: EASE };
  return (
    <div className="relative mx-auto w-full max-w-[560px]" style={{ perspective: "1600px" }}>
      {/* crown */}
      <div
        aria-hidden
        className="relative z-10 mx-[-3%] h-4 rounded-t-sm"
        style={{ background: "linear-gradient(180deg,#5a3d24,#3b2716)", boxShadow: "0 2px 0 rgba(176,141,87,0.4)" }}
      />
      {/* carcass */}
      <div
        className="relative aspect-[5/4] p-[10px] sm:aspect-[16/10] lg:aspect-[20/21]"
        style={{
          background: "linear-gradient(90deg,#3a2616,#5c3e26 12%,#4a311d 50%,#5c3e26 88%,#3a2616)",
          boxShadow: "0 40px 80px -30px rgba(0,0,0,0.8), inset 0 0 0 1px rgba(176,141,87,0.25)",
        }}
      >
        {/* interior */}
        <div className="relative h-full overflow-hidden" style={{ background: "linear-gradient(180deg,#1f1610,#2a1d13 60%,#1a120c)" }}>
          {/* warm interior light */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            initial={false}
            animate={{ opacity: opened ? 1 : 0 }}
            transition={{ duration: reduce ? 0 : 1.2, delay: reduce ? 0 : duration * 0.5 }}
            style={{
              background:
                "radial-gradient(80% 55% at 50% 0%, rgba(255,214,160,0.42), rgba(255,214,160,0.08) 55%, transparent 80%)",
            }}
          />
          {/* brass rail */}
          <div
            aria-hidden
            className="absolute inset-x-2 top-[8%] z-10 h-[5px] rounded-full"
            style={{ background: "linear-gradient(180deg,#e4cd9b,#b08d57 45%,#7d6236)", boxShadow: "0 2px 6px rgba(0,0,0,0.5)" }}
          />
          {/* hangers live here */}
          <div className="absolute inset-x-0 top-[8%] bottom-[3%] lg:bottom-[30%]">{children}</div>
          {/* drawer section (desktop) */}
          <div aria-hidden className="absolute inset-x-0 bottom-0 hidden h-[27%] lg:block">
            <div className="h-[6px]" style={{ background: "linear-gradient(180deg,#e4cd9b,#8a6c3d)" }} />
            <div className="grid h-[calc(100%-6px)] grid-rows-2 gap-[6px] p-[6px]" style={{ background: "#2b1c11" }}>
              {[0, 1].map((r) => (
                <div key={r} className="grid grid-cols-2 gap-[6px]">
                  {[0, 1].map((c) => (
                    <div
                      key={c}
                      className="relative"
                      style={{
                        background: "linear-gradient(100deg,#4b321e,#6b4a2d 40%,#5a3c24 70%,#4b321e)",
                        boxShadow: "inset 0 0 0 1px rgba(176,141,87,0.25), inset 0 -8px 16px rgba(0,0,0,0.25)",
                      }}
                    >
                      <span
                        className="absolute top-1/2 left-1/2 h-[5px] w-[22%] -translate-x-1/2 -translate-y-1/2 rounded-full"
                        style={{ background: "linear-gradient(180deg,#e4cd9b,#b08d57 50%,#7d6236)" }}
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
          {/* floor shadow of hanging section */}
          <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-1/5 bg-gradient-to-t from-black/45 to-transparent lg:bottom-[27%] lg:h-[12%]" />
        </div>

        {/* doors */}
        <Door side="left" opened={opened} transition={doorTransition} />
        <Door side="right" opened={opened} transition={doorTransition} />
      </div>
      {/* plinth */}
      <div aria-hidden className="mx-[-2%] h-3" style={{ background: "linear-gradient(180deg,#3b2716,#24170d)" }} />
    </div>
  );
}

function Door({
  side,
  opened,
  transition,
}: {
  side: "left" | "right";
  opened: boolean;
  transition: { duration: number; ease: typeof EASE };
}) {
  const left = side === "left";
  return (
    <motion.div
      aria-hidden
      className="absolute top-[10px] bottom-[10px] z-20 w-[calc(50%-10px)]"
      style={{
        [left ? "left" : "right"]: 10,
        transformOrigin: left ? "left center" : "right center",
        transformStyle: "preserve-3d",
        pointerEvents: opened ? "none" : "auto",
      }}
      initial={false}
      animate={{ rotateY: opened ? (left ? -105 : 105) : 0 }}
      transition={transition}
    >
      {/* outer face: walnut lacquer with an inset panel and brass handle */}
      <div
        className="absolute inset-0"
        style={{
          backfaceVisibility: "hidden",
          background:
            "linear-gradient(100deg,#4b321e,#6b4a2d 30%,#5a3c24 55%,#704e30 80%,#4b321e), repeating-linear-gradient(90deg, rgba(0,0,0,0.05) 0 2px, transparent 2px 9px)",
          backgroundBlendMode: "multiply",
          boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.35)",
        }}
      >
        <div className="absolute inset-[9%] border border-[rgba(176,141,87,0.35)]" />
        <div className="absolute inset-[12%] border border-[rgba(0,0,0,0.25)]" />
        <div
          className="absolute top-1/2 h-[22%] w-[5px] -translate-y-1/2 rounded-full"
          style={{
            [left ? "right" : "left"]: "7%",
            background: "linear-gradient(90deg,#7d6236,#e4cd9b,#b08d57)",
            boxShadow: "0 1px 4px rgba(0,0,0,0.5)",
          }}
        />
      </div>
      {/* inner face */}
      <div
        className="absolute inset-0"
        style={{
          backfaceVisibility: "hidden",
          transform: "rotateY(180deg)",
          background: "linear-gradient(90deg,#3a2616,#2c1d11)",
          boxShadow: "inset 0 0 0 1px rgba(176,141,87,0.25)",
        }}
      >
        <div className="absolute inset-[10%] rounded-t-[999px] border border-[rgba(217,196,160,0.25)] bg-gradient-to-br from-white/10 to-transparent" />
      </div>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */

interface HangerProps {
  product: ProductSummary;
  index: number;
  count: number;
  opened: boolean;
  reduce: boolean;
  delay: number;
  isActive: boolean;
  isDimmed: boolean;
  isSelected: boolean;
  tabIndex: number;
  ariaLabel: string;
  onActivate: () => void;
  onDeactivate: () => void;
  onPointerDown: (e: PointerEvent) => void;
  onClick: () => void;
}

function Hanger({
  product,
  index,
  count,
  opened,
  reduce,
  delay,
  isActive,
  isDimmed,
  isSelected,
  tabIndex,
  ariaLabel,
  onActivate,
  onDeactivate,
  onPointerDown,
  onClick,
}: HangerProps) {
  const swayDuration = 4 + ((index * 7) % 5) * 0.5; // 4–6s, different per hanger
  const phase = (index * 0.37) % 1;
  const image = product.hanger ?? product.front;
  const isFallback = !product.hanger;

  return (
    <motion.div
      className={cn(
        "relative h-full shrink-0 snap-center",
        "w-[56%] sm:w-[34%] lg:w-[var(--slot)]",
        index > 0 && "lg:ml-[var(--overlap)]",
      )}
      style={
        {
          zIndex: isActive ? 30 : 10 + count - Math.abs(index - (count - 1) / 2),
          "--slot": `${slotWidth(count)}%`,
          "--overlap": `${-overlapFor(count)}%`,
        } as React.CSSProperties
      }
      initial={reduce ? false : { opacity: 0, x: 60 }}
      animate={opened ? { opacity: isDimmed ? 0.55 : 1, x: 0, filter: isDimmed && !reduce ? "blur(1px)" : "blur(0px)" } : { opacity: 0, x: 60 }}
      transition={{
        opacity: { duration: opened && !isDimmed && !isActive ? 0.9 : 0.35, delay: opened && !isDimmed && !isActive ? 0 : 0 },
        x: { duration: 1, delay: reduce ? 0 : delay, ease: EASE },
        filter: { duration: 0.35 },
      }}
    >
      {/* idle pendulum sway, pivoting at the hook */}
      <motion.div
        className="h-full"
        style={{ transformOrigin: "50% 0%" }}
        animate={reduce || !opened ? { rotate: 0 } : { rotate: [-1.5, 1.5, -1.5] }}
        transition={
          reduce || !opened
            ? { duration: 0 }
            : { duration: swayDuration, repeat: Infinity, ease: "easeInOut", delay: delay + phase * swayDuration }
        }
      >
        {/* hover: lift + one spring sway */}
        <motion.button
          type="button"
          data-hanger
          data-cursor="view"
          tabIndex={tabIndex}
          aria-label={ariaLabel}
          aria-current={isSelected ? "true" : undefined}
          onMouseEnter={onActivate}
          onFocus={onActivate}
          onBlur={onDeactivate}
          onPointerDown={onPointerDown}
          onClick={onClick}
          className="group relative block h-full w-full outline-none"
          style={{ transformOrigin: "50% 0%" }}
          animate={
            reduce
              ? { y: 0 }
              : isActive
                ? { y: -10, rotate: [0, 3.2, -2.2, 1.1, -0.4, 0] }
                : { y: 0, rotate: 0 }
          }
          transition={{
            y: { type: "spring", stiffness: 260, damping: 22 },
            rotate: { duration: 1.4, ease: "easeOut" },
          }}
        >
          {/* hook glow */}
          <span
            aria-hidden
            className={cn(
              "absolute top-[-2%] left-1/2 z-10 size-5 -translate-x-1/2 rounded-full transition-opacity duration-500",
              isActive ? "opacity-100" : "opacity-0",
            )}
            style={{ background: "radial-gradient(circle, rgba(228,205,155,0.95), rgba(176,141,87,0) 70%)", filter: "blur(2px)" }}
          />
          {isFallback && <FallbackHook />}
          {image && (
            <span
              className={cn("absolute inset-x-0 bottom-[4%]", isFallback ? "top-[13%]" : "top-[-3%]")}
              style={
                isFallback
                  ? {
                      WebkitMaskImage: "radial-gradient(75% 85% at 50% 40%, #000 55%, transparent 100%)",
                      maskImage: "radial-gradient(75% 85% at 50% 40%, #000 55%, transparent 100%)",
                    }
                  : undefined
              }
            >
              <ProductImage
                src={image}
                alt=""
                fill
                sizes="(min-width: 1024px) 9vw, 40vw"
                className="object-contain object-top drop-shadow-[0_18px_18px_rgba(0,0,0,0.45)]"
              />
            </span>
          )}
          {/* focus ring */}
          <span
            aria-hidden
            className="absolute inset-x-[8%] top-[2%] bottom-[2%] rounded-sm opacity-0 ring-1 ring-brass-soft/70 transition-opacity group-focus-visible:opacity-100"
          />
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

/** Desktop slot width (% of the rail) — big enough to read, overlapping like a real rail. */
function slotWidth(count: number) {
  return count <= 2 ? 34 : count <= 4 ? 27 : 24;
}
function overlapFor(count: number) {
  const usable = 94; // rail minus side padding
  const total = slotWidth(count) * count;
  return count > 1 && total > usable ? (total - usable) / (count - 1) : 0;
}

function FallbackHook() {
  return (
    <svg aria-hidden viewBox="0 0 100 40" className="absolute inset-x-[10%] top-[-2%] z-10 w-[80%]" fill="none">
      <path d="M50 16 V8 C50 3 55 1 58 4 C61 7 58 10 55 10" stroke="#B08D57" strokeWidth="2" strokeLinecap="round" />
      <path d="M50 16 L12 34 C9 36 10 38 13 38 H87 C90 38 91 36 88 34 Z" fill="#7a5634" stroke="#5a3d24" />
    </svg>
  );
}
