import { createClient } from "@supabase/supabase-js";
import { getServiceRoleKey, getSupabaseUrl } from "@/lib/supabase/env";

export function getAdminClient() {
  const url = getSupabaseUrl();
  const serviceRoleKey = getServiceRoleKey();

  if (!url || !serviceRoleKey) {
    return null;
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function createAdminClient() {
  const admin = getAdminClient();
  if (!admin) {
    throw new Error(
      "Set SUPABASE_SERVICE_ROLE_KEY in .env.local (Supabase → Settings → API → service_role secret)."
    );
  }
  return admin;
}
