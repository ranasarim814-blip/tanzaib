import type { OrderStatus } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";

const FLOW: { status: OrderStatus; label: string; body: string }[] = [
  { status: "pending", label: "Order placed", body: "We've received your order." },
  { status: "confirmed", label: "Confirmed", body: "Confirmed with you by phone / WhatsApp." },
  { status: "processing", label: "In the atelier", body: "Being finished, checked and packed." },
  { status: "dispatched", label: "Dispatched", body: "On its way with our courier." },
  { status: "delivered", label: "Delivered", body: "Paid in cash on delivery. Enjoy!" },
];

export function StatusTimeline({ status, history }: { status: OrderStatus; history: { status: OrderStatus; created_at: string }[] }) {
  if (status === "cancelled" || status === "returned") {
    return (
      <p className="border border-maroon/40 p-4 text-sm text-maroon">
        This order was {status}. If you have questions, please message us on WhatsApp.
      </p>
    );
  }
  const reached = FLOW.findIndex((f) => f.status === status);
  return (
    <ol className="relative space-y-7 border-l border-line pl-8">
      {FLOW.map((f, i) => {
        const done = i <= reached;
        const when = history.filter((h) => h.status === f.status).at(-1)?.created_at;
        return (
          <li key={f.status} className="relative">
            <span
              aria-hidden
              className={cn("absolute top-1 -left-[37px] grid size-[17px] place-items-center rounded-full border", done ? "border-brass bg-brass" : "border-line bg-ivory")}
            >
              {done && <span className="size-1.5 rounded-full bg-ivory" />}
            </span>
            <p className={cn("font-serif text-xl", !done && "text-taupe-light")}>
              {f.label} {i === reached && <span className="sr-only">(current status)</span>}
            </p>
            <p className={cn("text-sm", done ? "text-taupe" : "text-taupe-light")}>{f.body}</p>
            {when && <p className="mt-0.5 text-xs text-taupe">{formatDate(when, true)}</p>}
          </li>
        );
      })}
    </ol>
  );
}
