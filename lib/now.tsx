"use client";

import { createContext, useContext, useSyncExternalStore } from "react";

const NowContext = createContext<string | null>(null);

export function NowProvider({ iso, children }: { iso: string; children: React.ReactNode }) {
  return <NowContext value={iso}>{children}</NowContext>;
}

// one shared ticking clock for every subscriber
let clientNow = 0;
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;

function subscribe(cb: () => void) {
  listeners.add(cb);
  if (!timer) {
    clientNow = Date.now();
    timer = setInterval(() => {
      clientNow = Date.now();
      listeners.forEach((l) => l());
    }, 60_000);
  }
  return () => {
    listeners.delete(cb);
    if (!listeners.size && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

/**
 * Current time for price calculations. During SSR/hydration this is the server's cached
 * reference time; after hydration it is the visitor's clock (refreshed every minute).
 */
export function useNow(): Date {
  const serverIso = useContext(NowContext);
  const ms = useSyncExternalStore(
    subscribe,
    () => clientNow || (clientNow = Date.now()),
    // Outside a NowProvider (admin, dynamic pages) fall back to the server clock.
    () => (serverIso ? Date.parse(serverIso) : Date.now()),
  );
  return new Date(ms);
}
