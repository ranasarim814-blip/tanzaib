import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/store/PageHeader";
import { ProductAccordions } from "@/components/store/product/Accordions";
import { FAQS } from "@/lib/content/policies";
import { JsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "FAQ — Delivery, Cash on Delivery, sizing and care",
  description: "Answers about Cash on Delivery, delivery times, custom stitching, exchanges and caring for hand-embroidered pieces.",
  alternates: { canonical: "/faq" },
};

export default function FaqPage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
        }}
      />
      <PageHeader eyebrow="Help" title="Questions, answered" urdu="سوال و جواب" />
      <div className="container-luxe max-w-3xl pb-28">
        <ProductAccordions items={FAQS.map((f, i) => ({ id: `faq-${i}`, title: f.q, content: <p>{f.a}</p> }))} />
        <p className="mt-10 text-center text-sm text-taupe">
          Still wondering? <Link href="/contact" className="link-underline text-ink">Write to us</Link> or message us on WhatsApp.
        </p>
      </div>
    </>
  );
}
