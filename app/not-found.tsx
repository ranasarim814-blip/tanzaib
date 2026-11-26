import Link from "next/link";

export default function RootNotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-ivory px-6 text-center">
      <p className="eyebrow text-brass-deep">Error 404</p>
      <h1 className="display mt-4 text-6xl">This drawer is empty</h1>
      <Link href="/" className="btn btn-ink mt-10">Return home</Link>
    </main>
  );
}
