import { Suspense } from "react";
import { AppShell } from "@/components/app-shell";
import { Loader } from "@/components/loader";
import { MessagingPagePanel } from "@/components/messaging-dock";

/** Skeleton shown while the messaging panel resolves (reads search params). */
function MessagingPanelSkeleton() {
  return (
    <div className="flex h-[calc(100dvh-3.5rem)] overflow-hidden border bg-background sm:h-[calc(100dvh-5.5rem)] sm:rounded-xl sm:shadow-sm">
      <div className="w-full border-r p-2 sm:max-w-sm">
        <Loader variant="conversation" count={7} />
      </div>
      <div className="hidden flex-1 flex-col justify-end p-4 sm:flex">
        <Loader variant="thread" />
      </div>
    </div>
  );
}

/** Keeps one messaging panel mounted across /messages and /messages/[id]. */
export default function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell noPadding feedLayout>
      <div className="mx-auto w-full max-w-282 sm:px-5 sm:py-5">
        <Suspense fallback={<MessagingPanelSkeleton />}>
          <MessagingPagePanel />
        </Suspense>
      </div>
      {children}
    </AppShell>
  );
}
