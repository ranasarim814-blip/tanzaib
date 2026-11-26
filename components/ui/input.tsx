import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "flex h-9 w-full rounded-md border border-border bg-background px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:border-brass focus-visible:ring-2 focus-visible:ring-brass/25 focus-visible:outline-none disabled:opacity-50 aria-[invalid=true]:border-destructive",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "flex min-h-20 w-full rounded-md border border-border bg-background px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:border-brass focus-visible:ring-2 focus-visible:ring-brass/25 focus-visible:outline-none aria-[invalid=true]:border-destructive",
        className,
      )}
      {...props}
    />
  );
}

export function NativeSelect({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "flex h-9 w-full rounded-md border border-border bg-background px-3 text-sm shadow-xs focus-visible:border-brass focus-visible:ring-2 focus-visible:ring-brass/25 focus-visible:outline-none",
        className,
      )}
      {...props}
    />
  );
}

export function Label({ className, ...props }: React.ComponentProps<"label">) {
  return <label className={cn("text-sm leading-none font-medium", className)} {...props} />;
}

export function FieldError({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return <p className="mt-1 text-xs text-destructive">{children}</p>;
}
