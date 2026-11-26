"use client";

import { create } from "zustand";

export interface FlyItem {
  id: number;
  image: string;
  from: { x: number; y: number; w: number; h: number };
}

interface UiState {
  bagOpen: boolean;
  menuOpen: boolean;
  bagBump: number;
  fly: FlyItem | null;
  openBag: () => void;
  closeBag: () => void;
  setMenu: (open: boolean) => void;
  flyToBag: (image: string, rect: DOMRect | null) => void;
  clearFly: () => void;
}

export const useUi = create<UiState>()((set) => ({
  bagOpen: false,
  menuOpen: false,
  bagBump: 0,
  fly: null,
  openBag: () => set({ bagOpen: true, menuOpen: false }),
  closeBag: () => set({ bagOpen: false }),
  setMenu: (menuOpen) => set({ menuOpen }),
  flyToBag: (image, rect) =>
    set((s) => ({
      bagBump: s.bagBump + 1,
      fly: rect
        ? { id: Date.now(), image, from: { x: rect.left, y: rect.top, w: rect.width, h: rect.height } }
        : null,
    })),
  clearFly: () => set({ fly: null }),
}));
