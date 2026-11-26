"use client";

import { AnimatePresence, motion } from "motion/react";
import { useUi } from "@/lib/store/ui";
import { ProductImage } from "./ProductImage";

/** A thumbnail flies from the Add-to-bag source to the bag icon, then the drawer opens. */
export function FlyToBag() {
  const fly = useUi((s) => s.fly);
  const clear = useUi((s) => s.clearFly);
  const openBag = useUi((s) => s.openBag);

  const target = (() => {
    if (typeof document === "undefined") return { x: 0, y: 0 };
    const el = document.querySelector("[data-bag-icon]");
    const r = el?.getBoundingClientRect();
    return r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : { x: window.innerWidth - 40, y: 30 };
  })();

  return (
    <AnimatePresence onExitComplete={() => undefined}>
      {fly && (
        <motion.div
          key={fly.id}
          className="pointer-events-none fixed top-0 left-0 z-[80] overflow-hidden bg-parchment shadow-xl"
          style={{ width: 80, height: 106 }}
          initial={{ x: fly.from.x + fly.from.w / 2 - 40, y: fly.from.y + fly.from.h / 2 - 53, scale: 1.4, opacity: 0 }}
          animate={{ x: target.x - 40, y: target.y - 53, scale: 0.12, opacity: [0, 1, 1, 0.2] }}
          transition={{ duration: 0.8, ease: [0.65, 0, 0.35, 1], opacity: { times: [0, 0.1, 0.8, 1], duration: 0.8 } }}
          onAnimationComplete={() => {
            clear();
            openBag();
          }}
        >
          <ProductImage src={fly.image} alt="" fill sizes="80px" className="object-cover" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
