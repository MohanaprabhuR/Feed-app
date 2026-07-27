"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Check, Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { cn } from "@/lib/utils";

const themes = [
  {
    value: "light",
    label: "Light",
    description: "Bright background, dark text",
    icon: Sun,
  },
  {
    value: "dark",
    label: "Dark",
    description: "Dark background, light text",
    icon: Moon,
  },
  {
    value: "system",
    label: "System",
    description: "Match your device setting",
    icon: Monitor,
  },
] as const;

type ThemeValue = (typeof themes)[number]["value"];

export function ThemeSwitcher({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <div
      className={cn(
        compact ? "space-y-1" : "grid gap-2 sm:grid-cols-3",
        className
      )}
      role="radiogroup"
      aria-label="Theme"
    >
      {themes.map(({ value, label, description, icon: Icon }) => {
        const selected = mounted && theme === value;

        if (compact) {
          return (
            <Button
              key={value}
              type="button"
              variant="ghost"
              role="radio"
              aria-checked={selected}
              className={cn(
                "w-full justify-start",
                selected && "bg-background font-medium"
              )}
              onClick={() => setTheme(value)}
            >
              <Icon className="size-3.5 text-muted-foreground" />
              <span className="flex-1 text-left">{label}</span>
              {selected && <Check className="size-3.5" />}
            </Button>
          );
        }

        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => setTheme(value)}
            className={cn(
              "flex flex-col items-start gap-3 rounded-xl border bg-card p-4 text-left transition-colors hover:bg-muted/40",
              selected && "border-primary bg-primary/5 ring-1 ring-primary/20"
            )}
          >
            <span
              className={cn(
                "flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground",
                selected && "bg-primary text-primary-foreground"
              )}
            >
              <Icon className="size-4" />
            </span>
            <span className="space-y-0.5">
              <span className="flex items-center gap-2 text-base font-medium">
                {label}
                {selected && <Check className="size-3.5 text-primary" />}
              </span>
              <span className="block text-sm text-muted-foreground">
                {description}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Menu row: "Theme" on the left, three-icon button group on the right. */
export function ThemeMenuRow({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <div
      className={cn(
        "flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5",
        className
      )}
    >
      <span className="text-base leading-tight tracking-4">Theme</span>
      <ButtonGroup aria-label="Theme">
        {themes.map(({ value, label, icon: Icon }) => {
          const selected = mounted && theme === value;
          return (
            <Button
              key={value}
              type="button"
              variant={selected ? "secondary" : "outline"}
              size="sm"
              iconOnly
              aria-label={label}
              aria-pressed={selected}
              onClick={() => setTheme(value)}
            >
              <Icon className="size-4" />
            </Button>
          );
        })}
      </ButtonGroup>
    </div>
  );
}

export type { ThemeValue };
