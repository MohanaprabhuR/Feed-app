"use client";
import { cn } from "@/lib/utils";
import React from "react";

function Header({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "w-full border-b bg-background py-2.5 ms:px-5 px-3 pl-2 flex items-center justify-between",
        className
      )}
    >
      {children}
    </header>
  );
}

export { Header };
