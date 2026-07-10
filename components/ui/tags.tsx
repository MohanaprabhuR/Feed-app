"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const tagVariants = cva(
  "inline-flex items-center  gap-x-1 rounded-sm  font-medium transition-all ease-in-out w-fit whitespace-nowrap shrink-0 [&>svg]:pointer-events-none aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive overflow-hidden data-[disabled=true]:cursor-not-allowed data-[disabled=true]:pointer-events-none",
  {
    variants: {
      variant: {
        solid:
          "bg-[var(--theme-primary)] outline-none hover:bg-[var(--theme-primary-hover)] active:bg-[var(--theme-primary-active)] focus:bg-[var(--theme-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 text-[var(--theme-primary-foreground)] data-[disabled=true]:bg-[var(--theme-disabled)] data-[disabled=true]:text-[var(--theme-disabled-foreground)] data-[disabled=true]:focus-visible:shadow-none",
        subtle:
          "bg-[var(--theme-secondary)] outline-none focus:bg-[var(--theme-secondary)] hover:bg-[var(--theme-secondary-hover)] active:bg-[var(--theme-secondary-active)] focus-visible:shadow-blue-ring text-[var(--theme-secondary-foreground)] data-[disabled=true]:bg-[var(--theme-disabled)] data-[disabled=true]:text-[var(--theme-disabled-foreground)] data-[disabled=true]:focus-visible:shadow-none",
        destructive:
          "bg-destructive text-white outline-none data-[disabled=true]:bg-[var(--theme-disabled)] data-[disabled=true]:text-[var(--theme-disabled-foreground)]",
        outline:
          "outline outline-1 -outline-offset-1 bg-transparent text-[var(--theme-primary)] hover:outline-[var(--theme-border-hover)] active:outline-[var(--theme-border-active)] outline-[var(--theme-border)] active:bg-[var(--theme-secondary-active)] focus-visible:border-transparent focus-visible:shadow-blue-ring data-[disabled=true]:bg-[var(--theme-disabled)] data-[disabled=true]:text-[var(--theme-disabled-foreground)] data-[disabled=true]:focus-visible:shadow-none",
        ghost:
          "text-[var(--theme-secondary-foreground)] outline-none  hover:bg-[var(--theme-secondary-hover)] active:bg-[var(--theme-secondary-active)] focus-visible:shadow-blue-ring focus:bg-[var(--theme-secondary)] data-[disabled=true]:text-[var(--theme-disabled-foreground)] data-[disabled=true]:focus-visible:shadow-none",
      },
      size: {
        sm: "px-1.5 py-[3px] text-xs tracking-4 leading-tight font-normal [&>svg]:size-3",
        md: "px-1.5 py-1 text-sm tracking-4 leading-tight font-normal [&>svg]:size-3",
        lg: "px-2 py-1.5 text-base tracking-4 leading-tight font-normal [&>svg]:size-3",
      },
    },
    defaultVariants: {
      variant: "solid",
      size: "sm",
    },
  }
);

const themeVars: Record<
  "default" | "blue" | "green" | "amber" | "red" | "violet",
  React.CSSProperties
> = {
  default: {
    "--theme-primary": "var(--color-primary)",
    "--theme-primary-hover": "var(--color-accent-foreground)",
    "--theme-primary-active": "var(--color-secondary-foreground)",
    "--theme-primary-foreground": "var(--color-primary-foreground)",
    "--theme-secondary": "var(--color-secondary)",
    "--theme-secondary-foreground": "var(--color-secondary-foreground)",
    "--theme-secondary-hover": "var(--color-accent)",
    "--theme-secondary-active": "var(--color-input)",
    "--theme-border": "var(--color-border)",
    "--theme-border-hover": "var(--color-default-border-hover)",
    "--theme-border-active": "var(--color-default-border-active)",
  } as React.CSSProperties,
  blue: {
    "--theme-primary": "var(--color-blue-primary)",
    "--theme-primary-hover": "var(--color-blue-primary-hover)",
    "--theme-primary-active": "var(--color-blue-primary-active)",
    "--theme-primary-foreground": "var(--color-blue-primary-foreground)",
    "--theme-secondary": "var(--color-blue-secondary)",
    "--theme-secondary-hover": "var(--color-blue-secondary-hover)",
    "--theme-secondary-active": "var(--color-blue-secondary-active)",
    "--theme-secondary-foreground": "var(--color-blue-secondary-foreground)",
    "--theme-border": "var(--color-blue-border)",
    "--theme-border-hover": "var(--color-blue-border-hover)",
    "--theme-border-active": "var(--color-blue-border-active)",
    "--theme-disabled": "var(--color-blue-disabled)",
    "--theme-disabled-foreground": "var(--color-blue-disabled-foreground)",
  } as React.CSSProperties,
  green: {
    "--theme-primary": "var(--color-green-primary)",
    "--theme-primary-foreground": "var(--color-green-primary-foreground)",
    "--theme-secondary": "var(--color-green-secondary)",
    "--theme-secondary-foreground": "var(--color-green-secondary-foreground)",
    "--theme-border": "var(--color-green-border)",
  } as React.CSSProperties,
  amber: {
    "--theme-primary": "var(--color-amber-primary)",
    "--theme-primary-foreground": "var(--color-amber-primary-foreground)",
    "--theme-secondary": "var(--color-amber-secondary)",
    "--theme-secondary-foreground": "var(--color-amber-secondary-foreground)",
    "--theme-border": "var(--color-amber-border)",
  } as React.CSSProperties,
  red: {
    "--theme-primary": "var(--color-red-primary)",
    "--theme-primary-foreground": "var(--color-red-primary-foreground)",
    "--theme-secondary": "var(--color-red-secondary)",
    "--theme-secondary-foreground": "var(--color-red-secondary-foreground)",
    "--theme-border": "var(--color-red-border)",
  } as React.CSSProperties,
  violet: {
    "--theme-primary": "var(--color-violet-primary)",
    "--theme-primary-foreground": "var(--color-violet-primary-foreground)",
    "--theme-secondary": "var(--color-violet-secondary)",
    "--theme-secondary-foreground": "var(--color-violet-secondary-foreground)",
    "--theme-border": "var(--color-violet-border)",
  } as React.CSSProperties,
};

export interface TagProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof tagVariants> {
  theme?: keyof typeof themeVars;
  onRemove?: () => void;
  asChild?: boolean;
  disabled?: boolean;
}

export function Tag({
  className,
  variant,
  size,
  theme = "default",
  asChild = false,
  children,
  disabled = false,
  ...props
}: TagProps) {
  const Comp = asChild ? Slot : "div";

  return (
    <Comp
      data-slot="tag"
      style={themeVars[theme]}
      className={cn(tagVariants({ variant, size }), className)}
      aria-disabled={disabled || undefined}
      data-disabled={disabled ? "true" : undefined}
      {...props}
    >
      {children}
    </Comp>
  );
}
