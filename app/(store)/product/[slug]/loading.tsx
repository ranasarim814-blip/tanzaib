export default function LoadingProduct() {
  return (
    <div className="container-luxe pt-16 pb-20" aria-busy aria-label="Loading piece">
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
        <div className="grid gap-4 lg:col-span-7 lg:grid-cols-[80px_minmax(0,1fr)]">
          <div className="hidden space-y-3 lg:block">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton h-[106px] w-20" />
            ))}
          </div>
          <div className="skeleton aspect-[3/4]" />
        </div>
        <div className="space-y-5 lg:col-span-5">
          <div className="skeleton h-3 w-40" />
          <div className="skeleton h-14 w-3/4" />
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-8 w-1/3" />
          <div className="flex gap-2 pt-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton h-12 w-13" />
            ))}
          </div>
          <div className="skeleton h-12 w-full" />
        </div>
      </div>
    </div>
  );
}
