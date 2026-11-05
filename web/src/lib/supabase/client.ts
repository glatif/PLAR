"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/database.types";
import { assertSupabaseEnv, supabasePublishableKey, supabaseUrl } from "@/lib/supabase/env";

/** Supabase client for Client Components. Every query runs as the signed-in person, through row-level security. */
export function createClient() {
  assertSupabaseEnv();
  return createBrowserClient<Database>(supabaseUrl, supabasePublishableKey);
}
