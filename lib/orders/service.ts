import "server-only";
import { randomBytes } from "node:crypto";
import { db } from "@/lib/data";
import { loadProducts } from "@/lib/data/catalog";
import { getSettingsUncached } from "@/lib/data/settings";
import { OutOfStockError, type PlaceOrderItem } from "@/lib/data/db";
import { computeOrderTotals, getEffectivePrice, type OrderTotals } from "@/lib/pricing";
import type { CustomMeasurements, ProductWithRelations, Size } from "@/lib/types";
import { MAX_QTY_PER_LINE, placeOrderSchema, type PlaceOrderInput } from "@/lib/validation/schemas";
import { normalizePkPhone } from "@/lib/validation/phone";

export const ORDERS_PER_HOUR_LIMIT = 3;

export interface QuotedLine {
  productId: string;
  name: string;
  slug: string;
  sku: string;
  image: string | null;
  size: Size;
  quantity: number;
  unitOriginal: number;
  unitFinal: number;
  lineTotal: number;
  madeToOrder: boolean;
  available: boolean;
  problem: string | null;
  measurements?: CustomMeasurements;
}

export interface Quote {
  lines: QuotedLine[];
  totals: OrderTotals;
  ok: boolean;
}

type LineIn = { productId: string; size: Size; quantity: number; measurements?: CustomMeasurements };

/** Re-prices a bag entirely from the database. Never trusts client prices. */
export async function quoteLines(lines: LineIn[], now = new Date()): Promise<Quote> {
  const ids = [...new Set(lines.map((l) => l.productId))];
  const [products, settings] = await Promise.all([
    ids.length ? loadProducts({ publishedOnly: true, ids }) : Promise.resolve([] as ProductWithRelations[]),
    getSettingsUncached(),
  ]);
  const byId = new Map(products.map((p) => [p.id, p]));
  // how many units of each variant this bag asks for
  const demand = new Map<string, number>();
  for (const l of lines) {
    const k = `${l.productId}:${l.size}`;
    demand.set(k, (demand.get(k) ?? 0) + l.quantity);
  }

  const quoted: QuotedLine[] = lines.map((l) => {
    const p = byId.get(l.productId);
    if (!p) {
      return {
        productId: l.productId,
        name: "Unavailable piece",
        slug: "",
        sku: "",
        image: null,
        size: l.size,
        quantity: l.quantity,
        unitOriginal: 0,
        unitFinal: 0,
        lineTotal: 0,
        madeToOrder: false,
        available: false,
        problem: "This piece is no longer available.",
      };
    }
    const price = getEffectivePrice(p, now);
    const variant = p.variants.find((v) => v.size === l.size);
    const image = p.images.find((i) => i.kind === "front")?.url ?? p.images[0]?.url ?? null;
    let problem: string | null = null;
    const qty = Math.min(Math.max(1, l.quantity), MAX_QTY_PER_LINE);
    if (l.size === "CUSTOM") {
      if (!p.allow_custom_stitching) problem = "Custom stitching isn't offered for this piece.";
      else if (!l.measurements) problem = "Measurements are missing.";
    } else if (!variant) {
      problem = `Size ${l.size} isn't available.`;
    } else if (!p.is_made_to_order) {
      const want = demand.get(`${l.productId}:${l.size}`) ?? qty;
      if (variant.stock <= 0) problem = `Size ${l.size} has just sold out.`;
      else if (variant.stock < want) problem = `Only ${variant.stock} left in size ${l.size}.`;
    }
    return {
      productId: p.id,
      name: p.name,
      slug: p.slug,
      sku: p.sku,
      image,
      size: l.size,
      quantity: qty,
      unitOriginal: price.original,
      unitFinal: price.final,
      lineTotal: price.final * qty,
      madeToOrder: p.is_made_to_order || l.size === "CUSTOM",
      available: problem === null,
      problem,
      measurements: l.measurements,
    };
  });

  const totals = computeOrderTotals(
    quoted.filter((q) => q.available).map((q) => ({ unitOriginal: q.unitOriginal, unitFinal: q.unitFinal, quantity: q.quantity })),
    settings,
  );
  return { lines: quoted, totals, ok: quoted.length > 0 && quoted.every((q) => q.available) };
}

export type PlaceOrderResult =
  | { ok: true; orderNumber: string; token: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string>; quote?: Quote };

export async function placeOrder(
  raw: PlaceOrderInput,
  client: { ipHash: string; userAgent: string },
): Promise<PlaceOrderResult> {
  const parsed = placeOrderSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path.filter((p) => p !== "customer").join(".");
      if (!fieldErrors[path]) fieldErrors[path] = issue.message;
    }
    return { ok: false, error: "Please check the highlighted fields.", fieldErrors };
  }
  const { customer, lines } = parsed.data;

  // Honeypot: pretend success-like failure without detail
  if (customer.website) return { ok: false, error: "We couldn't place this order. Please contact us on WhatsApp." };

  const d = db();
  const phone = customer.phone;
  const blocked = await d.select("blocked_phones", { in: { column: "phone", values: [phone, normalizePkPhone(customer.alt_phone) ?? phone] } });
  if (blocked.length) {
    return { ok: false, error: "We're unable to accept orders from this number. Please contact us on WhatsApp." };
  }

  const since = new Date(Date.now() - 3600_000).toISOString();
  const [byPhone, byIp] = await Promise.all([
    d.count("orders", { eq: { phone }, gte: { created_at: since } }),
    client.ipHash ? d.count("orders", { eq: { ip_hash: client.ipHash }, gte: { created_at: since } }) : Promise.resolve(0),
  ]);
  if (byPhone >= ORDERS_PER_HOUR_LIMIT || byIp >= ORDERS_PER_HOUR_LIMIT) {
    return {
      ok: false,
      error: "You've placed several orders in the last hour. Please wait a little or message us on WhatsApp.",
    };
  }

  const quote = await quoteLines(lines as LineIn[]);
  if (!quote.ok) {
    return { ok: false, error: quote.lines.find((l) => l.problem)?.problem ?? "Some items are unavailable.", quote };
  }

  const items: PlaceOrderItem[] = quote.lines.map((q) => ({
    product_id: q.productId,
    product_name: q.name,
    sku: q.sku,
    size: q.size,
    quantity: q.quantity,
    unit_price: q.unitOriginal,
    unit_discount: q.unitOriginal - q.unitFinal,
    line_total: q.lineTotal,
    custom_measurements: q.size === "CUSTOM" ? (q.measurements ?? null) : null,
    image_url: q.image,
    decrement: !q.madeToOrder,
  }));

  const city = customer.city === "Other" ? (customer.other_city ?? "Other") : customer.city;
  const token = randomBytes(16).toString("hex");
  try {
    const res = await d.placeOrder(
      {
        public_token: token,
        customer_name: customer.customer_name,
        phone,
        alt_phone: customer.alt_phone ?? null,
        email: customer.email ?? null,
        city,
        area: customer.area ?? null,
        address: customer.address,
        postal_code: customer.postal_code ?? null,
        notes: customer.notes ?? null,
        subtotal: quote.totals.subtotal,
        discount_total: quote.totals.discountTotal,
        delivery_charge: quote.totals.deliveryCharge,
        total: quote.totals.total,
        payment_method: "COD",
        ip_hash: client.ipHash,
        user_agent: client.userAgent,
      },
      items,
    );
    return { ok: true, orderNumber: res.order_number, token: res.public_token };
  } catch (e) {
    if (e instanceof OutOfStockError) {
      return { ok: false, error: `Sorry — ${e.productName} just sold out in your size.`, quote: await quoteLines(lines as LineIn[]) };
    }
    console.error("placeOrder failed", e);
    return { ok: false, error: "Something went wrong while placing your order. Please try again." };
  }
}
