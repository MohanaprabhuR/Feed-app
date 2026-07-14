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
        "sticky top-0 z-40 h-14 bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:px-5",
        className
      )}
    >
      {backHref ? (
        <Button variant="ghost" size="sm" iconOnly asChild>
          <Link href={backHref}>
            <ChevronLeft />
          </Link>
        </Button>
      ) : (
        <div className="w-9" />
      )}
      <h1 className="flex-1 truncate text-center text-lg font-semibold tracking-tight">
        {title}
      </h1>
      <div className="flex w-9 items-center justify-end">{action}</div>
    </Header>
  );
}
