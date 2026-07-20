"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SplashPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => router.push("/welcome"), 2000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-primary">
      <div className="flex flex-col items-center gap-6 text-primary-foreground">
        <div className="flex size-24 items-center justify-center rounded-3xl bg-primary-foreground/10 text-5xl font-bold backdrop-blur">
          F
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">FeedApp</h1>
          <p className="mt-2 text-primary-foreground/70">
            Connect. Share. Discover.
          </p>
        </div>
        <div className="mt-8 size-8 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
      </div>
    </div>
  );
}
