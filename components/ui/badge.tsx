import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center  justify-center rounded-5xl transition-all ease-in-out text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--theme-primary)] text-[var(--theme-primary-foreground)] ",
        secondary:
          "bg-[var(--theme-secondary)] text-[var(--theme-secondary-foreground)] ",
        destructive: "bg-destructive text-white ",
        outline:
          "text-[var(--theme-secondary-foreground)] outline-[var(--theme-border)] outline-1 outline",
        ghost: "text-[var(--theme-secondary-foreground)] ",
      },
      size: {
        sm: "px-1.5 py-px text-xs font-normal [&>svg]:size-2.5 tracking-4 leading-tight",
        md: "px-1.5 py-[3px] text-xs font-normal [&>svg]:size-3 tracking-4 leading-tight",
        lg: "px-2 py-[4.5px] text-sm font-normal [&>svg]:size-3 tracking-4 leading-tight",
      },
    },
    defaultVariants: {
      variant: "default",
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
    "--theme-primary-foreground": "var(--color-primary-foreground)",
    "--theme-secondary": "var(--color-secondary)",
    "--theme-secondary-foreground": "var(--color-secondary-foreground)",
    "--theme-border": "var(--color-input)",
  } as React.CSSProperties,
  blue: {
    "--theme-primary": "var(--color-blue-primary)",
    "--theme-primary-foreground": "var(--color-blue-primary-foreground)",
    "--theme-secondary": "var(--color-blue-secondary)",
    "--theme-secondary-foreground": "var(--color-blue-secondary-foreground)",
    "--theme-border": "var(--color-blue-border)",
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

function Badge({
  className,
  variant,
  size,
  theme = "default",
  asChild = false,
  children,
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof badgeVariants> & {
    theme?: keyof typeof themeVars;
    asChild?: boolean;
    showIcon?: boolean;
  }) {
  const Comp = asChild ? Slot : "div";

  return (
    <Comp
      data-slot="badge"
      style={theme ? themeVars[theme] : undefined}
      className={cn(
        badgeVariants({ variant, size }),
        "leading-tight",
        className
      )}
      {...props}
    >
      {children}
    </Comp>
  );
}

function BadgeGroup({
  className,
  asChild = false,
  children,
  max = 2,
  ...props
}: React.ComponentProps<"div"> & {
  theme?: keyof typeof themeVars;
  asChild?: boolean;
  max?: number;
}) {
  const Comp = asChild ? Slot : "div";

  const childrenArray = React.Children.toArray(children);
  const visibleChildren = childrenArray.slice(0, max);
  const remainingCount = childrenArray.length - max;

  return (
    <Comp
      data-slot="badge-group"
      className={cn("flex gap-x-1 items-center", className)}
      {...props}
    >
      {visibleChildren}
      {remainingCount > 0 && (
        <Badge size="sm" variant="secondary">
          +{remainingCount}
        </Badge>
      )}
    </Comp>
  );
}

export { Badge, badgeVariants, BadgeGroup };
