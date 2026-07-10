import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type AuthLayoutProps = {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  className?: string;
};

export function AuthLayout({
  children,
  title,
  subtitle,
  className,
}: AuthLayoutProps) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-gradient-to-b from-background to-muted/40 px-4 py-12">
      <div className={cn("w-full max-w-sm space-y-8", className)}>
        <div className="space-y-2 text-center">
          <Avatar size="3xl" className="mx-auto mb-4 rounded-2xl bg-primary">
            <AvatarFallback className="rounded-2xl bg-primary text-2xl font-bold text-primary-foreground">
              F
            </AvatarFallback>
          </Avatar>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
