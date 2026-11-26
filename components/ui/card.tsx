import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("rounded-xl border border-border bg-white shadow-xs", className)} {...props} />;
}
export function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex items-center justify-between gap-4 border-b border-border px-5 py-4", className)} {...props} />;
}
export function CardTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return <h2 className={cn("text-sm font-semibold", className)} {...props} />;
}
export function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("p-5", className)} {...props} />;
}

const BADGE = {
  default: "bg-muted text-ink",
  success: "bg-[#e7f1e8] text-[#25603a]",
  warning: "bg-[#fbf0dc] text-[#7a5414]",
  danger: "bg-[#f8e3e1] text-[#8a2823]",
  brass: "bg-[#f3ead9] text-[#6f5426]",
  info: "bg-[#e5edf6] text-[#2a4f78]",
  dark: "bg-ink text-white",
} as const;

export function Badge({ variant = "default", className, ...props }: React.ComponentProps<"span"> & { variant?: keyof typeof BADGE }) {
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.7rem] font-medium whitespace-nowrap", BADGE[variant], className)} {...props} />;
}

export function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn("w-full text-sm", className)} {...props} />
    </div>
  );
}
export function Th({ className, ...props }: React.ComponentProps<"th">) {
  return <th className={cn("h-10 border-b border-border px-3 text-left align-middle text-xs font-medium whitespace-nowrap text-muted-foreground", className)} {...props} />;
}
export function Td({ className, ...props }: React.ComponentProps<"td">) {
  return <td className={cn("border-b border-border px-3 py-3 align-middle", className)} {...props} />;
}

export function EmptyState({ title, body, children }: { title: string; body?: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <p className="font-serif text-2xl">{title}</p>
      {body && <p className="mt-2 max-w-sm text-sm text-muted-foreground">{body}</p>}
      {children && <div className="mt-6">{children}</div>}
    </div>
  );
}
