"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setMessageRead } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/card";
import type { ContactMessage } from "@/lib/types";
import { formatDate, whatsappLink } from "@/lib/utils";
import { displayPkPhone } from "@/lib/validation/phone";

export function MessageRow({ m }: { m: ContactMessage }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <li className={m.is_read ? "px-5 py-4" : "bg-[#fffaf0] px-5 py-4"}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium">{m.name} {!m.is_read && <Badge variant="brass">New</Badge>}</p>
          <p className="text-xs text-muted-foreground">
            {[m.phone && displayPkPhone(m.phone), m.email].filter(Boolean).join(" · ")} · {formatDate(m.created_at, true)}
          </p>
        </div>
        <div className="flex gap-1">
          {m.phone && <Button size="sm" variant="ghost" asChild><a href={whatsappLink(m.phone, `Assalam o Alaikum ${m.name.split(" ")[0]}! This is Tanzaib, replying to your message.`)} target="_blank" rel="noreferrer">WhatsApp</a></Button>}
          {m.email && <Button size="sm" variant="ghost" asChild><a href={`mailto:${m.email}`}>Email</a></Button>}
          <Button size="sm" variant="outline" disabled={pending} onClick={() => start(async () => { await setMessageRead(m.id, !m.is_read); router.refresh(); })}>
            Mark {m.is_read ? "unread" : "read"}
          </Button>
        </div>
      </div>
      <p className="mt-2 text-sm whitespace-pre-line">{m.message}</p>
    </li>
  );
}
