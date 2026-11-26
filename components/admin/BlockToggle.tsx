"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { blockPhone, unblockPhone } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";

export function BlockToggle({ phone, blocked }: { phone: string; blocked: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      size="sm"
      variant="ghost"
      className={blocked ? "" : "text-destructive"}
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = blocked ? await unblockPhone(phone) : await blockPhone(phone, "Blocked from customers list");
          if (res.ok) {
            toast.success(blocked ? "Unblocked" : "Blocked");
            router.refresh();
          } else toast.error(res.error);
        })
      }
    >
      {blocked ? "Unblock" : "Block"}
    </Button>
  );
}
