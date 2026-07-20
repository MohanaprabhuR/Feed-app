import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/ui/header";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  backHref?: string;
  action?: React.ReactNode;
  className?: string;
};

export function PageHeader({
  title,
  backHref,
  action,
  className,
}: PageHeaderProps) {
  return (
    <Header
      className={cn(
        "sticky top-14 z-30 h-12 border-b bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/80 sm:px-5 md:top-14",
        className,
      )}
    >
      {backHref ? (
        <Button variant="ghost" size="sm" iconOnly asChild>
          <Link href={backHref} aria-label="Go back">
            <ChevronLeft />
          </Link>
        </Button>
      ) : (
        <div className="w-9" />
      )}
      <h1 className="flex-1 truncate text-center text-base font-semibold tracking-tight sm:text-lg">
        {title}
      </h1>
      <div className="flex min-w-9 items-center justify-end">{action}</div>
    </Header>
  );
}
