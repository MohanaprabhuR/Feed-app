import { AppHeader, BottomNav } from "@/components/app-nav";
import { cn } from "@/lib/utils";

type AppShellProps = {
  children: React.ReactNode;
  className?: string;
  shellClassName?: string;
  noPadding?: boolean;
  wide?: boolean;
  feedLayout?: boolean;
};

export function AppShell({
  children,
  className,
  shellClassName,
  noPadding,
  wide,
  feedLayout,
}: AppShellProps) {
  return (
    <div
      className={cn(
        "flex min-h-full flex-col",
        feedLayout && "bg-muted/40 dark:bg-background",
        shellClassName
      )}
    >
      <AppHeader />
      <main
        className={cn(
          "mx-auto w-full flex-1 pb-20 md:pb-8",
          feedLayout && "max-w-[1128px] px-3 py-5 sm:px-5 sm:py-7",
          wide && !feedLayout && "max-w-6xl",
          !wide && !feedLayout && "max-w-2xl md:max-w-3xl",
          !noPadding && !feedLayout && "px-4 py-5 sm:px-6 sm:py-6",
          className
        )}
      >
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
