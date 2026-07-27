import { Suspense } from "react";
import { AppShell } from "@/components/app-shell";
import { MessagingPagePanel } from "@/components/messaging-dock";

/** Keeps one messaging panel mounted across /messages and /messages/[id]. */
export default function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell noPadding feedLayout>
      <div className="mx-auto w-full max-w-282 sm:px-5 sm:py-5">
        <Suspense fallback={null}>
          <MessagingPagePanel />
        </Suspense>
      </div>
      {children}
    </AppShell>
  );
}
