import { z } from "zod";
import {
  DISCOUNT_TYPES,
  EMBROIDERY_TYPES,
  IMAGE_KINDS,
  ORDER_STATUSES,
  PRODUCT_STATUSES,
  SIZES,
} from "@/lib/types";
import { normalizePkPhone } from "./phone";

export const MAX_QTY_PER_LINE = 5;

const trimmed = (min: number, max: number, label: string) =>
  z
    .string()
    .trim()
    .min(min, `${label} must be at least ${min} characters`)
    .max(max, `${label} must be at most ${max} characters`);

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));

export const pkPhone = z
  .string()
  .trim()
  .min(1, "Phone number is required")
  .refine((v) => normalizePkPhone(v) !== null, "Enter a valid Pakistani mobile, e.g. 03001234567")
  .transform((v) => normalizePkPhone(v) as string);

const optionalPkPhone = z
  .string()
  .trim()
  .optional()
  .refine((v) => !v || normalizePkPhone(v) !== null, "Enter a valid Pakistani mobile")
  .transform((v) => (v ? (normalizePkPhone(v) as string) : undefined));

const optionalEmail = z
  .string()
  .trim()
  .optional()
  .refine((v) => !v || z.email().safeParse(v).success, "Enter a valid email address")
  .transform((v) => (v ? v.toLowerCase() : undefined));

const measurement = (label: string) =>
  z.coerce
    .number({ error: `${label} is required` })
    .min(5, `${label} looks too small (inches)`)
    .max(80, `${label} looks too large (inches)`);

export const measurementsSchema = z.object({
  shirt_length: measurement("Shirt length"),
  chest: measurement("Chest"),
  waist: measurement("Waist"),
  hip: measurement("Hip"),
  shoulder: measurement("Shoulder"),
  sleeve: measurement("Sleeve"),
  trouser_length: measurement("Trouser length"),
  notes: optionalText(500),
});
export type MeasurementsInput = z.input<typeof measurementsSchema>;

export const cartLineSchema = z
  .object({
    productId: z.string().min(1).max(64),
    size: z.enum(SIZES),
    quantity: z.coerce.number().int().min(1).max(MAX_QTY_PER_LINE),
    measurements: measurementsSchema.optional(),
  })
  .refine((l) => l.size !== "CUSTOM" || l.measurements, {
    message: "Custom stitching needs measurements",
    path: ["measurements"],
  });

/** Customer details on the checkout form. */
export const checkoutFormSchema = z.object({
  customer_name: trimmed(3, 60, "Full name"),
  phone: pkPhone,
  alt_phone: optionalPkPhone,
  email: optionalEmail,
  city: z.string().trim().min(2, "Please choose your city").max(60),
  other_city: optionalText(60),
  area: trimmed(2, 80, "Area / sector"),
  address: trimmed(10, 300, "Address"),
  postal_code: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || /^\d{5}$/.test(v), "Postal code is 5 digits")
    .transform((v) => (v ? v : undefined)),
  notes: optionalText(500),
  /** Honeypot. Real users never see or fill this. */
  website: z.string().max(0).optional().or(z.literal("")),
});
export type CheckoutFormInput = z.input<typeof checkoutFormSchema>;
export type CheckoutFormData = z.output<typeof checkoutFormSchema>;

export const placeOrderSchema = z
  .object({
    customer: checkoutFormSchema,
    lines: z.array(cartLineSchema).min(1, "Your bag is empty").max(20),
  })
  .superRefine((v, ctx) => {
    if (v.customer.city === "Other" && !v.customer.other_city) {
      ctx.addIssue({
        code: "custom",
        message: "Please type your city",
        path: ["customer", "other_city"],
      });
    }
  });
export type PlaceOrderInput = z.input<typeof placeOrderSchema>;

export const trackOrderSchema = z.object({
  orderNumber: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^TZ-\d{4}-\d{5,}$/, "Order numbers look like TZ-2026-00001"),
  phone: pkPhone,
});

export const newsletterSchema = z.object({
  email: z.email("Enter a valid email address").trim().toLowerCase(),
  company: z.string().max(0).optional().or(z.literal("")),
});

export const contactSchema = z.object({
  name: trimmed(2, 60, "Name"),
  phone: optionalPkPhone,
  email: optionalEmail,
  message: trimmed(10, 2000, "Message"),
  company: z.string().max(0).optional().or(z.literal("")),
});

/* ---------------------------- Admin schemas ---------------------------- */

const nullableText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .optional()
    .transform((v) => (v ? v : null));

const nullableDate = z
  .string()
  .trim()
  .nullable()
  .optional()
  .refine((v) => !v || !Number.isNaN(new Date(v).getTime()), "Invalid date")
  .transform((v) => (v ? new Date(v).toISOString() : null));

export const productFormSchema = z
  .object({
    name: trimmed(2, 120, "Name"),
    slug: z
      .string()
      .trim()
      .min(2)
      .max(90)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and dashes"),
    sku: z
      .string()
      .trim()
      .min(2)
      .max(40)
      .regex(/^[A-Za-z0-9-_]+$/, "Letters, numbers, - and _ only")
      .transform((v) => v.toUpperCase()),
    category_id: z.string().min(1, "Choose a category"),
    short_description: nullableText(300),
    description: nullableText(8000),
    fabric: nullableText(120),
    embroidery_type: z.enum(EMBROIDERY_TYPES).nullable().optional().transform((v) => v ?? null),
    pieces: nullableText(120),
    colour: nullableText(60),
    handwork_hours: z.coerce.number().int().min(0).max(2000).nullable().optional().transform((v) => v ?? null),
    price: z.coerce.number().int("Whole rupees only").min(0).max(10_000_000),
    discount_type: z.enum(DISCOUNT_TYPES),
    discount_value: z.coerce.number().min(0).max(10_000_000),
    discount_starts_at: nullableDate,
    discount_ends_at: nullableDate,
    is_made_to_order: z.boolean(),
    lead_time_days: z.coerce.number().int().min(0).max(365).nullable().optional().transform((v) => v ?? null),
    allow_custom_stitching: z.boolean(),
    show_in_wardrobe: z.boolean(),
    wardrobe_order: z.coerce.number().int().min(0).max(999),
    is_featured: z.boolean(),
    is_new_arrival: z.boolean(),
    status: z.enum(PRODUCT_STATUSES),
    seo_title: nullableText(70),
    seo_description: nullableText(170),
    variants: z
      .array(z.object({ size: z.enum(SIZES), stock: z.coerce.number().int().min(0).max(9999) }))
      .max(SIZES.length),
    images: z
      .array(
        z.object({
          id: z.string().optional(),
          url: z.string().min(1).max(1000),
          kind: z.enum(IMAGE_KINDS),
          alt: nullableText(200),
        }),
      )
      .max(30),
  })
  .superRefine((v, ctx) => {
    if (v.discount_type === "percentage" && v.discount_value > 90) {
      ctx.addIssue({ code: "custom", message: "Maximum 90%", path: ["discount_value"] });
    }
    if (v.discount_type === "flat" && v.discount_value > v.price) {
      ctx.addIssue({ code: "custom", message: "Can't exceed the price", path: ["discount_value"] });
    }
    if (
      v.discount_starts_at &&
      v.discount_ends_at &&
      new Date(v.discount_starts_at) >= new Date(v.discount_ends_at)
    ) {
      ctx.addIssue({ code: "custom", message: "End must be after start", path: ["discount_ends_at"] });
    }
    if (v.status === "published" && !v.images.some((i) => i.kind === "front")) {
      ctx.addIssue({ code: "custom", message: "A published product needs a front image", path: ["images"] });
    }
  });
export type ProductFormInput = z.input<typeof productFormSchema>;
export type ProductFormData = z.output<typeof productFormSchema>;

export const categoryFormSchema = z.object({
  name: trimmed(2, 60, "Name"),
  slug: z.string().trim().min(2).max(60).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: nullableText(400),
  cover_image: nullableText(1000),
  sort_order: z.coerce.number().int().min(0).max(999),
  is_active: z.boolean(),
});
export type CategoryFormData = z.output<typeof categoryFormSchema>;

export const orderStatusUpdateSchema = z.object({
  status: z.enum(ORDER_STATUSES),
  note: nullableText(500),
});

export const orderMetaSchema = z.object({
  admin_notes: nullableText(2000),
  courier: nullableText(60),
  tracking_number: nullableText(80),
});

export const bulkDiscountSchema = z
  .object({
    ids: z.array(z.string()).min(1).max(500),
    discount_type: z.enum(DISCOUNT_TYPES),
    discount_value: z.coerce.number().min(0).max(10_000_000),
    discount_starts_at: nullableDate,
    discount_ends_at: nullableDate,
  })
  .refine((v) => v.discount_type !== "percentage" || v.discount_value <= 90, {
    message: "Maximum 90%",
    path: ["discount_value"],
  });

export const settingsSchema = z.object({
  delivery_charge: z.coerce.number().int().min(0).max(100_000),
  free_delivery_threshold: z.coerce.number().int().min(0).max(10_000_000),
  whatsapp_number: z
    .string()
    .trim()
    .regex(/^\+?\d[\d\s-]{7,18}$/, "Use the international format, e.g. +923001234567"),
  announcement: z.string().trim().max(160),
  hero_eyebrow: z.string().trim().max(60),
  hero_title: z.string().trim().max(80),
  hero_subtitle: z.string().trim().max(200),
  instagram: z.string().trim().max(200),
  facebook: z.string().trim().max(200),
  tiktok: z.string().trim().max(200),
  ready_to_wear_days: z.string().trim().max(40),
  made_to_order_weeks: z.string().trim().max(40),
});
