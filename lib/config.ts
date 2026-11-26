import type { StoreSettings } from "@/lib/types";

export const BRAND = {
  name: "Tanzaib",
  wordmark: "TANZAIB",
  urdu: "تنزیب",
  tagline: "Hand-embroidered heirlooms",
  country: "Pakistan",
  currency: "PKR",
  orderPrefix: "TZ",
} as const;

export const DEFAULT_SETTINGS: StoreSettings = {
  delivery_charge: 250,
  free_delivery_threshold: 15000,
  whatsapp_number: process.env.NEXT_PUBLIC_WHATSAPP || "+920000000000",
  announcement: "Complimentary delivery across Pakistan on orders of Rs. 15,000 and above",
  hero_eyebrow: "The Almari · Spring Atelier",
  hero_title: "Hand-embroidered heirlooms",
  hero_subtitle:
    "Each piece is traced, stitched and finished by hand in our Lahore atelier — made to be kept.",
  instagram: "https://instagram.com/tanzaib",
  facebook: "",
  tiktok: "",
  ready_to_wear_days: "5–7 working days",
  made_to_order_weeks: "2–4 weeks",
};

export const CATEGORY_ORDER = ["bridal", "formal", "luxury-pret", "festive", "unstitched"] as const;

export const isSupabaseConfigured = () =>
  Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
