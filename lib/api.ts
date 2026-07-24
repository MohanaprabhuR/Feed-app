import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getErrorMessage } from "@/lib/errors";

/** Thrown to short-circuit a handler with a specific HTTP status. */
export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Resolves the request's Supabase client and the signed-in user id, using the
 * cookie session — so every endpoint runs under that user's identity and RLS.
 * Throws ApiError(401) when there is no session.
 */
export async function requireUser(): Promise<{
  supabase: SupabaseClient;
  userId: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new ApiError("Authentication required.", 401);
  }

  return { supabase, userId: user.id };
}

/** Supabase client without requiring a session (for public reads). */
export async function getClient(): Promise<{
  supabase: SupabaseClient;
  userId: string | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, userId: user?.id ?? null };
}

/**
 * Wraps a route handler so thrown errors become consistent JSON responses:
 * ApiError uses its status; anything else is a 500.
 */
export async function handle<T>(
  fn: () => Promise<T>,
): Promise<NextResponse> {
  try {
    const result = await fn();
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ApiError) {
      return jsonError(error.message, error.status);
    }
    return jsonError(getErrorMessage(error, "Something went wrong."), 500);
  }
}
