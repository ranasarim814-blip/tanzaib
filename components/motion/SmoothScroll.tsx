"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { usePathname } from "next/navigation";

const g = globalThis as unknown as { __lenis?: Lenis };
export const getLenis = () => g.__lenis;

/** Lenis smooth scrolling — storefront only, disabled for reduced motion and touch. */
export function SmoothScroll() {
  const pathname = usePathname();

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    if (reduce || coarse) return;
    const lenis = new Lenis({ duration: 1.15, easing: (t) => 1 - Math.pow(1 - t, 4), smoothWheel: true });
    g.__lenis = lenis;
    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
      g.__lenis = undefined;
    };
  }, []);

  useEffect(() => {
    g.__lenis?.scrollTo(0, { immediate: true });
  }, [pathname]);

  return null;
}
