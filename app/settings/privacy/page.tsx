"use client";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const privacySettings = [
  {
    id: "private",
    label: "Private account",
    description: "Only approved followers can see your posts",
  },
  {
    id: "activity",
    label: "Show activity status",
    description: "Let others see when you're active",
  },
  {
    id: "mentions",
    label: "Allow mentions",
    description: "Let others mention you in posts",
  },
  {
    id: "tags",
    label: "Allow tags",
    description: "Let others tag you in photos",
  },
];

export default function PrivacyPage() {
  return (
    <AppShell noPadding>
      <PageHeader title="Privacy" backHref="/settings" />
      <div className="divide-y">
        {privacySettings.map((setting) => (
          <div
            key={setting.id}
            className="flex items-center justify-between gap-4 px-4 py-4"
          >
            <div className="space-y-0.5">
              <Label htmlFor={setting.id}>{setting.label}</Label>
              <p className="text-sm text-muted-foreground">
                {setting.description}
              </p>
            </div>
            <Switch id={setting.id} defaultChecked={setting.id !== "private"} />
          </div>
        ))}
      </div>
    </AppShell>
  );
}
