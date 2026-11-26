# Tanzaib — تنزیب

Luxury hand-embroidered eastern wear. A minimal, premium e-commerce site with Cash on Delivery
checkout, an animated **Wardrobe (Almari)** hero, and a full admin panel.

Built with Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Motion, Lenis, Supabase
(Postgres, Auth, Storage), React Hook Form + Zod, Zustand, and Resend (optional).

---

## Contents

1. [Try it in 5 minutes (no database)](#1-try-it-in-5-minutes-no-database)
2. [Set up the real database (Supabase)](#2-set-up-the-real-database-supabase)
3. [Create your admin account](#3-create-your-admin-account)
4. [Put the site online (Vercel)](#4-put-the-site-online-vercel)
5. [How to replace dummy products and photos](#5-how-to-replace-dummy-products-and-photos)
6. [Everyday admin tasks](#6-everyday-admin-tasks)
7. [Environment variables](#7-environment-variables)
8. [For developers](#8-for-developers)
9. [Decisions to confirm](#9-decisions-to-confirm)

---

## 1. Try it in 5 minutes (no database)

You need **Node.js 20.9 or newer** (from [nodejs.org](https://nodejs.org)) and **pnpm**.

```bash
npm install -g pnpm
```

```bash
git clone <your-repo-url> tanzaib
```

```bash
cd tanzaib
```

```bash
pnpm install
```

```bash
pnpm dev
```

Open <http://localhost:3000>.

Without Supabase settings the site runs in **demo mode**. It uses the 12 dummy products and
3 sample orders, and anything you change (orders, admin edits) is kept only until the server
restarts.

The admin panel is at <http://localhost:3000/admin>. In demo mode, sign in with
`admin@tanzaib.pk` and the password `tanzaib-demo`. That password only works on your own
computer (`pnpm dev`). On a live server, set `DEMO_ADMIN_PASSWORD` instead.

## 2. Set up the real database (Supabase)

1. Create a free project at [supabase.com](https://supabase.com). Choose the Mumbai or
   Singapore region (closest to Pakistan) and save the database password somewhere safe.
2. In Supabase, open **SQL Editor → New query** and run each of these files in order. Paste
   the whole file and click **Run**:
   1. `supabase/migrations/20261126000001_schema.sql`
   2. `supabase/migrations/20261126000002_rls.sql`
   3. `supabase/migrations/20261126000003_storage.sql`
   4. `supabase/seed.sql` (the dummy products and 3 sample orders; skip it if you want an empty shop)
3. Open **Project Settings → API** and copy the **Project URL**, the **anon public** key and
   the **service_role** key.
4. In the project folder, copy `.env.example` to a new file called `.env.local` and fill it in:

   ```
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   SUPABASE_SERVICE_ROLE_KEY=eyJ...   # secret, never share or commit
   ADMIN_EMAIL=you@yourdomain.com
   SESSION_SECRET=<any long random text>
   NEXT_PUBLIC_WHATSAPP=+923001234567
   ```

5. Restart `pnpm dev`. The demo-mode banner in the admin disappears, and everything is now
   saved in Supabase.

If you have the [Supabase CLI](https://supabase.com/docs/guides/cli), you can run
`supabase link` and then `supabase db push` instead of step 2.

## 3. Create your admin account

There is no public sign-up. Admins are created with a script:

```bash
pnpm create-admin --password 'choose-a-strong-password'
```

This creates the user `ADMIN_EMAIL` and adds it to the `admins` table. If you run
`pnpm create-admin` without `--password`, Supabase emails an invitation link instead.

To add another admin later, run the same command with `--email=other@yourdomain.com`.
Removing someone's row from the `admins` table (Supabase → Table editor) removes their access
immediately.

In Supabase, go to **Authentication → Sign In / Providers** and turn off **Allow new users to
sign up**. Only the script should create users.

## 4. Put the site online (Vercel)

1. Push this project to GitHub.
2. At [vercel.com](https://vercel.com), click **Add New → Project**, choose the repository, and
   keep the defaults (it detects Next.js and pnpm).
3. Under **Environment Variables**, add everything from your `.env.local`. Set
   `NEXT_PUBLIC_SITE_URL` to your real address, e.g. `https://tanzaib.pk`.
4. Click **Deploy**. When it finishes, add your domain under **Settings → Domains**.
5. In Supabase, go to **Authentication → URL Configuration** and set the Site URL to your
   domain.

Optional: for new-order emails, create a [Resend](https://resend.com) account, verify your
domain, and add `RESEND_API_KEY` and `RESEND_FROM` (e.g. `Tanzaib <orders@tanzaib.pk>`).
Without them, emails are silently skipped.

## 5. How to replace dummy products and photos

The dummy products use generated placeholder art (in `public/dummy/`), so nothing looks
broken before your photos are ready.

**Photos each product needs**

| Type | Required? | Notes |
|---|---|---|
| `front` | **Yes** | 3:4 portrait (e.g. 1200×1600). Used on cards, the product page and the Wardrobe stage. |
| `back` | Recommended | Shown when hovering over a product card, and in the Back view. |
| `detail` ×2–4 | Recommended | Close-ups of the embroidery. Customers can magnify them. |
| `hanger` | For the Wardrobe | The suit on a hanger, cut out on a **transparent background** (PNG/WebP). Without it, the front photo is used with a soft fade. |

**Steps**

1. Go to **Admin → Products → (a product) → Images**.
2. Drag your photos in. They are automatically resized to 1600px and converted to WebP.
3. Set each photo's type (front / back / detail / hanger), write a short description in the
   alt text field, and drag the photos into order.
4. Remove the old placeholder images and click **Save changes**. Removed uploaded files are
   deleted from storage.
5. Edit the name, description, price and sizes on the other tabs, or archive the dummy
   products and add your own with **Add product**.

To choose what hangs in the Wardrobe, go to **Visibility**, turn on **Show in the Wardrobe
hero**, and set its position (the first 7 are shown).

Other placeholders:
- **Lookbook images:** `public/dummy/lookbook/look-*.svg`. Replace the files, keeping the
  names, or edit `components/store/home/Lookbook.tsx`.
- **Logo:** the text wordmark is in `components/store/Logo.tsx`. The favicon is `app/icon.svg`.
- **Policy and FAQ text:** `lib/content/policies.ts`. Other site copy is in `lib/i18n/en.ts`.
- **Delivery charges, WhatsApp number, announcement bar and hero text:** Admin → Settings.

## 6. Everyday admin tasks

- **New order:** it appears as *Pending*. Use **WhatsApp customer** (the message is pre-filled),
  then set the status to *Confirmed → Processing → Dispatched* (add courier and tracking
  number) → *Delivered*. Each change is recorded in the status history.
- **Fake order:** cancel it (stock is returned automatically) and click **Block this phone**.
- **Print a packing slip:** order page → **Invoice / packing slip** → Print.
- **Run a sale:** Products → tick several products → **Apply discount** (percentage or flat,
  with optional start and end dates). The admin preview shows exactly what customers will see.
- **Export:** Orders → **Export CSV**. Messages → newsletter **CSV**.

## 7. Environment variables

See `.env.example`. **Never commit `.env.local`.**

| Variable | Needed for |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | Links, sitemap, SEO |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Database, login and photo storage. Leave all three empty for demo mode. |
| `ADMIN_EMAIL` | First admin; receives new-order emails |
| `SESSION_SECRET` | Signing demo sessions and hashing IP addresses (`openssl rand -hex 32`) |
| `DEMO_ADMIN_PASSWORD` | Admin login in demo mode on a live server |
| `NEXT_PUBLIC_WHATSAPP` | Default WhatsApp number (the Admin → Settings value overrides it) |
| `RESEND_API_KEY`, `RESEND_FROM` | New-order emails (optional) |
| `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_META_PIXEL_ID` | Google Analytics 4 / Meta Pixel (optional; ViewContent, AddToCart and Purchase events are already wired up) |

## 8. For developers

```bash
pnpm lint
```

```bash
pnpm typecheck
```

```bash
pnpm test
```

```bash
pnpm test:e2e
```

```bash
pnpm build
```

The end-to-end test builds the app and runs it in demo mode on port 3100. To use a Chromium
that is already installed, set `PW_CHROMIUM_PATH=/path/to/chrome`.

Regenerate the dummy content:

```bash
pnpm art
```

```bash
pnpm seed:sql
```

- **Structure:** `app/(store)` storefront · `app/admin` admin · `components/{ui,store,admin,wardrobe,motion}` · `lib/{data,pricing,validation,supabase,admin,orders}` · `supabase/` · `scripts/` · `tests/`. See `PLAN.md`.
- **Data access:** `lib/data` defines one `Db` interface with two backends: Supabase (service role, server-only) and an in-memory demo store seeded from `lib/demo/catalog.ts`.
- **Prices are never trusted from the browser.** Checkout re-prices every line with `getEffectivePrice` (`lib/pricing`). The Postgres function `place_order()` decrements stock atomically and rolls the whole order back if any item has sold out.
- **Caching:** catalogue reads use `'use cache'` with the `catalog` / `settings` tags, and admin changes call `updateTag()`. Prices are recomputed in the browser, so scheduled discounts start and end on time even on cached pages.
- **Security:** RLS is enabled on every table (anonymous users can read only the published catalogue). `/admin` is protected by `proxy.ts` and by a server-side `admins` check on every page, action and export. Checkout has a honeypot, a limit of 3 orders per phone/IP per hour, blocked phones, and a maximum of 5 per line.

## 9. Decisions to confirm

These defaults were chosen during the build. Please review them:

1. **Free delivery** applies from **Rs. 15,000 inclusive**, based on the total after discounts.
2. **Policy, FAQ and About copy** (exchange within 7 days, custom and sale pieces are final sale, reverse shipping Rs. 250, "Lahore atelier", "40+ karigars") is placeholder text. Please edit `lib/content/policies.ts` and `app/(store)/about/page.tsx`.
3. **Order numbers** use a single counter (`TZ-2026-00004`, `TZ-2027-00005`…). The year changes, but the number doesn't restart each year.
4. **Order privacy:** the success page link carries a private token. Anyone without it must enter the order's phone number on `/track`.
5. **Cancelled or returned orders** put ready-to-wear stock back automatically (there's an option on the status form to turn this off).
6. **Unstitched / one-size pieces:** offer a single size (e.g. M). The store then shows "One size".
7. **Made-to-order lead time** is entered in days and shown in weeks (21 days → "3–4 weeks").
8. **Contact page map** is a styled placeholder. Add a Google Maps embed when you have an address you want to publish.
9. **Placeholder WhatsApp, Instagram and email** need your real values (Admin → Settings and `.env.local`).
10. **Dummy images** are generated SVG art. Free stock photography couldn't be downloaded in the build environment, so there are no third-party image credits (see `public/dummy/CREDITS.md`).
