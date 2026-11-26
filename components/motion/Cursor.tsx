"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";

/**
 * Optional brass cursor: a small dot that grows into a "View" circle over elements with
 * [data-cursor="view"]. Desktop (fine pointer) only; off for reduced motion.
 */
export function Cursor() {
  const [enabled, setEnabled] = useState(false);
  const [mode, setMode] = useState<"dot" | "view">("dot");
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 500, damping: 40, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 500, damping: 40, mass: 0.4 });

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine) and (hover: hover)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduce) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- enabling after a media check
    setEnabled(true);
    const move = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      const el = (e.target as Element | null)?.closest?.("[data-cursor]");
      setMode(el?.getAttribute("data-cursor") === "view" ? "view" : "dot");
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, [x, y]);

  if (!enabled) return null;
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed top-0 left-0 z-[95] grid place-items-center rounded-full mix-blend-normal"
      style={{ x: sx, y: sy, translateX: "-50%", translateY: "-50%" }}
      animate={
        mode === "view"
          ? { width: 76, height: 76, backgroundColor: "rgba(28,26,23,0.78)", border: "1px solid rgba(176,141,87,0.9)" }
          : { width: 8, height: 8, backgroundColor: "rgba(176,141,87,1)", border: "0px solid rgba(176,141,87,0)" }
      }
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      {mode === "view" && <span className="text-[0.6rem] tracking-[0.25em] text-ivory uppercase">View</span>}
    </motion.div>
  );
}
