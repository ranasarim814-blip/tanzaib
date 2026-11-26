"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Heart, Menu, ShoppingBag, X } from "lucide-react";
import { Logo } from "./Logo";
import { PRIMARY_NAV, SECONDARY_NAV } from "./nav";
import { cartCount, useCart } from "@/lib/store/cart";
import { useWishlist } from "@/lib/store/wishlist";
import { useUi } from "@/lib/store/ui";
import { useHydrated } from "@/lib/hooks";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function Header() {
  const pathname = usePathname();
  const hydrated = useHydrated();
  const reduce = useReducedMotion();
  const lines = useCart((s) => s.lines);
  const wish = useWishlist((s) => s.slugs.length);
  const { openBag, menuOpen, setMenu, bagBump } = useUi();
  const [scrolled, setScrolled] = useState(false);
  const isHome = pathname === "/";

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > (isHome ? window.innerHeight * 0.82 : 8));
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, [isHome]);

  useEffect(() => setMenu(false), [pathname, setMenu]);

  const dark = isHome && !scrolled && !menuOpen;
  const count = hydrated ? cartCount(lines) : 0;

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-colors duration-700",
        dark ? "bg-ink text-ivory" : "bg-ivory/92 text-ink backdrop-blur-md",
        scrolled && !dark && "shadow-[0_1px_0_var(--line)]",
      )}
    >
      <div className="container-luxe flex h-16 items-center justify-between gap-4 lg:h-20">
        <div className="flex flex-1 items-center gap-6">
          <button
            type="button"
            className="-ml-2 p-2 lg:hidden"
            aria-label={menuOpen ? t.nav.close : t.nav.menu}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenu(!menuOpen)}
          >
            {menuOpen ? <X strokeWidth={1.25} className="size-5" /> : <Menu strokeWidth={1.25} className="size-5" />}
          </button>
          <nav aria-label="Collections" className="hidden lg:block">
            <ul className="flex items-center gap-7">
              {PRIMARY_NAV.map((n) => (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    aria-current={pathname === n.href ? "page" : undefined}
                    className="link-underline eyebrow text-[0.65rem]"
                  >
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <Link href="/" aria-label="Tanzaib — home" className="shrink-0">
          <Logo tone={dark ? "ivory" : "ink"} />
        </Link>

        <div className="flex flex-1 items-center justify-end gap-1 sm:gap-3">
          <nav aria-label="Secondary" className="mr-3 hidden xl:block">
            <ul className="flex items-center gap-6">
              {SECONDARY_NAV.slice(0, 3).map((n) => (
                <li key={n.href}>
                  <Link href={n.href} aria-current={pathname === n.href ? "page" : undefined} className="link-underline eyebrow text-[0.65rem]">
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <Link href="/wishlist" className="relative p-2" aria-label={`${t.nav.wishlist}${hydrated && wish ? `, ${wish} items` : ""}`}>
            <Heart strokeWidth={1.25} className="size-5" />
            {hydrated && wish > 0 && <span className="absolute top-1.5 right-1 size-1.5 rounded-full bg-brass" aria-hidden />}
          </Link>
          <motion.button
            type="button"
            data-bag-icon
            key={bagBump}
            onClick={openBag}
            className="relative -mr-2 p-2"
            aria-label={`${t.nav.bag}, ${count} items`}
            initial={reduce || bagBump === 0 ? false : { scale: 1 }}
            animate={reduce || bagBump === 0 ? undefined : { scale: [1, 1.18, 0.96, 1] }}
            transition={{ duration: 0.6, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <ShoppingBag strokeWidth={1.25} className="size-5" />
            {count > 0 && (
              <span
                className={cn(
                  "absolute -top-0.5 -right-0.5 grid size-4 place-items-center rounded-full text-[0.6rem] font-semibold",
                  dark ? "bg-brass-soft text-ink" : "bg-ink text-ivory",
                )}
              >
                {count}
              </span>
            )}
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="mobile-menu"
            className="fixed inset-x-0 top-16 bottom-0 z-40 overflow-y-auto bg-ivory lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            data-lenis-prevent
          >
            <nav aria-label="Mobile" className="container-luxe py-10">
              <ul className="space-y-1">
                {PRIMARY_NAV.map((n, i) => (
                  <motion.li
                    key={n.href}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * i, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <Link href={n.href} className="display block py-2 text-4xl">
                      {n.label}
                    </Link>
                  </motion.li>
                ))}
              </ul>
              <div className="hairline my-8" />
              <ul className="grid grid-cols-2 gap-y-4">
                {SECONDARY_NAV.map((n) => (
                  <li key={n.href}>
                    <Link href={n.href} className="eyebrow text-taupe">
                      {n.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link href="/faq" className="eyebrow text-taupe">
                    FAQ
                  </Link>
                </li>
              </ul>
              <p lang="ur" className="urdu mt-12 text-2xl text-brass-deep">
                ہاتھ سے بنی، دل سے پہنی
              </p>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
