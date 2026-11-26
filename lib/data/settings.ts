import "server-only";
import { DEFAULT_SETTINGS } from "@/lib/config";
import type { StoreSettings } from "@/lib/types";
import { db } from "./index";

/** Settings straight from the DB (no cache) — used where money is involved. */
export async function getSettingsUncached(): Promise<StoreSettings> {
  const rows = await db().select("settings");
  const merged: Record<string, unknown> = { ...DEFAULT_SETTINGS };
  for (const r of rows) if (r.key in merged) merged[r.key] = r.value;
  return merged as unknown as StoreSettings;
}
