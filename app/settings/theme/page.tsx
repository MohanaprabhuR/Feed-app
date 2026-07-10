"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Check, Monitor, Moon, Sun } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { cn } from "@/lib/utils";

const themes = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

export default function ThemePage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <AppShell noPadding>
      <PageHeader title="Theme" backHref="/settings" />
      <div className="space-y-2 p-4">
        {themes.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => setTheme(value)}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors hover:bg-muted/50",
              mounted && theme === value && "border-primary bg-primary/5"
            )}
          >
            <Icon className="size-5" />
            <span className="flex-1 font-medium">{label}</span>
            {mounted && theme === value && <Check className="size-4 text-primary" />}
          </button>
        ))}
      </div>
    </AppShell>
  );
}
