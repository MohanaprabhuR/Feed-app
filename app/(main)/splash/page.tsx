"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { FeedLogoMark } from "@/components/feed-logo";

export default function SplashPage() {
  const router = useRouter();

  useEffect(() => {
    // replace, not push — back from /welcome shouldn't land on the splash.
    const timer = setTimeout(() => router.replace("/welcome"), 2000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-primary">
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
        <div className="mt-8 size-8 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
      </div>
    </div>
  );
}
