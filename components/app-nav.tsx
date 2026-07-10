"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  Briefcase,
  Home,
  MessageCircle,
  Search,
  Users,
} from "lucide-react";
import { MeMenu } from "@/components/me-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/ui/header";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/feed", label: "Home", icon: Home },
  { href: "/search", label: "My Network", icon: Users },
  { href: "/trending", label: "Jobs", icon: Briefcase },
  { href: "/messages", label: "Messaging", icon: MessageCircle },
  { href: "/notifications", label: "Notifications", icon: Bell, badge: 3 },
] as const;

const hiddenOnRoutes = [
  "/splash",
  "/welcome",
  "/login",
  "/register",
  "/forgot-password",
  "/logout",
];

function NavItem({
  href,
  label,
  icon: Icon,
  active,
  badge,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  badge?: number;
}) {
  return (
    <Button
      asChild
      variant="ghost"
      className={cn(
        "relative flex min-w-[64px] h-auto flex-col items-center gap-0.5 px-1 py-1 text-[11px]",
        active ? "text-foreground" : "text-muted-foreground"
      )}
    >
      <Link href={href}>
        <Icon className="size-5" />
        {badge ? (
          <Badge
            variant="destructive"
            size="sm"
            className="absolute right-2 top-0 size-4 p-0 text-[10px]"
          >
            {badge}
          </Badge>
        ) : null}
        <span className="max-w-[72px] truncate">{label}</span>
        {active && (
          <Separator className="h-0.5 w-full max-w-14 bg-foreground" />
        )}
      </Link>
    </Button>
  );
}

export function BottomNav() {
  const pathname = usePathname();

  if (hiddenOnRoutes.some((route) => pathname.startsWith(route))) {
    return null;
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t bg-background md:hidden">
      <div className="mx-auto flex h-14 max-w-lg items-center justify-around px-1">
        {navItems.slice(0, 4).map((item) => (
          <NavItem
            key={item.href}
            {...item}
            active={
              pathname === item.href ||
              (item.href !== "/feed" && pathname.startsWith(item.href))
            }
          />
        ))}
        <MeMenu side="top" align="center" />
      </div>
    </nav>
  );
}

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();

  if (hiddenOnRoutes.some((route) => pathname.startsWith(route))) {
    return null;
  }

  return (
    <Header className="sticky top-0 z-40 h-[52px] w-full border-b bg-background/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:px-4">
      <div className="mx-auto flex h-full w-full max-w-[1128px] items-center gap-2">
      <Button asChild variant="ghost" size="sm" iconOnly className="shrink-0">
        <Link href="/feed">
          <Avatar size="2xl" className="rounded bg-primary">
            <AvatarFallback className="rounded bg-primary text-lg font-bold text-primary-foreground">
              F
            </AvatarFallback>
          </Avatar>
        </Link>
      </Button>

      <Input
        type="search"
        size="sm"
        placeholder="Search"
        prefix={<Search className="size-4 text-muted-foreground" />}
        className="hidden max-w-[280px] flex-1 md:flex"
        onKeyDown={(e) => {
          if (e.key === "Enter") router.push("/search");
        }}
      />

      <nav className="mx-auto hidden flex-1 items-center justify-center md:flex">
        {navItems.map((item) => (
          <NavItem
            key={item.href}
            {...item}
            active={
              pathname === item.href ||
              (item.href !== "/feed" && pathname.startsWith(item.href))
            }
          />
        ))}
        <MeMenu />
      </nav>

      <Button variant="ghost" size="sm" iconOnly className="md:hidden" asChild>
        <Link href="/search">
          <Search />
        </Link>
      </Button>
      </div>
    </Header>
  );
}
