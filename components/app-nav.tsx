"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  Bookmark,
  CircleHelp,
  FileText,
  Globe,
  Home,
  LogOut,
  Menu,
  MessageCircle,
  Search,
  Settings,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { useCurrentUser } from "@/components/current-user-provider";
import { MeMenu } from "@/components/me-menu";
import { FeedLogoMark } from "@/components/feed-logo";
import { useNotifications } from "@/components/notifications-provider";
import { ThemeMenuRow } from "@/components/theme-switcher";
import { UserAvatar } from "@/components/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/ui/header";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
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
import { createClient } from "@/lib/supabase/client";
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
        "relative flex min-w-18 h-auto flex-col items-center gap-1 px-1.5 py-1.5 text-2xs font-medium",
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
        <span className="max-w-18 truncate">{label}</span>
        {active && (
          <Separator className="h-0.5 w-full max-w-14 bg-foreground" />
        )}
      </Link>
    </Button>
  );
}

function MessagesNavItem({ active }: { active: boolean }) {
  return (
    <NavItem
      href="/messages"
      label="Messages"
      icon={MessageCircle}
      active={active}
    />
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

function MobileMessagesMenuItem() {
  return (
    <MobileNavMenuItem
      href="/messages"
      label="Messages"
      icon={MessageCircle}
      active={isNavActive(usePathname(), "/messages")}
    />
  );
}

function MobileNavSidebarContent() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useCurrentUser();
  const { unreadCount } = useNotifications();
  const { setOpenMobile } = useSidebar();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setOpenMobile(false);
    router.push("/welcome");
    router.refresh();
  }

  return (
    <Sidebar side="left" collapsible="offcanvas">
      <SidebarHeader className="border-b border-sidebar-border px-2 py-2">
        <FeedLogoMark className="size-8 text-base sm:size-8 sm:text-base" />
        <span className="font-serif text-xl font-semibold">Feed</span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          iconOnly
          aria-label="Close menu"
          className="ml-auto"
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
            <MobileMessagesMenuItem />
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
            <SidebarGroup>
              <SidebarGroupLabel>Account</SidebarGroupLabel>
              <SidebarMenu>
                <MobileNavMenuItem
                  href="/profile"
                  label="View profile"
                  icon={UserRound}
                  active={isNavActive(pathname, "/profile")}
                />
                <MobileNavMenuItem
                  href="/settings"
                  label="Settings & privacy"
                  icon={Settings}
                  active={isNavActive(pathname, "/settings")}
                />
                <MobileNavMenuItem
                  href="/about"
                  label="Help"
                  icon={CircleHelp}
                  active={isNavActive(pathname, "/about")}
                />
                <MobileNavMenuItem
                  href="/settings/language"
                  label="Language"
                  icon={Globe}
                  active={pathname === "/settings/language"}
                />
              </SidebarMenu>
              <ThemeMenuRow />
            </SidebarGroup>

            <SidebarSeparator className="mx-0" />
            <SidebarGroup>
              <SidebarGroupLabel>Manage</SidebarGroupLabel>
              <SidebarMenu>
                <MobileNavMenuItem
                  href="/my-posts"
                  label="Posts & activity"
                  icon={FileText}
                  active={isNavActive(pathname, "/my-posts")}
                />
                <MobileNavMenuItem
                  href="/saved"
                  label="Saved items"
                  icon={Bookmark}
                  active={isNavActive(pathname, "/saved")}
                />
              </SidebarMenu>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      {user && (
        <SidebarFooter className="border-t border-sidebar-border">
          <div className="flex min-w-0 items-center gap-2">
            <UserAvatar src={user.avatar} name={user.name} size="sm" />
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-sm font-semibold">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                @{user.username}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              iconOnly
              aria-label="Sign out"
              onClick={() => void handleSignOut()}
            >
              <LogOut />
            </Button>
          </div>
        </SidebarFooter>
      )}
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
      <div className="mx-auto flex h-full w-full max-w-282 items-center gap-3">
        <Link
          href="/feed"
          aria-label="Feed home"
          className="inline-flex shrink-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <FeedLogoMark />
        </Link>

        <div className="hidden max-w-70 flex-1 lg:block">
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
          <MessagesNavItem active={isNavActive(pathname, "/messages")} />
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
