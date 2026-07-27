"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type CellSize =
  | "xs"
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "2xl"
  | "3xl"
  | "4xl"
  | "auto";

interface AdvancedCellProps extends React.ComponentProps<"div"> {
  size?: CellSize;
}

function AdvancedCell({
  className,
  children,
  size = "auto",
  ...props
}: AdvancedCellProps) {
  const sizeClasses = {
    xs: "max-w-22",
    sm: "max-w-26",
    md: "max-w-30",
    lg: "max-w-34",
    xl: "max-w-36",
    "2xl": "max-w-42",
    "3xl": "max-w-46",
    "4xl": "max-w-54",
    auto: "w-fit",
  }[size];

  return (
    <div
      data-slot="advanced-cell"
      className={cn(
        "flex  gap-1 w-full px-3 py-1.5 overflow-hidden items-center",
        sizeClasses,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export { AdvancedCell };
