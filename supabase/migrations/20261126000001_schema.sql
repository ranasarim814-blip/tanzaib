-- Tanzaib schema
-- Run with `supabase db push` or paste into the Supabase SQL editor (see README).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- enums
do $$ begin
  create type embroidery_type as enum ('zardozi','tilla','dabka','resham','mirror','gota','mixed');
exception when duplicate_object then null; end $$;
do $$ begin
  create type discount_type as enum ('none','percentage','flat');
exception when duplicate_object then null; end $$;
do $$ begin
  create type product_status as enum ('draft','published','archived');
exception when duplicate_object then null; end $$;
do $$ begin
  create type image_kind as enum ('front','back','detail','hanger','gallery');
exception when duplicate_object then null; end $$;
do $$ begin
  create type size_code as enum ('XS','S','M','L','XL','CUSTOM');
exception when duplicate_object then null; end $$;
do $$ begin
  create type order_status as enum ('pending','confirmed','processing','dispatched','delivered','cancelled','returned');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------- helpers
create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ---------------------------------------------------------------- tables
create table if not exists admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);

-- security definer so policies can call it without recursion
create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  cover_image text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  sku text not null unique,
  category_id uuid not null references categories(id) on delete restrict,
  short_description text,
  description text,
  fabric text,
  embroidery_type embroidery_type,
  pieces text,
  colour text,
  price numeric(12,0) not null check (price >= 0),
  discount_type discount_type not null default 'none',
  discount_value numeric(12,2) not null default 0 check (discount_value >= 0),
  discount_starts_at timestamptz,
  discount_ends_at timestamptz,
  is_made_to_order boolean not null default false,
  lead_time_days int,
  handwork_hours int,
  allow_custom_stitching boolean not null default true,
  show_in_wardrobe boolean not null default false,
  wardrobe_order int not null default 0,
  is_featured boolean not null default false,
  is_new_arrival boolean not null default false,
  status product_status not null default 'draft',
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint discount_percentage_cap check (discount_type <> 'percentage' or discount_value <= 90),
  constraint discount_window check (discount_starts_at is null or discount_ends_at is null or discount_starts_at < discount_ends_at)
);
create index if not exists products_status_idx on products(status);
create index if not exists products_category_idx on products(category_id);
create index if not exists products_wardrobe_idx on products(show_in_wardrobe, wardrobe_order);
drop trigger if exists products_updated_at on products;
create trigger products_updated_at before update on products for each row execute function set_updated_at();

create table if not exists product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  url text not null,
  kind image_kind not null default 'gallery',
  alt text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists product_images_product_idx on product_images(product_id, sort_order);

create table if not exists product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  size size_code not null,
  stock int not null default 0 check (stock >= 0),
  created_at timestamptz not null default now(),
  unique (product_id, size)
);

create sequence if not exists order_number_seq start 1;

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  public_token text not null default encode(gen_random_bytes(16), 'hex'),
  customer_name text not null,
  phone text not null,
  alt_phone text,
  email text,
  city text not null,
  area text,
  address text not null,
  postal_code text,
  notes text,
  subtotal numeric(12,0) not null,
  discount_total numeric(12,0) not null default 0,
  delivery_charge numeric(12,0) not null default 0,
  total numeric(12,0) not null,
  payment_method text not null default 'COD' check (payment_method = 'COD'),
  status order_status not null default 'pending',
  admin_notes text,
  tracking_number text,
  courier text,
  ip_hash text,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists orders_phone_idx on orders(phone, created_at desc);
create index if not exists orders_ip_idx on orders(ip_hash, created_at desc);
create index if not exists orders_status_idx on orders(status, created_at desc);
drop trigger if exists orders_updated_at on orders;
create trigger orders_updated_at before update on orders for each row execute function set_updated_at();

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  product_name text not null,
  sku text not null,
  size size_code not null,
  quantity int not null check (quantity between 1 and 5),
  unit_price numeric(12,0) not null,
  unit_discount numeric(12,0) not null default 0,
  line_total numeric(12,0) not null,
  custom_measurements jsonb,
  image_url text
);
create index if not exists order_items_order_idx on order_items(order_id);

create table if not exists order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  status order_status not null,
  note text,
  changed_by text,
  created_at timestamptz not null default now()
);
create index if not exists order_status_history_order_idx on order_status_history(order_id, created_at);

create table if not exists blocked_phones (
  phone text primary key,
  reason text,
  created_at timestamptz not null default now()
);

create table if not exists newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists settings (
  key text primary key,
  value jsonb not null
);

-- ---------------------------------------------------------------- order placement
-- Called by the server (service role) after it has re-priced every line from the DB.
-- Locks + decrements stock atomically; any failure rolls back the whole order.
create or replace function place_order(p_order jsonb, p_items jsonb)
returns table (id uuid, order_number text, public_token text)
language plpgsql security definer set search_path = public as $$
declare
  v_item jsonb;
  v_id uuid;
  v_number text;
  v_token text;
begin
  if jsonb_array_length(p_items) = 0 then
    raise exception 'EMPTY_ORDER';
  end if;

  for v_item in select * from jsonb_array_elements(p_items) loop
    if coalesce((v_item->>'decrement')::boolean, false) then
      update product_variants pv
         set stock = pv.stock - (v_item->>'quantity')::int
       where pv.product_id = (v_item->>'product_id')::uuid
         and pv.size = (v_item->>'size')::size_code
         and pv.stock >= (v_item->>'quantity')::int;
      if not found then
        raise exception 'OUT_OF_STOCK:%', v_item->>'product_name';
      end if;
    end if;
  end loop;

  v_number := 'TZ-' || to_char(now() at time zone 'Asia/Karachi', 'YYYY') || '-'
              || lpad(nextval('order_number_seq')::text, 5, '0');
  v_token := coalesce(nullif(p_order->>'public_token', ''), encode(gen_random_bytes(16), 'hex'));

  insert into orders (
    order_number, public_token, customer_name, phone, alt_phone, email, city, area, address,
    postal_code, notes, subtotal, discount_total, delivery_charge, total, payment_method,
    ip_hash, user_agent
  ) values (
    v_number, v_token, p_order->>'customer_name', p_order->>'phone', p_order->>'alt_phone',
    p_order->>'email', p_order->>'city', p_order->>'area', p_order->>'address',
    p_order->>'postal_code', p_order->>'notes',
    (p_order->>'subtotal')::numeric, (p_order->>'discount_total')::numeric,
    (p_order->>'delivery_charge')::numeric, (p_order->>'total')::numeric, 'COD',
    p_order->>'ip_hash', p_order->>'user_agent'
  ) returning orders.id into v_id;

  insert into order_items (
    order_id, product_id, product_name, sku, size, quantity, unit_price, unit_discount,
    line_total, custom_measurements, image_url
  )
  select v_id, (i->>'product_id')::uuid, i->>'product_name', i->>'sku', (i->>'size')::size_code,
         (i->>'quantity')::int, (i->>'unit_price')::numeric, (i->>'unit_discount')::numeric,
         (i->>'line_total')::numeric, nullif(i->'custom_measurements', 'null'::jsonb), i->>'image_url'
    from jsonb_array_elements(p_items) i;

  insert into order_status_history (order_id, status, note)
  values (v_id, 'pending', 'Order placed (Cash on Delivery)');

  return query select v_id, v_number, v_token;
end $$;

revoke all on function place_order(jsonb, jsonb) from public;
do $$ begin
  execute 'revoke all on function place_order(jsonb, jsonb) from anon, authenticated';
exception when undefined_object then null; end $$;
