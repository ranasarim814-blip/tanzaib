import { Suspense } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/admin/auth";

export const instant = false;

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<AdminLoading />}>
      <Gate>{children}</Gate>
    </Suspense>
  );
}

async function Gate({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  return (
    <AdminShell email={admin.email} demo={admin.mode === "demo"}>
      {children}
    </AdminShell>
  );
}

function AdminLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center" aria-busy>
      <p className="font-serif text-xl tracking-[0.3em] text-muted-foreground">TANZAIB</p>
    </div>
  );
}
