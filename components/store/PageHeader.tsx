import { ThreadDivider } from "@/components/motion/ThreadDraw";

export function PageHeader({ eyebrow, title, urdu, body }: { eyebrow: string; title: string; urdu?: string; body?: string }) {
  return (
    <header className="container-luxe pt-14 pb-10 text-center sm:pt-20">
      <p className="eyebrow text-brass-deep">{eyebrow}</p>
      <h1 className="display mt-4 text-5xl sm:text-7xl">{title}</h1>
      {urdu && (
        <p lang="ur" className="urdu mt-2 text-xl text-brass-deep sm:text-2xl">
          {urdu}
        </p>
      )}
      {body && <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-taupe">{body}</p>}
      <ThreadDivider className="mt-6" />
    </header>
  );
}
