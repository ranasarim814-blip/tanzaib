import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/store/PageHeader";
import { POLICIES } from "@/lib/content/policies";

export function generateStaticParams() {
  return Object.keys(POLICIES).map((slug) => ({ slug }));
}

export async function generateMetadata(props: PageProps<"/policies/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const p = POLICIES[slug];
  return p ? { title: p.title, alternates: { canonical: `/policies/${slug}` } } : { title: "Not found" };
}

export default async function PolicyPage(props: PageProps<"/policies/[slug]">) {
  const { slug } = await props.params;
  const p = POLICIES[slug];
  if (!p) notFound();
  return (
    <>
      <PageHeader eyebrow={`Last updated ${p.updated}`} title={p.title} urdu={p.urdu} />
      <article className="container-luxe max-w-3xl pb-28">
        {p.sections.map((s) => (
          <section key={s.h} className="border-t border-line py-8">
            <h2 className="font-serif text-3xl font-light">{s.h}</h2>
            {s.p.map((para, i) => (
              <p key={i} className="mt-3 leading-relaxed text-ink/80">{para}</p>
            ))}
          </section>
        ))}
      </article>
    </>
  );
}
