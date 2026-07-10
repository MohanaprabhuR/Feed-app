import Link from "next/link";
import {
  Bell,
  ChevronRight,
  Globe,
  Info,
  Lock,
  LogOut,
  Moon,
  Shield,
  UserX,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Separator } from "@/components/ui/separator";

const settingsGroups = [
  {
    title: "Account",
    items: [
      { href: "/settings/privacy", label: "Privacy", icon: Lock },
      { href: "/settings/blocked", label: "Blocked users", icon: UserX },
      { href: "/settings/notifications", label: "Notifications", icon: Bell },
    ],
  },
  {
    title: "Preferences",
    items: [
      { href: "/settings/theme", label: "Theme", icon: Moon },
      { href: "/settings/language", label: "Language", icon: Globe },
    ],
  },
  {
    title: "Safety",
    items: [{ href: "/settings/blocked", label: "Blocked users", icon: Shield }],
  },
  {
    title: "About",
    items: [
      { href: "/about", label: "About", icon: Info },
      { href: "/terms", label: "Terms & Privacy", icon: Shield },
    ],
  },
];

export default function SettingsPage() {
  return (
    <AppShell noPadding>
      <PageHeader title="Settings" backHref="/feed" />
      <div className="p-4">
        {settingsGroups.map((group, i) => (
          <div key={group.title} className="mb-6">
            <h2 className="mb-2 px-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {group.title}
            </h2>
            <div className="rounded-lg border">
              {group.items.map((item, j) => (
                <div key={item.href + item.label}>
                  <Link
                    href={item.href}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
                  >
                    <item.icon className="size-4 text-muted-foreground" />
                    <span className="flex-1 text-sm">{item.label}</span>
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </Link>
                  {j < group.items.length - 1 && <Separator />}
                </div>
              ))}
            </div>
            {i < settingsGroups.length - 1 && <div className="mt-4" />}
          </div>
        ))}

        <Link
          href="/logout"
          className="flex items-center gap-3 rounded-lg border border-destructive/20 px-4 py-3 text-destructive transition-colors hover:bg-destructive/10"
        >
          <LogOut className="size-4" />
          <span className="text-sm font-medium">Sign out</span>
        </Link>
      </div>
    </AppShell>
  );
}
