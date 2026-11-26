"use client";

import { Switch as RSwitch, Tabs as RTabs, Dialog as RDialog, Checkbox as RCheckbox } from "radix-ui";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Switch({ className, ...props }: React.ComponentProps<typeof RSwitch.Root>) {
  return (
    <RSwitch.Root
      className={cn(
        "peer inline-flex h-5 w-9 shrink-0 items-center rounded-full border border-transparent bg-border transition-colors focus-visible:ring-2 focus-visible:ring-brass/40 focus-visible:outline-none data-[state=checked]:bg-ink",
        className,
      )}
      {...props}
    >
      <RSwitch.Thumb className="pointer-events-none block size-4 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0.5" />
    </RSwitch.Root>
  );
}

export function Checkbox({ className, ...props }: React.ComponentProps<typeof RCheckbox.Root>) {
  return (
    <RCheckbox.Root
      className={cn(
        "grid size-4 shrink-0 place-items-center rounded-[4px] border border-[#bdb3a5] bg-white focus-visible:ring-2 focus-visible:ring-brass/40 focus-visible:outline-none data-[state=checked]:border-ink data-[state=checked]:bg-ink data-[state=checked]:text-white data-[state=indeterminate]:border-ink data-[state=indeterminate]:bg-ink data-[state=indeterminate]:text-white",
        className,
      )}
      {...props}
    >
      <RCheckbox.Indicator>
        {props.checked === "indeterminate" ? <span className="block h-0.5 w-2 bg-white" /> : <Check className="size-3" strokeWidth={3} />}
      </RCheckbox.Indicator>
    </RCheckbox.Root>
  );
}

export const Tabs = RTabs.Root;
export function TabsList({ className, ...props }: React.ComponentProps<typeof RTabs.List>) {
  return <RTabs.List className={cn("inline-flex h-10 flex-wrap items-center gap-1 rounded-lg bg-muted p-1", className)} {...props} />;
}
export function TabsTrigger({ className, ...props }: React.ComponentProps<typeof RTabs.Trigger>) {
  return (
    <RTabs.Trigger
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-brass/40 focus-visible:outline-none data-[state=active]:bg-white data-[state=active]:text-ink data-[state=active]:shadow-sm",
        className,
      )}
      {...props}
    />
  );
}
export function TabsContent({ className, ...props }: React.ComponentProps<typeof RTabs.Content>) {
  return <RTabs.Content className={cn("mt-6 focus-visible:outline-none", className)} {...props} />;
}

export const Dialog = RDialog.Root;
export const DialogTrigger = RDialog.Trigger;
export const DialogClose = RDialog.Close;
export function DialogContent({ className, children, title, description, ...props }: React.ComponentProps<typeof RDialog.Content> & { title: string; description?: string }) {
  return (
    <RDialog.Portal>
      <RDialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
      <RDialog.Content
        className={cn("fixed top-1/2 left-1/2 z-50 w-[min(94vw,480px)] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-white p-6 shadow-2xl", className)}
        {...props}
      >
        <RDialog.Title className="text-lg font-semibold">{title}</RDialog.Title>
        {description ? (
          <RDialog.Description className="mt-1.5 text-sm text-muted-foreground">{description}</RDialog.Description>
        ) : (
          <RDialog.Description className="sr-only">{title}</RDialog.Description>
        )}
        <div className="mt-4">{children}</div>
        <RDialog.Close className="absolute top-4 right-4 rounded-md p-1 text-muted-foreground hover:bg-muted" aria-label="Close">
          <X className="size-4" />
        </RDialog.Close>
      </RDialog.Content>
    </RDialog.Portal>
  );
}
