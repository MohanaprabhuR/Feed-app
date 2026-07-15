import * as React from "react";

import { cn } from "@/lib/utils";
import { cva, VariantProps } from "class-variance-authority";

const cardVariants = cva(
  "bg-card text-card-foreground leading-normal tracking-4 flex flex-col border w-full",
  {
    variants: {
      size: {
        sm: "rounded-lg px-3 py-2.5 gap-3.5",
        md: "rounded-xl p-4 gap-4",
        lg: "rounded-2xl p-4 gap-5",
      },
      padding: {
        default: "",
        none: "p-0 gap-0",
      },
    },
    defaultVariants: {
      size: "md",
      padding: "default",
    },
  }
);

function Card({
  className,
  size,
  padding,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof cardVariants>) {
  return (
    <div
      data-slot="card"
      className={cn(cardVariants({ size, padding }), className)}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min leading-normal tracking-4 grid-rows-[auto_auto] items-start gap-1.5 px-4 pt-4 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-4",
        className
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "font-serif font-normal text-foreground leading-tight tracking-4 text-base  w-full truncate",
        className
      )}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn(
        "text-muted-foreground pt-1 text-xs leading-tight tracking-4 font-normal",
        className
      )}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-4 pb-4 leading-normal tracking-4", className)}
      {...props}
    />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center px-4 py-2.5 [.border-t]:pt-2.5 leading-normal tracking-4 font-normal",
        className
      )}
      {...props}
    />
  );
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
};
