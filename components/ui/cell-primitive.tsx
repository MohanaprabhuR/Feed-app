"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

function CellPrimitive({
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & { active?: boolean }) {
  return (
    <div
      data-slot="cell-primitive"
      role="cell"
      className={cn(
        "group relative flex  items-center  gap-2 bg-background  transition-all",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

function CellContent({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="cell-content"
      className={cn("flex flex-col gap-0.5 justify-between", className)}
      {...props}
    >
      {children}
    </div>
  );
}

function CellTitle({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="cell-title"
      className={cn(
        "text-accent-secondary  text-base font-normal tracking-1",
        className
      )}
      {...props}
    >
      <span className="leading-4.5 flex gap-1 items-center ">{children}</span>
    </div>
  );
}

function CellSubtext({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="cell-subtext"
      className={cn(
        "text-secondary-foreground flex gap-1 items-center font-normal tracking-0 text-base",
        className
      )}
      {...props}
    >
      <span className="leading-6">{children}</span>
    </div>
  );
}

function CellHint({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="cell-hint"
      className={cn(
        "flex items-center gap-1 text-muted-foreground   text-sm font-normal tracking-1 ",
        className
      )}
      {...props}
    >
      {/* Dot before text */}
      <span className="inline-block w-0.5 h-0.5 rounded-full bg-muted-foreground/70" />
      <span className="leading-4.5">{children}</span>
    </div>
  );
}

export { CellPrimitive, CellContent, CellSubtext, CellHint, CellTitle };
