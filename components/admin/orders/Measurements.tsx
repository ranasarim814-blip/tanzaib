import type { CustomMeasurements } from "@/lib/types";

const LABELS: [keyof CustomMeasurements, string][] = [
  ["shirt_length", "Shirt length"],
  ["chest", "Chest"],
  ["waist", "Waist"],
  ["hip", "Hip"],
  ["shoulder", "Shoulder"],
  ["sleeve", "Sleeve"],
  ["trouser_length", "Trouser length"],
];

export function MeasurementsTable({ m }: { m: CustomMeasurements }) {
  return (
    <div className="mt-2 rounded-md bg-[#fbf3e2] p-3 text-xs">
      <p className="mb-1.5 font-semibold text-[#6f5426]">Custom measurements (inches)</p>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-4">
        {LABELS.map(([k, l]) => (
          <div key={k} className="flex justify-between gap-2">
            <dt className="text-muted-foreground">{l}</dt>
            <dd className="font-medium tabular-nums">{String(m[k] ?? "—")}</dd>
          </div>
        ))}
      </dl>
      {m.notes && <p className="mt-2"><span className="text-muted-foreground">Notes:</span> {m.notes}</p>}
    </div>
  );
}
