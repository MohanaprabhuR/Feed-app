import Link from "next/link";
import { Bell, FileText, Heart, MessageCircle, Users } from "lucide-react";
import { FeedMark } from "@/components/feed-logo";
import { cn } from "@/lib/utils";

type AuthLayoutProps = {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  className?: string;
};


function AuthBrandPanel() {
  return (
    <aside
      className="relative hidden min-h-dvh w-full overflow-hidden lg:flex lg:flex-col lg:justify-between"
      style={{
        backgroundColor: "#f3efe8",
        backgroundImage:
          "repeating-linear-gradient(-45deg, transparent, transparent 11px, rgba(0,0,0,0.035) 11px, rgba(0,0,0,0.035) 12px)",
      }}
    >
      <div className="relative z-10 flex min-h-dvh flex-1 flex-col px-10 pb-10 pt-12 xl:px-16">
        <FeedMark />

        <div className="mt-10 max-w-lg">
          <h2 className="text-4xl font-semibold leading-tight tracking-tight text-foreground xl:text-5xl">
            Share updates, follow people, and stay in the conversation
          </h2>
        </div>

        <div className="relative mx-auto mt-12 w-full max-w-105 flex-1">
          <div className="auth-preview-stack relative space-y-3">
            <div className="auth-preview-float auth-preview-float--1">
              <div className="auth-preview-card auth-preview-card--1 rounded-2xl border border-black/5 bg-background p-4 shadow-[0_18px_40px_-24px_rgba(0,0,0,0.45)]">
                <div className="flex items-center gap-3">
                  <span className="size-10 rounded-full bg-sky-700/90" />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="h-3 w-28 rounded-full bg-foreground/80" />
                    <div className="h-2.5 w-20 rounded-full bg-foreground/25" />
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="h-2.5 w-full rounded-full bg-foreground/15" />
                  <div className="h-2.5 w-4/5 rounded-full bg-foreground/15" />
                </div>
                <div className="mt-4 flex items-center gap-4 text-foreground/55">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                    <Heart className="size-3.5 fill-rose-500 text-rose-500" />
                    Like
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                    <MessageCircle className="size-3.5" />
                    Comment
                  </span>
                </div>
              </div>
            </div>

            <div className="auth-preview-float auth-preview-float--2">
              <div className="auth-preview-card auth-preview-card--2 ml-6 rounded-2xl border border-black/5 bg-background p-3.5 shadow-[0_16px_36px_-22px_rgba(0,0,0,0.4)]">
                <div className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                    <Bell className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">
                      New notification
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      Alex liked your post
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="auth-preview-float auth-preview-float--3">
              <div className="auth-preview-card auth-preview-card--3 mr-4 rounded-2xl border border-black/5 bg-background p-3.5 shadow-[0_16px_36px_-22px_rgba(0,0,0,0.4)]">
                <div className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    <MessageCircle className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">
                      New message
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      Let’s catch up on the feed
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-2 pt-10 text-sm font-medium text-foreground/45">
          <span className="inline-flex items-center gap-1.5">
            <Users className="size-3.5" />
            Following
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Bell className="size-3.5" />
            Notifications
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MessageCircle className="size-3.5" />
            Messages
          </span>
          <span className="inline-flex items-center gap-1.5">
            <FileText className="size-3.5" />
            Posts
          </span>
        </div>
      </div>
    </aside>
  );
}

export function AuthLayout({
  children,
  title,
  subtitle,
  className,
}: AuthLayoutProps) {
  return (
    <div className="grid min-h-dvh w-full bg-background lg:grid-cols-2">
      <AuthBrandPanel />

      <div className="relative flex min-h-dvh w-full flex-col justify-center px-5 py-12 sm:px-10 lg:px-14 xl:px-20">
        <div className="mb-8 lg:hidden">
          <Link href="/welcome" className="inline-flex">
            <FeedMark />
          </Link>
        </div>

        <div
          className={cn("mx-auto w-full max-w-105 space-y-7", className)}
        >
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {title}
            </h1>
            {subtitle ? (
              <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                {subtitle}
              </p>
            ) : null}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
