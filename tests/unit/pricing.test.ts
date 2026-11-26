import { describe, expect, it } from "vitest";
import { computeOrderTotals, getEffectivePrice } from "@/lib/pricing";
import type { Priceable } from "@/lib/types";

const base: Priceable = { price: 20000, discount_type: "none", discount_value: 0, discount_starts_at: null, discount_ends_at: null };
const now = new Date("2026-11-26T12:00:00Z");

describe("getEffectivePrice", () => {
  it("returns the full price without a discount", () => {
    expect(getEffectivePrice(base, now)).toMatchObject({ original: 20000, final: 20000, savedAmount: 0, isOnSale: false });
  });

  it("applies a percentage discount", () => {
    const p = getEffectivePrice({ ...base, discount_type: "percentage", discount_value: 15 }, now);
    expect(p).toMatchObject({ final: 17000, savedAmount: 3000, savedPercent: 15, isOnSale: true });
  });

  it("caps percentage discounts at 90%", () => {
    const p = getEffectivePrice({ ...base, discount_type: "percentage", discount_value: 150 }, now);
    expect(p.final).toBe(2000);
    expect(p.savedPercent).toBe(90);
  });

  it("applies a flat discount and never goes below zero", () => {
    expect(getEffectivePrice({ ...base, discount_type: "flat", discount_value: 2500 }, now).final).toBe(17500);
    expect(getEffectivePrice({ ...base, discount_type: "flat", discount_value: 999999 }, now).final).toBe(0);
  });

  it("ignores a discount before it starts and after it ends", () => {
    const future = { ...base, discount_type: "percentage" as const, discount_value: 10, discount_starts_at: "2026-12-01T00:00:00Z" };
    const expired = { ...base, discount_type: "percentage" as const, discount_value: 10, discount_ends_at: "2026-01-31T18:59:59Z" };
    expect(getEffectivePrice(future, now).isOnSale).toBe(false);
    expect(getEffectivePrice(expired, now).isOnSale).toBe(false);
  });

  it("applies inside the window and exposes the end date", () => {
    const p = getEffectivePrice(
      { ...base, discount_type: "flat", discount_value: 1000, discount_starts_at: "2026-11-01T00:00:00Z", discount_ends_at: "2026-12-31T00:00:00Z" },
      now,
    );
    expect(p).toMatchObject({ final: 19000, isOnSale: true, validUntil: "2026-12-31T00:00:00Z" });
  });

  it("treats zero / negative values as no discount", () => {
    expect(getEffectivePrice({ ...base, discount_type: "percentage", discount_value: 0 }, now).isOnSale).toBe(false);
    expect(getEffectivePrice({ ...base, discount_type: "flat", discount_value: -5 }, now).isOnSale).toBe(false);
  });
});

describe("computeOrderTotals", () => {
  const rules = { delivery_charge: 250, free_delivery_threshold: 15000 };

  it("charges delivery below the threshold", () => {
    const t = computeOrderTotals([{ unitOriginal: 12500, unitFinal: 12500, quantity: 1 }], rules);
    expect(t).toMatchObject({ subtotal: 12500, discountTotal: 0, deliveryCharge: 250, total: 12750, remainingForFreeDelivery: 2500, freeDelivery: false });
  });

  it("ships free at or above the threshold (after discounts)", () => {
    expect(computeOrderTotals([{ unitOriginal: 15000, unitFinal: 15000, quantity: 1 }], rules).deliveryCharge).toBe(0);
    const t = computeOrderTotals([{ unitOriginal: 16500, unitFinal: 14000, quantity: 1 }], rules);
    expect(t).toMatchObject({ discountTotal: 2500, deliveryCharge: 250, total: 14250 });
  });

  it("sums multiple lines and quantities", () => {
    const t = computeOrderTotals(
      [
        { unitOriginal: 48000, unitFinal: 42000, quantity: 1 },
        { unitOriginal: 16500, unitFinal: 14000, quantity: 2 },
      ],
      rules,
    );
    expect(t).toMatchObject({ subtotal: 81000, discountTotal: 11000, itemsTotal: 70000, deliveryCharge: 0, total: 70000 });
  });

  it("charges nothing for an empty bag", () => {
    expect(computeOrderTotals([], rules).total).toBe(0);
  });
});
