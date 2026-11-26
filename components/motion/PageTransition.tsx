"use client";

import { motion, useReducedMotion } from "motion/react";

/**
 * Rendered from app/(store)/template.tsx, which remounts on every navigation:
 * a thin brass line sweeps across the top and the page fades in.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <>
      {!reduce && (
        <motion.div
          aria-hidden
          className="pointer-events-none fixed inset-x-0 top-0 z-[90] h-px origin-left bg-brass"
          initial={{ scaleX: 0, opacity: 1 }}
          animate={{ scaleX: 1, opacity: [1, 1, 0] }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], opacity: { times: [0, 0.7, 1], duration: 1.1 } }}
        />
      )}
      <motion.div
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </>
  );
}
