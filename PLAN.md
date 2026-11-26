# Tanzaib v1 — Build Plan

## Phases
1. **Foundation** — Next.js 16 (App Router, Cache Components), Tailwind v4 tokens, fonts (Cormorant Garamond, Manrope, Noto Nastaliq Urdu), i18n dictionary, header / footer / announcement bar, logo + favicon.
2. **Data** — Supabase SQL migrations (schema, RLS, `place_order` function, order-number sequence, storage bucket), seed SQL, dummy SVG art generator, shared types, `getEffectivePrice`, Zod schemas, data repository (Supabase backend + in-memory demo backend).
3. **Storefront** — Home (Wardrobe hero, marquee, collections, new arrivals, The Craft, promise, lookbook, newsletter), Shop + collections with URL filters, Product page (gallery, magnifier, sizes, custom stitching, WhatsApp, accordions, related).
4. **Cart & COD** — Zustand bag (persisted), drawer + `/cart`, `/checkout` (RHF + Zod), server order creation (server-side pricing, atomic stock, anti-fake-order), `/order/[orderNumber]` gift-box success, `/track`.
5. **Admin** — Supabase auth (+ demo-mode login), proxy + server guard, dashboard, products CRUD (tabs, discount preview, images, stock, wardrobe), bulk actions, orders (status history, invoice, CSV, block phone), customers, categories, messages, newsletter, settings.
6. **Polish** — page transitions, thread-draw dividers, cursor, SEO (metadata, sitemap, robots, JSON-LD), analytics hooks, a11y, tests (Vitest + Playwright).
7. **Docs** — README for non-developers, deployment guide, decisions to confirm.

## Folder structure
```
app/
  (store)/            storefront routes (shared header/footer/cart drawer)
  admin/              login + (panel) routes, all noindex, server-guarded
  api/                route handlers (track, demo uploads, csv export)
components/
  ui/                 shadcn-style primitives (Radix based)
  store/              storefront components
  admin/              admin components
  wardrobe/           Wardrobe (Almari) hero
  motion/             reusable motion pieces (thread-draw, reveal, page transition)
lib/
  supabase/           server / browser / admin clients
  data/               repository interface + supabase + memory backends
  pricing/            getEffectivePrice, order totals
  validation/         Zod schemas (shared client/server), phone normalisation
  demo/               dummy catalog (single source for seed + demo mode)
  i18n/               string dictionary (English)
  utils/              formatting, slug, cn
supabase/migrations/  SQL migrations
supabase/seed.sql     generated from lib/demo
scripts/              generate-dummy-art, generate-seed, create-admin, seed-storage
tests/                vitest unit tests, playwright e2e
```

## Data model
See `supabase/migrations/0001_schema.sql`. Tables: categories, products, product_images,
product_variants, orders, order_items, order_status_history, blocked_phones,
newsletter_subscribers, contact_messages, settings, admins. RLS on every table.

## Key design decisions
- **Demo mode:** when Supabase env vars are missing the app runs on an in-memory copy of the
  dummy catalog (orders/admin edits live until the server restarts). This lets the site be
  previewed, built and tested without a database. Real deployments set Supabase env vars.
- **Prices are never trusted from the client.** The server re-prices every line with
  `getEffectivePrice` and the Postgres `place_order` function locks and decrements stock atomically.
- **Caching:** catalog reads use `'use cache'` + `cacheTag('catalog')`; admin mutations call
  `updateTag`. Prices are recomputed client-side at render time so scheduled discounts flip on time.
