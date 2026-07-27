"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { FeedLogoMark } from "@/components/feed-logo";
import { withMinimumDelay } from "@/lib/minimum-delay";
import { createClient } from "@/lib/supabase/client";
import { getSupabaseEnv } from "@/lib/supabase/env";

/** Keep the splash visible long enough for branding before navigating. */
const SPLASH_MIN_MS = 1800;

/**
 * Resolve the signed-in session (if any).
 * Returns null when unauthenticated or Supabase isn't configured.
 */
async function loadSession() {
  if (!getSupabaseEnv()) return null;

  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}

/** Pick the next route after splash finishes loading. */
function resolveSplashDestination(isSignedIn: boolean) {
  return isSignedIn ? "/feed" : "/welcome";
}

/**
 * Bootstrap the app from splash: load session (+ min delay), then navigate.
 */
async function runSplashLoaders() {
  const user = await withMinimumDelay(loadSession(), SPLASH_MIN_MS);
  return resolveSplashDestination(Boolean(user));
}

export default function SplashPage() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const next = await runSplashLoaders();
      if (cancelled) return;
      // replace, not push — back from /welcome shouldn't land on the splash.
      router.replace(next);
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-primary">
      <div className="flex flex-col items-center gap-6 text-primary-foreground animate-in fade-in-0 zoom-in-95 duration-700">
        <FeedLogoMark className="size-24 rounded-3xl text-5xl sm:size-24 sm:text-5xl" />
        <div className="text-center">
          <h1 className="font-serif text-3xl font-bold tracking-tight">
            FeedApp
          </h1>
          <p className="mt-2 text-primary-foreground/70">
            Connect. Share. Discover.
          </p>
        </div>
        <div
          className="mt-8 size-8 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground"
          role="status"
          aria-label="Loading"
        />
      </div>
    </div>
  );
}
