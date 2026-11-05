import "server-only";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/database.types";
import { assertSupabaseEnv, supabasePublishableKey, supabaseUrl } from "@/lib/supabase/env";

/**
 * Supabase client for Server Components, Server Functions and Route Handlers.
 * It reads the session from cookies, so queries run as the signed-in person through row-level security.
 * Reading cookies makes the caller dynamic: call it inside <Suspense> (Cache Components).
 */
export async function createClient() {
  assertSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient<Database>(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options);
        } catch {
          // Server Components can't set cookies. The session refresh in the proxy (week 2) handles it.
        }
      },
    },
  });
}
