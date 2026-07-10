"use client";

import { ThemeProvider } from "@/components/theme-provider";
import { CurrentUserProvider } from "@/components/current-user-provider";
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <CurrentUserProvider>
        {children}
        <Toaster richColors position="top-center" />
      </CurrentUserProvider>
    </ThemeProvider>
  );
}
