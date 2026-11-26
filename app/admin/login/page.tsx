import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/admin/LoginForm";
import { demoAdminEmail, demoAdminPassword } from "@/lib/admin/auth";
import { isSupabaseConfigured } from "@/lib/config";

export const metadata: Metadata = { title: "Sign in" };

export default function AdminLoginPage() {
  const demo = !isSupabaseConfigured();
  const demoEnabled = demo && Boolean(demoAdminPassword());
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-4">
      <div className="w-full max-w-sm rounded-xl bg-ivory p-8 shadow-2xl">
        <p className="font-serif text-2xl tracking-[0.35em] text-center">TANZAIB</p>
        <p className="mt-1 text-center text-xs tracking-[0.2em] text-muted-foreground uppercase">Atelier admin</p>
        <Suspense>
          <LoginForm />
        </Suspense>
        {demo && (
          <p className="mt-6 rounded-md bg-[#fbf3e2] p-3 text-xs leading-relaxed text-[#6f5426]">
            {demoEnabled ? (
              <>
                Demo mode (no Supabase). Sign in as <strong>{demoAdminEmail()}</strong>
                {process.env.DEMO_ADMIN_PASSWORD ? " with your DEMO_ADMIN_PASSWORD." : <> with password <strong>tanzaib-demo</strong> (development only).</>}
              </>
            ) : (
              "Admin is disabled until Supabase is connected or DEMO_ADMIN_PASSWORD is set."
            )}
          </p>
        )}
      </div>
    </div>
  );
}
