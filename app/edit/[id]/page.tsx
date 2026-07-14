"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";

/** Edit opens in a modal on the feed — keep this route as a soft redirect. */
export default function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  useEffect(() => {
    router.replace(`/feed?edit=${encodeURIComponent(id)}`);
  }, [id, router]);

  return null;
}
