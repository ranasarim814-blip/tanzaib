"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function StoreError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="container-luxe flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
      <p className="eyebrow text-maroon">Something went wrong</p>
      <h1 className="display mt-4 text-5xl">A thread came loose</h1>
      <p className="mt-4 max-w-md text-sm text-taupe">Please try again. If it keeps happening, message us on WhatsApp and we&rsquo;ll help you directly.</p>
      <div className="mt-10 flex gap-3">
        <button type="button" onClick={reset} className="btn btn-ink">Try again</button>
        <Link href="/" className="btn btn-outline">Home</Link>
      </div>
    </div>
  );
}
