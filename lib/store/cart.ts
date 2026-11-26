"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CustomMeasurements, Priceable, Size } from "@/lib/types";
import { MAX_QTY_PER_LINE } from "@/lib/validation/schemas";

export interface CartLine extends Priceable {
  key: string;
  productId: string;
  slug: string;
  name: string;
  sku: string;
  image: string | null;
  category: string | null;
  size: Size;
  quantity: number;
  /** stock available when added (null = made to order / custom) */
  maxStock: number | null;
  measurements?: CustomMeasurements;
  madeToOrder: boolean;
}

interface CartState {
  lines: CartLine[];
  add: (line: Omit<CartLine, "key">) => void;
  setQuantity: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  replacePricing: (updates: Record<string, Priceable>) => void;
}

const keyOf = (l: Pick<CartLine, "productId" | "size" | "measurements">) =>
  l.size === "CUSTOM"
    ? `${l.productId}:CUSTOM:${Math.abs(hash(JSON.stringify(l.measurements ?? {})))}`
    : `${l.productId}:${l.size}`;

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h;
}

const clampQty = (q: number, max: number | null) =>
  Math.max(1, Math.min(MAX_QTY_PER_LINE, max ?? MAX_QTY_PER_LINE, Math.floor(q) || 1));

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      add: (line) =>
        set((s) => {
          const key = keyOf(line);
          const existing = s.lines.find((l) => l.key === key);
          if (existing) {
            return {
              lines: s.lines.map((l) =>
                l.key === key ? { ...l, ...line, key, quantity: clampQty(l.quantity + line.quantity, line.maxStock) } : l,
              ),
            };
          }
          return { lines: [...s.lines, { ...line, key, quantity: clampQty(line.quantity, line.maxStock) }] };
        }),
      setQuantity: (key, qty) =>
        set((s) => ({
          lines: s.lines.map((l) => (l.key === key ? { ...l, quantity: clampQty(qty, l.maxStock) } : l)),
        })),
      remove: (key) => set((s) => ({ lines: s.lines.filter((l) => l.key !== key) })),
      clear: () => set({ lines: [] }),
      replacePricing: (updates) =>
        set((s) => ({
          lines: s.lines.map((l) => (updates[l.productId] ? { ...l, ...updates[l.productId] } : l)),
        })),
    }),
    {
      name: "tanzaib-bag",
      version: 1,
      storage: createJSONStorage(() => {
        try {
          return localStorage;
        } catch {
          return sessionStorage;
        }
      }),
    },
  ),
);

export const cartCount = (lines: CartLine[]) => lines.reduce((n, l) => n + l.quantity, 0);
