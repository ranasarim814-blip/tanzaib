"use client";

import { useActionState } from "react";
import { sendContactMessage, type ActionState } from "@/app/actions/store";

export function ContactForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(sendContactMessage, null);
  if (state?.ok) {
    return (
      <div className="border border-brass/50 p-8 text-center" role="status">
        <p className="urdu text-3xl text-brass-deep">شکریہ</p>
        <p className="mt-2 font-serif text-2xl">{state.message}</p>
      </div>
    );
  }
  const err = (k: string) => state?.fieldErrors?.[k];
  const f = (name: string, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}, optional = false) => (
    <div>
      <label htmlFor={`ct-${name}`} className="field-label">
        {label} {optional && <span className="normal-case tracking-normal text-taupe-light">(optional)</span>}
      </label>
      <input id={`ct-${name}`} name={name} className="field" aria-invalid={Boolean(err(name))} aria-describedby={err(name) ? `ct-${name}-e` : undefined} {...props} />
      {err(name) && <p id={`ct-${name}-e`} className="field-error">{err(name)}</p>}
    </div>
  );
  return (
    <form action={action} noValidate className="grid gap-6 sm:grid-cols-2">
      <div className="sm:col-span-2">{f("name", "Name", { autoComplete: "name", required: true })}</div>
      {f("phone", "Phone", { autoComplete: "tel", inputMode: "tel" }, true)}
      {f("email", "Email", { autoComplete: "email", type: "email" }, true)}
      <div className="sm:col-span-2">
        <label htmlFor="ct-message" className="field-label">Message</label>
        <textarea id="ct-message" name="message" rows={5} required className="field resize-none" aria-invalid={Boolean(err("message"))} />
        {err("message") && <p className="field-error">{err("message")}</p>}
      </div>
      <input type="text" name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      {state && !state.ok && <p className="text-sm text-maroon sm:col-span-2" role="alert">{state.message}</p>}
      <div className="sm:col-span-2">
        <button type="submit" disabled={pending} className="btn btn-ink">{pending ? "Sending…" : "Send message"}</button>
      </div>
    </form>
  );
}
