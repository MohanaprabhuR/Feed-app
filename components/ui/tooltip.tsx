"use client";

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

import { cn } from "@/lib/utils";

function TooltipProvider({
  delayDuration = 0,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      {...props}
    />
  );
}

function Tooltip({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  return (
    <TooltipProvider>
      <TooltipPrimitive.Root data-slot="tooltip" {...props} />
    </TooltipProvider>
  );
}

function TooltipTrigger({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />;
}

type CustomTooltipContentProps = React.ComponentProps<
  typeof TooltipPrimitive.Content
> & {
  resize?: boolean;
  arrow?: boolean;
};

function TooltipContent({
  className,
  sideOffset = 0,
  children,
  resize = true,
  arrow = true,
  ...props
}: CustomTooltipContentProps) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          "group relative bg-primary text-primary-foreground shadow-sm animate-in fade-in-0 zoom-in-95  " +
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 " +
            "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 " +
            "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 " +
            "z-50 origin-(--radix-tooltip-content-transform-origin) rounded-lg px-2 py-[5px] " +
            "text-base font-normal tracking-4 flex items-center gap-x-1.5 ",
          resize ? "w-full max-w-40 leading-normal" : "w-fit leading-normal",
          className,
        )}
        {...props}
      >
        {children}

        {arrow && (
          <span
            className={cn(
              "absolute text-foreground",
              "group-data-[side=top]:-bottom-[8px] group-data-[side=top]:left-1/2 group-data-[side=top]:-translate-x-1/2 group-data-[side=top]:-rotate-90",
              "group-data-[side=bottom]:-top-[8px] group-data-[side=bottom]:left-1/2 group-data-[side=bottom]:-translate-x-1/2 group-data-[side=bottom]:rotate-90",
              "group-data-[side=left]:-right-[4px] group-data-[side=left]:top-1/2 group-data-[side=left]:-translate-y-1/2 group-data-[side=left]:-rotate-180",
              "group-data-[side=right]:-left-[4px] group-data-[side=right]:top-1/2 group-data-[side=right]:-translate-y-1/2 group-data-[side=right]:rotate-0",
            )}
          >
            <svg
              width="5"
              height="12"
              viewBox="0 0 5 12"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path d="M5 0.853444C5 -4.38012 5 16.3808 5 11.1463C5 9.2166 1.53071e-07 7.4069 2.14575e-07 5.99985C-2.00758e-07 4.59281 5 2.76252 5 0.853444Z" />
            </svg>
          </span>
        )}
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
