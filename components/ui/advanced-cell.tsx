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
    xs: "max-w-[88px]",
    sm: "max-w-[104px]",
    md: "max-w-[120px]",
    lg: "max-w-[136px]",
    xl: "max-w-[144px]",
    "2xl": "max-w-[168px]",
    "3xl": "max-w-[184px]",
    "4xl": "max-w-[216px]",
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
