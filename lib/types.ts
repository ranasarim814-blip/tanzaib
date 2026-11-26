export const SIZES = ["XS", "S", "M", "L", "XL", "CUSTOM"] as const;
export type Size = (typeof SIZES)[number];
export const STANDARD_SIZES = ["XS", "S", "M", "L", "XL"] as const;

export const EMBROIDERY_TYPES = [
  "zardozi",
  "tilla",
  "dabka",
  "resham",
  "mirror",
  "gota",
  "mixed",
] as const;
export type EmbroideryType = (typeof EMBROIDERY_TYPES)[number];

export const DISCOUNT_TYPES = ["none", "percentage", "flat"] as const;
export type DiscountType = (typeof DISCOUNT_TYPES)[number];

export const PRODUCT_STATUSES = ["draft", "published", "archived"] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export const IMAGE_KINDS = ["front", "back", "detail", "hanger", "gallery"] as const;
export type ImageKind = (typeof IMAGE_KINDS)[number];

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "dispatched",
  "delivered",
  "cancelled",
  "returned",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  cover_image: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  kind: ImageKind;
  alt: string | null;
  sort_order: number;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  size: Size;
  stock: number;
}

/** Fields needed to compute a price. Kept minimal so it can be shipped to the client. */
export interface Priceable {
  price: number;
  discount_type: DiscountType;
  discount_value: number;
  discount_starts_at: string | null;
  discount_ends_at: string | null;
}

export interface Product extends Priceable {
  id: string;
  name: string;
  slug: string;
  sku: string;
  category_id: string;
  short_description: string | null;
  description: string | null;
  fabric: string | null;
  embroidery_type: EmbroideryType | null;
  pieces: string | null;
  colour: string | null;
  is_made_to_order: boolean;
  lead_time_days: number | null;
  handwork_hours: number | null;
  allow_custom_stitching: boolean;
  show_in_wardrobe: boolean;
  wardrobe_order: number;
  is_featured: boolean;
  is_new_arrival: boolean;
  status: ProductStatus;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductWithRelations extends Product {
  category: Pick<Category, "id" | "name" | "slug"> | null;
  images: ProductImage[];
  variants: ProductVariant[];
}

export interface CustomMeasurements {
  shirt_length: number;
  chest: number;
  waist: number;
  hip: number;
  shoulder: number;
  sleeve: number;
  trouser_length: number;
  notes?: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  phone: string;
  alt_phone: string | null;
  email: string | null;
  city: string;
  area: string | null;
  address: string;
  postal_code: string | null;
  notes: string | null;
  subtotal: number;
  discount_total: number;
  delivery_charge: number;
  total: number;
  payment_method: "COD";
  status: OrderStatus;
  admin_notes: string | null;
  tracking_number: string | null;
  courier: string | null;
  ip_hash: string | null;
  user_agent: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  sku: string;
  size: Size;
  quantity: number;
  unit_price: number;
  unit_discount: number;
  line_total: number;
  custom_measurements: CustomMeasurements | null;
  image_url: string | null;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  status: OrderStatus;
  note: string | null;
  changed_by: string | null;
  created_at: string;
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
  history: OrderStatusHistory[];
}

export interface BlockedPhone {
  phone: string;
  reason: string | null;
  created_at: string;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  created_at: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  message: string;
  created_at: string;
  is_read: boolean;
}

export interface StoreSettings {
  delivery_charge: number;
  free_delivery_threshold: number;
  whatsapp_number: string;
  announcement: string;
  hero_eyebrow: string;
  hero_title: string;
  hero_subtitle: string;
  instagram: string;
  facebook: string;
  tiktok: string;
  ready_to_wear_days: string;
  made_to_order_weeks: string;
}

/** Lightweight shape used by cards, the wardrobe and the bag. */
export interface ProductSummary extends Priceable {
  id: string;
  name: string;
  slug: string;
  sku: string;
  category: { name: string; slug: string } | null;
  colour: string | null;
  fabric: string | null;
  embroidery_type: EmbroideryType | null;
  is_made_to_order: boolean;
  lead_time_days: number | null;
  is_new_arrival: boolean;
  created_at: string;
  front: string | null;
  back: string | null;
  hanger: string | null;
  frontAlt: string | null;
  totalStock: number;
  sizes: { size: Size; stock: number }[];
  allow_custom_stitching: boolean;
}
