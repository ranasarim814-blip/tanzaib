"use client";

import { Accordion } from "radix-ui";
import { Plus } from "lucide-react";

export function ProductAccordions({ items }: { items: { id: string; title: string; content: React.ReactNode }[] }) {
  return (
    <Accordion.Root type="multiple" defaultValue={[items[0]?.id]} className="border-t border-line">
      {items.map((it) => (
        <Accordion.Item key={it.id} value={it.id} className="border-b border-line">
          <Accordion.Header>
            <Accordion.Trigger className="group flex w-full items-center justify-between py-5 text-left">
              <span className="eyebrow text-[0.65rem]">{it.title}</span>
              <Plus className="size-4 transition-transform duration-500 group-data-[state=open]:rotate-45" strokeWidth={1.25} />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content className="overflow-hidden text-sm leading-relaxed text-ink/80 data-[state=closed]:animate-[accordion-up_0.4s_var(--ease-luxe)] data-[state=open]:animate-[accordion-down_0.5s_var(--ease-luxe)]">
            <div className="pb-6">{it.content}</div>
          </Accordion.Content>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}
