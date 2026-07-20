"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { cn } from "@/lib/utils";

const languages = [
  { code: "en", label: "English", native: "English" },
  { code: "es", label: "Spanish", native: "Español" },
  { code: "fr", label: "French", native: "Français" },
  { code: "de", label: "German", native: "Deutsch" },
  { code: "ja", label: "Japanese", native: "日本語" },
  { code: "hi", label: "Hindi", native: "हिन्दी" },
];

export default function LanguagePage() {
  const [selected, setSelected] = useState("en");

  return (
    <AppShell noPadding>
      <PageHeader title="Language" backHref="/settings" />
      <div className="divide-y">
        {languages.map((lang) => (
          <button
            key={lang.code}
            type="button"
            onClick={() => setSelected(lang.code)}
            className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50"
          >
            <div className="flex-1">
              <p className="font-medium">{lang.native}</p>
              <p className="text-sm text-muted-foreground">{lang.label}</p>
            </div>
            {selected === lang.code && (
              <Check className="size-4 text-primary" />
            )}
          </button>
        ))}
      </div>
    </AppShell>
  );
}
