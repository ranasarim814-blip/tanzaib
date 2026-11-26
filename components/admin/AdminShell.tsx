"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Dialog } from "radix-ui";
import { Toaster } from "sonner";
import { ExternalLink, FolderTree, Inbox, LayoutDashboard, LogOut, Menu, Package, Settings, ShoppingBag, Users, X } from "lucide-react";
import { logoutAction } from "@/app/admin/actions";
import { Badge } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/messages", label: "Messages", icon: Inbox },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

const IDLE_MINUTES = 30;

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <ul className="space-y-0.5">
      {NAV.map((n) => {
        const active = n.exact ? pathname === n.href : pathname.startsWith(n.href);
        return (
          <li key={n.href}>
            <Link
              href={n.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn("flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors", active ? "bg-ink text-white" : "text-ink/75 hover:bg-muted hover:text-ink")}
            >
              <n.icon className="size-4" strokeWidth={1.6} />
              {n.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Signs the admin out after a period of inactivity. */
function IdleLogout() {
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(() => formRef.current?.requestSubmit(), IDLE_MINUTES * 60_000);
    };
    const events = ["pointerdown", "keydown", "scroll", "visibilitychange"] as const;
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => {
      clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, []);
  return <form ref={formRef} action={logoutAction} className="hidden" aria-hidden />;
}

export function AdminShell({ email, demo, children }: { email: string; demo: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const brand = (
    <Link href="/admin" className="flex items-baseline gap-2 px-3">
      <span className="font-serif text-xl tracking-[0.3em]">TANZAIB</span>
      <span className="text-[0.65rem] tracking-[0.18em] text-muted-foreground uppercase">Admin</span>
    </Link>
  );
  const footer = (
    <div className="space-y-2 border-t border-border pt-4">
      <p className="truncate px-3 text-xs text-muted-foreground" title={email}>{email}</p>
      <Link href="/" target="_blank" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-ink/75 hover:bg-muted">
        <ExternalLink className="size-4" strokeWidth={1.6} /> View store
      </Link>
      <form action={logoutAction}>
        <button type="submit" className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-ink/75 hover:bg-muted">
          <LogOut className="size-4" strokeWidth={1.6} /> Sign out
        </button>
      </form>
    </div>
  );
  return (
    <div className="flex min-h-screen bg-[#faf8f5] text-ink">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col justify-between border-r border-border bg-white px-3 py-5 lg:flex">
        <div className="space-y-6">
          {brand}
          <nav aria-label="Admin">
            <NavLinks />
          </nav>
        </div>
        {footer}
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-white/90 px-4 backdrop-blur lg:hidden">
          <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger className="rounded-md p-2 hover:bg-muted" aria-label="Open menu">
              <Menu className="size-5" />
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-40 bg-black/30" />
              <Dialog.Content className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col justify-between bg-white px-3 py-5" aria-describedby={undefined}>
                <Dialog.Title className="sr-only">Admin menu</Dialog.Title>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    {brand}
                    <Dialog.Close className="rounded-md p-1.5 hover:bg-muted" aria-label="Close menu"><X className="size-4" /></Dialog.Close>
                  </div>
                  <NavLinks onNavigate={() => setOpen(false)} />
                </div>
                {footer}
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
          {brand}
          <span className="w-9" />
        </header>
        {demo && (
          <div className="border-b border-[#ecd9b0] bg-[#fbf3e2] px-4 py-2 text-xs text-[#6f5426] lg:px-8">
            <Badge variant="brass" className="mr-2">Demo mode</Badge>
            Supabase isn&apos;t connected — changes are kept in memory until the server restarts. See README to connect a database.
          </div>
        )}
        <main className="w-full max-w-[1400px] flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
      <Toaster position="top-right" richColors closeButton />
      <IdleLogout />
    </div>
  );
}

export function PageTitle({ title, description, children }: { title: string; description?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-serif text-3xl font-light">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}
