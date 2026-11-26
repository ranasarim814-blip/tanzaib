"use client";

import { useActionState } from "react";
import { subscribeNewsletter, type ActionState } from "@/app/actions/store";
import { cn } from "@/lib/utils";

export function NewsletterForm({ tone = "ink", id = "newsletter" }: { tone?: "ink" | "ivory"; id?: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(subscribeNewsletter, null);
  const light = tone === "ivory";
  return (
    <form action={action} className="w-full" noValidate>
      <div className={cn("flex items-end gap-3 border-b", light ? "border-ivory/30" : "border-line")}>
        <label htmlFor={`${id}-email`} className="sr-only">
          Email address
        </label>
        <input
          id={`${id}-email`}
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="Your email address"
          className={cn(
            "min-h-12 flex-1 bg-transparent py-3 text-sm outline-none",
            light ? "text-ivory placeholder:text-ivory/50" : "text-ink placeholder:text-taupe-light",
          )}
          aria-describedby={`${id}-status`}
        />
        <input type="text" name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
        <button
          type="submit"
          disabled={pending}
          className={cn("eyebrow min-h-12 shrink-0 px-1 text-[0.65rem] link-underline", light ? "text-brass-soft" : "text-ink")}
        >
          {pending ? "…" : "Subscribe"}
        </button>
      </div>
      <p id={`${id}-status`} role="status" className={cn("mt-3 min-h-5 text-xs", state?.ok ? (light ? "text-brass-soft" : "text-brass-deep") : "text-maroon", light && !state?.ok && "text-[#e8b4b4]")}>
        {state?.message}
      </p>
    </form>
  );
}
