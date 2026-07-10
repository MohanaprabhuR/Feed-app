import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const alertVariants = cva(
  "relative w-full  justify-between flex max-w-[384px]  gap-x-2.5 gap-y-0.5 [&>svg]:w-4 [&>svg]:h-4 [&>svg]:shrink-0 [&>svg]:text-current",
  {
    variants: {
      variant: {
        default: "bg-card outline outline-1 outline-border -outline-offset-1",
        information: "bg-blue-secondary",
        success: "bg-green-secondary",
        warning: "bg-amber-secondary",
        error: "bg-red-secondary",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Alert({
  className,
  variant,
  action = false,
  longText = false,
  children,
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof alertVariants> & {
    action?: boolean;
    longText?: boolean;
    children?: React.ReactNode;
  }) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(
        alertVariants({ variant }),
        action &&
          longText &&
          "pl-4 pr-3  pt-3 pb-4 items-start [&>svg]:mt-0.75 [&>svg]:mb-0.75 rounded-2xl",
        action &&
          !longText &&
          "pl-[12px] py-1.5 pr-1.5 items-center rounded-xl",
        !action &&
          longText &&
          "pl-4 pr-3 py-3.5 items-start [&>svg]:mt-0.75 [&>svg]:mb-0.75 rounded-2xl",
        !action && !longText && "py-[9.5px] px-3 items-center rounded-xl",
        longText && "has-[>svg]:pr-3",
        "has-[>svg]:pl-3",

        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "font-medium text-base tracking-4 leading-normal text-foreground w-full",
        className,
      )}
      {...props}
    />
  );
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "text-secondary-foreground font-normal tracking-4 grid justify-items-start gap-1 text-base leading-normal",
        className,
      )}
      {...props}
    />
  );
}

function AlertContent({
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & { children?: React.ReactNode }) {
  return (
    <div
      data-slot="alert-content"
      className={cn("flex flex-col gap-y-0.5", className)}
      {...props}
    >
      {children}
    </div>
  );
}

function AlertWrapper({
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & { children?: React.ReactNode }) {
  return (
    <div
      data-slot="alert-wrapper"
      className={cn("flex flex-col gap-y-3.5", className)}
      {...props}
    >
      {children}
    </div>
  );
}
export { Alert, AlertTitle, AlertDescription, AlertContent, AlertWrapper };
