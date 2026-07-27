"use client";

import * as React from "react";
import { Slot as SlotPrimitive } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";

const buttonVariants = cva(
  "inline-flex items-center gap-[0_8px] w-fit hover:z-1 justify-center whitespace-nowrap transition-all ease-in-out disabled:pointer-events-none pointer-events-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground  hover:bg-primary/86 active:bg-primary/75 disabled:bg-secondary disabled:text-primary/42",
        secondary:
          "bg-secondary text-accent-foreground  hover:bg-accent active:bg-primary/12 focus:bg-secondary focus-visible:bg-secondary disabled:bg-secondary disabled:text-primary/42",
        outline:
          "outline outline-1 outline-input -outline-offset-1  text-accent-foreground hover:outline-primary/25 active:bg-primary/12 active:outline-primary/15 focus-visible:bg-secondary focus-visible:bg-secondary  focus-visible:ring-2 focus-visible:ring-ring disabled:bg-secondary disabled:text-primary/42",
        destructive:
          "bg-destructive text-white/99 focus-visible:ring-destructive/20 hover:bg-destructive/85 active:bg-destructive/90 disabled:bg-destructive/25 disabled:text-destructive/50",
        ghost:
          "bg-transparent hover:bg-accent  text-accent-foreground  active:bg-primary/12 focus:bg-secondary focus-visible:bg-secondary  disabled:bg-transparent disabled:text-primary/42",
        shadow:
          "bg-background hover:bg-accent shadow-lg text-accent-foreground  active:bg-primary/12 focus:bg-secondary focus-visible:bg-secondary  disabled:bg-transparent disabled:text-primary/42",
      },
      size: {
        sm: "rounded-lg text-base font-normal tracking-4 leading-tight [&_svg]:size-4",
        md: "rounded-lg text-base font-normal tracking-4 leading-tight [&_svg]:size-4.5",
        lg: "rounded-xl text-lg font-medium tracking-4 leading-tight [&_svg]:size-5",
        xl: "rounded-2xl text-xl font-medium tracking-4 leading-tight [&_svg]:size-6",
        "2xl":
          "rounded-3xl text-2xl font-medium tracking-4 leading-tight [&_svg]:size-6",
      },
      iconOnly: {
        true: "",
        false: "",
      },
    },
    compoundVariants: [
      { size: "sm", iconOnly: false, className: "px-2 py-1.5" },
      { size: "sm", iconOnly: true, className: "p-1.5" },

      { size: "md", iconOnly: false, className: "py-1.75 px-2.5" },
      { size: "md", iconOnly: true, className: "p-1.75" },

      { size: "lg", iconOnly: false, className: "py-2.5 px-3" },
      { size: "lg", iconOnly: true, className: "p-2.5" },

      { size: "xl", iconOnly: false, className: "py-2.75 px-3.5" },
      { size: "xl", iconOnly: true, className: "p-2.75" },

      { size: "2xl", iconOnly: false, className: "py-3.5 px-4" },
      { size: "2xl", iconOnly: true, className: "p-3.5" },
    ],
    defaultVariants: {
      variant: "primary",
      size: "sm",
      iconOnly: false,
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  children?: React.ReactNode;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  showIcon?: boolean;
}

const iconSizeMap: Record<
  NonNullable<ButtonProps["size"]>,
  { width: number; height: number }
> = {
  sm: { width: 16, height: 16 },
  md: { width: 18, height: 18 },
  lg: { width: 20, height: 20 },
  xl: { width: 24, height: 24 },
  "2xl": { width: 24, height: 24 },
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size = "sm",
      iconOnly = false,
      asChild = false,
      children,
      loading = false,
      disabled,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? SlotPrimitive.Root : "button";

    let content: React.ReactNode = children;

    if (loading && !asChild) {
      content = (
        <>
          <Spinner size="sm" className="shrink-0" />
          {children}
        </>
      );
    }

    if (iconOnly) {
      const icons = React.Children.toArray(content).filter((child) =>
        React.isValidElement(child),
      );

      content =
        icons.length > 1 ? icons[icons.length - 1] : icons[0] || null;
    }

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, iconOnly }), className)}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {content}
      </Comp>
    );
  },
);

Button.displayName = "Button";

export { Button, buttonVariants };
