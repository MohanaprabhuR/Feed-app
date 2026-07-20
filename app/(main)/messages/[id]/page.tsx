"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMessaging } from "@/components/messaging-provider";

/** Chat opens in the floating dock — soft-redirect old page routes. */
export default function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { openMessaging } = useMessaging();

  useEffect(() => {
    openMessaging(id);
    router.replace("/feed");
  }, [id, openMessaging, router]);

  return null;
}
