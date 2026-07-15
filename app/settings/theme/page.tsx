"use client";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { pageColumnClass, pagePanelClass } from "@/lib/feed-layout";

export default function ThemePage() {
  return (
    <AppShell noPadding feedLayout>
      <PageHeader title="Theme" backHref="/settings" />
      <div className={pageColumnClass}>
        <div className={`${pagePanelClass} p-4 sm:p-5`}>
          <h2 className="mb-1 font-serif text-lg font-medium tracking-tight">
            Appearance
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Choose how Feed looks across the app. System follows your device.
          </p>
          <ThemeSwitcher />
        </div>
      </div>
    </AppShell>
  );
}
