export default function AdminLoading() {
  return (
    <div className="space-y-6" aria-busy aria-label="Loading">
      <div className="h-9 w-56 animate-pulse rounded-md bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
      <div className="h-96 animate-pulse rounded-xl bg-muted" />
    </div>
  );
}
