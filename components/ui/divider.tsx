"use client";

import React from "react";
import { cn } from "@/lib/utils";

type DividerProps = {
  orientation?: "horizontal" | "vertical";
  align?: "start" | "center" | "end";
  children?: React.ReactNode;
  className?: string;
  slot?: boolean;
  padded?: boolean;
  paddingSize?: "sm" | "md" | "lg";
};

export const Divider: React.FC<DividerProps> = ({
  orientation = "horizontal",
  align = "center",
  children,
  className,
  slot = true,
  padded = false,
  paddingSize = "md",
}) => {
  const isHorizontal = orientation === "horizontal";

  const paddingMap = {
    sm: "p-1",
    md: "p-1.5",
    lg: "p-2.5",
  };

  const wrapperClasses = cn(
    "relative",
    isHorizontal ? "w-full h-fit" : "h-auto w-fit",
    padded && paddingMap[paddingSize],
    className
  );

  const lineClasses = cn(
    "absolute bg-accent",
    isHorizontal ? "h-px w-full top-1/2" : "w-px h-full left-1/2"
  );

  const contentWrapperClasses = cn(
    "absolute bg-background",
    isHorizontal
      ? align === "start"
        ? "left-4 -translate-y-1/2 top-1/2"
        : align === "end"
          ? "right-4 -translate-y-1/2 top-1/2"
          : "left-1/2 -translate-x-1/2 -translate-y-1/2 top-1/2"
      : align === "start"
        ? "top-4 -translate-x-1/2 left-1/2"
        : align === "end"
          ? "bottom-4 -translate-x-1/2 left-1/2"
          : "top-1/2 -translate-x-1/2 -translate-y-1/2 left-1/2"
  );

  // If no children, just render the line
  if (!children) {
    return (
      <div className={wrapperClasses}>
        <div className={lineClasses} />
      </div>
    );
  }

  // With children
  return (
    <div className={cn(wrapperClasses, "flex items-center justify-center")}>
      <div className={lineClasses} />
      {slot && (
        <div className={cn(contentWrapperClasses, "flex-shrink-0")}>
          <div className="relative">{children}</div>
        </div>
      )}
    </div>
  );
};
