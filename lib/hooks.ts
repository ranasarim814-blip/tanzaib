"use client";

import { useSyncExternalStore } from "react";

/** True after hydration — use before reading persisted (localStorage) stores. */
export function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function useMediaQuery(query: string, fallback = false) {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(query);
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia(query).matches,
    () => fallback,
  );
}

/** prefers-reduced-motion that is `false` during SSR/hydration (avoids hydration mismatches). */
export function useReducedMotionSafe() {
  const hydrated = useHydrated();
  const reduce = useMediaQuery("(prefers-reduced-motion: reduce)", false);
  return hydrated && reduce;
}
