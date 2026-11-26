import type { OrderStatus } from "@/lib/types";
import { Badge } from "@/components/ui/card";

export const STATUS_VARIANT: Record<OrderStatus, "warning" | "info" | "brass" | "dark" | "success" | "danger" | "default"> = {
  pending: "warning",
  confirmed: "info",
  processing: "brass",
  dispatched: "dark",
  delivered: "success",
  cancelled: "danger",
  returned: "default",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return <Badge variant={STATUS_VARIANT[status]} className="capitalize">{status}</Badge>;
}
