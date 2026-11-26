"use client";

import { Dialog } from "radix-ui";
import { X } from "lucide-react";

const ROWS = [
  ["XS", 34, 28, 36, 13.5, 21, 38, 37],
  ["S", 36, 30, 38, 14, 21.5, 39, 38],
  ["M", 38, 32, 40, 14.5, 22, 40, 39],
  ["L", 41, 35, 43, 15, 22.5, 41, 39.5],
  ["XL", 44, 38, 46, 15.5, 23, 42, 40],
] as const;
const HEAD = ["Size", "Chest", "Waist", "Hip", "Shoulder", "Sleeve", "Shirt length", "Trouser length"];

export function SizeChart() {
  return (
    <Dialog.Root>
      <Dialog.Trigger className="link-underline text-xs tracking-wide text-taupe">Size chart</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[70] bg-ink/45" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-[71] max-h-[90vh] w-[min(94vw,720px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto bg-ivory p-6 sm:p-10" data-lenis-prevent>
          <div className="flex items-start justify-between">
            <div>
              <p className="eyebrow text-brass-deep">Measurements in inches</p>
              <Dialog.Title className="display mt-2 text-4xl">Size chart</Dialog.Title>
            </div>
            <Dialog.Close aria-label="Close size chart" className="-mr-2 p-2">
              <X className="size-5" strokeWidth={1.25} />
            </Dialog.Close>
          </div>
          <Dialog.Description className="mt-3 text-sm text-taupe">
            Body measurements. Our shirts include 2–3 inches of ease. Between sizes? Choose Custom Stitching and we will tailor it to you.
          </Dialog.Description>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-line">
                  {HEAD.map((h) => (
                    <th key={h} scope="col" className="py-3 pr-3 text-left text-[0.62rem] font-semibold tracking-[0.16em] text-taupe uppercase">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map((r) => (
                  <tr key={r[0]} className="border-b border-line">
                    {r.map((c, i) =>
                      i === 0 ? (
                        <th key={i} scope="row" className="py-3 pr-3 text-left font-serif text-lg font-normal">{c}</th>
                      ) : (
                        <td key={i} className="py-3 pr-3 tabular-nums">{c}</td>
                      ),
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
