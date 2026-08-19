"use client";

import { ThemeProvider } from "@/components/theme-provider";
import { CurrentUserProvider } from "@/components/current-user-provider";
import { MessagingDock } from "@/components/messaging-dock";
import { MessagingProvider } from "@/components/messaging-provider";
import { NotificationsProvider } from "@/components/notifications-provider";
import { PresenceProvider } from "@/components/presence-provider";
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <CurrentUserProvider>
        <PresenceProvider>
          <MessagingProvider>
            <NotificationsProvider>
              <div className="flex min-h-dvh w-full flex-1 flex-col">
                {children}
              </div>
              <MessagingDock />
              <Toaster richColors position="top-center" />
            </NotificationsProvider>
          </MessagingProvider>
        </PresenceProvider>
      </CurrentUserProvider>
    </ThemeProvider>
  );
}
