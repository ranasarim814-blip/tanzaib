import Link from "next/link";
import { ThreadDivider } from "@/components/motion/ThreadDraw";

export default function NotFound() {
  return (
    <div className="container-luxe flex min-h-[70vh] flex-col items-center justify-center py-24 text-center">
      <p className="eyebrow text-brass-deep">Error 404</p>
      <h1 className="display mt-4 text-6xl sm:text-7xl">This drawer is empty</h1>
      <p lang="ur" className="urdu mt-2 text-2xl text-brass-deep">یہ صفحہ نہیں ملا</p>
      <ThreadDivider className="mt-6" />
      <p className="mt-6 max-w-md text-sm text-taupe">The page you were looking for has been moved, sold, or perhaps never stitched at all.</p>
      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Link href="/" className="btn btn-ink">Return home</Link>
        <Link href="/shop" className="btn btn-outline">Shop the collection</Link>
      </div>
    </div>
  );
}
