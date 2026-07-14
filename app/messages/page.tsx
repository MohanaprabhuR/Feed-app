"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMessaging } from "@/components/messaging-provider";

/** Messaging opens in the floating dock — soft-redirect old page routes. */
export default function MessagesPage() {
  const router = useRouter();
  const { openMessaging } = useMessaging();

  useEffect(() => {
    openMessaging();
    router.replace("/feed");
  }, [openMessaging, router]);

  return null;
}
