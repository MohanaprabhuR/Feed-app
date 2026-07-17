"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Home, MessageCircle, Search, Users } from "lucide-react";
import { MeMenu } from "@/components/me-menu";
import { FeedLogoMark } from "@/components/feed-logo";
import { useMessaging } from "@/components/messaging-provider";
import { useNotifications } from "@/components/notifications-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/ui/header";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/feed", label: "Home", icon: Home },
  { href: "/following", label: "Following", icon: Users },
  { href: "/notifications", label: "Notifications", icon: Bell },
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
        "relative flex min-w-[72px] h-auto flex-col items-center gap-1 px-1.5 py-1.5 text-2xs font-medium",
        active ? "text-foreground" : "text-muted-foreground",
      )}
    >
      <Link href={href}>
        <Icon className="size-5" />
        {badge ? (
          <Badge
            variant="destructive"
            size="sm"
            className="absolute right-1.5 top-0 size-4 p-0 text-2xs"
          >
            {badge > 9 ? "9+" : badge}
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

function MessagingNavItem() {
  const { expanded, toggleMessaging } = useMessaging();

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={toggleMessaging}
      aria-pressed={expanded}
      className={cn(
        "relative flex min-w-[72px] h-auto flex-col items-center gap-1 px-1.5 py-1.5 text-2xs font-medium",
        expanded ? "text-foreground" : "text-muted-foreground",
      )}
    >
      <MessageCircle className="size-5" />
      <span className="max-w-[72px] truncate">Messaging</span>
      {expanded && (
        <Separator className="h-0.5 w-full max-w-14 bg-foreground" />
      )}
    </Button>
  );
}

function NotificationsNavItem({ active }: { active: boolean }) {
  const { unreadCount } = useNotifications();

  return (
    <NavItem
      href="/notifications"
      label="Notifications"
      icon={Bell}
      active={active}
      badge={unreadCount > 0 ? unreadCount : undefined}
    />
  );
}

function isNavActive(pathname: string, href: string) {
  return pathname === href || (href !== "/feed" && pathname.startsWith(href));
}

export function BottomNav() {
  const pathname = usePathname();

  if (hiddenOnRoutes.some((route) => pathname.startsWith(route))) {
    return null;
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t bg-background md:hidden">
      <div className="mx-auto flex h-14 max-w-lg items-center justify-around px-2">
        <NavItem
          {...navItems[0]}
          active={isNavActive(pathname, navItems[0].href)}
        />
        <NavItem
          {...navItems[1]}
          active={isNavActive(pathname, navItems[1].href)}
        />
        <MessagingNavItem />
        <NotificationsNavItem
          active={isNavActive(pathname, "/notifications")}
        />
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
    <Header className="sticky top-0 z-40 h-14 w-full border-b bg-background/95 px-3 backdrop-blur supports-backdrop-filter:bg-background/80 sm:px-5">
      <div className="mx-auto flex h-full w-full max-w-[1128px] items-center gap-3">
        <Link
          href="/feed"
          aria-label="Feed home"
          className="inline-flex shrink-0 rounded-[0.7rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <FeedLogoMark />
        </Link>

        <div className="hidden max-w-[280px] flex-1 md:block">
          <Input
            type="search"
            size="sm"
            placeholder="Search"
            prefix={<Search className="size-4 text-muted-foreground" />}
            onKeyDown={(e) => {
              if (e.key === "Enter") router.push("/search");
            }}
          />
        </div>

        <nav className="mx-auto hidden flex-1 items-center justify-center md:flex">
          <NavItem
            {...navItems[0]}
            active={isNavActive(pathname, navItems[0].href)}
          />
          <NavItem
            {...navItems[1]}
            active={isNavActive(pathname, navItems[1].href)}
          />
          <MessagingNavItem />
          <NotificationsNavItem
            active={isNavActive(pathname, "/notifications")}
          />
          <MeMenu />
        </nav>

        <Button
          variant="ghost"
          size="sm"
          iconOnly
          className="md:hidden"
          asChild
        >
          <Link href="/search">
            <Search />
          </Link>
        </Button>
      </div>
    </Header>
  );
}
