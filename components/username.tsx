import { formatUsernameHandle } from "@/lib/username";
import { cn } from "@/lib/utils";

type UsernameProps = {
  username: string;
  className?: string;
};

export function Username({ username, className }: UsernameProps) {
  return (
    <span className={cn("font-mono tracking-tight", className)}>
      {formatUsernameHandle(username)}
    </span>
  );
}
