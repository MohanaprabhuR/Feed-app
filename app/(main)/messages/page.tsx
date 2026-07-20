"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMessaging } from "@/components/messaging-provider";

function MessagesRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { openMessaging } = useMessaging();
  const conversationId = searchParams.get("c");

  useEffect(() => {
    openMessaging(conversationId);
    router.replace("/feed");
  }, [conversationId, openMessaging, router]);

  return null;
}

/** Messaging opens in the floating dock — soft-redirect old page routes. */
export default function MessagesPage() {
  return (
    <Suspense fallback={null}>
      <MessagesRedirect />
    </Suspense>
  );
}
