"use client";

import { MeMenuPanel } from "@/components/me-menu-panel";
import type { User } from "@/lib/types";

type ProfileGeneralSettingsProps = {
  user: User;
};

export function ProfileGeneralSettings({ user }: ProfileGeneralSettingsProps) {
  return <MeMenuPanel user={user} />;
}
