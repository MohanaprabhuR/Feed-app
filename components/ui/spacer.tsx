import * as React from "react";
import { cn } from "@/lib/utils";

type SpacerSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";

type SpacerProps = {
  /** Direction of spacing */
  orientation?: "vertical" | "horizontal";
  size?: SpacerSize;
  className?: string;
  children?: React.ReactNode;
};

const sizeMap: Record<SpacerSize, number> = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 10,
  xl: 12,
  "2xl": 14,
  "3xl": 16,
};

function Spacer({
  orientation = "horizontal",
  size = "md",
  className,
  children,
}: SpacerProps) {
  const dimension = sizeMap[size];

  const style =
    orientation === "horizontal"
      ? { height: `${dimension}px`, width: "100%" }
      : { width: `${dimension}px`, height: "100%" };

  return (
    <div
      aria-hidden={!children}
      className={cn("block shrink-0", className)}
      style={style}
    >
      {children}
    </div>
  );
}

export { Spacer };
