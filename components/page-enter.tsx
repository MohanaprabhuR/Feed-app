"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";

type PageEnterProps = {
  children: React.ReactNode;
  className?: string;
};

export function PageEnter({ children, className }: PageEnterProps) {
  const pathname = usePathname();
  const [initialPathname] = useState(pathname);
  const shouldAnimate = pathname !== initialPathname;

  return (
    <div
      key={pathname}
      className={cn(
        shouldAnimate &&
          "page-enter animate-in fade-in-0 slide-in-from-bottom-2 duration-500",
        className,
      )}
    >
      {children}
    </div>
  );
}
