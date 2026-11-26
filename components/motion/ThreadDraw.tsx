"use client";

import { useReducedMotionSafe } from "@/lib/hooks";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * Paisley/floral embroidery motif whose brass stroke "stitches itself" as it enters view.
 * Used as a section divider.
 */
export function ThreadDivider({ className, tone = "brass" }: { className?: string; tone?: "brass" | "soft" }) {
  const reduce = useReducedMotionSafe();
  const stroke = tone === "brass" ? "var(--brass)" : "var(--brass-soft)";
  const draw = (delay: number, duration = 2.2) =>
    reduce
      ? {}
      : {
          initial: { pathLength: 0, opacity: 0 },
          whileInView: { pathLength: 1, opacity: 1 },
          viewport: { once: true, margin: "-10% 0px" },
          transition: { pathLength: { duration, delay, ease: [0.22, 1, 0.36, 1] as const }, opacity: { duration: 0.3, delay } },
        };
  return (
    <div className={cn("flex items-center justify-center gap-4 py-2", className)} aria-hidden>
      <svg viewBox="0 0 520 60" className="h-10 w-full max-w-[520px] sm:h-12" fill="none">
        <motion.path d="M0 30 H170" stroke={stroke} strokeWidth="0.8" strokeDasharray="3 5" {...draw(0, 1.6)} />
        <motion.path d="M350 30 H520" stroke={stroke} strokeWidth="0.8" strokeDasharray="3 5" {...draw(0, 1.6)} />
        {/* left paisley */}
        <motion.path
          d="M232 30 C214 30 200 20 204 9 C207 1 218 2 219 9 C220 14 214 16 212 12 C214 22 226 26 238 26"
          stroke={stroke}
          strokeWidth="1"
          {...draw(0.4)}
        />
        {/* right paisley (mirrored) */}
        <motion.path
          d="M288 30 C306 30 320 40 316 51 C313 59 302 58 301 51 C300 46 306 44 308 48 C306 38 294 34 282 34"
          stroke={stroke}
          strokeWidth="1"
          {...draw(0.4)}
        />
        {/* central flower */}
        <motion.path
          d="M260 18 C266 24 266 36 260 42 C254 36 254 24 260 18 Z M248 30 C254 24 266 24 272 30 C266 36 254 36 248 30 Z"
          stroke={stroke}
          strokeWidth="1"
          {...draw(0.9, 1.8)}
        />
        <motion.circle cx="260" cy="30" r="2.2" fill={stroke} {...(reduce ? {} : { initial: { scale: 0 }, whileInView: { scale: 1 }, viewport: { once: true }, transition: { delay: 2.2, duration: 0.5 } })} />
        {/* stitches */}
        <motion.path d="M176 30 L196 30 M324 30 L344 30" stroke={stroke} strokeWidth="1.4" strokeDasharray="1 4" {...draw(1.4, 1)} />
      </svg>
    </div>
  );
}
