"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import {
  Check,
  Monitor,
  Moon,
  Sun,
} from "lucide-react";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from "@/components/ui/item";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@/lib/types";
import { cn } from "@/lib/utils";

const themes = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

type MeMenuPanelProps = {
  user: User;
  onClose?: () => void;
};

export function MeMenuPanel({ user, onClose }: MeMenuPanelProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [showTheme, setShowTheme] = useState(false);

  useEffect(() => setMounted(true), []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    onClose?.();
    router.push("/welcome");
    router.refresh();
  }

  return (
    <div className="w-[300px] p-2">
      <Item size="sm">
        <UserAvatar src={user.avatar} name={user.name} size="sm" />
        <ItemContent>
          <ItemTitle>{user.name}</ItemTitle>
          <ItemDescription>{user.bio || `@${user.username}`}</ItemDescription>
        </ItemContent>
      </Item>

      <div className="flex gap-2 px-2 pb-3">
        <Button variant="outline" size="sm" className="flex-1" asChild>
          <Link href="/profile" onClick={onClose}>
            View profile
          </Link>
        </Button>
        <Button variant="primary" size="sm" className="flex-1" asChild>
          <Link href="/profile/edit" onClick={onClose}>
            Edit profile
          </Link>
        </Button>
      </div>

      <Separator />

      <div className="px-2 py-3">
        <p className="mb-1 text-sm font-semibold">Account</p>
        <ItemGroup>
          <Button variant="ghost" className="w-full justify-start" asChild>
            <Link href="/profile/settings" onClick={onClose}>
              Settings &amp; Privacy
            </Link>
          </Button>
          <Button variant="ghost" className="w-full justify-start" asChild>
            <Link href="/about" onClick={onClose}>
              Help
            </Link>
          </Button>
          <Button variant="ghost" className="w-full justify-start" asChild>
            <Link href="/settings/language" onClick={onClose}>
              Language
            </Link>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => setShowTheme((v) => !v)}
          >
            Theme
          </Button>
          {showTheme && (
            <ItemGroup className="rounded-lg border bg-muted/30 p-1">
              {themes.map(({ value, label, icon: Icon }) => (
                <Button
                  key={value}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start",
                    mounted && theme === value && "bg-background font-medium"
                  )}
                  onClick={() => setTheme(value)}
                >
                  <Icon className="size-3.5 text-muted-foreground" />
                  <span className="flex-1 text-left">{label}</span>
                  {mounted && theme === value && <Check className="size-3.5" />}
                </Button>
              ))}
            </ItemGroup>
          )}
        </ItemGroup>
      </div>

      <Separator />

      <div className="px-2 py-3">
        <p className="mb-1 text-sm font-semibold">Manage</p>
        <ItemGroup>
          <Button variant="ghost" className="w-full justify-start" asChild>
            <Link href="/following" onClick={onClose}>
              Following
            </Link>
          </Button>
          <Button variant="ghost" className="w-full justify-start" asChild>
            <Link href="/my-posts" onClick={onClose}>
              Posts &amp; Activity
            </Link>
          </Button>
          <Button variant="ghost" className="w-full justify-start" asChild>
            <Link href="/saved" onClick={onClose}>
              Saved items
            </Link>
          </Button>
        </ItemGroup>
      </div>

      <Separator />

      <div className="px-2 py-2">
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={handleSignOut}
        >
          Sign out
        </Button>
      </div>
    </div>
  );
}
