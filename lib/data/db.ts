import "server-only";
import type {
  BlockedPhone,
  Category,
  ContactMessage,
  NewsletterSubscriber,
  Order,
  OrderItem,
  OrderStatusHistory,
  Product,
  ProductImage,
  ProductVariant,
} from "@/lib/types";

export interface SettingRow {
  key: string;
  value: unknown;
}
export interface AdminRow {
  user_id: string;
  email: string;
  created_at: string;
}

export interface OrderRow extends Order {
  public_token: string;
}

export interface Tables {
  categories: Category;
  products: Product;
  product_images: ProductImage;
  product_variants: ProductVariant;
  orders: OrderRow;
  order_items: OrderItem;
  order_status_history: OrderStatusHistory;
  blocked_phones: BlockedPhone;
  newsletter_subscribers: NewsletterSubscriber;
  contact_messages: ContactMessage;
  settings: SettingRow;
  admins: AdminRow;
}
export type TableName = keyof Tables;

export interface Query<T> {
  eq?: Partial<Record<keyof T & string, string | number | boolean | null>>;
  in?: { column: keyof T & string; values: (string | number)[] };
  gte?: Partial<Record<keyof T & string, string | number>>;
  lte?: Partial<Record<keyof T & string, string | number>>;
  /** case-insensitive "contains" across several columns (OR) */
  search?: { columns: (keyof T & string)[]; term: string };
  order?: { column: keyof T & string; ascending?: boolean }[];
  limit?: number;
  offset?: number;
}

export interface PlaceOrderItem {
  product_id: string;
  product_name: string;
  sku: string;
  size: string;
  quantity: number;
  unit_price: number;
  unit_discount: number;
  line_total: number;
  custom_measurements: unknown | null;
  image_url: string | null;
  /** false for made-to-order and CUSTOM lines */
  decrement: boolean;
}

export type PlaceOrderPayload = Omit<
  OrderRow,
  "id" | "order_number" | "created_at" | "updated_at" | "status" | "admin_notes" | "tracking_number" | "courier"
>;

export class OutOfStockError extends Error {
  constructor(public productName: string) {
    super(`OUT_OF_STOCK:${productName}`);
  }
}

export interface Db {
  readonly kind: "supabase" | "memory";
  select<K extends TableName>(table: K, q?: Query<Tables[K]>): Promise<Tables[K][]>;
  count<K extends TableName>(table: K, q?: Query<Tables[K]>): Promise<number>;
  insert<K extends TableName>(table: K, rows: Partial<Tables[K]>[]): Promise<Tables[K][]>;
  update<K extends TableName>(
    table: K,
    match: Query<Tables[K]>,
    patch: Partial<Tables[K]>,
  ): Promise<Tables[K][]>;
  remove<K extends TableName>(table: K, match: Query<Tables[K]>): Promise<void>;
  upsert<K extends TableName>(
    table: K,
    rows: Partial<Tables[K]>[],
    onConflict: string,
  ): Promise<Tables[K][]>;
  /** Atomically decrement stock, create the order, its items and first history row. */
  placeOrder(
    order: PlaceOrderPayload,
    items: PlaceOrderItem[],
  ): Promise<{ id: string; order_number: string; public_token: string }>;
  /** Upload a file to product storage; returns its public URL. */
  uploadFile(path: string, body: Uint8Array, contentType: string): Promise<string>;
  /** Best-effort delete of files previously returned by uploadFile. */
  deleteFiles(urls: string[]): Promise<void>;
}
