import { t } from "@/lib/i18n";

export const PRIMARY_NAV = [
  { href: "/collections/bridal", label: t.nav.bridal },
  { href: "/collections/formal", label: t.nav.formal },
  { href: "/collections/luxury-pret", label: t.nav.pret },
  { href: "/collections/festive", label: t.nav.festive },
  { href: "/collections/unstitched", label: t.nav.unstitched },
] as const;

export const SECONDARY_NAV = [
  { href: "/shop", label: "Shop All" },
  { href: "/lookbook", label: t.nav.lookbook },
  { href: "/about", label: t.nav.about },
  { href: "/track", label: t.nav.track },
  { href: "/contact", label: t.nav.contact },
] as const;

export const HELP_NAV = [
  { href: "/faq", label: "FAQ" },
  { href: "/track", label: "Track your order" },
  { href: "/policies/shipping", label: "Shipping" },
  { href: "/policies/exchange", label: "Exchange & Returns" },
  { href: "/policies/privacy", label: "Privacy" },
  { href: "/policies/terms", label: "Terms" },
] as const;
