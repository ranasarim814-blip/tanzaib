"use client";

import { useReducedMotionSafe } from "@/lib/hooks";
import { useRef, useState, type PointerEvent as RPointerEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Dialog } from "radix-ui";
import { Maximize2, X } from "lucide-react";
import { ProductImage } from "@/components/store/ProductImage";
import { productImageLayoutId } from "@/components/wardrobe/Wardrobe";
import type { ProductImage as PImage } from "@/lib/types";
import { cn } from "@/lib/utils";

type View = "front" | "back" | "detail";

export function Gallery({ slug, name, images }: { slug: string; name: string; images: PImage[] }) {
  const reduce = useReducedMotionSafe();
  const visible = images.filter((i) => i.kind !== "hanger");
  const front = visible.find((i) => i.kind === "front") ?? visible[0];
  const back = visible.find((i) => i.kind === "back");
  const details = visible.filter((i) => i.kind === "detail" || i.kind === "gallery");
  const views: { key: View; label: string; available: boolean }[] = [
    { key: "front", label: "Front", available: Boolean(front) },
    { key: "back", label: "Back", available: Boolean(back) },
    { key: "detail", label: "Detail", available: details.length > 0 },
  ];
  const [current, setCurrent] = useState<PImage | undefined>(front);
  const [zoomOpen, setZoomOpen] = useState(false);
  const view: View = current?.kind === "back" ? "back" : current && current !== front ? "detail" : "front";

  const pick = (v: View) => setCurrent(v === "front" ? front : v === "back" ? back : details[0]);

  if (!front || !current) {
    return <div className="aspect-[3/4] bg-parchment" />;
  }

  return (
    <div className="lg:sticky lg:top-28">
      <div className="grid gap-4 lg:grid-cols-[80px_minmax(0,1fr)]">
        {/* thumbnails */}
        <ul className="no-scrollbar order-2 flex gap-3 overflow-x-auto lg:order-1 lg:flex-col" aria-label="Product images">
          {visible.map((img, i) => (
            <li key={img.id} className="shrink-0">
              <button
                type="button"
                onClick={() => setCurrent(img)}
                aria-label={`Show image ${i + 1}: ${img.alt ?? img.kind}`}
                aria-current={current.id === img.id}
                className={cn("relative block h-24 w-18 overflow-hidden bg-parchment transition-opacity lg:h-[106px] lg:w-20", current.id === img.id ? "ring-1 ring-ink ring-offset-2 ring-offset-ivory" : "opacity-65 hover:opacity-100")}
              >
                <ProductImage src={img.url} alt="" fill sizes="80px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>

        <div className="order-1 lg:order-2">
          <Magnifier image={current} name={name} layoutId={current.id === front.id ? productImageLayoutId(slug) : undefined} reduce={!!reduce} onOpenZoom={() => setZoomOpen(true)} />
          {/* Front / Back / Detail toggle */}
          <div role="tablist" aria-label="View" className="mt-4 flex justify-center gap-1">
            {views.filter((v) => v.available).map((v) => (
              <button
                key={v.key}
                role="tab"
                type="button"
                aria-selected={view === v.key}
                onClick={() => pick(v.key)}
                className={cn("relative px-4 py-2 text-[0.62rem] font-semibold tracking-[0.22em] uppercase transition-colors", view === v.key ? "text-ink" : "text-taupe hover:text-ink")}
              >
                {v.label}
                {view === v.key && <motion.span layoutId="gallery-tab" className="absolute inset-x-3 bottom-0 h-px bg-brass" />}
              </button>
            ))}
          </div>
        </div>
      </div>
      <ZoomDialog open={zoomOpen} onOpenChange={setZoomOpen} image={current} />
    </div>
  );
}

/** Desktop: hover lens that magnifies the embroidery. Touch: tap opens a pinch-zoom view. */
function Magnifier({ image, name, layoutId, reduce, onOpenZoom }: { image: PImage; name: string; layoutId?: string; reduce: boolean; onOpenZoom: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [lens, setLens] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const ZOOM = 2.6;
  const LENS = 190;

  const onMove = (e: RPointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") return;
    const r = ref.current!.getBoundingClientRect();
    setLens({ x: e.clientX - r.left, y: e.clientY - r.top, w: r.width, h: r.height });
  };

  return (
    <div
      ref={ref}
      data-gallery-main
      className="relative aspect-[3/4] cursor-zoom-in overflow-hidden bg-parchment shadow-[0_30px_60px_-40px_rgba(28,26,23,0.5)]"
      onPointerMove={onMove}
      onPointerLeave={() => setLens(null)}
      onClick={(e) => {
        if ((e.nativeEvent as PointerEvent).pointerType !== "mouse") onOpenZoom();
      }}
    >
      <AnimatePresence initial={false}>
        <motion.div
          key={image.id}
          className="absolute inset-0"
          initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div layoutId={layoutId} className="absolute inset-0">
            <ProductImage src={image.url} alt={image.alt ?? name} fill preload sizes="(min-width: 1024px) 46vw, 100vw" className="object-cover" />
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {lens && (
        <div
          aria-hidden
          className="pointer-events-none absolute z-10 rounded-full border border-brass bg-no-repeat shadow-[0_10px_30px_rgba(0,0,0,0.25)]"
          style={{
            width: LENS,
            height: LENS,
            left: lens.x - LENS / 2,
            top: lens.y - LENS / 2,
            backgroundImage: `url("${image.url}")`,
            backgroundColor: "var(--parchment)",
            backgroundSize: `${lens.w * ZOOM}px ${lens.h * ZOOM}px`,
            backgroundPosition: `${-(lens.x * ZOOM - LENS / 2)}px ${-(lens.y * ZOOM - LENS / 2)}px`,
          }}
        />
      )}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onOpenZoom();
        }}
        className="absolute right-3 bottom-3 z-10 grid size-10 place-items-center bg-ivory/90 text-ink"
        aria-label="Open zoomed view"
      >
        <Maximize2 className="size-4" strokeWidth={1.25} />
      </button>
      <p className="pointer-events-none absolute bottom-4 left-4 hidden text-[0.6rem] tracking-[0.2em] text-ink/60 uppercase lg:block">Hover to see the hand-work</p>
    </div>
  );
}

/** Full-screen zoom with pinch (two fingers), drag to pan and double-tap to toggle. */
function ZoomDialog({ open, onOpenChange, image }: { open: boolean; onOpenChange: (o: boolean) => void; image: PImage }) {
  const [t, setT] = useState({ scale: 1, x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const start = useRef<{ dist: number; scale: number; x: number; y: number; px: number; py: number } | null>(null);
  const lastTap = useRef(0);

  const onDown = (e: RPointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    setDragging(true);
    const pts = [...pointers.current.values()];
    const dist = pts.length === 2 ? Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) : 0;
    start.current = { dist, scale: t.scale, x: t.x, y: t.y, px: e.clientX, py: e.clientY };
    if (pts.length === 1) {
      const now = Date.now();
      if (now - lastTap.current < 300) setT((v) => (v.scale > 1 ? { scale: 1, x: 0, y: 0 } : { scale: 2.5, x: 0, y: 0 }));
      lastTap.current = now;
    }
  };
  const onMove = (e: RPointerEvent) => {
    if (!pointers.current.has(e.pointerId) || !start.current) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = [...pointers.current.values()];
    if (pts.length === 2 && start.current.dist) {
      const d = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      setT((v) => ({ ...v, scale: Math.min(5, Math.max(1, (start.current!.scale * d) / start.current!.dist)) }));
    } else if (pts.length === 1 && t.scale > 1) {
      setT((v) => ({ ...v, x: start.current!.x + (e.clientX - start.current!.px), y: start.current!.y + (e.clientY - start.current!.py) }));
    }
  };
  const onUp = (e: RPointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (!pointers.current.size) setDragging(false);
    const p = [...pointers.current.values()][0];
    start.current = p ? { dist: 0, scale: t.scale, x: t.x, y: t.y, px: p.x, py: p.y } : null;
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) setT({ scale: 1, x: 0, y: 0 });
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[70] bg-ink/95" />
        <Dialog.Content className="fixed inset-0 z-[71] flex items-center justify-center outline-none" aria-describedby={undefined}>
          <Dialog.Title className="sr-only">Zoomed image</Dialog.Title>
          <div
            className="relative h-[86vh] w-[min(92vw,64.5vh)] touch-none select-none"
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
            onWheel={(e) => setT((v) => ({ ...v, scale: Math.min(5, Math.max(1, v.scale - e.deltaY * 0.002)) }))}
          >
            <div className="absolute inset-0" style={{ transform: `translate(${t.x}px, ${t.y}px) scale(${t.scale})`, transition: dragging ? "none" : "transform 0.3s" }}>
              <ProductImage src={image.url} alt={image.alt ?? ""} fill sizes="92vw" className="object-contain" />
            </div>
          </div>
          <p className="absolute bottom-6 text-[0.62rem] tracking-[0.2em] text-ivory/60 uppercase">Pinch or double-tap to zoom</p>
          <Dialog.Close className="absolute top-4 right-4 grid size-11 place-items-center text-ivory" aria-label="Close zoom">
            <X className="size-6" strokeWidth={1.25} />
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
