"use client";

import { Dialog } from "radix-ui";
import { X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { measurementsSchema } from "@/lib/validation/schemas";
import type { CustomMeasurements } from "@/lib/types";

type In = z.input<typeof measurementsSchema>;
type Out = z.output<typeof measurementsSchema>;

const FIELDS: { name: keyof Omit<CustomMeasurements, "notes">; label: string; hint: string }[] = [
  { name: "shirt_length", label: "Shirt length", hint: "Shoulder to hem" },
  { name: "chest", label: "Chest", hint: "Fullest part" },
  { name: "waist", label: "Waist", hint: "Natural waist" },
  { name: "hip", label: "Hip", hint: "Fullest part" },
  { name: "shoulder", label: "Shoulder", hint: "Edge to edge" },
  { name: "sleeve", label: "Sleeve", hint: "Shoulder to wrist" },
  { name: "trouser_length", label: "Trouser length", hint: "Waist to ankle" },
];

export function MeasurementsDialog({
  open,
  onOpenChange,
  initial,
  onSave,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial?: CustomMeasurements;
  onSave: (m: CustomMeasurements) => void;
}) {
  const { register, handleSubmit, formState } = useForm<In, unknown, Out>({
    resolver: zodResolver(measurementsSchema),
    defaultValues: initial as In | undefined,
  });
  const errors = formState.errors;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[70] bg-ink/45" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 z-[71] max-h-[92vh] overflow-y-auto bg-ivory p-6 sm:top-1/2 sm:left-1/2 sm:right-auto sm:bottom-auto sm:w-[min(94vw,640px)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:p-10" data-lenis-prevent>
          <div className="flex items-start justify-between">
            <div>
              <p className="eyebrow text-brass-deep">Custom stitching</p>
              <Dialog.Title className="display mt-2 text-4xl">Your measurements</Dialog.Title>
            </div>
            <Dialog.Close aria-label="Close" className="-mr-2 p-2">
              <X className="size-5" strokeWidth={1.25} />
            </Dialog.Close>
          </div>
          <Dialog.Description className="mt-3 text-sm text-taupe">
            In inches. Measure over light clothing, or use a kameez that fits you well. Custom pieces are made to order and are not exchangeable for size.
          </Dialog.Description>
          <form
            noValidate
            onSubmit={handleSubmit((v) => {
              onSave(v as CustomMeasurements);
              onOpenChange(false);
            })}
            className="mt-6"
          >
            <div className="grid grid-cols-2 gap-x-6 gap-y-5">
              {FIELDS.map((f) => (
                <div key={f.name}>
                  <label htmlFor={`m-${f.name}`} className="field-label">
                    {f.label} <span className="normal-case tracking-normal text-taupe-light">· {f.hint}</span>
                  </label>
                  <input
                    id={`m-${f.name}`}
                    inputMode="decimal"
                    className="field"
                    aria-invalid={Boolean(errors[f.name])}
                    aria-describedby={errors[f.name] ? `m-${f.name}-err` : undefined}
                    {...register(f.name)}
                  />
                  {errors[f.name] && (
                    <p id={`m-${f.name}-err`} className="field-error">{errors[f.name]?.message}</p>
                  )}
                </div>
              ))}
              <div className="col-span-2">
                <label htmlFor="m-notes" className="field-label">Notes for the tailor (optional)</label>
                <textarea id="m-notes" rows={2} className="field resize-none" placeholder="e.g. slightly loose fit, sleeves to the elbow" {...register("notes")} />
              </div>
            </div>
            <button type="submit" className="btn btn-ink mt-8 w-full">Save measurements</button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
