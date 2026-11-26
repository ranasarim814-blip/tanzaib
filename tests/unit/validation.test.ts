import { describe, expect, it } from "vitest";
import { displayPkPhone, normalizePkPhone } from "@/lib/validation/phone";
import { checkoutFormSchema, placeOrderSchema } from "@/lib/validation/schemas";

describe("normalizePkPhone", () => {
  it.each([
    ["03001234567", "+923001234567"],
    ["0300-1234567", "+923001234567"],
    ["0300 123 4567", "+923001234567"],
    ["+923001234567", "+923001234567"],
    ["923001234567", "+923001234567"],
    ["00923001234567", "+923001234567"],
  ])("accepts %s", (input, out) => expect(normalizePkPhone(input)).toBe(out));

  it.each(["", "0300123456", "04235761234", "+443001234567", "abc", "030012345678"])("rejects %s", (input) => {
    expect(normalizePkPhone(input)).toBeNull();
  });

  it("formats for display", () => expect(displayPkPhone("+923001234567")).toBe("0300 1234567"));
});

describe("checkout schema", () => {
  const valid = { customer_name: "Sana Tariq", phone: "0300 7654321", city: "Lahore", area: "Gulberg III", address: "House 45, Street 7, Block H" };

  it("normalises the phone and accepts optional fields", () => {
    const r = checkoutFormSchema.parse({ ...valid, email: "SANA@Example.com" });
    expect(r.phone).toBe("+923007654321");
    expect(r.email).toBe("sana@example.com");
  });

  it("rejects short names, bad phones, short addresses and bad emails", () => {
    const r = checkoutFormSchema.safeParse({ ...valid, customer_name: "Al", phone: "12345", address: "short", email: "nope" });
    expect(r.success).toBe(false);
    const paths = r.error!.issues.map((i) => i.path[0]);
    expect(paths).toEqual(expect.arrayContaining(["customer_name", "phone", "address", "email"]));
  });

  it("requires a typed city when 'Other' is chosen", () => {
    const line = { productId: "p1", size: "M", quantity: 1 };
    expect(placeOrderSchema.safeParse({ customer: { ...valid, city: "Other" }, lines: [line] }).success).toBe(false);
    expect(placeOrderSchema.safeParse({ customer: { ...valid, city: "Other", other_city: "Kalam" }, lines: [line] }).success).toBe(true);
  });

  it("limits quantity to 5 per line and requires measurements for custom stitching", () => {
    expect(placeOrderSchema.safeParse({ customer: valid, lines: [{ productId: "p1", size: "M", quantity: 6 }] }).success).toBe(false);
    expect(placeOrderSchema.safeParse({ customer: valid, lines: [{ productId: "p1", size: "CUSTOM", quantity: 1 }] }).success).toBe(false);
  });
});
