import "server-only";
import { isSupabaseConfigured } from "@/lib/config";
import type { Db } from "./db";
import { memoryDb } from "./memory";
import { supabaseDb } from "./supabase";

export function db(): Db {
  return isSupabaseConfigured() ? supabaseDb : memoryDb;
}

export const isDemoMode = () => !isSupabaseConfigured();
export type { Db } from "./db";
