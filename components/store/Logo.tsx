import { BRAND } from "@/lib/config";
import { cn } from "@/lib/utils";

/** Text wordmark — replace with an SVG/PNG logo by editing this component. */
export function Logo({ className, tone = "ink", showUrdu = true }: { className?: string; tone?: "ink" | "ivory"; showUrdu?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-3 leading-none", tone === "ivory" ? "text-ivory" : "text-ink", className)}>
      <span className="font-serif text-[1.35rem] font-normal tracking-[0.42em] sm:text-[1.6rem]" style={{ marginRight: "-0.42em" }}>
        {BRAND.wordmark}
      </span>
      {showUrdu && (
        <>
          <span aria-hidden className="h-5 w-px bg-brass/60" />
          <span lang="ur" className="urdu -mt-1 text-[0.95rem] text-brass-deep sm:text-base" style={tone === "ivory" ? { color: "var(--brass-soft)" } : undefined}>
            {BRAND.urdu}
          </span>
        </>
      )}
    </span>
  );
}
