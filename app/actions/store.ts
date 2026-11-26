"use server";

import { db } from "@/lib/data";
import { placeOrder as placeOrderService, quoteLines, type PlaceOrderResult, type Quote } from "@/lib/orders/service";
import { clientInfo, softLimit } from "@/lib/server/request";
import { notifyNewOrder } from "@/lib/server/email";
import { cartLineSchema, contactSchema, newsletterSchema, type PlaceOrderInput } from "@/lib/validation/schemas";
import { z } from "zod";

export type ActionState = { ok: boolean; message: string; fieldErrors?: Record<string, string> } | null;

/** Authoritative prices for the bag/checkout summary. */
export async function quoteBag(lines: unknown): Promise<Quote> {
  const parsed = z.array(cartLineSchema).max(20).safeParse(lines);
  if (!parsed.success) return { lines: [], totals: emptyTotals, ok: false };
  return quoteLines(parsed.data);
}

const emptyTotals = {
  subtotal: 0,
  discountTotal: 0,
  itemsTotal: 0,
  deliveryCharge: 0,
  total: 0,
  remainingForFreeDelivery: 0,
  freeDelivery: false,
};

export async function placeOrderAction(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  const client = await clientInfo();
  const res = await placeOrderService(input, client);
  if (res.ok) {
    const order = (await db().select("orders", { eq: { order_number: res.orderNumber } }))[0];
    const items = order ? await db().select("order_items", { eq: { order_id: order.id } }) : [];
    if (order) {
      await notifyNewOrder({
        orderNumber: order.order_number,
        name: order.customer_name,
        phone: order.phone,
        city: order.city,
        total: Number(order.total),
        items: items.map((i) => ({ name: i.product_name, size: i.size, quantity: i.quantity })),
      });
    }
  }
  return res;
}

export async function subscribeNewsletter(_prev: ActionState, form: FormData): Promise<ActionState> {
  const parsed = newsletterSchema.safeParse({ email: form.get("email"), company: form.get("company") ?? "" });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Enter a valid email" };
  const { ipHash } = await clientInfo();
  if (!softLimit(`nl:${ipHash}`, 5, 3600_000)) return { ok: false, message: "Please try again later." };
  if (parsed.data.company) return { ok: true, message: "Thank you. You're on the list." };
  try {
    await db().upsert("newsletter_subscribers", [{ email: parsed.data.email }], "email");
  } catch {
    // already subscribed — treat as success
  }
  return { ok: true, message: "Thank you. You're on the list." };
}

export async function sendContactMessage(_prev: ActionState, form: FormData): Promise<ActionState> {
  const parsed = contactSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] ??= i.message;
    return { ok: false, message: "Please check the highlighted fields.", fieldErrors };
  }
  const { ipHash } = await clientInfo();
  if (!softLimit(`contact:${ipHash}`, 5, 3600_000)) return { ok: false, message: "Please try again later or WhatsApp us." };
  if (parsed.data.company) return { ok: true, message: "Thank you — we'll be in touch shortly." };
  await db().insert("contact_messages", [
    {
      name: parsed.data.name,
      phone: parsed.data.phone ?? null,
      email: parsed.data.email ?? null,
      message: parsed.data.message,
      is_read: false,
    },
  ]);
  return { ok: true, message: "Thank you — we'll be in touch shortly." };
}

export async function trackOrderAction(
  input: unknown,
): Promise<{ ok: true; order: import("@/lib/orders/lookup").CustomerOrderView } | { ok: false; message: string }> {
  const { trackOrderSchema } = await import("@/lib/validation/schemas");
  const parsed = trackOrderSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Check your details" };
  const { ipHash } = await clientInfo();
  if (!softLimit(`track:${ipHash}`, 20, 3600_000)) return { ok: false, message: "Too many attempts. Please try again later." };
  const { getCustomerOrder } = await import("@/lib/orders/lookup");
  const order = await getCustomerOrder(parsed.data.orderNumber, { phone: parsed.data.phone });
  if (!order) return { ok: false, message: "We couldn't find an order with that number and phone." };
  return { ok: true, order };
}
