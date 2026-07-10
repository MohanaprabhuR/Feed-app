import { createBrowserClient } from "@supabase/ssr";
import { requireSupabaseEnv } from "@/lib/supabase/env";

export function createClient() {
  const { url, publicKey } = requireSupabaseEnv();
  return createBrowserClient(url, publicKey);
}
