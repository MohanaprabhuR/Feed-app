import { AppHeader, BottomNav } from "@/components/app-nav";
import { cn } from "@/lib/utils";

type AppShellProps = {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
  wide?: boolean;
  feedLayout?: boolean;
};

export function AppShell({
  children,
  className,
  noPadding,
  wide,
  feedLayout,
}: AppShellProps) {
  return (
    <div
      className={cn(
        "flex min-h-full flex-col",
        feedLayout && "bg-muted/40 dark:bg-background"
      )}
    >
      <AppHeader />
      <main
        className={cn(
          "mx-auto w-full flex-1 pb-20 md:pb-8",
          feedLayout && "max-w-[1128px] px-3 py-4 sm:px-4 sm:py-6",
          wide && !feedLayout && "max-w-6xl",
          !wide && !feedLayout && "max-w-2xl md:max-w-3xl",
          !noPadding && !feedLayout && "px-4 py-4",
          className
        )}
      >
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
