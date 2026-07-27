import { AppShell } from "@/components/app-shell";
import { MessagingPagePanel } from "@/components/messaging-dock";

export default function MessagesPage() {
  return (
    <AppShell noPadding feedLayout>
      <div className="mx-auto w-full max-w-[1128px] sm:px-5 sm:py-5">
        <MessagingPagePanel />
      </div>
    </AppShell>
  );
}
