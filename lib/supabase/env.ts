function isPlaceholder(value: string) {
  const lower = value.toLowerCase();
  return (
    lower.includes("your-project") ||
    lower.includes("your-anon-key") ||
    lower.includes("your-service-role-key") ||
    lower.includes("xxxx") ||
    lower.startsWith("your-")
  );
}

export function getSupabaseUrl() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/$/, "");
  if (!url || isPlaceholder(url)) return null;

  try {
    new URL(url);
  } catch {
    return null;
  }

  return url;
}

/** Supports legacy anon key and new publishable key env names. */
export function getSupabasePublicKey() {
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!key || isPlaceholder(key)) return null;
  return key;
}

export function getSupabaseEnv() {
  const url = getSupabaseUrl();
  const publicKey = getSupabasePublicKey();
  if (!url || !publicKey) return null;
  return { url, publicKey };
}

export function requireSupabaseEnv() {
  const env = getSupabaseEnv();
  if (!env) {
    throw new Error(
      "Missing Supabase configuration. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)."
    );
  }
  return env;
}

export function getServiceRoleKey() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!key || isPlaceholder(key)) return null;
  return key;
}
