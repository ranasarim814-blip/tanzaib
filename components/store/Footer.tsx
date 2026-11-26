import Link from "next/link";
import { Logo } from "./Logo";
import { NewsletterForm } from "./NewsletterForm";
import { HELP_NAV, PRIMARY_NAV } from "./nav";
import { getSettings } from "@/lib/data/catalog";
import { displayPkPhone, normalizePkPhone } from "@/lib/validation/phone";
import { BRAND } from "@/lib/config";

export async function Footer() {
  const s = await getSettings();
  const phone = normalizePkPhone(s.whatsapp_number);
  const socials = [
    { label: "Instagram", href: s.instagram },
    { label: "Facebook", href: s.facebook },
    { label: "TikTok", href: s.tiktok },
  ].filter((x) => x.href);
  return (
    <footer className="bg-ink text-ivory">
      <div className="container-luxe grid gap-14 py-20 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-4">
          <Logo tone="ivory" />
          <p className="mt-6 max-w-sm font-serif text-xl font-light text-ivory/80 italic">{BRAND.tagline}.</p>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-ivory/60">
            Hand-embroidered eastern wear, made slowly in Pakistan by master karigars. Cash on delivery, nationwide.
          </p>
          <div className="mt-8 max-w-sm">
            <p className="eyebrow mb-1 text-brass-soft">Letters from the atelier</p>
            <NewsletterForm tone="ivory" id="footer-newsletter" />
          </div>
        </div>
        <nav aria-label="Shop" className="lg:col-span-2 lg:col-start-6">
          <p className="eyebrow text-brass-soft">Shop</p>
          <ul className="mt-5 space-y-3 text-sm text-ivory/75">
            <li><Link className="link-underline hover:text-ivory" href="/shop">Shop all</Link></li>
            {PRIMARY_NAV.map((n) => (
              <li key={n.href}><Link className="link-underline hover:text-ivory" href={n.href}>{n.label}</Link></li>
            ))}
            <li><Link className="link-underline hover:text-ivory" href="/shop?sale=1">On sale</Link></li>
          </ul>
        </nav>
        <nav aria-label="Help" className="lg:col-span-2">
          <p className="eyebrow text-brass-soft">Help</p>
          <ul className="mt-5 space-y-3 text-sm text-ivory/75">
            {HELP_NAV.map((n) => (
              <li key={n.href}><Link className="link-underline hover:text-ivory" href={n.href}>{n.label}</Link></li>
            ))}
          </ul>
        </nav>
        <div className="lg:col-span-2">
          <p className="eyebrow text-brass-soft">Atelier</p>
          <ul className="mt-5 space-y-3 text-sm text-ivory/75">
            <li><Link className="link-underline hover:text-ivory" href="/about">Our story</Link></li>
            <li><Link className="link-underline hover:text-ivory" href="/lookbook">Lookbook</Link></li>
            <li><Link className="link-underline hover:text-ivory" href="/contact">Contact</Link></li>
            {phone && <li className="pt-2 text-ivory/60">WhatsApp {displayPkPhone(phone)}</li>}
            {socials.map((x) => (
              <li key={x.label}>
                <a className="link-underline hover:text-ivory" href={x.href} target="_blank" rel="noopener noreferrer">{x.label}</a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-line-light">
        <div className="container-luxe flex flex-col items-center justify-between gap-3 py-6 text-[0.7rem] tracking-[0.14em] text-ivory/50 uppercase sm:flex-row">
          <p>© {BRAND.name} · Made in Pakistan</p>
          <p lang="ur" className="urdu text-sm normal-case tracking-normal text-brass-soft/80">{BRAND.urdu} — ہاتھ کا ہنر</p>
          <p>Cash on Delivery · Nationwide</p>
        </div>
      </div>
    </footer>
  );
}
