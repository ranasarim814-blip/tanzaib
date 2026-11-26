-- Row Level Security. All storefront writes go through server code using the service role,
-- so the public (anon) role only ever gets read access to the published catalogue.

alter table admins enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table product_images enable row level security;
alter table product_variants enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table order_status_history enable row level security;
alter table blocked_phones enable row level security;
alter table newsletter_subscribers enable row level security;
alter table contact_messages enable row level security;
alter table settings enable row level security;

-- ---------------- public catalogue (read only)
drop policy if exists "public read active categories" on categories;
create policy "public read active categories" on categories
  for select using (is_active or is_admin());

drop policy if exists "public read published products" on products;
create policy "public read published products" on products
  for select using (status = 'published' or is_admin());

drop policy if exists "public read images of published products" on product_images;
create policy "public read images of published products" on product_images
  for select using (
    exists (select 1 from products p where p.id = product_id and p.status = 'published') or is_admin()
  );

drop policy if exists "public read variants of published products" on product_variants;
create policy "public read variants of published products" on product_variants
  for select using (
    exists (select 1 from products p where p.id = product_id and p.status = 'published') or is_admin()
  );

drop policy if exists "public read settings" on settings;
create policy "public read settings" on settings for select using (true);

-- ---------------- admin-only writes on catalogue + settings
do $$
declare t text;
begin
  foreach t in array array['categories','products','product_images','product_variants','settings'] loop
    execute format('drop policy if exists "admin write %1$s" on %1$I', t);
    execute format(
      'create policy "admin write %1$s" on %1$I for all using (is_admin()) with check (is_admin())', t);
  end loop;
end $$;

-- ---------------- private tables: admins only (orders are tracked via a server route)
do $$
declare t text;
begin
  foreach t in array array['orders','order_items','order_status_history','blocked_phones',
                           'newsletter_subscribers','contact_messages'] loop
    execute format('drop policy if exists "admin all %1$s" on %1$I', t);
    execute format(
      'create policy "admin all %1$s" on %1$I for all using (is_admin()) with check (is_admin())', t);
  end loop;
end $$;

drop policy if exists "admins read self" on admins;
create policy "admins read self" on admins for select using (user_id = auth.uid());
-- no insert/update/delete policy on admins: manage via SQL editor or scripts/create-admin.ts
