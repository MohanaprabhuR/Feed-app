import { AppHeader } from "@/components/app-nav";
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
        // Ambient gradient wash, shared by every page. bg-fixed keeps it stable
        // regardless of page height; the transparent middle reveals the base
        // muted field so content cards still read against it.
        "flex min-h-dvh flex-col bg-muted/30 bg-fixed bg-gradient-to-b from-sky-100/50 via-transparent to-violet-100/40 dark:bg-background dark:from-sky-950/20 dark:via-transparent dark:to-violet-950/25",
        shellClassName,
      )}
    >
      <AppHeader />
      <main
        className={cn(
          "mx-auto w-full flex-1 pb-8",
          feedLayout && "max-w-282",
          feedLayout && !noPadding && "px-3 py-5 sm:px-5 sm:py-7",
          wide && !feedLayout && "max-w-6xl",
          !wide && !feedLayout && "max-w-2xl md:max-w-3xl",
          !noPadding && !feedLayout && "px-4 py-5 sm:px-6 sm:py-6",
          className,
        )}
      >
        {children}
      </main>
    </div>
  );
}
