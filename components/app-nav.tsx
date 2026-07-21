"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Home, Menu, MessageCircle, Search, Users, X } from "lucide-react";
import { useCurrentUser } from "@/components/current-user-provider";
import { MeMenu } from "@/components/me-menu";
import { MeMenuPanel } from "@/components/me-menu-panel";
import { FeedLogoMark } from "@/components/feed-logo";
import { useMessaging } from "@/components/messaging-provider";
import { useNotifications } from "@/components/notifications-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/ui/header";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
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

function MobileNavMenuItem({
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
  const { setOpenMobile } = useSidebar();

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={active}>
        <Link href={href} onClick={() => setOpenMobile(false)}>
          <Icon />
          <span>{label}</span>
        </Link>
      </SidebarMenuButton>
      {badge ? (
        <SidebarMenuBadge>{badge > 9 ? "9+" : badge}</SidebarMenuBadge>
      ) : null}
    </SidebarMenuItem>
  );
}

function MobileMessagingMenuItem() {
  const { expanded, toggleMessaging } = useMessaging();
  const { setOpenMobile } = useSidebar();

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        type="button"
        isActive={expanded}
        onClick={() => {
          toggleMessaging();
          setOpenMobile(false);
        }}
      >
        <MessageCircle />
        <span>Messaging</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function MobileNavSidebarContent() {
  const pathname = usePathname();
  const { user } = useCurrentUser();
  const { unreadCount } = useNotifications();
  const { setOpenMobile } = useSidebar();

  return (
    <Sidebar side="left" collapsible="offcanvas">
      <SidebarHeader className="flex-row items-center justify-between border-b border-sidebar-border">
        <span className="font-serif text-xl font-semibold">Menu</span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          iconOnly
          aria-label="Close menu"
          onClick={() => setOpenMobile(false)}
        >
          <X />
        </Button>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <MobileNavMenuItem
              {...navItems[0]}
              active={isNavActive(pathname, navItems[0].href)}
            />
            <MobileNavMenuItem
              {...navItems[1]}
              active={isNavActive(pathname, navItems[1].href)}
            />
            <MobileMessagingMenuItem />
            <MobileNavMenuItem
              href="/notifications"
              label="Notifications"
              icon={Bell}
              active={isNavActive(pathname, "/notifications")}
              badge={unreadCount > 0 ? unreadCount : undefined}
            />
            <MobileNavMenuItem
              href="/search"
              label="Search"
              icon={Search}
              active={isNavActive(pathname, "/search")}
            />
          </SidebarMenu>
        </SidebarGroup>

        {user && (
          <>
            <SidebarSeparator className="mx-0" />
            <MeMenuPanel user={user} onClose={() => setOpenMobile(false)} />
          </>
        )}
      </SidebarContent>
    </Sidebar>
  );
}

function MobileNav() {
  return (
    <SidebarProvider defaultOpen={false} persistState={false} className="contents">
      <SidebarTrigger
        icon={Menu}
        variant="ghost"
        size="sm"
        aria-label="Open menu"
        className="size-9"
      />
      <MobileNavSidebarContent />
    </SidebarProvider>
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

        <div className="hidden max-w-[280px] flex-1 lg:block">
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

        <nav className="mx-auto hidden flex-1 items-center justify-center lg:flex">
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

        <div className="ml-auto flex items-center gap-1 lg:hidden">
          <Button variant="ghost" size="sm" iconOnly asChild>
            <Link href="/search">
              <Search />
            </Link>
          </Button>
          <MobileNav />
        </div>
      </div>
    </Header>
  );
}
