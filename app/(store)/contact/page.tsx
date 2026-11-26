import type { Metadata } from "next";
import { PageHeader } from "@/components/store/PageHeader";
import { ContactForm } from "@/components/store/ContactForm";
import { getSettings } from "@/lib/data/catalog";
import { displayPkPhone, normalizePkPhone } from "@/lib/validation/phone";
import { whatsappLink } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Contact the atelier",
  description: "Questions about a piece, sizing or your order? Write to Tanzaib or message us on WhatsApp.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage() {
  const s = await getSettings();
  const phone = normalizePkPhone(s.whatsapp_number);
  return (
    <>
      <PageHeader eyebrow="Contact" title="Write to the atelier" urdu="رابطہ" />
      <div className="container-luxe grid gap-16 pb-28 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <ContactForm />
        </div>
        <aside className="space-y-10 lg:col-span-4 lg:col-start-9">
          <div>
            <p className="eyebrow text-taupe">WhatsApp</p>
            <a href={whatsappLink(s.whatsapp_number, "Assalam o Alaikum Tanzaib!")} target="_blank" rel="noopener noreferrer" className="mt-2 block font-serif text-3xl hover:text-brass-deep">
              {phone ? displayPkPhone(phone) : s.whatsapp_number}
            </a>
            <p className="mt-1 text-sm text-taupe">Monday – Saturday, 11am – 8pm</p>
          </div>
          <div>
            <p className="eyebrow text-taupe">Atelier</p>
            <p className="mt-2 leading-relaxed">By appointment only<br />Lahore, Pakistan</p>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden border border-line bg-parchment" role="img" aria-label="Map placeholder — Lahore">
            <svg viewBox="0 0 400 300" className="absolute inset-0 h-full w-full text-brass/40" fill="none" stroke="currentColor" aria-hidden>
              {Array.from({ length: 12 }).map((_, i) => <path key={i} d={`M0 ${i * 28} C120 ${i * 28 + 20} 260 ${i * 28 - 20} 400 ${i * 28 + 10}`} />)}
              {Array.from({ length: 10 }).map((_, i) => <path key={`v${i}`} d={`M${i * 44} 0 L${i * 44 + 30} 300`} />)}
              <circle cx="210" cy="150" r="7" fill="var(--maroon)" stroke="none" />
              <circle cx="210" cy="150" r="18" stroke="var(--maroon)" />
            </svg>
            <p className="absolute bottom-3 left-3 text-[0.6rem] tracking-[0.2em] text-taupe uppercase">Map placeholder</p>
          </div>
        </aside>
      </div>
    </>
  );
}
