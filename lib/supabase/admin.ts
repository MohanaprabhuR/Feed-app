import { createClient } from "@supabase/supabase-js";

export function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (
    !url ||
    !serviceRoleKey ||
    serviceRoleKey === "your-service-role-key" ||
    serviceRoleKey.startsWith("your-")
  ) {
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
      "Replace SUPABASE_SERVICE_ROLE_KEY in .env.local with your real service_role key from Supabase → Settings → API. (Do not use the placeholder 'your-service-role-key'.)"
    );
  }
  return admin;
}
